import { Injectable } from '@angular/core';
import { WamElements } from '../enums/WamElements';
import { WAM_ELEMENTS_DATA, WamElementsDataValue } from '../constants/WamElementsData';
import { CustomElement } from '../Infrastructure/CustomElement';
import { WamLinks } from '../enums/WamLinks';
import { CustomLink } from '../Infrastructure/CustomLink';
import { WAM_LINK_DATA } from '../constants/WamLinksData';
import { shapes } from '@joint/core';
import Cylinder = shapes.standard.Cylinder;
import standard = shapes.standard;

@Injectable({
  providedIn: 'root',
})
export class CellCreatorService {
  public createElement(element: WamElements): CustomElement | Cylinder {
    const def = WAM_ELEMENTS_DATA[element];
    if (!def) throw new Error(`Unknown element type: ${element}`);

    if (def.jointElement) {
      return this.createJointElement(def);
    }

    return new CustomElement({
      size: { width: def.size.width, height: def.size.height },
      attrs: def.attrs,
      ports: def.ports,
      markup: def.markup,
    });
  }

  public createJointElement(def: WamElementsDataValue): Cylinder {
    return new standard.Cylinder({
      size: { width: def.size.width, height: def.size.height },
      attrs: def.attrs,
      ports: def.ports,
      markup: def.markup,
    });
  }

  public createLink(link: WamLinks): CustomLink {
    const def = WAM_LINK_DATA[link];
    if (!def) throw new Error(`Unknown link type: ${link}`);
    return new CustomLink({
      attrs: def.attrs,
      markup: def.markup,
    });
  }
}
