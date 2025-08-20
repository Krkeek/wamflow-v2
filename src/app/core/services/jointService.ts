import { ElementRef, inject, Injectable } from '@angular/core';
import { dia, shapes } from '@joint/core';
import { WamElements } from '../enums/WamElements';
import { ElementCreatorService } from './elementCreatorService';

@Injectable({
  providedIn: 'root',
})
export class JointService {
  private graph?: dia.Graph;
  private paper?: dia.Paper;
  private readonly elementCreatorService = inject(ElementCreatorService);

  constructor() {}

  public initPaper(canvas: ElementRef<HTMLElement>): void {
    this.initGraph();
    this.paper = new dia.Paper({
      el: canvas.nativeElement,
      model: this.graph,
      height: '85%',
      width: '100%',
      gridSize: 1,
      cellViewNamespace: shapes,
      background: { color: '#E9ECEF' },
      linkPinning: false,
      defaultConnectionPoint: { name: 'boundary' },
      restrictTranslate: true,
      embeddingMode: true,
      highlighting: {
        embedding: false,
      },
      validateConnection: function (cellViewS, magnetS, cellViewT) {
        return cellViewS !== cellViewT;
      },
    });
  }

  private initGraph(): dia.Graph | void {
    this.graph = new dia.Graph({}, { cellNamespace: shapes });
  }

  public removeCell(cellId: string): void {}

  public addCell(cell: WamElements): void {
    const newCell = this.elementCreatorService.create(cell);
    if (this.graph) {
      newCell.addTo(this.graph);
    }
  }

  public duplicateCell(cellId: string): void {}

  public selectCell(cellId: string): void {}

  public clearSelection(): void {}

  public exportAsJson(): string | void {}

  public importAsJson(json: string): void {}

  public exportAsPNG(): void {}

  public exportAsRdf(): void {}

  public resetPaperDefaultSettings(): void {}

  public findCellById(cellId: string): dia.Cell | null {
    return null;
  }

  public getAllElements(): dia.Element[] {
    return [];
  }

  public getAllLinks(): dia.Link[] {
    return [];
  }

  public updateCellAttributes(cellId: string, attrs: any): void {}

  public updateAttributeByName(cellId: string, attrName: string, value: any): void {}

  public getAttributeByCellId(cellId: string, attrName: string): any {}
}
