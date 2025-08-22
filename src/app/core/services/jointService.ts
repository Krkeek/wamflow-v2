import { inject, Injectable, OnDestroy } from '@angular/core';
import { dia, elementTools, g, shapes } from '@joint/core';
import { WamElements } from '../enums/WamElements';
import { ElementCreatorService } from './elementCreatorService';
import { JOINT_CONSTRAINTS } from '../constants/JointConstraints';
import { BehaviorSubject, distinctUntilChanged, pairwise } from 'rxjs';
import { ResizeControl } from '../Infrastructure/ResizeControl';
import ToolsView = dia.ToolsView;
import ID = dia.Cell.ID;
import CellView = dia.CellView;

@Injectable({
  providedIn: 'root',
})
export class JointService implements OnDestroy {
  public selectedCells$ = new BehaviorSubject<ID[]>([]);

  private readonly _elementCreatorService = inject(ElementCreatorService);
  private _graph?: dia.Graph;
  private _paper?: dia.Paper;
  private _paperDimensions = {
    width: JOINT_CONSTRAINTS.paperDefaultDimensions.width,
    height: JOINT_CONSTRAINTS.paperDefaultDimensions.height,
  };
  private _groupDragActive = false;
  private _groupDragStart: { x: number; y: number } | null = null;
  private _groupBasePos = new Map<ID, { x: number; y: number }>();
  private _origin?: dia.Point;
  private _rubberNode?: SVGRectElement;
  private _multiBoxG?: SVGGElement;
  private _multiBoxRect?: SVGRectElement;
  private _multiBoxDeleteButton?: SVGElement;

  constructor() {
    this.selectedCells$
      .pipe(
        distinctUntilChanged((a, b) => this.arraysEqual(a, b)),
        pairwise(),
      )
      .subscribe(([prevIds, currIds]) => {
        const prevSet = new Set(prevIds);
        const currSet = new Set(currIds);
        this.printSelectedCellsForDebug(prevIds, currIds);
        this.updateMultiSelectionBox(currIds);

        for (const id of prevIds) {
          if (!currSet.has(id)) this.unhighlightCell(id);
        }
        for (const id of currIds) {
          if (!prevSet.has(id)) {
            this.highlightCell(id);
          }
        }
      });
  }

  private _toolsView?: ToolsView;
  private get toolsView(): ToolsView {
    if (!this._toolsView) {
      throw new Error('No tools view found.');
    }
    return this._toolsView;
  }

  public initPaper(canvas: HTMLElement): void {
    this.initGraph();
    this._paper = new dia.Paper({
      el: canvas,
      model: this._graph,
      width: this._paperDimensions.width,
      height: this._paperDimensions.height,
      gridSize: 10,
      drawGridSize: 40,
      drawGrid: {
        name: 'mesh',
        args: { color: '#bdbdbd', thickness: 1 },
      },
      cellViewNamespace: shapes,
      linkPinning: false,
      defaultConnectionPoint: { name: 'boundary' },
      restrictTranslate: true,
      embeddingMode: true,
      highlighting: { embedding: false },
      validateConnection: (s, _m, t) => s !== t,
    });
    this.initToolTips();
    this.bindPaperEvents();
  }
  public initPalettePaper(canvas: HTMLElement): { graph: dia.Graph; paper: dia.Paper } {
    const graph = this.getPaletteItemGraph();
    const paper = new dia.Paper({
      el: canvas,
      model: graph,
      interactive: false,
      cellViewNamespace: shapes,

      width: 90,
      height: 90,
    });
    return { graph, paper };
  }

  public addCell(cell: WamElements, specificGraph?: dia.Graph, specificPaper?: dia.Paper): void {
    const newCell = this._elementCreatorService.create(cell);

    if (specificGraph) {
      newCell.position(20, 10);
      newCell.addTo(specificGraph);
      specificPaper?.fitToContent({
        allowNewOrigin: 'any',
        allowNegativeBottomRight: false,
        padding: 5,
      });
    } else {
      if (this._graph) {
        newCell.addTo(this._graph);
      }
    }
  }
  public addCellAt(cell: WamElements, x: number, y: number) {
    if (!this._graph) return;
    const el = this._elementCreatorService.create(cell);
    const { width, height } = el.size();
    el.position(x - width / 2, y - height / 2);
    el.addTo(this._graph);
    this.selectSingle(el.id);
  }

