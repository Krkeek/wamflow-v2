import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
}
