import { Themes } from '../enums/Themes';

export interface ThemeSave {
  version: number;
  ts: number;
  data: Themes;
}
