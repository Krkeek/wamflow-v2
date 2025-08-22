import { WamElements } from '../enums/WamElements';
import { JOINT_CONSTRAINTS } from './JointConstraints';
import { dia } from '@joint/core';

export const WAM_ELEMENTS_DATA: Record<
  WamElements,
  {
    size: { width: number; height: number };
    attrs?: dia.Element.Attributes;
    ports?:
      | {
          groups?: Record<string, dia.Element.PortGroup>;
          items?: dia.Element.Port[];
        }
      | undefined;

    markup?: dia.Element.Attributes['markup'];
  }
> = {
  [WamElements.Application]: {
    size: { width: 70, height: 70 },
    attrs: {
      body: {
        refWidth: '100%',
        refHeight: '100%',
        rx: 10,
        ry: 10,
        fill: JOINT_CONSTRAINTS.defaultFill,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: JOINT_CONSTRAINTS.strokeWidth,
        cursor: 'move',
      },
      labelOne: {
        text: '',
        refX: '50%',
        refY: '50%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fontSize: 12,
        fill: JOINT_CONSTRAINTS.textColor,
      },
    },
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'text',
        selector: 'labelOne',
      },
    ],
  },
  [WamElements.Service]: {
    size: { width: 70, height: 65 },
    attrs: {
      path: {
        refDResetOffset: `M31.7544 8.43415C36.7317 -0.186735 49.1748 -0.186749 54.1521 8.43413L82.1492 56.9266C87.1265 65.5475 80.9049 76.3236 70.9504 76.3236H14.9561C5.0016 76.3236 -1.22 65.5475 3.75727 56.9266L31.7544 8.43415Z`,
        strokeWidth: JOINT_CONSTRAINTS.strokeWidth,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        fill: JOINT_CONSTRAINTS.defaultFill,
        cursor: 'move',
      },
      labelOne: {
        text: '',
        refX: '50%',
        refY: '65%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fontSize: 12,
        fill: JOINT_CONSTRAINTS.textColor,
      },
    },
    markup: [
      {
        tagName: 'path',
        selector: 'path',
      },
      {
        tagName: 'text',
        selector: 'labelOne',
      },
    ],
  },
  [WamElements.IdentityProvider]: {
    size: { width: 70, height: 70 },
    attrs: {
      body: {
        refDResetOffset: `M74.3946 65.3453V11.8404C74.3946 3.30662 64.0769 -0.967114 58.0426 5.06717L4.53775 58.5721C-1.49653 64.6063 2.77722 74.924 11.311 74.924H64.8158C70.106 74.924 74.3946 70.6355 74.3946 65.3453Z`,
        fill: JOINT_CONSTRAINTS.defaultFill,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: JOINT_CONSTRAINTS.strokeWidth,
        cursor: 'move',
      },
      labelOne: {
        text: '',
        refX: '50%',
        refY: '65%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fontSize: 12,
        fill: JOINT_CONSTRAINTS.textColor,
      },
    },
    markup: [
      { tagName: 'path', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
  },
  [WamElements.ProcessUnit]: {
    size: { width: 70, height: 70 },
    attrs: {
      body: {
        refCx: '50%',
        refCy: '50%',
        refRx: '50%',
        refRy: '50%',
        fill: JOINT_CONSTRAINTS.defaultFill,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: JOINT_CONSTRAINTS.strokeWidth,
        cursor: 'move',
      },
      labelOne: {
        text: '',
        refX: '50%',
        refY: '50%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fontSize: 12,
        fill: JOINT_CONSTRAINTS.textColor,
      },
    },
    markup: [
      { tagName: 'ellipse', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
  },
  /*
  [WamElements.DataProvider]: {
    size: { width: 200, height: 200 },
    attrs: {
      body: {
        d: `
       M0 20
       a40 calc(w/6.5) 0 01calc(w) 0
       v50
       a40 calc(w/6.5) 0 01-calc(w) 0
       v-50Z
        `,
        lateralArea: 10,
        fill: JOINT_CONSTRAINTS.defaultFill,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: JOINT_CONSTRAINTS.strokeWidth,
        cursor: 'move',
      },
      top: {
        cx: 'calc(w/2)',
        cy: 19,
        rx: 'calc(w/2)',
        ry: 10,
        fill: JOINT_CONSTRAINTS.defaultFill,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: JOINT_CONSTRAINTS.strokeWidth,
      },
    },
    markup: [
      {
        tagName: 'path',
        selector: 'body',
      },
      {
        tagName: 'ellipse',
        selector: 'top',
      },
      {
        tagName: 'text',
        selector: 'labelOne',
      },
    ],
  },
*/
  [WamElements.DataProvider]: {
    size: { width: 70, height: 70 },
    attrs: {
      body: {
        refWidth: '100%',
        refHeight: '100%',
        rx: 10,
        ry: 10,
        fill: JOINT_CONSTRAINTS.defaultFill,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: JOINT_CONSTRAINTS.strokeWidth,
        cursor: 'move',
      },
      labelOne: {
        text: '',
        refX: '50%',
        refY: '50%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fontSize: 12,
        fill: JOINT_CONSTRAINTS.textColor,
      },
    },
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'text',
        selector: 'labelOne',
      },
    ],
  },
  [WamElements.SecurityRealm]: {
    size: { width: 70, height: 70 },
    attrs: {
      body: {
        refWidth: '100%',
        refHeight: '100%',
        rx: 10,
        ry: 10,
        fill: JOINT_CONSTRAINTS.defaultFill,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: JOINT_CONSTRAINTS.strokeWidth,
        cursor: 'move',
      },
      labelOne: {
        text: '',
        refX: '50%',
        refY: '50%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fontSize: 12,
        fill: JOINT_CONSTRAINTS.textColor,
      },
    },
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'text',
        selector: 'labelOne',
      },
    ],
  },
};
