import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export enum LogSubject {
  Intercept = '🎾',
  Guard = '⚔️',
  Store = '💾',
  Error = '❌',
}

@Injectable({
  providedIn: 'root',
})
export class LogService {
  areConsolesAllowed = !environment.production;

  info(subject: LogSubject, message: string): void {
    if (this.areConsolesAllowed) {
      console.info(`${subject}: ${message}`);
    }
  }

  error(message: string): void {
    if (this.areConsolesAllowed) {
      console.error(`${LogSubject.Error}: ${message}`);
    }
  }
}
