import { CellPanelDataDto } from '../dtos/cell-panel-data.dto';

export interface HistoryStack {
  past: CellPanelDataDto[];
  future: CellPanelDataDto[];
}
