import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UnsavedChangesService } from './core/services/UnsavedChangesService';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly unsavedChangesService = inject(UnsavedChangesService);

  /*  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.unsavedChangesService.hasPendingChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }*/
}
