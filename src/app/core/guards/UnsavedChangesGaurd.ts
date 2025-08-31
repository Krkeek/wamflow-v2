import { inject, Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

import { UnsavedChangesService } from '../services/unsavedChangesService';

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<boolean> {
  private readonly unsavedChangesService = inject(UnsavedChangesService);

  public canDeactivate(): boolean {
    if (!this.unsavedChangesService.hasPendingChanges()) return true;
    return window.confirm('You have unsaved changes. Leave this page?');
  }
}
