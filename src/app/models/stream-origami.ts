import { InjectionToken } from '@angular/core';
import { UserOrigami } from './user-origami';

export const STREAM_ORIGAMI_KEYS = new InjectionToken('user-public-origami-key');

export interface StreamOrigami extends UserOrigami {
  ownerPublicKey: string;
}

export interface StreamOrigamis {
  origami: StreamOrigami[];
  lastProcessDate: Date;
}
