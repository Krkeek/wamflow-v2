import { Component, DOCUMENT, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JointService } from './core/services/jointService';
import { MatDialog } from '@angular/material/dialog';
import { UnsavedChangesService } from './core/services/unsavedChangesService';
import { ThemeService } from './core/services/themeService';
import { Subscription } from 'rxjs';
import { Themes } from './core/enums/Themes';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private subscription = new Subscription();
  private document = inject(DOCUMENT);

  private readonly unsavedChangesService = inject(UnsavedChangesService);
  private readonly dialog = inject(MatDialog);
  private readonly jointService = inject(JointService);
  private readonly themeService = inject(ThemeService);

  async ngOnInit() {
    this.subscription.add(
      this.themeService.activeTheme$.subscribe((theme) => {
        const body = this.document.body;
        if (theme === Themes.Dark) {
          body.classList.add('dark-theme');
        } else {
          body.classList.remove('dark-theme');
        }
      }),
    );
    await this.themeService.loadThemeFromLocalStorage();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

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
