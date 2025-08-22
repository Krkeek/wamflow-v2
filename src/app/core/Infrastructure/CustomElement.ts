import { dia } from '@joint/core';

export class CustomElement extends dia.Element {
  constructor(attrs: dia.Element.Attributes) {
    super(attrs);
  }

  override preinitialize(attrs: dia.Element.Attributes) {
    if (attrs.markup) this.markup = attrs.markup;
  }

  override defaults() {
    return {
      ...super.defaults,
      type: 'customElement',
    };
  }
}
