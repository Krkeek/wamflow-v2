import { Injectable } from '@angular/core';
import { get, set, del } from 'idb-keyval';
import { LocalStorageKeys } from '../enums/LocalStorageKeys';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  public async save<T>(key: LocalStorageKeys, payload: T): Promise<void> {
    await set(key, payload);
  }

  public async load<T>(key: LocalStorageKeys): Promise<T | null> {
    const raw = await get(key);
    return (raw as T) ?? null;
  }

  public async clear(key: LocalStorageKeys): Promise<void> {
    await del(key);
  }
}
