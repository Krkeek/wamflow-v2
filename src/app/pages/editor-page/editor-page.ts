import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { JointService } from '../../core/services/jointService';
import { WamElements } from '../../core/enums/WamElements';

@Component({
  selector: 'app-editor-page',
  imports: [],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.css',
})
export class EditorPage implements AfterViewInit {
  @ViewChild('canvas') canvas?: ElementRef<HTMLElement>;
  private readonly jointService = inject(JointService);

  ngAfterViewInit() {
    if (this.canvas) {
      this.jointService.initPaper(this.canvas);
    } else {
      throw new Error('Canvas not initialized');
    }

    this.jointService.addCell(WamElements.Application);
    this.jointService.addCell(WamElements.Service);
    this.jointService.addCell(WamElements.IdentityProvider);
    this.jointService.addCell(WamElements.ProcessUnit);
    this.jointService.addCell(WamElements.DataProvider);
    this.jointService.addCell(WamElements.SecurityRealm);
  }
}
