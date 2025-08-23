import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JointService } from './core/services/jointService';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /*
  private readonly unsavedChangesService = inject(UnsavedChangesService);
*/
  /*  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.unsavedChangesService.hasPendingChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }*/

  private readonly jointService = inject(JointService);
  @HostListener('window:keydown', ['$event'])
  onDocKeydown(e: KeyboardEvent) {
    e.preventDefault();
    this.jointService.triggerKeyboardAction(e);
  }
}
