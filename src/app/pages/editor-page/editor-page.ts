import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';

import { WamElements } from '../../core/enums/WamElements';
import { JointService } from '../../core/services/jointService';
import { NavControlService } from '../../core/services/navControlService';
import { CellDetailsPanel } from '../../shared/components/cell-details-panel/cell-details-panel';
import { Footer } from '../../shared/components/footer/footer';
import { Palette } from '../../shared/components/palette/palette';
import { SheetHeader } from '../../shared/components/sheet-header/sheet-header';

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
    CellDetailsPanel,
  ],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.css',
})
export class EditorPage implements AfterViewInit, OnInit {
  @ViewChild('canvas') canvas?: ElementRef<HTMLElement>;
  protected panelState = { left: false, right: false };

  private readonly navControlService = inject(NavControlService);
  private readonly jointService = inject(JointService);

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
