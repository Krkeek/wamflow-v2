import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { dia, elementTools, g, linkTools, shapes } from '@joint/core';
import html2canvas from 'html2canvas';
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  pairwise,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';

import { ElementSettingsDialog } from '../../shared/components/element-settings-dialog/element-settings-dialog';
import { JOINT_CONSTRAINTS } from '../constants/JointConstraints';
import { CellDataDto, CellPanelInfo } from '../dtos/cell-data.dto';
import { CellPanelDataDto } from '../dtos/cell-panel-data.dto';
import { LabelModes } from '../enums/LabelModes';
import { LocalStorageKeys } from '../enums/LocalStorageKeys';
import { Themes } from '../enums/Themes';
import { WamElements } from '../enums/WamElements';
import { WamLinks } from '../enums/WamLinks';
import { CustomElement } from '../Infrastructure/CustomElement';
import { CustomLink } from '../Infrastructure/CustomLink';
import { ResizeControl } from '../Infrastructure/ResizeControl';
import { GraphSave } from '../interfaces/GraphSave';
import { BaseUtility } from '../utilities/BaseUtility';

import { CellCreatorService } from './cellCreatorService';
import { DialogService } from './dialogService';
import { HistoryService } from './historyService';
import { LocalStorageService } from './localStorageService';
import { NavControlService } from './navControlService';
import { ThemeService } from './themeService';

import ToolsView = dia.ToolsView;
import ID = dia.Cell.ID;
import CellView = dia.CellView;

@Injectable({
  providedIn: 'root',
})
export class JointService implements OnDestroy {
  public selectedCells$ = new BehaviorSubject<ID[]>([]);
  public cellLabelMode = new BehaviorSubject<LabelModes>(LabelModes.none);
  public readonly ready = signal(false);
  public readonly title = signal('');
  public readonly paperDimensions = signal<{ width: number; height: number }>({
    width: 4000,
    height: 4000,
  });

  public activeLinkType$ = new BehaviorSubject(WamLinks.Invocation);
  public currentCellPanelInfo$ = new BehaviorSubject<CellPanelInfo | null>(null);

