import { Component, HostListener, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'danger';
}
@Component({
  selector: 'app-confirmation-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.css',
})
export class ConfirmationDialog {
  protected readonly data = inject<ConfirmOptions>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ConfirmationDialog, boolean>);

  @HostListener('window:keydown', ['$event'])
  onDocKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.ref.close(true);
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      this.ref.close(false);
    }
  }
  close(result: boolean) {
    this.ref.close(result);
  }
}
