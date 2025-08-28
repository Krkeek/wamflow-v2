import { dia } from '@joint/core';
import GridOptions = dia.Paper.GridOptions;

export const JOINT_CONSTRAINTS = {
  defaultFill: 'white',
  defaultPaletteFill: 'transparent',
  defaultStroke: '#000',
  defaultGrid: {
    name: 'mesh',
    args: { color: '#bdbdbd', thickness: 1 },
  } as GridOptions,
  warningFill: '#FFF3CD',
  infoFill: '#D1ECF1',
  primaryStroke: '#1E88E5',
  paperBackground: 'white',
  textColor: 'black',
  strokeWidth: 2.5,
  paperDefaultDimensions: { width: 4000, height: 4000 },
  multiBoxSelectorColor: 'black',
  multiBoxSelectorThickness: '0.5',
  edgeHighlightColor: 'rgba(2,62,138,0.25)',
};
