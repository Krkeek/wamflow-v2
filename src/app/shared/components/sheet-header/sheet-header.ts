import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatCheckbox } from '@angular/material/checkbox';
import { JointService } from '../../../core/services/jointService';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-sheet-header',
  imports: [
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatCheckbox,
    FormsModule,
    MatFormField,
    MatLabel,
    MatButton,
    MatInput,
    MatTooltip,
  ],
  templateUrl: './sheet-header.html',
  styleUrl: './sheet-header.css',
})
export class SheetHeader {
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;

  private readonly jointService = inject(JointService);
  private _snackBar = inject(MatSnackBar);

  private _dims = this.jointService.paperDimensions(); // { width, height }

  protected get title() {
    return this.jointService.title();
  }
  protected set title(v: string) {
    this.jointService.setTitle(v);
  }

  protected get paperDimensions() {
    return this._dims; // return the SAME reference
  }
  protected set paperDimensions(dim: { width: number; height: number }) {
    this._dims = dim; // update reference so the view updates
    this.jointService.updatePaperDimensions(dim.width, dim.height);
  }

  protected updatePaperDimensions(width: number, height: number) {
    const { width: w, height: h } = this.validateDimensions(width, height);
    this.openSnackBar(`Sheet set to ${w}×${h}px`, 'Dismiss');
    this.paperDimensions = { width, height };
  }

  protected updatePaperWidth(width: number) {
    const { width: w, height: h } = this.validateDimensions(width, this.paperDimensions.height);
    this.openSnackBar(`Sheet set to ${w}×${h}px`, 'Dismiss');

    this.paperDimensions = { width: Number(width), height: this.paperDimensions.height };
  }
  protected updatePaperHeight(height: number) {
    const { width: w, height: h } = this.validateDimensions(this.paperDimensions.width, height);
    this.openSnackBar(`Sheet set to ${w}×${h}`, 'Dismiss');

    this.paperDimensions = { width: this.paperDimensions.width, height: Number(height) };
  }

  protected ready() {
    return this.jointService.ready();
  }

  protected openFilePicker() {
    this.fileInput.nativeElement.click();
  }

  protected async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    await this.handleFile(file);
    input.value = '';
  }

  protected async exportJSON() {
    await this.jointService.exportJSON();
  }

  protected resetPaper = () => {
    this.jointService.resetPaper();
  };

  private async handleFile(file: File) {
    const text = await file.text();
    console.log('Loaded JSON:', text);
    await this.jointService.importJSON(file);
  }

  private openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, { duration: 3000 });
  }

  private validateDimensions = (width: number, height: number) => {
    const MIN_W = 1920;
    const MIN_H = 1080;
    const MAX_W = 10000;
    const MAX_H = 10000;

    const safeWidth = Math.min(Math.max(width, MIN_W), MAX_W);
    const safeHeight = Math.min(Math.max(height, MIN_H), MAX_H);

    return { width: safeWidth, height: safeHeight };
  };
}
