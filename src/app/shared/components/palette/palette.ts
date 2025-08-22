import { Component, OnInit } from '@angular/core';
import { dia } from '@joint/core';
import { PaletteItem } from './palette-item/palette-item';
import { WamElements } from '../../../core/enums/WamElements';

@Component({
  selector: 'app-palette',
  imports: [PaletteItem],
  templateUrl: './palette.html',
  styleUrl: './palette.css',
})
export class Palette implements OnInit {
  protected elements: WamElements[] = [];
  protected links: dia.Link[] = [];
  protected readonly WamElements = WamElements;

  ngOnInit() {
    this.elements = Object.values(WamElements) as WamElements[];
  }
}
