import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { dia } from '@joint/core';
import { DialogService } from '../../../core/services/dialogService';
import { JointService } from '../../../core/services/jointService';

export interface ElementSettingsData {
  title?: string;
  vt: dia.Event;
  view: dia.ElementView;
}

@Component({
  selector: 'app-element-settings-dialog',
  imports: [MatListModule, MatDialogContent],
  templateUrl: './element-settings-dialog.html',
  styleUrl: './element-settings-dialog.scss',
})
export class ElementSettingsDialog {
  protected data: ElementSettingsData = inject(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ElementSettingsDialog, boolean>);

  private dialogService = inject(DialogService);
  private jointService = inject(JointService);

  protected deleteCell = () => {
    this.dialogService
      .confirm({
        title: 'Delete cell',
        message: 'Are you sure you want to delete this cell? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'danger',
      })
      .subscribe((ok) => {
        if (ok) {
          const view = this.data.view;
          this.jointService.removeCells([view.model.id]);
          this.ref.close();
        }
      });
  };

  protected duplicateCell = () => {
    const view = this.data.view;
    this.jointService.duplicateCell(view.model.id);
    this.ref.close();
  };
}
