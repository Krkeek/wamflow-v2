import { Injectable } from '@angular/core';
import { WamElements } from '../enums/WamElements';
import { WAM_ELEMENTS_DATA } from '../constants/WamElementsData';
import { CustomElement } from '../Infrastructure/CustomElement';

@Injectable({
  providedIn: 'root',
})
export class ElementCreatorService {
  public create(element: WamElements): CustomElement {
    const def = WAM_ELEMENTS_DATA[element];
    if (!def) throw new Error(`Unknown element type: ${element}`);
    const el = new CustomElement();
    el.resize(def.size.width, def.size.height);
    el.attr(def.attrs);
    if (def.ports) {
      el.set('ports', def.ports);
    }
    el.position(100, 100);
    return el;
  }
}
