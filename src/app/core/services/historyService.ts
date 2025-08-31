import { Injectable } from '@angular/core';
import { dia } from '@joint/core';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private undoStack: dia.Graph.Attributes[] = [];
  private redoStack: dia.Graph.Attributes[] = [];
  private suspended = false;

  public snapshot(graph: dia.Graph) {
    if (this.suspended) return;
    this.redoStack = [];
    this.undoStack.push(graph.toJSON());
    if (this.undoStack.length > 50) this.undoStack.shift();
  }

  public withSuspended<T>(graph: dia.Graph, fn: () => T): T {
    const prev = this.suspended;
    this.suspended = true;
    try {
      return fn();
    } finally {
      this.suspended = prev;
    }
  }

  public undo(graph: dia.Graph) {
    if (!this.undoStack.length) return;
    const current = graph.toJSON();
    const prev = this.undoStack.pop()!;
    this.redoStack.push(current);
    this.withSuspended(graph, () => graph.fromJSON(prev));
  }

  public redo(graph: dia.Graph) {
    if (!this.redoStack.length) return;
    const current = graph.toJSON();
    const next = this.redoStack.pop()!;
    this.undoStack.push(current);
    this.withSuspended(graph, () => graph.fromJSON(next));
  }

  public canUndo() {
    return this.undoStack.length > 0;
  }
  public canRedo() {
    return this.redoStack.length > 0;
  }
}
