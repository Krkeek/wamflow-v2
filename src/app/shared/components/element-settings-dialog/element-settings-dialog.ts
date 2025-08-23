import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { dia } from '@joint/core';

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
  protected readonly alert = alert;
  protected data: ElementSettingsData = inject(MAT_DIALOG_DATA);
}