  public highlightCell(cellId: ID): void {
    const cell = this.getCellById(cellId);
    cell.attr('body/stroke', JOINT_CONSTRAINTS.primaryStroke);
    cell.attr('path/stroke', JOINT_CONSTRAINTS.primaryStroke);
    cell.attr('top/stroke', JOINT_CONSTRAINTS.primaryStroke);
  }
  public unhighlightCell(cellId: ID): void {
    const cellView = this.getCellView(cellId);
    cellView.removeTools();

    const cell = this.getCellById(cellId);
    cell.attr('body/stroke', JOINT_CONSTRAINTS.defaultStroke);
    cell.attr('path/stroke', JOINT_CONSTRAINTS.defaultStroke);
    cell.attr('top/stroke', JOINT_CONSTRAINTS.defaultStroke);
  }

  public getCellById(cellId: ID) {
    const cell = this._graph?.getCell(cellId);
    if (!cell) throw Error(`Unable to get cell ${cellId}`);
    return cell;
  }

  public clientToLocal(clientX: number, clientY: number) {
    if (!this._paper) throw new Error('No _paper or _graph found.');
    return this._paper.clientToLocalPoint({ x: clientX, y: clientY });
  }

  public ngOnDestroy(): void {
    if (!this._paper || !this._graph) throw new Error('No _paper or _graph found.');

    this._paper.off('element:pointerdown');
    this._paper.off('element:mouseover');
    this._paper.off('element:mouseleave');
    this._paper.off('element:pointermove');
    this._paper.off('element:pointerup');
    this._paper.off('link:pointerdown');
    this._paper.off('link:pointerup');
    this._paper.off('blank:pointerclick');
    this._paper.off('blank:pointerdown');
    this._paper.off('blank:pointerup');
    this._paper.off('blank:pointermove');
    this._paper.off('link:mouseenter');
    this._paper.off('blank:mouseover');
    this._graph.off('change add');
    this._graph.off('remove');
  }

  private getSelectedIds(): ID[] {
    return this.selectedCells$.value ?? [];
  }

  private printSelectedCellsForDebug = (prevIds: ID[], currIds: ID[]) => {
    console.log('Previous:');
    console.log(prevIds);
    console.log('Current:');
    console.log(currIds);
    console.log('---------------------------------------------------');
  };

  private removeCells = (idsToRemove: ID[]) => {
    if (!this._graph) return;
    const cellsToRemove = this._graph.getCells().filter((cell) => idsToRemove.includes(cell.id));
    this._graph.removeCells(cellsToRemove);
  };
  private initGraph(): dia.Graph | void {
    this._graph = new dia.Graph({}, { cellNamespace: shapes });
  }
  private getPaletteItemGraph(): dia.Graph {
    return new dia.Graph({}, { cellNamespace: shapes });
  }
  private getCellView(cellId: ID): CellView {
    const cell = this.getCellById(cellId);
    if (!this._paper) throw new Error('No _paper found.');
    return cell.findView(this._paper);
  }
  private initToolTips(): void {
    const boundaryTool = new elementTools.Boundary();
    const removeButton = new elementTools.Remove();
    const resizeButton = new ResizeControl();

    this._toolsView = new dia.ToolsView({
      tools: [boundaryTool, removeButton, resizeButton],
    });
  }
  private bindPaperEvents(): void {
    if (!this._paper || !this._graph) throw new Error('No _paper or _graph found.');

    // attach
    this._paper.on('element:pointerdown', this.onElementPointerDown);
    this._paper.on('element:pointermove', this.onElementPointerMove);
    this._paper.on('element:pointerup', this.onElementPointerUp);

    /*    this._paper.on('element:mouseover', this.onElementMouseOver);
    this._paper.on('element:mouseleave', this.onElementMouseLeave);*/
    this._paper.on('element:contextmenu', this.onElementContextMenu);
    /*
    this._paper.on('link:pointerdown', this.onLinkPointerDown);
*/
    /*    this._paper.on('link:pointerup', this.onLinkPointerUp);
    this._paper.on('link:mouseenter', this.onLinkMouseEnter);*/
    this._paper.on('blank:pointerclick', this.onBlankPointerClick);
    this._paper.on('blank:pointerdown', this.onBlankPointerDown);
    this._paper.on('blank:pointerup', this.onBlankPointerUp);
    this._paper.on('blank:pointermove', this.onBlankPointerMove);
    /*    this._paper.on('blank:mouseover', this.onBlankMouseOver);
    this._graph.on('change add', this.onGraphUpdate);*/
    this._graph.on('remove', this.onGraphRemove);
  }

