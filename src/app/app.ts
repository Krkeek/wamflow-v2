import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Angular');

  @HostListener('window:beforeunload', ['$event'])
  showMessage($event: Event) {
    $event.preventDefault();
    return confirm();
  }
}
