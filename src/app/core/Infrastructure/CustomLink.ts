import { dia } from '@joint/core';

export class CustomLink extends dia.Link {
  public constructor(attrs: dia.Element.Attributes) {
    super(attrs);
  }

  public override preinitialize(attrs: dia.Element.Attributes) {
    if (attrs.markup) this.markup = attrs.markup;
  }

  public override defaults() {
    return {
      ...super.defaults,
      type: 'custom.Link',
      markup: [],
    };
  }
}