  private setSelection(ids: ID[]) {
    this.selectedCells$.next([...ids]);
  }

  private selectSingle(id: ID) {
    this.setSelection([id]);
  }

  private clearAllSelection() {
    this.selectedCells$.next([]);
  }
  private addToSelection(id: ID) {
    const next = new Set(this.selectedCells$.value);
    next.add(id);
    this.selectedCells$.next([...next]);
  }
  private removeFromSelection(id: ID) {
    const next = new Set(this.selectedCells$.value);
    next.delete(id);
    this.selectedCells$.next([...next]);
  }
  private removeMultiSelectionBox() {
    if (this._multiBoxG && this._multiBoxG.parentNode) {
      this._multiBoxG.parentNode.removeChild(this._multiBoxG);
    }
    this._multiBoxG = undefined;
    this._multiBoxDeleteButton = undefined;
    this._multiBoxRect = undefined;
  }
  private arraysEqual(a: ID[], b: ID[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  private onElementPointerDown = (
    elementView: dia.ElementView,
    _evt: dia.Event,
    x?: number,
    y?: number,
  ) => {
    this.initDraggingCells(elementView, x, y);
  };

  private onElementPointerMove = (
    view: dia.ElementView,
    _evt: dia.Event,
    x?: number,
    y?: number,
  ) => {
    this.dragCellsAsGroup(view, x, y);
  };

  private onElementContextMenu = (elementView: dia.ElementView) => {
    this.showToolView(elementView);
  };

  private onElementPointerUp = () => {
    this.resetGroupDragConstraints();
  };

  private onBlankPointerClick = () => {
    this.clearAllSelection();
    this.removeMultiSelectionBox();
  };
  private onBlankPointerDown = (_evt: dia.Event, x: number, y: number) => {
    this.clearAllSelection();
    this.createRubberNode(x, y);
  };

  private onBlankPointerUp = (_evt: dia.Event, x: number, y: number) => {
    this.selectAllWithRubberNode(x, y);
  };

  private onBlankPointerMove = (_evt: dia.Event, x: number, y: number) => {
    this.adjustRubberNodeOnMove(x, y);
  };

  private onGraphRemove = (cell: dia.Cell) => {
    this.removeFromSelection(cell.id);
  };

  private createRubberNode = (x: number, y: number) => {
    this._origin = { x, y };

    const svg = this._paper?.svg as SVGSVGElement | undefined;
    if (!svg) return;
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', String(x));
    r.setAttribute('y', String(y));
    r.setAttribute('width', '1');
    r.setAttribute('height', '1');
    r.setAttribute('fill', 'rgba(30,144,255,0.12)');
    r.setAttribute('stroke', '#1e90ff');
    r.setAttribute('stroke-dasharray', '4,2');
    r.setAttribute('pointer-events', 'none'); // don't steal mouse
    svg.appendChild(r);

    this._rubberNode = r;
  };
  private selectAllWithRubberNode = (x: number, y: number) => {
    if (!this._origin) return;

    const x0 = Math.min(this._origin.x, x);
    const y0 = Math.min(this._origin.y, y);
    const w = Math.abs(x - this._origin.x);
    const h = Math.abs(y - this._origin.y);
    const area = new g.Rect(x0, y0, w, h);

    const views = this._paper?.findElementViewsInArea(area) ?? [];

    const ids: ID[] = views.filter((v) => v.model.isElement()).map((v) => String(v.model.id));
    this.setSelection(ids);

    if (this._rubberNode) {
      this._rubberNode.parentNode?.removeChild(this._rubberNode);
      this._rubberNode = undefined;
    }
    this._origin = undefined;
  };
  private adjustRubberNodeOnMove = (x: number, y: number) => {
    if (!this._origin || !this._rubberNode) return;
    const x0 = Math.min(this._origin.x, x);
    const y0 = Math.min(this._origin.y, y);
    const w = Math.abs(x - this._origin.x);
    const h = Math.abs(y - this._origin.y);
    this._rubberNode.setAttribute('x', String(x0));
    this._rubberNode.setAttribute('y', String(y0));
    this._rubberNode.setAttribute('width', String(w));
    this._rubberNode.setAttribute('height', String(h));
  };
  private updateMultiSelectionBox(selectedIds: ID[]) {
    if (!this._paper) return;
    if (selectedIds.length < 2) return;

    if (!selectedIds.length) {
      this.removeMultiSelectionBox();
      return;
    }
    const views = selectedIds
      .map((id) => this._graph?.getCell(id))
      .filter((c): c is dia.Element => !!c && c.isElement())
      .map((el) => el.findView(this._paper!))
      .filter((v): v is dia.ElementView => !!v);

    if (!views.length) {
      this.removeMultiSelectionBox();
      return;
    }

    let bbox = views[0].getBBox({ useModelGeometry: true });
    for (let i = 1; i < views.length; i++) {
      bbox = bbox.union(views[i].getBBox({ useModelGeometry: true }));
    }
    bbox = bbox.inflate(6);
    const svg = this._paper.svg as SVGSVGElement;
    const viewportLayer =
      (svg.querySelector('.joint-cells-layer.joint-viewport') as SVGGElement) ??
      (svg.firstElementChild as SVGGElement);

    if (!this._multiBoxG) {
      this._multiBoxG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this._multiBoxG.setAttribute('class', 'wam-multi-select-box');
      this._multiBoxG.setAttribute('pointer-events', 'none');

      this._multiBoxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      this._multiBoxRect.setAttribute('fill', 'none');
      this._multiBoxRect.setAttribute('stroke', '#1e90ff');
      this._multiBoxRect.setAttribute('stroke-width', '1.5');
      this._multiBoxRect.setAttribute('stroke-dasharray', '6,4');
      this._multiBoxRect.setAttribute('vector-effect', 'non-scaling-stroke');
      this._multiBoxRect.setAttribute('pointer-events', 'none');

      this._multiBoxDeleteButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      // red circle background
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '7');
      circle.setAttribute('fill', 'red');
      circle.setAttribute('pointer-events', 'none');

      // white X
      const cross = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cross.textContent = '✕';
      cross.setAttribute('fill', 'white');
      cross.setAttribute('font-size', '8');
      cross.setAttribute('font-weight', '900');
      cross.setAttribute('text-anchor', 'middle');
      cross.setAttribute('dominant-baseline', 'middle');
      cross.setAttribute('dy', '0.08em');
      cross.setAttribute('stroke', 'white');
      cross.setAttribute('stroke-width', '0.8');
      cross.setAttribute('paint-order', 'stroke');
      cross.setAttribute('pointer-events', 'none');

      this._multiBoxDeleteButton.appendChild(circle);
      this._multiBoxDeleteButton.appendChild(cross);
      this._multiBoxDeleteButton.setAttribute('cursor', 'pointer');
      this._multiBoxDeleteButton.setAttribute('pointer-events', 'visiblePainted');

      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hit.setAttribute('x', String(-8));
      hit.setAttribute('y', String(-8));
      hit.setAttribute('width', '16');
      hit.setAttribute('height', '16');
      hit.setAttribute('fill', 'transparent');
      hit.setAttribute('pointer-events', 'all');

      const consume = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
      };
      this._multiBoxDeleteButton.addEventListener('mousedown', consume);
      this._multiBoxDeleteButton.addEventListener('touchstart', consume, { passive: false });

      this._multiBoxDeleteButton.addEventListener('click', () => {
        console.log('clicked');
        this.removeCells(selectedIds);
        this.removeMultiSelectionBox();
      });

      this._multiBoxDeleteButton.appendChild(circle);
      this._multiBoxDeleteButton.appendChild(cross);
      this._multiBoxDeleteButton.appendChild(hit);
      this._multiBoxG.appendChild(this._multiBoxRect);
      this._multiBoxG.appendChild(this._multiBoxDeleteButton);
      viewportLayer.appendChild(this._multiBoxG);
      this._multiBoxDeleteButton.setAttribute(
        'transform',
        `translate(${bbox.x + 10}, ${bbox.y + 10})`,
      );
    }

    // Update box
    this._multiBoxRect!.setAttribute('x', String(bbox.x));
    this._multiBoxRect!.setAttribute('y', String(bbox.y));
    this._multiBoxRect!.setAttribute('width', String(bbox.width));
    this._multiBoxRect!.setAttribute('height', String(bbox.height));

    // Reposition the delete button on EVERY update
    if (this._multiBoxDeleteButton) {
      const pad = 8;
      this._multiBoxDeleteButton.setAttribute(
        'transform',
        `translate(${bbox.x + pad}, ${bbox.y + pad})`,
      );
    }
  }

