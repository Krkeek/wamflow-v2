import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import {
  ConfirmationDialog,
  ConfirmOptions,
} from '../../shared/components/confirmation-dialog/confirmation-dialog';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly dialog = inject(MatDialog);

  public openDialog<T, D = unknown, R = unknown>(
    component: ComponentType<T>,
    config?: MatDialogConfig<D>,
  ) {
    return this.dialog.open<T, D, R>(component, {
      ...config,
    });
  }

  public confirm(options: ConfirmOptions, config?: Omit<MatDialogConfig<ConfirmOptions>, 'data'>) {
    return this.dialog
      .open<
        ConfirmationDialog,
        ConfirmOptions,
        boolean
      >(ConfirmationDialog, { data: options, ...config })
      .afterClosed();
  }

  public async withConfirm(options: ConfirmOptions, action: () => void | Promise<void>) {
    const ok = await firstValueFrom(this.confirm(options));
    if (ok) await action();
    return ok === true;
  }
}
