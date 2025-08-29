import { WamElements } from '../enums/WamElements';
import { JOINT_CONSTRAINTS } from './JointConstraints';
import { dia } from '@joint/core';

export interface WamElementsDataValue {
  size: { width: number; height: number };
  jointElement?: boolean;
  attrs?: dia.Element.Attributes;
  ports?:
    | {
        groups?: Record<string, dia.Element.PortGroup>;
        items?: dia.Element.Port[];
      }
    | undefined;

  markup?: dia.Element.Attributes['markup'];
}
export const WAM_ELEMENTS_DATA: Record<WamElements, WamElementsDataValue> = {
  [WamElements.SecurityRealm]: {
    size: { width: 120, height: 80 },
    attrs: {
      path: {
        refDResetOffset: `M7.2 121S0 121 0 114.95L0 6.05S0 0 7.2 0L280.8 0S288 0 289.44 6.05L288 114.95S288 121 280.8 121ZM238 0 289.44 24.2`,
        fill: JOINT_CONSTRAINTS.defaultFill,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: JOINT_CONSTRAINTS.strokeWidth,
        cursor: 'move',
      },
      edge: {
        refWidth: '100%',
        refHeight: '100%',
        rx: 10,
        ry: 10,
        fill: 'transparent',
        stroke: 'transparent',
        'stroke-width': 14,
        magnet: true,
        'pointer-events': 'stroke',
        cursor: 'crosshair',
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
        tagName: 'path',
        selector: 'path',
      },
      {
        tagName: 'rect',
        selector: 'edge',
      },
      {
        tagName: 'text',
        selector: 'labelOne',
      },
    ],
  },
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
      edge: {
        refWidth: '100%',
        refHeight: '100%',
        rx: 10,
        ry: 10,
        fill: 'transparent',
        stroke: 'transparent',
        'stroke-width': 14,
        magnet: true,
        'pointer-events': 'stroke',
        cursor: 'crosshair',
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
      { tagName: 'rect', selector: 'edge' },
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
      edge: {
        refDResetOffset: `M31.7544 8.43415C36.7317 -0.186735 49.1748 -0.186749 54.1521 8.43413L82.1492 56.9266C87.1265 65.5475 80.9049 76.3236 70.9504 76.3236H14.9561C5.0016 76.3236 -1.22 65.5475 3.75727 56.9266L31.7544 8.43415Z`,
        fill: 'none',
        stroke: 'transparent',
        'stroke-width': 14,
        magnet: true,
        'pointer-events': 'stroke',
        cursor: 'crosshair',
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
        tagName: 'path',
        selector: 'edge',
      },
      {
        tagName: 'text',
        selector: 'labelOne',
      },
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
      edge: {
        refCx: '50%',
        refCy: '50%',
        refRx: '50%',
        refRy: '50%',
        fill: 'transparent',
        stroke: 'transparent',
        'stroke-width': 14,
        magnet: true,
        'pointer-events': 'stroke',
        cursor: 'crosshair',
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
      { tagName: 'ellipse', selector: 'edge' },
      { tagName: 'text', selector: 'label' },
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
      edge: {
        refDResetOffset: `M74.3946 65.3453V11.8404C74.3946 3.30662 64.0769 -0.967114 58.0426 5.06717L4.53775 58.5721C-1.49653 64.6063 2.77722 74.924 11.311 74.924H64.8158C70.106 74.924 74.3946 70.6355 74.3946 65.3453Z`,
        fill: 'none',
        stroke: 'transparent',
        'stroke-width': 14,
        magnet: true,
        'pointer-events': 'stroke',
        cursor: 'crosshair',
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
      { tagName: 'path', selector: 'edge' },
      { tagName: 'text', selector: 'label' },
    ],
  },
  [WamElements.DataProvider]: {
    size: { width: 70, height: 80 },
    jointElement: true,
    attrs: {
      body: {
        'stroke-width': 2.5,
      },
      top: {
        'stroke-width': 2.5,
      },
      edge: {
        refWidth: '100%',
        refHeight: '100%',
        rx: 13,
        ry: 13,
        fill: 'transparent',
        stroke: 'transparent',
        'stroke-width': 10,
        magnet: true,
        'pointer-events': 'stroke',
        cursor: 'crosshair',
      },
      labelOne: {
        text: '',
        refX: '50%',
        refY: '50%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fontSize: 12,
        fill: JOINT_CONSTRAINTS.textColor,
        pointerEvents: 'none',
      },
    },
    markup: [
      { tagName: 'rect', selector: 'edge' },
      { tagName: 'text', selector: 'label' },
      { tagName: 'path', selector: 'body' },
      { tagName: 'ellipse', selector: 'top' },
    ],
  },
};
