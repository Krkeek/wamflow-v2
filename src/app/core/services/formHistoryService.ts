import { Injectable } from '@angular/core';
import { dia } from '@joint/core';
import { BehaviorSubject } from 'rxjs';

import { CellPanelDataDto } from '../dtos/cell-panel-data.dto';
import { HistoryStack } from '../interfaces/HistoryStack';
import { BaseUtility } from '../utilities/BaseUtility';

import ID = dia.Cell.ID;

function snapshot<T>(v: T): T {
  return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

@Injectable({
  providedIn: 'root',
})
export class FormHistoryService {
  private isAfterUndo = new BehaviorSubject<boolean>(false);
  private histories = new Map<ID, HistoryStack>();
  private limit = 20;

  public updateHistoryState(formId: ID): { canUndo: boolean; canRedo: boolean } {
    return {
      canUndo: this.getStack(formId).past.length > 0,
      canRedo: this.getStack(formId).future.length > 0,
    };
  }

  public push = (formId: ID, state: CellPanelDataDto): void => {
    const stack = this.getStack(formId);
    const last = stack.past[stack.past.length - 1];

    if (last && BaseUtility.deepEqual(last, state)) return;

    stack.past.push(snapshot(state));
    if (stack.past.length > this.limit) stack.past.shift();
    stack.future = [];
    if (this.isAfterUndo.value) {
      stack.past = [];
      this.isAfterUndo.next(false);
    }
  };

  public undo = (formId: ID, current: CellPanelDataDto): CellPanelDataDto | null => {
    const { past, future } = this.getStack(formId);
    const prev = past.pop();
    if (prev) {
      future.push(snapshot(current));
      this.isAfterUndo.next(true);
      return snapshot(prev);
    }
    return null;
  };

  public redo = (formId: ID, current: CellPanelDataDto): CellPanelDataDto | null => {
    const { past, future } = this.getStack(formId);
    const next = future.pop();
    if (next) {
      past.push(snapshot(current));
      this.isAfterUndo.next(false);
      return snapshot(next);
    }
    return null;
  };

  public clear = (formIds: ID[]): void => {
    formIds.forEach((formId) => {
      this.histories.delete(formId);
    });
  };

  private getStack = (formId: ID): HistoryStack => {
    if (!this.histories.has(formId)) {
      this.histories.set(formId, { past: [], future: [] });
    }
    return this.histories.get(formId)!;
  };
}
