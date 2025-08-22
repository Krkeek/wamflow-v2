import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  private readonly _dirty = signal(true);
  public setDirty(v: boolean) {
    this._dirty.set(v);
  }
  public hasPendingChanges() {
    return this._dirty();
  }
}
