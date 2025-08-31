import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { JointService } from '../../../core/services/jointService';

@Component({
  selector: 'app-header-panel',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, FormsModule],
  templateUrl: './header-panel.html',
  styleUrls: ['./header-panel.css'],
})
export class HeaderPanel {
  @ViewChild('fileInput', { static: false })
  public fileInput!: ElementRef<HTMLInputElement>;

  private readonly jointService = inject(JointService);

  protected get title() {
    return this.jointService.title();
  }
  protected set title(v: string) {
    this.jointService.setTitle(v);
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

  private async handleFile(file: File) {
    await this.jointService.importJSON(file);
  }
}
