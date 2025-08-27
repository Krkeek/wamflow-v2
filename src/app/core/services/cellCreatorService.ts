import { Injectable } from '@angular/core';
import { WamElements } from '../enums/WamElements';
import { WAM_ELEMENTS_DATA } from '../constants/WamElementsData';
import { CustomElement } from '../Infrastructure/CustomElement';
import { WamLinks } from '../enums/WamLinks';
import { CustomLink } from '../Infrastructure/CustomLink';
import { WAM_LINK_DATA } from '../constants/WamLinksData';

@Injectable({
  providedIn: 'root',
})
export class CellCreatorService {
  public createElement(element: WamElements): CustomElement {
    const def = WAM_ELEMENTS_DATA[element];
    if (!def) throw new Error(`Unknown element type: ${element}`);
    return new CustomElement({
      size: { width: def.size.width, height: def.size.height },
      attrs: def.attrs,
      ports: def.ports,
      markup: def.markup,
    });
  }

  public createLink(link: WamLinks): CustomLink {
    const def = WAM_LINK_DATA[link];
    console.log(def)
    if (!def) throw new Error(`Unknown link type: ${link}`);
    return new CustomLink({
      attrs: def.attrs,
      markup: def.markup,
    });
  }
}
