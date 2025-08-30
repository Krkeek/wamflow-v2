import { Component, inject } from '@angular/core';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatNavList } from '@angular/material/list';
import { ThemeService } from '../../../core/services/themeService';
import { Themes } from '../../../core/enums/Themes';
import { AsyncPipe } from '@angular/common';

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
