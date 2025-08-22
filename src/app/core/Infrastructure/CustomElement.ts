import { dia } from '@joint/core';

export class CustomElement extends dia.Element {
  constructor(attrs: dia.Element.Attributes = {}, options: any = {}) {
    super(attrs, options);
  }

  override preinitialize(attrs?: dia.Element.Attributes, options?: any) {
    this.markup = options.markup;
  }

  override defaults() {
    return {
      ...super.defaults,
      type: 'customElement',
    };
  }
}
