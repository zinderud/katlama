import { UserData } from './user-data';
import { InjectionToken } from "@angular/core";

export const SKYDB_CACHED_USERS_KEY = new InjectionToken('cached-users');

export interface CachedUser {
  nickname?: string;
  description?: string;
  cachedAt: Date;
}

export interface CachedUsers {
  [userPublicKey: string]: CachedUser;
}

export interface UsersCache {
  lastPullAt: number;
  cache: CachedUsers;
}
