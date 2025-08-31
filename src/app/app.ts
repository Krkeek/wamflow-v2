import { Component, DOCUMENT, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

import { Themes } from './core/enums/Themes';
import { JointService } from './core/services/jointService';
import { ThemeService } from './core/services/themeService';
import { UnsavedChangesService } from './core/services/unsavedChangesService';

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

  public async ngOnInit() {
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

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.unsavedChangesService.hasPendingChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  @HostListener('window:keydown', ['$event'])
  protected onDocKeydown(e: KeyboardEvent) {
    if (this.dialog.openDialogs.length) return;

    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();

    if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
      return;
    }
    this.jointService.triggerKeyboardAction(e);
  }
}
