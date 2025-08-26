import { Injectable } from '@angular/core';
import { get, set, del } from 'idb-keyval';

const KEY = 'jointjs-graph';

export interface GraphSave {
  version: number;
  ts: number;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  public async save(payload: GraphSave) {
    await set(KEY, payload);
  }

  public async load(): Promise<GraphSave | undefined> {
    return (await get(KEY)) as GraphSave | undefined;
  }
  public async clear() {
    await del(KEY);
  }
}
