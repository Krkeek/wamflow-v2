import { Injectable } from '@angular/core';
import { dia } from '@joint/core';
import { del, get, set } from 'idb-keyval';

import { LocalStorageKeys } from '../enums/LocalStorageKeys';

import ID = dia.Cell.ID;

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  public async save<T>(key: LocalStorageKeys | ID, payload: T): Promise<void> {
    await set(key, payload);
  }

  public async load<T>(key: LocalStorageKeys | ID): Promise<T | null> {
    const raw = await get(key);
    return (raw as T) ?? null;
  }

  public async clear(key: LocalStorageKeys | ID): Promise<void> {
    await del(key);
  }
}
