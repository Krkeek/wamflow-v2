import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatNavList } from '@angular/material/list';
import { MatSlideToggle } from '@angular/material/slide-toggle';

import { Themes } from '../../../core/enums/Themes';
import { ThemeService } from '../../../core/services/themeService';

@Component({
  selector: 'app-app-settings',
  imports: [MatSlideToggle, MatNavList, AsyncPipe],
  templateUrl: './app-settings.html',
  styleUrl: './app-settings.css',
})
export class AppSettings {
  protected readonly themeService = inject(ThemeService);
  protected readonly Themes = Themes;
}
