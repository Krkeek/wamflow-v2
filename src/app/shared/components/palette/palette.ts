import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';

import { WamElements } from '../../../core/enums/WamElements';

import { PaletteItem } from './palette-item/palette-item';

@Component({
  selector: 'app-palette',
  imports: [PaletteItem, MatTabGroup, MatTab, MatTabLabel, MatIcon, MatTooltip],
  templateUrl: './palette.html',
  styleUrl: './palette.css',
})
export class Palette implements OnInit {
  protected elements: WamElements[] = [];

  public ngOnInit() {
    this.elements = Object.values(WamElements) as WamElements[];
  }
}
