import { Component, OnInit } from '@angular/core';
import { PaletteItem } from './palette-item/palette-item';
import { WamElements } from '../../../core/enums/WamElements';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-palette',
  imports: [PaletteItem, MatTabGroup, MatTab, MatTabLabel, MatIcon, MatTooltip],
  templateUrl: './palette.html',
  styleUrl: './palette.css',
})
export class Palette implements OnInit {
  protected elements: WamElements[] = [];

  ngOnInit() {
    this.elements = Object.values(WamElements) as WamElements[];
  }
}
