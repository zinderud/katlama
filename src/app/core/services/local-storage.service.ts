import { Injectable } from '@angular/core';

import { LogService, LogSubject } from '../services/log.service';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor(private readonly logService: LogService) {}

  getItemInStorage(key: string): unknown {
    const stringValue = localStorage.getItem(key) as string;
    const value = (JSON.parse(stringValue) as unknown) ?? undefined;
    this.logService.info(
      LogSubject.Store,
      value !== undefined ? `get ${key}` : `get ${key} (${value})`,
    );

    return value;
  }

  setItemInStorage(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
    this.logService.info(LogSubject.Store, `set ${key}`);
  }

  removeItemInStorage(key: string): void {
    localStorage.removeItem(key);
    this.logService.info(LogSubject.Store, `remove ${key}`);
  }
}
