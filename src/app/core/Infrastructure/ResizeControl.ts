import { dia, elementTools } from '@joint/core';

import { JOINT_CONSTRAINTS } from '../constants/JointConstraints';

export const ResizeControl = elementTools.Control.extend({
  children: [
    {
      tagName: 'g',
      selector: 'handle',
      attributes: {
        cursor: 'nwse-resize',
        'pointer-events': 'all',
      },
      children: [
        {
          tagName: 'circle',
          selector: 'button',
          attributes: {
            class: 'settings-btn',
            r: 7,
            fill: JOINT_CONSTRAINTS.toolTipSettingColor,
            cursor: 'nwse-resize',
          },
        },
      ],
    },
  ],
  getPosition(view: dia.ElementView) {
    const { width, height } = view.model.size();
    const x = width;
    const y = height;

    return { x, y };
  },
  setPosition(view: dia.ElementView, coordinates: { x: number; y: number }) {
    const model = view.model;

    const { width: w0, height: h0 } = model.size();
    const ratio = this._ratio ?? w0 / Math.max(h0, 1);

    const minW = 20;
    const minH = 20;

    // candidate 1: driven by X (mouse x)
    const wByX = Math.max(coordinates.x, minW);
    const hFromW = Math.max(wByX / Math.max(ratio, 1e-6), minH);

    // candidate 2: driven by Y (mouse y)
    const hByY = Math.max(coordinates.y, minH);
    const wFromH = Math.max(hByY * ratio, minW);

    // pick whichever is closer to the pointer
    const errW = Math.abs(hFromW - coordinates.y);
    const errH = Math.abs(wFromH - coordinates.x);

    const newW = errW <= errH ? wByX : wFromH;
    const newH = errW <= errH ? hFromW : hByY;

    model.resize(newW, newH);
  },
});
