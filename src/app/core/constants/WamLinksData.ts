import { dia } from '@joint/core';

import { WamLinks } from '../enums/WamLinks';

import { JOINT_CONSTRAINTS } from './JointConstraints';

export const WAM_LINK_DATA: Record<
  WamLinks,
  {
    attrs: dia.Link.Attributes;
    markup: dia.Link.Attributes['markup'];
  }
> = {
  [WamLinks.Invocation]: {
    attrs: {
      line: {
        connection: true,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: 2,
        strokeLinejoin: 'round',
        targetMarker: {
          type: 'path',
          d: 'M 10 -5 0 0 10 5 z',
        },
      },
      wrapper: {
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
    },
    markup: [
      {
        tagName: 'path',
        selector: 'wrapper',
        attributes: {
          fill: 'none',
          cursor: 'pointer',
          stroke: 'transparent',
        },
      },
      {
        tagName: 'path',
        selector: 'line',
        attributes: {
          fill: 'none',
          'pointer-events': 'none',
        },
      },
    ],
  },
  [WamLinks.LegacyRelationship]: {
    attrs: {
      line: {
        connection: true,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: 2,
        strokeLinejoin: 'round',
      },
      wrapper: {
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
    },
    markup: [
      {
        tagName: 'path',
        selector: 'wrapper',
        attributes: {
          fill: 'none',
          cursor: 'pointer',
          stroke: 'transparent',
        },
      },
      {
        tagName: 'path',
        selector: 'line',
        attributes: {
          fill: 'none',
          'pointer-events': 'none',
        },
      },
    ],
  },
  [WamLinks.TrustRelationship]: {
    attrs: {
      line: {
        fill: 'none',
        connection: true,
        stroke: JOINT_CONSTRAINTS.defaultStroke,
        strokeWidth: 2,
        strokeLinejoin: 'round',
        targetMarker: {
          type: 'path',
          d: 'M 10 -5 L 0 0 L 10 5 ',
          fill: 'none',
          'stroke-width': 2,
        },
      },
      wrapper: {
        fill: 'none',
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
    },
    markup: [
      {
        tagName: 'path',
        selector: 'wrapper',
        attributes: {
          fill: 'transparent',
          cursor: 'pointer',
          stroke: 'transparent',
        },
      },
      {
        tagName: 'path',
        selector: 'line',
        attributes: {
          fill: 'none',
          'pointer-events': 'none',
        },
      },
    ],
  },
};
