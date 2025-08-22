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
  private graph?: dia.Graph;
  private paper?: dia.Paper;
  private paperDimensions = {
    width: JOINT_CONSTRAINTS.paperDefaultDimensions.width,
    height: JOINT_CONSTRAINTS.paperDefaultDimensions.height,
  };
  private readonly elementCreatorService = inject(ElementCreatorService);

  private groupDragActive = false;
  private groupDragStart: { x: number; y: number } | null = null;
  private groupBasePos = new Map<ID, { x: number; y: number }>();
  private origin: dia.Point | null = null;
  private rubberNode: SVGRectElement | null = null;

  constructor() {
    this.selectedCells$
      .pipe(
        distinctUntilChanged((a, b) => this.arraysEqual(a, b)),
        pairwise(),
      )
      .subscribe(([prevIds, currIds]) => {
        const prevSet = new Set(prevIds);
        const currSet = new Set(currIds);

        // unhighlight IDs that were removed
        for (const id of prevIds) {
          if (!currSet.has(id)) this.clearSelection(id);
        }

        // highlight IDs that were added
        for (const id of currIds) {
          if (!prevSet.has(id)) {
            this.highlightCell(id);
          }
        }
      });
  }

  private _toolsView?: ToolsView;

  public get toolsView(): ToolsView {
    if (!this._toolsView) {
      throw new Error('No tools view found.');
    }
    return this._toolsView;
  }

  public initPaper(canvas: HTMLElement): void {
    this.initGraph();
    this.paper = new dia.Paper({
      el: canvas,
      model: this.graph,
      width: this.paperDimensions.width,
      height: this.paperDimensions.height,
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

  public initPalettePaper(canvas: HTMLElement): {
    graph: dia.Graph;
    paper: dia.Paper;
  } {
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
    const newCell = this.elementCreatorService.create(cell);

    if (specificGraph) {
      newCell.position(20, 10);
      newCell.addTo(specificGraph);
      specificPaper?.fitToContent({
        allowNewOrigin: 'any',
        allowNegativeBottomRight: false,
        padding: 5,
      });
    } else {
      if (this.graph) {
        newCell.addTo(this.graph);
      }
    }
  }

  /*
  public removeCell(cellId: string): void {}
*/

  public highlightCell(cellId: ID): void {
    const cell = this.getCellById(cellId);
    cell.attr('body/stroke', JOINT_CONSTRAINTS.primaryStroke);
    cell.attr('path/stroke', JOINT_CONSTRAINTS.primaryStroke);
    cell.attr('top/stroke', JOINT_CONSTRAINTS.primaryStroke);
  }

  /*
  public duplicateCell(cellId: string): void {}
*/

  public unhighlightCell(cellId: ID): void {
    const cell = this.getCellById(cellId);
    cell.attr('body/stroke', JOINT_CONSTRAINTS.defaultStroke);
    cell.attr('path/stroke', JOINT_CONSTRAINTS.defaultStroke);
    cell.attr('top/stroke', JOINT_CONSTRAINTS.defaultStroke);
  }

  public getCellById(cellId: ID) {
    const cell = this.graph?.getCell(cellId);
    if (!cell) throw Error(`Unable to get cell ${cellId}`);
    return cell;
  }

  public clearSelection(cellId: ID): void {
    const cellView = this.getCellView(cellId);
    cellView.removeTools();
    this.unhighlightCell(cellId);
  }

  public ngOnDestroy(): void {
    if (!this.paper || !this.graph) throw new Error('No paper or graph found.');

    this.paper.off('element:pointerdown');
    this.paper.off('element:mouseover');
    this.paper.off('element:mouseleave');
    this.paper.off('element:pointermove');
    this.paper.off('element:pointerup');
    this.paper.off('link:pointerdown');
    this.paper.off('link:pointerup');
    this.paper.off('blank:pointerclick');
    this.paper.off('blank:pointerdown');
    this.paper.off('blank:pointerup');
    this.paper.off('blank:pointermove');
    this.paper.off('link:mouseenter');
    this.paper.off('blank:mouseover');
    this.graph.off('change add');
    this.graph.off('remove');
  }

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
    this.paper?.setDimensions(width, height);
  }*/
  /*

  public setCellDimensions(width: number, height: number): void {}
*/

  public clientToLocal(clientX: number, clientY: number) {
    if (!this.paper) return { x: 0, y: 0 };
    return this.paper.clientToLocalPoint({ x: clientX, y: clientY });
  }

  public addCellAt(cell: WamElements, x: number, y: number) {
    if (!this.graph) return;
    const el = this.elementCreatorService.create(cell);
    const { width, height } = el.size();
    el.position(x - width / 2, y - height / 2);
    el.addTo(this.graph);
    this.clearAllSelection();
    this.addToSelection(el.id);
  }

  public setSelection(ids: ID[]) {
    this.selectedCells$.next([...ids]);
  }

  public clearAllSelection() {
    this.selectedCells$.next([]);
  }

  public addToSelection(id: ID) {
    const next = new Set(this.selectedCells$.value);
    next.add(id);
    this.selectedCells$.next([...next]);
  }

  public removeFromSelection(id: ID) {
    const next = new Set(this.selectedCells$.value);
    next.delete(id);
    this.selectedCells$.next([...next]);
  }

  private getSelectedIds(): ID[] {
    return this.selectedCells$.value ?? [];
  }

  private arraysEqual(a: ID[], b: ID[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  private getCellView(cellId: ID): CellView {
    const cell = this.getCellById(cellId);
    if (!this.paper) throw new Error('No paper found.');
    return cell.findView(this.paper);
  }

  private initGraph(): dia.Graph | void {
    this.graph = new dia.Graph({}, { cellNamespace: shapes });
  }

  private getPaletteItemGraph(): dia.Graph {
    return new dia.Graph({}, { cellNamespace: shapes });
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
    if (!this.paper || !this.graph) throw new Error('No paper or graph found.');

    // attach
    this.paper.on('element:pointerdown', this.onElementPointerDown);
    this.paper.on('element:pointermove', this.onElementPointerMove);
    this.paper.on('element:pointerup', this.onElementPointerUp);

    /*    this.paper.on('element:mouseover', this.onElementMouseOver);
    this.paper.on('element:mouseleave', this.onElementMouseLeave);*/
    this.paper.on('element:contextmenu', this.onElementContextMenu);
    this.paper.on('link:pointerdown', this.onLinkPointerDown);
    /*    this.paper.on('link:pointerup', this.onLinkPointerUp);
    this.paper.on('link:mouseenter', this.onLinkMouseEnter);*/
    this.paper.on('blank:pointerclick', this.onBlankPointerClick);
    this.paper.on('blank:pointerdown', this.onBlankPointerDown);
    this.paper.on('blank:pointerup', this.onBlankPointerUp);
    this.paper.on('blank:pointermove', this.onBlankPointerMove);
    /*    this.paper.on('blank:mouseover', this.onBlankMouseOver);
    this.graph.on('change add', this.onGraphUpdate);*/
    this.graph.on('remove', this.onGraphRemove);
  }

  private onElementPointerDown = (
    elementView: dia.ElementView,
    _evt: dia.Event,
    x?: number,
    y?: number,
  ) => {
    const ids = this.getSelectedIds();
    const thisId = String(elementView.model.id);

    if (!ids.includes(thisId)) {
      this.clearAllSelection();
      this.addToSelection(elementView.model.id);
    }

    if (this.getSelectedIds().length < 2) {
      this.groupDragActive = false;
      this.groupBasePos.clear();
      this.groupDragStart = null;
      return;
    }

    const startX = x ?? 0;
    const startY = y ?? 0;
    this.groupDragStart = { x: startX, y: startY };
    this.groupBasePos.clear();

    for (const id of this.getSelectedIds()) {
      const cell = this.graph?.getCell(id);
      if (cell && cell.isElement()) {
        const { x: px, y: py } = (cell as dia.Element).position();
        this.groupBasePos.set(id, { x: px, y: py });
      }
    }
    this.groupDragActive = true;
  };

  private onElementPointerMove = (
    view: dia.ElementView,
    _evt: dia.Event,
    x?: number,
    y?: number,
  ) => {
    if (!this.groupDragActive || !this.groupDragStart) return;

    const dx = (x ?? 0) - this.groupDragStart.x;
    const dy = (y ?? 0) - this.groupDragStart.y;

    this.graph?.startBatch('group-move');

    const grabbedId = String(view.model.id);
    for (const id of this.getSelectedIds()) {
      if (id === grabbedId) continue;
      const base = this.groupBasePos.get(id);
      const cell = this.graph?.getCell(id);
      if (base && cell && cell.isElement()) {
        (cell as dia.Element).position(base.x + dx, base.y + dy);
      }
    }

    this.graph?.stopBatch('group-move');
  };

  private onLinkPointerDown = (linkView: dia.LinkView, evt: dia.Event) => {
    console.log('[Joint] link:pointerdown', { id: linkView.model.id, evt });
    // TODO: select link, show tools
  };
  /*
  private onElementMouseOver = (elementView: dia.ElementView) => {};

  private onElementMouseLeave = (elementView: dia.ElementView) => {};
*/

  private onElementContextMenu = (elementView: dia.ElementView) => {
    if (!this.selectedCells$.value.find((id) => id == elementView.model.id)) {
      this.addToSelection(elementView.model.id);
    }
    const cellView = this.getCellView(elementView.model.id);
    cellView.addTools(this.toolsView);
  };

  private onElementPointerUp = () => {
    this.groupDragActive = false;
    this.groupBasePos.clear();
    this.groupDragStart = null;
  };

  /*  private onLinkPointerUp = (linkView: dia.LinkView, evt: dia.Event) => {

  };*/

  private onBlankPointerClick = () => {
    this.clearAllSelection();
  };
  private onBlankPointerDown = (_evt: dia.Event, x: number, y: number) => {
    // start a fresh selection
    this.clearAllSelection();

    this.origin = { x, y };

    // create the overlay rect inside the paper's <svg>
    const svg = this.paper?.svg as SVGSVGElement | undefined;
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

    this.rubberNode = r;
  };

  private onBlankPointerUp = (_evt: dia.Event, x: number, y: number) => {
    if (!this.origin) return;

    const x0 = Math.min(this.origin.x, x);
    const y0 = Math.min(this.origin.y, y);
    const w = Math.abs(x - this.origin.x);
    const h = Math.abs(y - this.origin.y);
    const area = new g.Rect(x0, y0, w, h);

    const views = this.paper?.findElementViewsInArea(area) ?? [];
    const ids: ID[] = views.filter((v) => v.model.isElement()).map((v) => String(v.model.id));
    this.setSelection(ids);
    if (this.rubberNode) {
      this.rubberNode.parentNode?.removeChild(this.rubberNode);
      this.rubberNode = null;
    }
    this.origin = null;
  };

  private onBlankPointerMove = (_evt: dia.Event, x: number, y: number) => {
    if (!this.origin || !this.rubberNode) return;
    const x0 = Math.min(this.origin.x, x);
    const y0 = Math.min(this.origin.y, y);
    const w = Math.abs(x - this.origin.x);
    const h = Math.abs(y - this.origin.y);
    this.rubberNode.setAttribute('x', String(x0));
    this.rubberNode.setAttribute('y', String(y0));
    this.rubberNode.setAttribute('width', String(w));
    this.rubberNode.setAttribute('height', String(h));
  };

  /*
  private onLinkMouseEnter = (linkView: dia.LinkView, evt: dia.Event) => {};
*/

  /*
  private onBlankMouseOver = (evt: dia.Event) => {};
*/

  /*  private onGraphUpdate = (cell: dia.Cell, opt: dia.Cell.Options) => {

  };*/
  private onGraphRemove = (cell: dia.Cell) => {
    this.removeFromSelection(cell.id);
  };
}
