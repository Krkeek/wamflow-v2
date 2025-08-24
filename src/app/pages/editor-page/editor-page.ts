import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { JointService } from '../../core/services/jointService';
import { Palette } from '../../shared/components/palette/palette';
import { WamElements } from '../../core/enums/WamElements';
import { MatIconModule } from '@angular/material/icon';
import { SheetHeader } from '../../shared/components/sheet-header/sheet-header';

@Component({
  selector: 'app-editor-page',
  imports: [Palette, MatIconModule, SheetHeader],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.css',
})
export class EditorPage implements AfterViewInit {
  @ViewChild('canvas') canvas?: ElementRef<HTMLElement>;
  protected readonly ondragover = ondragover;
  private readonly jointService = inject(JointService);

  ngAfterViewInit() {
    if (this.canvas) {
      this.jointService.initPaper(this.canvas.nativeElement);
    } else {
      throw new Error('Canvas not initialized');
    }
  }

  onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.dataTransfer!.dropEffect = 'copy';
  }

  onDrop(evt: DragEvent) {
    evt.preventDefault();

    if (!evt.dataTransfer) throw new Error('evt.dataTransfer is null');

    const elementToDrag = evt.dataTransfer.getData('elementToDrag');
    if (!elementToDrag) return;
    const element = elementToDrag as WamElements;

    const customDimensions = this.jointService.checkForCustomDimensions(element);

    const pt = this.jointService.clientToLocal(evt.clientX, evt.clientY);
    this.jointService.addCellAt(element, pt.x, pt.y, customDimensions);
  }
}
