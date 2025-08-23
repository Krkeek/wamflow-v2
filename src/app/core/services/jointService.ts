import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { dia, elementTools, g, shapes } from '@joint/core';
import { WamElements } from '../enums/WamElements';
import { ElementCreatorService } from './elementCreatorService';
import { JOINT_CONSTRAINTS } from '../constants/JointConstraints';
import { BehaviorSubject, distinctUntilChanged, pairwise } from 'rxjs';
import { ResizeControl } from '../Infrastructure/ResizeControl';
import ToolsView = dia.ToolsView;
import ID = dia.Cell.ID;
import CellView = dia.CellView;
import { DialogService } from './dialogService';
import { ElementSettingsDialog } from '../../shared/components/element-settings-dialog/element-settings-dialog';
import { CustomElement } from '../Infrastructure/CustomElement';
import { HistoryService } from './historyService';

@Injectable({
  providedIn: 'root',
})
export class JointService implements OnDestroy {
  public selectedCells$ = new BehaviorSubject<ID[]>([]);
  public readonly ready = signal(false);
  public readonly title = signal('');
  private readonly _elementCreatorService = inject(ElementCreatorService);
  private readonly _dialogService = inject(DialogService);
  private readonly _historyService = inject(HistoryService);
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
  private _multiBoxResizeButton?: SVGElement;
  private _groupResizeActive = false;
  private _groupResizeBase = new Map<ID, { x: number; y: number; w: number; h: number }>();
  private _groupResizeAnchor: { x: number; y: number } | null = null;
  private _groupResizeStart: { w: number; h: number } | null = null;
  private namespace = {
    ...shapes,
    custom: {
      Element: CustomElement,
    },
  };

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
          if (!currSet.has(id)) {
            const cell = this._graph?.getCell(id);
            if (cell) {
              this.unhighlightCell(id);
            }
          }
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

  public setTitle(v: string) {
    this.title.set(v);
  }

