import { dia } from '@joint/core';

export class CustomElement extends dia.Element {
  constructor(attrs: dia.Element.Attributes = {}, options: any = {}) {
    super(attrs, options);

    this.markup = [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ];
  }

  override defaults() {
    return {
      ...super.defaults,
      size: { width: 100, height: 60 },
      type: 'CustomElement',
      attrs: {
        body: {
          fill: '#E9ECEF',
          stroke: '#000',
          width: 'calc(w)',
          height: 'calc(h)',
        },
        label: {
          text: '',
          fontSize: 12,
          fill: '#333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          refX: '50%',
          refY: '50%',
        },
      },
    };
  }
}
