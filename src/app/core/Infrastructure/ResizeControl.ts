import { elementTools } from '@joint/core';

export const ResizeControl = elementTools.Control.extend({
  children: [
    {
      tagName: 'path',
      selector: 'handle',
      attributes: {
        d: 'M14 12M3 12h11V2', // arrow head
        stroke: 'black',
        'stroke-width': 2,
        fill: 'none',
        cursor: 'nwse-resize',
      },
    },
  ],

  getPosition: function (view: any) {
    const model = view.model;
    const { width, height } = model.size();
    return { x: width, y: height }; // bottom-right corner
  },

  setPosition(view: any, coordinates: any) {
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
