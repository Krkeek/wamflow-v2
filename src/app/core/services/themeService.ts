import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { LocalStorageKeys } from '../enums/LocalStorageKeys';
import { Themes } from '../enums/Themes';
import { ThemeSave } from '../interfaces/ThemeSave';

import { LocalStorageService } from './localStorageService';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  public readonly activeTheme$ = new BehaviorSubject<Themes>(Themes.Light);
  private readonly localStorageService = inject(LocalStorageService);

  public setTheme(theme: Themes) {
    this.activeTheme$.next(theme);
    this.persist();
  }
  public async loadThemeFromLocalStorage(): Promise<void> {
    const theme = await this.localStorageService.load<ThemeSave>(LocalStorageKeys.Theme);
    if (theme) this.activeTheme$.next(theme.data);
  }

  private persist() {
    const payload: ThemeSave = { version: 1, ts: Date.now(), data: this.activeTheme$.value };
    this.localStorageService.save<ThemeSave>(LocalStorageKeys.Theme, payload);
  }
}
