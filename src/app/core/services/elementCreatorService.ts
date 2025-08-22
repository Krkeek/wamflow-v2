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
    return new CustomElement(
      {
        size: { width: def.size.width, height: def.size.height },
        attrs: def.attrs,
        ports: def.ports,
        position: { x: 100, y: 100 },
      },
      {
        markup: def.markup,
      },
    );
  }
}
