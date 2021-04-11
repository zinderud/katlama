import { InjectionToken } from '@angular/core';
import { EncryptionType } from './encryption';
export const USER_ORIGAMI_KEY_PREFIX = new InjectionToken('user-origami-key-prefix');

export interface BaseOrigami {
  text?: string;
  name?: string;
  tags?: string[];
  location?: string;
}

export interface UserOrigami extends BaseOrigami {
  id: string;
  added: Date;
  mimeType: string | null;
  skylink?: string;
  skylinkResized?: string;
  isPublic?: true;
  isShared?: true;
  shareLink?: string;
}

export interface UserOrigamiEncrypted {
  encryptedOrigami: string;
  encryptionType: EncryptionType; // to allow migration if the encryptionType changes
}
