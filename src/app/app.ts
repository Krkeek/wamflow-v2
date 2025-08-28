import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JointService } from './core/services/jointService';
import { MatDialog } from '@angular/material/dialog';
import { UnsavedChangesService } from './core/services/unsavedChangesService';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly unsavedChangesService = inject(UnsavedChangesService);
  private readonly dialog = inject(MatDialog);
  private readonly jointService = inject(JointService);

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.unsavedChangesService.hasPendingChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  @HostListener('window:keydown', ['$event'])
  onDocKeydown(e: KeyboardEvent) {
    if (this.dialog.openDialogs.length) return;

    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();

    if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
      return;
    }
    this.jointService.triggerKeyboardAction(e);
  }
}
