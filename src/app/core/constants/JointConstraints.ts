import { dia } from '@joint/core';
import GridOptions = dia.Paper.GridOptions;

export const JOINT_CONSTRAINTS = {
  defaultFill: 'white',
  defaultPaletteFill: '#E9ECEF',
  defaultStroke: '#000',
  defaultGrid: {
    name: 'mesh',
    args: { color: '#bdbdbd', thickness: 1 },
  } as GridOptions,
  defaultGridDark: {
    name: 'mesh',
    args: { color: '#424242', thickness: 1 },
  } as GridOptions,
  warningFill: '#FFF3CD',
  infoFill: '#D1ECF1',
  primaryStroke: '#1E88E5',
  textColor: 'black',
  strokeWidth: 2.5,
  paperDefaultDimensions: { width: 4000, height: 4000 },
  multiBoxSelectorColor: 'black',
  multiBoxSelectorThickness: '0.5',
  edgeHighlightColor: 'rgba(2,62,138,0.25)',
  toolTipSettingColor: 'rgba(30,136,229,0.5)',
  paperBackground: { color: 'white' },
  paperBackgroundDark: { color: '#c0c0c0' },
};
