import { WamElements } from '../enums/WamElements';
import { JOINT_COLORS } from './JointColors';

export const WAM_ELEMENTS_DATA: Record<
  WamElements,
  {
    size: { width: number; height: number };
    attrs: any;
    ports?: any;
  }
> = {
  [WamElements.Application]: {
    size: { width: 120, height: 80 },
    attrs: {
      body: { fill: JOINT_COLORS.defaultFill, stroke: JOINT_COLORS.defaultStroke },
      label: { text: 'Application' },
    },
  },
  [WamElements.Service]: {
    size: { width: 120, height: 80 },
    attrs: {
      body: { fill: JOINT_COLORS.defaultFill, stroke: JOINT_COLORS.defaultStroke },
      label: { text: 'Service' },
    },
  },
  [WamElements.SecurityRealm]: {
    size: { width: 120, height: 80 },
    attrs: {
      body: { fill: JOINT_COLORS.defaultFill, stroke: JOINT_COLORS.defaultStroke },
      label: { text: 'SecurityRealm' },
    },
  },
  [WamElements.IdentityProvider]: {
    size: { width: 120, height: 80 },
    attrs: {
      body: { fill: JOINT_COLORS.defaultFill, stroke: JOINT_COLORS.defaultStroke },
      label: { text: 'IdentityProvider' },
    },
  },
  [WamElements.ProcessUnit]: {
    size: { width: 100, height: 60 },
    attrs: {
      body: { fill: JOINT_COLORS.warningFill, stroke: JOINT_COLORS.defaultStroke },
      label: { text: 'ProcessUnit' },
    },
  },
  [WamElements.DataProvider]: {
    size: { width: 120, height: 80 },
    attrs: {
      body: { fill: JOINT_COLORS.infoFill, stroke: JOINT_COLORS.defaultStroke },
      label: { text: 'DataProvider' },
    },
  },
};