  public triggerKeyboardAction(e: KeyboardEvent) {
    if (!this._graph || this.selectedCells$.value.length === 0) return;
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      this._dialogService
        .confirm({
          title: this.selectedCells$.value.length < 2 ? 'Delete cell' : 'Delete cells',
          message:
            this.selectedCells$.value.length < 2
              ? 'Are you sure you want to delete this cell? This action cannot be undone.'
              : 'Are you sure you want to delete these cells? This action cannot be undone.',
          confirmText: this.selectedCells$.value.length < 2 ? 'Delete' : 'Delete All',
          cancelText: 'Cancel',
          confirmColor: 'danger',
        })
        .subscribe((ok) => {
          if (ok) {
            this.removeCells(this.selectedCells$.value);
            this.removeMultiSelectionBox();
          }
        });
    }

    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      this._historyService.undo(this._graph);
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      this._historyService.redo(this._graph);
    }
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
      cellViewNamespace: this.namespace,
      linkPinning: false,
      defaultConnectionPoint: { name: 'boundary' },
      restrictTranslate: true,
      embeddingMode: true,
      highlighting: { embedding: false },
      validateConnection: (s, _m, t) => s !== t,
    });

    this.initToolTips();
    this.bindPaperEvents();
    this.ready.set(true);
  }

  public initPalettePaper(canvas: HTMLElement): { graph: dia.Graph; paper: dia.Paper } {
    const graph = this.getPaletteItemGraph();
    const paper = new dia.Paper({
      el: canvas,
      model: graph,
      interactive: false,
      cellViewNamespace: this.namespace,
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
    if (!this._graph || !this._paper) return;
    this._historyService.snapshot(this._graph);
    const el = this._elementCreatorService.create(cell);
    const { width, height } = el.size();
    el.position(x - width / 2, y - height / 2);
    el.addTo(this._graph);
    this.selectSingle(el.id);
    const cellView = el.findView(this._paper);
    this.showToolView(cellView);
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

  public duplicateCell(cellId: ID): void {
    if (!this._graph || !this._paper) return;

    const cell = this._graph.getCell(cellId);
    if (!cell || !cell.isElement()) return;

    const newCell = cell.clone();

    const { x, y } = (cell as dia.Element).position();
    const { width } = (cell as dia.Element).size();

    const offset = 20;
    (newCell as dia.Element).position(x + width + offset, y);

    newCell.addTo(this._graph);
    this.selectSingle(newCell.id);
  }

  public clientToLocal(clientX: number, clientY: number) {
    if (!this._paper) throw new Error('No _paper or _graph found.');
    return this._paper.clientToLocalPoint({ x: clientX, y: clientY });
  }

  public importJSON = async (file: File) => {
    if (!this._graph) return;
    const JSONObject = await this.parseJsonFile(file);
    this._graph.fromJSON(JSONObject);
    this.parseTitleFromGraph();
  };

  public exportJSON = async () => {
    if (!this._graph) return;
    this.parseTitleToGraph();
    const jsonObject = this._graph.toJSON();
    const jsonString = JSON.stringify(jsonObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = (this.title() || 'Untitled') + '.json';
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    this._graph.off('change');
    this._graph.off('add');
    this._graph.off('remove');
    this._graph.off('change add remove');
  }

  public removeCells = (idsToRemove: ID[]) => {
    if (!this._graph) return;
    this._historyService.snapshot(this._graph);
    const cellsToRemove = this._graph.getCells().filter((cell) => idsToRemove.includes(cell.id));
    this._graph.removeCells(cellsToRemove);
  };

  public removeCellById = (idToRemove: ID) => {
    if (!this._graph) return;
    this._historyService.snapshot(this._graph);
    const cellsToRemove = this._graph.getCell(idToRemove);
    this._graph.removeCells([cellsToRemove]);
  };

  private parseTitleToGraph() {
    this._graph?.set('title', this.title());
  }

  private parseTitleFromGraph() {
    const title = this._graph?.get('title');
    this.title.set(title);
  }

  private parseJsonFile = async (file: File): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = (event: ProgressEvent<FileReader>) => {
        const reader = event.target;
        if (!reader) {
          reject(new Error('No FileReader target'));
          return;
        }
        try {
          const text = reader.result as string;
          resolve(JSON.parse(text));
        } catch (err) {
          reject(err);
        }
      };

      fileReader.onerror = (event: ProgressEvent<FileReader>) => {
        reject(event.target?.error ?? new Error('FileReader error'));
      };

      fileReader.readAsText(file);
    });
  };

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

  private initGraph(): dia.Graph | void {
    this._graph = new dia.Graph({}, { cellNamespace: this.namespace });
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

    const removeButton = new elementTools.Remove({
      action: (evt: dia.Event, view: dia.ElementView) => {
        evt.preventDefault();
        evt.stopPropagation();

        this._dialogService
          .confirm({
            title: 'Delete cell',
            message: 'Are you sure you want to delete this cell? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmColor: 'danger',
          })
          .subscribe((ok) => {
            if (ok) {
              this.removeCellById(view.model.id);
            }
          });
      },
    });

    const resizeButton = new ResizeControl();

    const settingsButton = new elementTools.Button({
      x: '99%',
      y: '1%',
      markup: [
        {
          tagName: 'circle',
          selector: 'button',
          attributes: {
            r: 7,
            fill: 'gray',
            cursor: 'pointer',
          },
        },
        {
          tagName: 'text',
          selector: 'icon',
          attributes: {
            x: 0,
            y: 1,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': 10,
            'font-weight': 'bold',
            fill: '#333',
            'pointer-events': 'none',
          },
        },
      ],
      icon: { icon: '⚙' },
      action: (evt: dia.Event, view: dia.ElementView) => {
        this._dialogService.openDialog(ElementSettingsDialog, {
          data: { view: view, evt: evt },
          autoFocus: false,
          panelClass: 'dialog-container',
        });
      },
    });
    this._toolsView = new dia.ToolsView({
      tools: [boundaryTool, removeButton, resizeButton, settingsButton],
    });
  }
  private bindPaperEvents(): void {
    if (!this._paper || !this._graph) throw new Error('No _paper or _graph found.');

    // attach
    this._paper.on('element:pointerdown', this.onElementPointerDown);
    this._paper.on('element:pointermove', this.onElementPointerMove);
    this._paper.on('element:pointerup', this.onElementPointerUp);
    this._paper.on('element:contextmenu', this.onElementContextMenu);
    this._paper.on('blank:pointerclick', this.onBlankPointerClick);
    this._paper.on('blank:pointerdown', this.onBlankPointerDown);
    this._paper.on('blank:pointerup', this.onBlankPointerUp);
    this._paper.on('blank:pointermove', this.onBlankPointerMove);
    this._graph.on('remove', this.onGraphRemove);
    this._graph.on('add', this.onGraphAdd);
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
  /*  private addToSelection(id: ID) {
    const next = new Set(this.selectedCells$.value);
    next.add(id);
    this.selectedCells$.next([...next]);
  }*/
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
    this.removeMultiSelectionBox();
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
    this.removeMultiSelectionBox();
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

  private onGraphAdd = () => {
    if (!this._graph) return;
    this.removeMultiSelectionBox();
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
      this._multiBoxRect.setAttribute('stroke', JOINT_CONSTRAINTS.multiBoxSelectorColor);
      this._multiBoxRect.setAttribute('stroke-width', JOINT_CONSTRAINTS.multiBoxSelectorThickness);
      this._multiBoxRect.setAttribute('stroke-dasharray', '6,4');
      this._multiBoxRect.setAttribute('vector-effect', 'non-scaling-stroke');
      this._multiBoxRect.setAttribute('pointer-events', 'none');

      this._multiBoxDeleteButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this._multiBoxResizeButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      // red circle background
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '7');
      circle.setAttribute('fill', 'red');
      circle.setAttribute('pointer-events', 'none');

      // blue circle background
      const circleTwo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleTwo.setAttribute('r', '7');
      circleTwo.setAttribute('fill', 'black');
      circleTwo.setAttribute('pointer-events', 'none');

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

      this._multiBoxResizeButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this._multiBoxResizeButton.setAttribute('cursor', 'se-resize');
      this._multiBoxResizeButton.setAttribute('pointer-events', 'visiblePainted');

      // 1) Visual: little corner "L" (or arrow) — purely visual
      const corner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      corner.setAttribute('d', 'M0 12 L12 12 L12 0'); // small L shape
      corner.setAttribute('fill', 'none');
      corner.setAttribute('stroke', 'black');
      corner.setAttribute('stroke-width', '2');
      corner.setAttribute('pointer-events', 'none'); // visual only

      // 2) Transparent hit area (captures the events)
      const hitTwo = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hitTwo.setAttribute('x', String(-10));
      hitTwo.setAttribute('y', String(-10));
      hitTwo.setAttribute('width', '24');
      hitTwo.setAttribute('height', '24');
      hitTwo.setAttribute('fill', 'transparent');
      hitTwo.setAttribute('pointer-events', 'all');

      // prevent JointJS from reacting first
      const eat = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
      };
      this._multiBoxResizeButton.addEventListener('mousedown', (e) => {
        eat(e);
        this.beginGroupResize();
      });
      this._multiBoxResizeButton.addEventListener(
        'touchstart',
        (e) => {
          eat(e);
          this.beginGroupResize();
        },
        { passive: false },
      );

      this._multiBoxResizeButton.appendChild(corner);
      this._multiBoxResizeButton.appendChild(hitTwo);
      this._multiBoxG!.appendChild(this._multiBoxResizeButton);

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
        this._dialogService
          .confirm({
            title: 'Delete cells',
            message: 'Are you sure you want to delete these cells? This action cannot be undone.',
            confirmText: 'Delete All',
            cancelText: 'Cancel',
            confirmColor: 'danger',
          })
          .subscribe((ok) => {
            if (ok) {
              this.removeCells(this.selectedCells$.value);
              this.removeMultiSelectionBox();
            }
          });
      });

      this._multiBoxDeleteButton.appendChild(circle);
      this._multiBoxDeleteButton.appendChild(cross);
      this._multiBoxDeleteButton.appendChild(hit);
      this._multiBoxG.appendChild(this._multiBoxRect);
      this._multiBoxG.appendChild(this._multiBoxDeleteButton);
      this._multiBoxG.appendChild(this._multiBoxResizeButton);
      viewportLayer.appendChild(this._multiBoxG);
      this._multiBoxDeleteButton.setAttribute(
        'transform',
        `translate(${bbox.x + 10}, ${bbox.y + 10})`,
      );

      if (this._multiBoxResizeButton) {
        this._multiBoxResizeButton.setAttribute(
          'transform',
          `translate(${bbox.x + (bbox.width - 10)}, ${bbox.y + (bbox.height - 10)})`,
        );
      }
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
    // Reposition the delete button on EVERY update
    if (this._multiBoxResizeButton) {
      this._multiBoxResizeButton.setAttribute(
        'transform',
        `translate(${bbox.x + (bbox.width - 10)}, ${bbox.y + (bbox.height - 10)})`,
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

  private showToolView = (cellView: dia.CellView) => {
    if (!this.selectedCells$.value.find((id) => id == cellView.model.id)) {
      this.selectSingle(cellView.model.id);
    }
    cellView.addTools(this.toolsView);
  };

  private beginGroupResize() {
    if (!this._paper || !this._graph) return;

    const ids = this.getSelectedIds();
    if (ids.length < 2) return; // only for multi-select (or allow 1 if you like)

    // Compute current union bbox and anchor (top-left)
    const views = ids
      .map((id) => this._graph!.getCell(id))
      .filter((c): c is dia.Element => !!c && c.isElement())
      .map((el) => el.findView(this._paper!))
      .filter((v): v is dia.ElementView => !!v);

    if (!views.length) return;

    let bbox = views[0].getBBox({ useModelGeometry: true });
    for (let i = 1; i < views.length; i++)
      bbox = bbox.union(views[i].getBBox({ useModelGeometry: true }));

    this._groupResizeAnchor = { x: bbox.x, y: bbox.y };
    this._groupResizeStart = { w: Math.max(bbox.width, 1), h: Math.max(bbox.height, 1) };

    // Store base pos & size of each element
    this._groupResizeBase.clear();
    for (const id of ids) {
      const cell = this._graph.getCell(id) as dia.Element | null;
      if (!cell?.isElement()) continue;
      const p = cell.position();
      const s = cell.size();
      this._groupResizeBase.set(id, { x: p.x, y: p.y, w: s.width, h: s.height });
    }

    this._groupResizeActive = true;

    // Attach move/up listeners on the document so dragging stays smooth
    const onMove = (ev: MouseEvent | Touch) => {
      const { x, y } = this.clientToLocal(ev.clientX, ev.clientY);
      this.performGroupResize(x, y);
    };
    const onMouseMove = (e: MouseEvent) => onMove(e);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0]);
      e.preventDefault();
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onUp);

      this._groupResizeActive = false;
      this._groupResizeAnchor = null;
      this._groupResizeStart = null;

      // Recompute overlay (and ensure no leftover transform)
      if (this._multiBoxG) this._multiBoxG.removeAttribute('transform');
      this.updateMultiSelectionBox(this.getSelectedIds());
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onUp, { once: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onUp, { once: true });
  }

  private performGroupResize(x: number, y: number) {
    if (
      !this._groupResizeActive ||
      !this._groupResizeAnchor ||
      !this._groupResizeStart ||
      !this._graph
    )
      return;

    const anchor = this._groupResizeAnchor; // top-left fixed corner of the group
    const start = this._groupResizeStart; // initial bbox size (w,h)

    // Raw scale factors from anchor → pointer
    const sx = (x - anchor.x) / Math.max(start.w, 1);
    const sy = (y - anchor.y) / Math.max(start.h, 1);

    // Uniform scale to preserve aspect ratio
    const sMin = 0.05; // guard against collapsing
    const s = Math.max(Math.max(sx, sy), sMin); // <-- key line: same factor for X & Y

    this._graph.startBatch('group-resize');

    for (const [id, base] of this._groupResizeBase.entries()) {
      const cell = this._graph.getCell(id) as dia.Element | null;
      if (!cell?.isElement()) continue;

      // offset from the anchor in initial geometry
      const ox = base.x - anchor.x;
      const oy = base.y - anchor.y;

      // new pos = anchor + scaled offset (keeps anchor fixed)
      const nx = anchor.x + ox * s;
      const ny = anchor.y + oy * s;

      // new size = scaled base size (uniform)
      const minW = 10,
        minH = 10;
      const nw = Math.max(base.w * s, minW);
      const nh = Math.max(base.h * s, minH);

      cell.position(nx, ny);
      cell.resize(nw, nh);
    }

    this._graph.stopBatch('group-resize');

    // Recompute overlay each move so the handle sticks to bottom-right
    this.updateMultiSelectionBox(this.getSelectedIds());
  }
}
