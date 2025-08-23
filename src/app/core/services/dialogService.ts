import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly dialog = inject(MatDialog);

  openDialog<T, D = unknown, R = unknown>(
    component: ComponentType<T>,
    config?: MatDialogConfig<D>,
  ) {
    return this.dialog.open<T, D, R>(component, {
      ...config,
      minHeight: '20vh',
    });
  }
}
