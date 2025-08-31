import { Component } from '@angular/core';

import { TopBar } from '../../shared/components/top-bar/top-bar';

@Component({
  selector: 'app-home-page',
  imports: [TopBar],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {}