  private dragCellsAsGroup(view: dia.ElementView, x?: number, y?: number) {
    if (!this._groupDragActive || !this._groupDragStart) return;

    const dx = (x ?? 0) - this._groupDragStart.x;
    const dy = (y ?? 0) - this._groupDragStart.y;

    this._graph?.startBatch('group-move');

    const grabbedId = String(view.model.id);
    for (const id of this.getSelectedIds()) {
      if (id === grabbedId) continue;
      const base = this._groupBasePos.get(id);
      const cell = this._graph?.getCell(id);
      if (base && cell && cell.isElement()) {
        (cell as dia.Element).position(base.x + dx, base.y + dy);
      }
    }

    if (this._multiBoxG && this._groupDragStart) {
      const dx = (x ?? 0) - this._groupDragStart.x;
      const dy = (y ?? 0) - this._groupDragStart.y;
      this._multiBoxG.setAttribute('transform', `translate(${dx}, ${dy})`);
    }

    this._graph?.stopBatch('group-move');
  }
  private initDraggingCells(elementView: dia.ElementView, x?: number, y?: number) {
    const ids = this.getSelectedIds();
    const thisId = String(elementView.model.id);

    if (!ids.includes(thisId)) {
      this.selectSingle(elementView.model.id);
    }

    if (this.getSelectedIds().length < 2) {
      this._groupDragActive = false;
      this._groupBasePos.clear();
      this._groupDragStart = null;
      return;
    }

    const startX = x ?? 0;
    const startY = y ?? 0;
    this._groupDragStart = { x: startX, y: startY };
    this._groupBasePos.clear();

    for (const id of this.getSelectedIds()) {
      const cell = this._graph?.getCell(id);
      if (cell && cell.isElement()) {
        const { x: px, y: py } = (cell as dia.Element).position();
        this._groupBasePos.set(id, { x: px, y: py });
      }
    }
    this._groupDragActive = true;
  }
  private resetGroupDragConstraints() {
    this._groupDragActive = false;
    this._groupBasePos.clear();
    this._groupDragStart = null;

    if (this._multiBoxG) this._multiBoxG.removeAttribute('transform');
    this.updateMultiSelectionBox(this.getSelectedIds());
  }

