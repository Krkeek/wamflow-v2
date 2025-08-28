import { DataTypes } from '../enums/DataTypes';

export type CellProp =
  | { type: DataTypes.string; value: string; label?: string; description?: string }
  | {
      type: DataTypes.number;
      value: number | null;
      min?: number;
      max?: number;
      step?: number;
      label?: string;
    }
  | { type: DataTypes.boolean; value: boolean; label?: string }
  | {
      type: DataTypes.enum;
      value: string;
      options: string[];
      label?: string;
    }
  | {
      type: DataTypes.file;
      value: null | {
        id: string;
        name: string;
        mime: string;
        url: string;
        size?: number;
        thumbnailUrl?: string;
      };
      label?: string;
    };

export interface CellDataDto {
  name: string;
  type: string;
  uri: string;
  props: Record<string, CellProp>;
}
