import { dia } from '@joint/core';

import ID = dia.Cell.ID;

export class BaseUtility {
  public static parseJsonFile = async (file: File): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = (event: ProgressEvent<FileReader>) => {
        const reader = event.target;
        if (!reader) {
          reject(new Error('No FileReader target'));
          return;
        }
        try {
          const text = reader.result as string;
          resolve(JSON.parse(text));
        } catch (err) {
          reject(err);
        }
      };

      fileReader.onerror = (event: ProgressEvent<FileReader>) => {
        reject(event.target?.error ?? new Error('FileReader error'));
      };

      fileReader.readAsText(file);
    });
  };

  public static exportJSONHelper = async (jsonObject: JSON, title: string) => {
    const jsonString = JSON.stringify(jsonObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = (title || 'Untitled') + '.json';
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  public static arraysEqual(a: ID[], b: ID[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      // Arrays
      if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (!BaseUtility.deepEqual(a[i], b[i])) return false;
        return true;
      }
      // Dates
      if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();

      // Objects
      const ak = Object.keys(a);
      const bk = Object.keys(b);
      if (ak.length !== bk.length) return false;
      for (const k of ak) {
        if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
        if (!BaseUtility.deepEqual(a[k], b[k])) return false;
      }
      return true;
    }
    return false;
  }

  public static printSelectedCellsForDebug = (prevIds: ID[], currIds: ID[]) => {
    console.log('Previous:');
    console.log(prevIds);
    console.log('Current:');
    console.log(currIds);
    console.log('---------------------------------------------------');
  };
}