  private showToolView = (elementView: dia.ElementView) => {
    if (!this.selectedCells$.value.find((id) => id == elementView.model.id)) {
      this.selectSingle(elementView.model.id);
    }
    const cellView = this.getCellView(elementView.model.id);
    cellView.addTools(this.toolsView);
  };

  /*  private onLinkPointerUp = (linkView: dia.LinkView, evt: dia.Event) => {

};*/

  /*
  private onLinkMouseEnter = (linkView: dia.LinkView, evt: dia.Event) => {};
*/

  /*
  private onBlankMouseOver = (evt: dia.Event) => {};
*/

  /*  private onGraphUpdate = (cell: dia.Cell, opt: dia.Cell.Options) => {

  };*/

  /*
public removeCell(cellId: string): void {}
*/

  /*
  public duplicateCell(cellId: string): void {}
*/

  /*  public exportAsJson(): string | void {}

  public importAsJson(json: string): void {}

  public exportAsPNG(): void {}

  public exportAsRdf(): void {}

  public resetPaperDefaultSettings(): void {}*/

  /*  public getAllElements(): dia.Element[] {
    return [];
  }

  public getAllLinks(): dia.Link[] {
    return [];
  }*/

  /*  public updateCellAttributes(cellId: string, attrs: dia.Cell.Attributes): void {}

  public updateAttributeByName(cellId: string, attrName: string, value: string): void {}

  public getAttributeByCellId(cellId: string, attrName: string): string {
    return '';
  }*/

  /*  public setPaperDimensions(width: number, height: number): void {
    if (width < 4000 || height < 4000)
      throw new Error('Paper Dimensions must be greater than 4000px');
    this._paper?.setDimensions(width, height);
  }*/
  /*

  public setCellDimensions(width: number, height: number): void {}
*/

  /*
private onElementMouseOver = (elementView: dia.ElementView) => {};

private onElementMouseLeave = (elementView: dia.ElementView) => {};
*/

  /*  private onLinkPointerDown = (linkView: dia.LinkView, evt: dia.Event) => {
    console.log('[Joint] link:pointerdown', { id: linkView.model.id, evt });
  };*/
}
