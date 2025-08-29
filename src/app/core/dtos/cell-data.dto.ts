import { DataTypes } from '../enums/DataTypes';

export type CellProp =
  | {
      type: DataTypes.string;
      value: string;
      label?: string;
      description?: string;
      required?: boolean;
    }
  | {
      type: DataTypes.number;
      value: number | null;
      min?: number;
      max?: number;
      step?: number;
      label?: string;
      required?: boolean;
    }
  | { type: DataTypes.boolean; value: boolean; label?: string; required?: boolean }
  | {
      type: DataTypes.enum;
      value: string;
      options: string[];
      label?: string;
      required?: boolean;
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
      required?: boolean;
    };

export interface CellDataDto {
  name: string;
  type: string;
  uri: string;
  props: Record<string, CellProp>;
}
