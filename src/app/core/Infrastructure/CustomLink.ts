import { dia } from '@joint/core';

export class CustomLink extends dia.Link {
  constructor(attrs: dia.Element.Attributes) {
    super(attrs);
  }

  override preinitialize(attrs: dia.Element.Attributes) {
    if (attrs.markup) this.markup = attrs.markup;
  }

  override defaults() {
    return {
      ...super.defaults,
      type: 'custom.Link',
      markup: [],
    };
  }
}
