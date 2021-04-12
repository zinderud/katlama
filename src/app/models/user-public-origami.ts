import { InjectionToken } from '@angular/core';
import { UserOrigami } from './user-origami';
export const USER_PUBLIC_ORIGAMI_KEY = new InjectionToken('user-public-origami-key');

export interface UserPublicOrigami {
  origami: UserOrigami;
  publicAt: Date;
}

export interface UsersPublicOrigami {
  [userPublicKey: string]: UserPublicOrigami[];
}
