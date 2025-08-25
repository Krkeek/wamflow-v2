import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type Side = 'left' | 'right';

@Injectable({ providedIn: 'root' })
export class NavControlService {
  private state = new BehaviorSubject<{ left: boolean; right: boolean }>({
    left: true,
    right: false,
  });

  public state$ = this.state.asObservable();

  public toggle(type: Side) {
    const s = this.state.value;
    this.state.next({ ...s, [type]: !s[type] });
  }
}
