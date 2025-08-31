import { AfterViewInit, Component, ElementRef, inject, input, ViewChild } from '@angular/core';

import { WamElements } from '../../../../core/enums/WamElements';
import { JointService } from '../../../../core/services/jointService';

@Component({
  selector: 'app-palette-item',
  imports: [],
  templateUrl: './palette-item.html',
  styleUrl: './palette-item.css',
})
export class PaletteItem implements AfterViewInit {
  @ViewChild('canvas') canvas?: ElementRef<HTMLElement>;

  public element = input.required<WamElements>();
  private readonly jointService = inject(JointService);

  public ngAfterViewInit() {
    if (!this.canvas) throw new Error('Canvas not initialized');
    queueMicrotask(() => {
      const host = this.canvas!.nativeElement;
      const { graph, paper } = this.jointService.initPalettePaper(host);
      this.jointService.addCell(this.element(), graph, paper);
    });
  }

  public onDragStart(e: DragEvent) {
    if (e.dataTransfer == null) {
      throw new Error('e.transfer is null');
    }
    const element = this.element();
    e.dataTransfer.setData('elementToDrag', String(element));
    e.dataTransfer.effectAllowed = 'copy';

    if (e.dataTransfer && this.canvas) {
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      e.dataTransfer.setDragImage(this.canvas.nativeElement, rect.width / 2, rect.height / 2);
    }
  }
}
