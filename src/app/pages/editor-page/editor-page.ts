import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { JointService } from '../../core/services/jointService';
import { Palette } from '../../shared/components/palette/palette';
import { WamElements } from '../../core/enums/WamElements';
import { MatIconModule } from '@angular/material/icon';
import { SheetHeader } from '../../shared/components/sheet-header/sheet-header';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { FormsModule } from '@angular/forms';
import { NavControlService } from '../../core/services/navControlService';
import { Footer } from '../../shared/components/footer/footer';

@Component({
  selector: 'app-editor-page',
  imports: [
    MatIconModule,
    SheetHeader,
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    FormsModule,
    Palette,
    Footer,
  ],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.css',
})
export class EditorPage implements AfterViewInit, OnInit {
  @ViewChild('canvas') canvas?: ElementRef<HTMLElement>;
  private readonly navControlService = inject(NavControlService);
  private readonly jointService = inject(JointService);
  protected panelState = { left: false, right: false };

  ngOnInit() {
    this.navControlService.state$.subscribe((state) => (this.panelState = state));
  }

  async ngAfterViewInit() {
    if (this.canvas) {
      await this.jointService.initPaper(this.canvas.nativeElement);
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
