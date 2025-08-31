import { dia } from '@joint/core';

export class CustomElement extends dia.Element {
  public constructor(attrs: dia.Element.Attributes) {
    super(attrs);
  }

  public override preinitialize(attrs: dia.Element.Attributes) {
    if (attrs.markup) this.markup = attrs.markup;
  }

  public override defaults() {
    return {
      ...super.defaults,
      type: 'custom.Element',
    };
  }
}