  private readonly _elementCreatorService = inject(CellCreatorService);
  private readonly _dialogService = inject(DialogService);
  private readonly _historyService = inject(HistoryService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _localStorageService = inject(LocalStorageService);
  private readonly _navControlService = inject(NavControlService);
  private readonly _cellCreatorService = inject(CellCreatorService);
  private readonly _themeService = inject(ThemeService);
  private _toolsView?: ToolsView;
  private _toolsViewLinks?: ToolsView;
  private _paper?: dia.Paper;
  private _saveTrigger$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  private _graph?: dia.Graph;

  private _groupDragActive = false;
  private _groupDragStart: { x: number; y: number } | null = null;
  private _groupBasePos = new Map<ID, { x: number; y: number }>();
  private _groupBaseVertices = new Map<ID, dia.Point[]>();
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
      Link: CustomLink,
    },
  };

  private _canvas?: HTMLElement;

  public constructor() {
    this.selectedCells$
      .pipe(
        distinctUntilChanged((a, b) => BaseUtility.arraysEqual(a, b)),
        pairwise(),
      )
      .subscribe(([prevIds, currIds]) => {
        const prevSet = new Set(prevIds);
        const currSet = new Set(currIds);
        this.updateMultiSelectionBox(currIds);
        this.updateCellPanelInfo();

        for (const id of prevIds) {
          if (!currSet.has(id)) {
            const cell = this.graph?.getCell(id);
            if (cell) {
              this.unhighlightCells([id]);
            }
          }
        }

        for (const id of currIds) {
          if (!prevSet.has(id)) {
            this.highlightCells([id]);
          }
        }
      });

    this._saveTrigger$
      .pipe(
        debounceTime(800),
        switchMap(() => this.persist()),
        catchError((err) => {
          console.error('Save failed', err);
          return of(null);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    this._themeService.activeTheme$.subscribe((theme) => {
      if (this._paper) this.toggleJointTheme(theme);
    });

    this.cellLabelMode.subscribe((labelMode) => {
      if (this._graph) this.toggleCellLabels(labelMode);
    });
  }

  private get canvas() {
    if (!this._canvas) throw 'Canvas is undefined';
    return this._canvas;
  }
  private get graph() {
    if (!this._graph) throw 'No graph defined';
    return this._graph;
  }

  private get paper() {
    if (!this._paper) throw 'No paper defined';
    return this._paper;
  }

  private get toolsView(): ToolsView {
    if (!this._toolsView) {
      throw new Error('No tools view found.');
    }
    return this._toolsView;
  }

  private get toolsViewLinks(): ToolsView {
    if (!this._toolsViewLinks) {
      throw new Error('No tools view found.');
    }
    return this._toolsViewLinks;
  }

  public clientToLocal(clientX: number, clientY: number) {
    return this.paper?.clientToLocalPoint({ x: clientX, y: clientY });
  }

  public setTitle(v: string) {
    this.title.set(v);
  }

  public triggerKeyboardAction(e: KeyboardEvent) {
    if (this.selectedCells$.value.length != 0) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.removeCells(this.selectedCells$.value);
      }
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      this._historyService.undo(this.graph);
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this._historyService.redo(this.graph);
    }
    if (!e.ctrlKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      this._navControlService.toggle('left');
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      this._navControlService.toggle('right');
    }
  }

  public updatePaperDimensions(width: number, height: number) {
    this.paper.setDimensions(width, height);
  }

  public async initPaper(canvas: HTMLElement): Promise<void> {
    this._canvas = canvas;

    await this.initGraph();
    this._paper = new dia.Paper({
      el: canvas,
      model: this.graph,
      width: this.paperDimensions().width,
      height: this.paperDimensions().height,
      gridSize: 10,
      drawGridSize: 30,
      background: { color: 'white' },
      drawGrid: JOINT_CONSTRAINTS.defaultGrid,
      defaultLink: () => this._cellCreatorService.createLink(this.activeLinkType$.value),
      cellViewNamespace: this.namespace,
      linkPinning: false,
      defaultConnectionPoint: { name: 'boundary' },
      restrictTranslate: true,
      embeddingMode: true,
      validateConnection: (s, _m, t) => s !== t,
      validateEmbedding: (_childView, parentView) => this.isSecurityRealm(parentView.model),
      highlighting: {
        default: {
          name: 'stroke',
          options: {
            padding: 8,
            rx: 6,
            ry: 6,
            attrs: {
              stroke: JOINT_CONSTRAINTS.primaryStroke,
              'stroke-width': 2,
              'stroke-dasharray': '4,2',
            },
          },
        },
        connecting: {
          name: 'stroke',
          options: {
            padding: 20,
            attrs: {
              stroke: JOINT_CONSTRAINTS.primaryStroke,
              'stroke-width': 1,
              'stroke-dasharray': '2',
            },
          },
        },
      },
    });
    this.unhighlightCells(this.graph.getCells().map((c) => c.id));
    this.initToolTips();
    this.bindPaperEvents();
    this.toggleJointTheme(this._themeService.activeTheme$.value);
    this.ready.set(true);
  }

  public resetPaper(): void {
    if (!this.graph) return;

    if (this.graph.getCells().length === 0) {
      this._snackBar.open('The diagram is already empty', 'Dismiss', { duration: 3000 });
      return;
    }

    this._dialogService
      .confirm({
        title: 'Reset Diagram',
        message: 'Are you sure you want to reset the diagram? This action cannot be undone.',
        confirmText: 'Reset',
        cancelText: 'Cancel',
        confirmColor: 'danger',
      })
      .subscribe((ok) => {
        if (ok) {
          this.clearAllSelection();
          this.removeMultiSelectionBox();
          this.graph.clear();
          this._snackBar.open('Diagram cleared successfully', 'Dismiss', { duration: 3000 });
        }
      });
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

  public updateCellPanelInfo(): void {
    const ids = this.selectedCells$.value;
    if (ids.length === 1) {
      const cell = this.getCellById(ids[0]);
      this.currentCellPanelInfo$.next({ id: ids[0], data: cell.prop('attrs/data') });
    } else {
      this.currentCellPanelInfo$.next(null);
    }
  }

  public updateCellData(id: ID, data: CellPanelDataDto) {
    const cell = this.getCellById(id);
    const prevData = cell.prop('attrs/data') as CellDataDto;
  }

  public toggleCellLabels = (label: LabelModes, ids?: ID[]) => {
    const cells = !ids
      ? this.graph.getCells()
      : this.graph.getCells().filter((cell) => ids.includes(cell.id));

    cells.forEach((cell) => {
      if (label === LabelModes.none) {
        cell.prop('attrs/labelOne/text', '');
      } else {
        const labelToShow = cell.prop('attrs/data/' + label);
        cell.prop('attrs/labelOne/text', labelToShow);
      }
    });
  };

  public addCell(cell: WamElements, specificGraph?: dia.Graph, specificPaper?: dia.Paper): void {
    const newCell = this._elementCreatorService.createElement(cell);

    if (specificGraph) {
      newCell.attr({
        body: { fill: JOINT_CONSTRAINTS.defaultPaletteFill },
        path: { fill: JOINT_CONSTRAINTS.defaultPaletteFill },
        bottom: { fill: JOINT_CONSTRAINTS.defaultPaletteFill },
        top: { fill: JOINT_CONSTRAINTS.defaultPaletteFill },
      });
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

  public addCellAt(
    cell: WamElements,
    x: number,
    y: number,
    dimensions?: { width: number; height: number },
  ) {
    this._historyService.snapshot(this.graph);
    const el = this._elementCreatorService.createElement(cell);

    const { width, height } = el.size();

    if (dimensions) el.resize(dimensions.width, dimensions.height);
    el.position(x - width / 2, y - height / 2);
    el.addTo(this.graph);
    el.toFront();
    this.tryEmbedIntoSecurityRealm(el);
    this.selectSingle(el.id);
    const cellView = el.findView(this.paper);
    this.showToolView(cellView);
    this.toggleCellLabels(this.cellLabelMode.value, [el.id]);
  }

  public highlightCells(cellIds: ID[]): void {
    cellIds.forEach((cellId) => {
      const cell = this.getCellById(cellId);

      if (!cell) return;

      if (cell.isElement()) {
        cell.attr('body/stroke', JOINT_CONSTRAINTS.primaryStroke);
        cell.attr('path/stroke', JOINT_CONSTRAINTS.primaryStroke);
        cell.attr('bottom/stroke', JOINT_CONSTRAINTS.primaryStroke);
        cell.attr('top/stroke', JOINT_CONSTRAINTS.primaryStroke);
      }

      if (cell.isLink()) {
        cell.attr('line/stroke', JOINT_CONSTRAINTS.primaryStroke);
      }
    });
  }

  public unhighlightCells(cellIds: ID[]): void {
    cellIds.forEach((cellId) => {
      const cellView = this.getCellView(cellId);
      if (cellView) {
        cellView.removeTools();
      }

      const cell = this.getCellById(cellId);
      if (!cell) return;

      if (cell.isElement()) {
        cell.attr('body/stroke', JOINT_CONSTRAINTS.defaultStroke);
        cell.attr('path/stroke', JOINT_CONSTRAINTS.defaultStroke);
        cell.attr('bottom/stroke', JOINT_CONSTRAINTS.defaultStroke);
        cell.attr('top/stroke', JOINT_CONSTRAINTS.defaultStroke);
      }

      if (cell.isLink()) {
        cell.attr('line/stroke', JOINT_CONSTRAINTS.defaultStroke);
      }
    });
  }

  public ngOnDestroy(): void {
    this.paper.off('element:pointerdown');
    this.paper.off('element:mouseover');
    this.paper.off('element:mouseleave');
    this.paper.off('element:pointermove');
    this.paper.off('element:pointerup');
    this.paper.off('element:mouseenter');
    this.paper.off('element:mouseleave');
    this.paper.off('link:contextmenu');
    this.paper.off('link:pointerdown');
    this.paper.off('link:pointerup');
    this.paper.off('link:mouseenter');
    this.paper.off('blank:pointerclick');
    this.paper.off('blank:pointerdown');
    this.paper.off('blank:pointerup');
    this.paper.off('blank:pointermove');
    this.paper.off('blank:mouseover');
    this.graph.off('change');
    this.graph.off('add');
    this.graph.off('remove');
    this.graph.off('change');

    this.destroy$.next();
    this.destroy$.complete();
  }

  public removeCells = (idsToRemove: ID[]) => {
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
          this._historyService.snapshot(this.graph);
          const cellsToRemove = this.graph
            .getCells()
            .filter((cell) => idsToRemove.includes(cell.id));
          this.graph.removeCells(cellsToRemove);

          let deleteMessage = 'Element Deleted';
          if (cellsToRemove.length > 1) deleteMessage = 'Elements Deleted';
          this._snackBar.open(deleteMessage, 'Dismiss', { duration: 3000 });

          this.removeMultiSelectionBox();
        }
      });
  };

  public resetCellsData = (idsToReset: ID[]) => {
    this._dialogService
      .confirm({
        title: 'Reset all data',
        message:
          this.selectedCells$.value.length < 2
            ? 'Are you sure you want to reset all properties for this cell? This action cannot be undone.'
            : 'Are you sure you want to reset all properties for these cells? This action cannot be undone.',
        confirmText: 'Reset All',
        cancelText: 'Cancel',
        confirmColor: 'danger',
      })
      .subscribe((ok) => {
        if (ok) {
          this._historyService.snapshot(this.graph);
          const cellsToReset = this.graph.getCells().filter((cell) => idsToReset.includes(cell.id));

          cellsToReset.forEach((cell) => {
            const dto = cell.prop('attrs/data') as CellDataDto | undefined;
            if (!dto) return;

            dto.name = '';
            dto.uri = '';

            Object.entries(dto.props).forEach(([_key, prop]) => {
              prop.value = null;
            });
            cell.prop('attrs/data', dto);
            this.updateCellPanelInfo();
          });

          this._snackBar.open('All data is reset', 'Dismiss', { duration: 3000 });
        }
      });
  };

  public checkForCustomDimensions(element: WamElements) {
    return element === WamElements.SecurityRealm ? { width: 500, height: 300 } : undefined;
  }

  public getCellById(cellId: ID) {
    const cell = this.graph?.getCell(cellId);
    if (!cell) throw Error(`Unable to get cell ${cellId}`);
    return cell;
  }

  public duplicateCell(cellId: ID): void {
    const cell = this.graph.getCell(cellId);
    if (!cell || !cell.isElement()) return;

    const newCell = cell.clone();

    const { x, y } = (cell as dia.Element).position();
    const { width } = (cell as dia.Element).size();

    const offset = 20;
    (newCell as dia.Element).position(x + width + offset, y);

    newCell.addTo(this.graph);
    this.selectSingle(newCell.id);
  }

  public importJSON = async (file: File) => {
    const JSONObject = await BaseUtility.parseJsonFile(file);
    this.graph.fromJSON(JSONObject);
    this.parseTitleFromGraph();
    this._snackBar.open('Diagram imported successfully', 'Dismiss', { duration: 2500 });
  };

  public exportJSON = async () => {
    if (this.graph.getCells().length === 0) {
      this._snackBar.open('The diagram is empty', 'Dismiss', { duration: 3000 });
      return;
    }
    this.parseTitleToGraph();
    const jsonObject = this.graph.toJSON();
    await BaseUtility.exportJSONHelper(jsonObject, this.title());

    this._snackBar.open('Diagram exported as JSON', 'Dismiss', { duration: 2500 });
  };

  public exportPNG = async () => {
    if (this.graph.getCells().length === 0) {
      this._snackBar.open('The diagram is empty', 'Dismiss', { duration: 3000 });
      return;
    }
    this.exportPNGPrepare('before');
    html2canvas(this.canvas).then((canvas) => {
      const based64image = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.setAttribute('href', based64image);
      anchor.setAttribute('download', this.title());
      anchor.click();
      anchor.remove();
    });
    this.exportPNGPrepare('after');
    this._snackBar.open('Diagram exported as PNG', 'Dismiss', { duration: 2500 });
  };

  public toggleJointTheme(theme: Themes): void {
    if (theme === Themes.Dark) {
      this.paper.setGrid(JOINT_CONSTRAINTS.defaultGridDark);
      this.paper.drawBackground(JOINT_CONSTRAINTS.paperBackgroundDark);
    }
    if (theme === Themes.Light) {
      this.paper.setGrid(JOINT_CONSTRAINTS.defaultGrid);
      this.paper.drawBackground(JOINT_CONSTRAINTS.paperBackground);
    }
  }

  public toggleCellLayer = (cellId: ID) => {
    const cellToToggle = this.graph.getCell(cellId);
    const cells = this.graph.getCells();
    const idx = cells.indexOf(cellToToggle);

    if (idx === cells.length - 1) {
      cellToToggle.toBack();
      this._snackBar.open('Element sent to back', 'Dismiss', { duration: 2500 });
    } else {
      cellToToggle.toFront();
      this._snackBar.open('Element sent to front', 'Dismiss', { duration: 2500 });
    }
  };

  private exportPNGPrepare = (stage: 'before' | 'after') => {
    if (stage === 'before') {
      if (this._multiBoxG) this._multiBoxG.style.display = 'none';
      this.unhighlightCells(this.selectedCells$.value);
      this.paper.setGrid({ name: 'mesh', args: { color: 'transparent' } });
      this.paper.fitToContent({
        allowNewOrigin: 'any',
        allowNegativeBottomRight: false,
        padding: 5,
      });
    } else {
      if (this._multiBoxG) this._multiBoxG.style.display = '';
      this.highlightCells(this.selectedCells$.value);
      this.paper.setDimensions(
        JOINT_CONSTRAINTS.paperDefaultDimensions.width,
        JOINT_CONSTRAINTS.paperDefaultDimensions.height,
      );
      this.paper.translate(0, 0);
      this.paper.setGrid(JOINT_CONSTRAINTS.defaultGrid);
    }
  };

  private parseTitleToGraph() {
    this.graph?.set('title', this.title());
  }

  private parseTitleFromGraph() {
    const title = this.graph?.get('title');
    this.title.set(title);
  }

  private getSelectedIds(): ID[] {
    return this.selectedCells$.value ?? [];
  }

  private async initGraph(): Promise<dia.Graph | void> {
    this._graph = new dia.Graph({}, { cellNamespace: this.namespace });
    await this.tryLoadingLocalStorageGraph();
  }
  private tryLoadingLocalStorageGraph = async () => {
    const saved = (await this._localStorageService.load(LocalStorageKeys.JointGraph)) as GraphSave;
    if (saved?.data) {
      try {
        this.graph.fromJSON(saved.data);
        if (this.graph.getCells().length != 0) {
          this._snackBar
            .open('Restored from last session', 'New Diagram', { duration: 5000 })
            .onAction()
            .subscribe(() => {
              this.resetPaper();
            });
        }
      } catch (e) {
        console.error(e);
        this._snackBar.open('Couldn’t restore your diagram', 'Dismiss', { duration: 3000 });
      }
    }
  };

  private getPaletteItemGraph(): dia.Graph {
    return new dia.Graph({}, { cellNamespace: shapes });
  }
  private getCellView(cellId: ID): CellView {
    const cell = this.getCellById(cellId);
    return cell.findView(this.paper);
  }

  private setEdgeHighlight(view: dia.ElementView, enabled: boolean): void {
    if (!view.model) return;

    view.model.attr(
      ['edge', 'stroke'],
      enabled ? JOINT_CONSTRAINTS.edgeHighlightColor : 'transparent',
    );
    view.model.attr(['edge', 'cursor'], enabled ? 'crosshair' : 'move');
  }

  private initToolTips(): void {
    const removeButton = new elementTools.Remove({
      action: (evt: dia.Event, view: dia.ElementView) => {
        evt.preventDefault();
        evt.stopPropagation();

        this.removeCells([view.model.id]);
      },
    });

    const verticesTool = new linkTools.Vertices();
    const segmentsTool = new linkTools.Segments();

    this._toolsViewLinks = new dia.ToolsView({
      tools: [verticesTool, segmentsTool, removeButton],
    });

    const boundaryTool = new elementTools.Boundary();
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
            fill: 'black',
            cursor: 'pointer',
          },
        },
        {
          tagName: 'path',
          selector: 'icon',
          attributes: {
            d: 'M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4',
            fill: 'none',
            stroke: '#FFFFFF',
            'stroke-width': 2,
            'pointer-events': 'none',
          },
        },
      ],
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

  private showToolView = (cellView: dia.CellView) => {
    const model = cellView.model;
    if (!this.selectedCells$.value.find((id) => id == model.id)) {
      this.selectSingle(model.id);
    }
    const tools = model.isElement() ? this.toolsView : model.isLink() ? this.toolsViewLinks : null;
    if (tools) {
      cellView.addTools(tools);
    }
  };

  private bindPaperEvents(): void {
    // attach
    this.paper.on('element:pointerdown', this.onElementPointerDown);
    this.paper.on('element:pointermove', this.onElementPointerMove);
    this.paper.on('element:pointerup', this.onElementPointerUp);
    this.paper.on('element:contextmenu', this.onElementContextMenu);
    this.paper.on('element:mouseenter', this.onElementMouseEnter);
    this.paper.on('element:mouseleave', this.onElementMouseLeave);
    this.paper.on('link:contextmenu', this.onLinkContextMenu);
    this.paper.on('link:pointerdown', this.onLinkPointerDown);
    this.paper.on('blank:pointerclick', this.onBlankPointerClick);
    this.paper.on('blank:pointerdown', this.onBlankPointerDown);
    this.paper.on('blank:pointerup', this.onBlankPointerUp);
    this.paper.on('blank:pointermove', this.onBlankPointerMove);
    this.graph.on('remove', this.onGraphRemove);
    this.graph.on('add', this.onGraphAdd);
    this.graph.on('change', this.onGraphChange);
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
    this._multiBoxResizeButton = undefined;
    this._multiBoxRect = undefined;
  }

  private persist() {
    const data = this.graph.toJSON();
    const payload: GraphSave = { version: 1, ts: Date.now(), data };
    return this._localStorageService.save<GraphSave>(LocalStorageKeys.JointGraph, payload);
  }

  private onElementPointerDown = (
    elementView: dia.ElementView,
    _evt: dia.Event,
    x?: number,
    y?: number,
  ) => {
    this.initDraggingCells(elementView, x, y);
  };

  private onLinkPointerDown = (elementView: dia.LinkView) => {
    const ids = this.getSelectedIds();
    const thisId = String(elementView.model.id);

    if (!ids.includes(thisId)) {
      this.selectSingle(elementView.model.id);
    }
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

  private onElementPointerUp = (elementView: dia.ElementView) => {
    this.resetGroupDragConstraints();
    this.tryEmbedMultiElementsIntoSecurityRealm(elementView);
  };

  private onElementMouseEnter = (elementView: dia.ElementView) => {
    this.setEdgeHighlight(elementView, true);
  };

  private onElementMouseLeave = (elementView: dia.ElementView) => {
    this.setEdgeHighlight(elementView, false);
  };

  private onLinkContextMenu = (linkView: dia.LinkView) => {
    this.showToolView(linkView);
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
    this._saveTrigger$.next();
  };

  private onGraphAdd = () => {
    this.removeMultiSelectionBox();
    this._saveTrigger$.next();
  };

  private onGraphChange = () => {
    this._saveTrigger$.next();
  };

  private createRubberNode = (x: number, y: number) => {
    this._origin = { x, y };

    const svg = this.paper.svg as SVGSVGElement | undefined;
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

    const views = this.paper.findCellViewsInArea(area, {
      strict: false,
      inflated: 2,
    });

    if (views) {
      const ids: ID[] = views.map((v) => String(v.model.id));
      this.setSelection(ids);
      if (this._rubberNode) {
        this._rubberNode.parentNode?.removeChild(this._rubberNode);
        this._rubberNode = undefined;
      }
      this._origin = undefined;
    }
  };
  private tryEmbedIntoSecurityRealm(child: dia.Element) {
    const center = child.getBBox().center();
    const viewsAtPoint = this.paper.findElementViewsAtPoint(center);

    const parents = viewsAtPoint
      .map((v) => v.model)
      .filter(
        (m): m is dia.Element => m.isElement() && m.id !== child.id && this.isSecurityRealm(m),
      );

    const parent = parents.at(-1);
    if (parent) {
      parent.embed(child);
      parent.toBack();
    }
  }

  private tryEmbedMultiElementsIntoSecurityRealm(elementView: dia.ElementView) {
    const dragged = elementView.model as dia.Element;
    const parent = dragged.getParentCell() as dia.Element | null;

    if (!parent || !this.isSecurityRealm(parent)) return;

    const selectedIds: ID[] = this.selectedCells$.value ?? [];
    const selectedEls = selectedIds
      .map((id) => this.graph.getCell(id))
      .filter((c): c is dia.Element => !!c && c.isElement());

    const parentBB = parent.getBBox();

    selectedEls.forEach((el) => {
      if (el.id === dragged.id) return;
      const elBB = el.getBBox();

      if (parentBB.containsRect(elBB)) {
        parent.embed(el);
      } else {
        if (el.getParentCell() && el.getParentCell()!.id === parent.id) {
          parent.unembed(el);
        }
      }
    });
    parent.toBack();
    this.removeMultiSelectionBox();
  }

  private isSecurityRealm = (m: dia.Element) => m.attr('data/type') === WamElements.SecurityRealm;

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
    if (selectedIds.length < 2) return;

    if (!selectedIds.length) {
      this.removeMultiSelectionBox();
      return;
    }
    const views = selectedIds
      .map((id) => this.graph?.getCell(id))
      .filter((c): c is dia.Element => !!c && c.isElement())
      .map((el) => el.findView(this.paper))
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
    const svg = this.paper.svg as SVGSVGElement;
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
        this.removeCells(this.selectedCells$.value);
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

    this.graph?.startBatch('group-move');

    const grabbedId = String(view.model.id);
    for (const id of this.getSelectedIds()) {
      if (id === grabbedId) continue;
      const base = this._groupBasePos.get(id);
      const cell = this.graph?.getCell(id);
      if (base && cell && cell.isElement()) {
        (cell as dia.Element).position(base.x + dx, base.y + dy);
      } else if (cell.isLink()) {
        const baseVertices = this._groupBaseVertices.get(id);
        if (baseVertices) {
          const moved = baseVertices.map((v) => ({ x: v.x + dx, y: v.y + dy }));
          (cell as dia.Link).vertices(moved);
        }
      }
    }

    if (this._multiBoxG && this._groupDragStart) {
      const dx = (x ?? 0) - this._groupDragStart.x;
      const dy = (y ?? 0) - this._groupDragStart.y;
      this._multiBoxG.setAttribute('transform', `translate(${dx}, ${dy})`);
    }

    this.graph?.stopBatch('group-move');
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
      const cell = this.graph?.getCell(id);
      if (cell && cell.isElement()) {
        const { x: px, y: py } = (cell as dia.Element).position();
        this._groupBasePos.set(id, { x: px, y: py });
      } else if (cell.isLink()) {
        const vertices = (cell as dia.Link).vertices() || [];
        this._groupBaseVertices.set(
          id,
          vertices.map((v) => ({ x: v.x, y: v.y })),
        );
      }
    }
    this._groupDragActive = true;
  }
  private resetGroupDragConstraints() {
    this._groupDragActive = false;
    this._groupBasePos.clear();
    this._groupDragStart = null;
    this._groupBaseVertices.clear();

    if (this._multiBoxG) this._multiBoxG.removeAttribute('transform');
    this.updateMultiSelectionBox(this.getSelectedIds());
  }

  private beginGroupResize() {
    const ids = this.getSelectedIds();
    if (ids.length < 2) return; // only for multi-select (or allow 1 if you like)

    // Compute current union bbox and anchor (top-left)
    const views = ids
      .map((id) => this.graph!.getCell(id))
      .filter((c): c is dia.Element => !!c && c.isElement())
      .map((el) => el.findView(this.paper))
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
      const cell = this.graph.getCell(id) as dia.Element | null;
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
      !this.graph
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

    this.graph.startBatch('group-resize');

    for (const [id, base] of this._groupResizeBase.entries()) {
      const cell = this.graph.getCell(id) as dia.Element | null;
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

    this.graph.stopBatch('group-resize');

    // Recompute overlay each move so the handle sticks to bottom-right
    this.updateMultiSelectionBox(this.getSelectedIds());
  }
}
