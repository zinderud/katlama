
import { CachedUser, UsersCache } from './../models/users-cache';
import { Inject, Injectable, Optional } from '@angular/core';
import { PORTAL } from '../tokens/portal.token';
import { SkynetClient, genKeyPairFromSeed, genKeyPairAndSeed, defaultSkynetPortalUrl } from 'skynet-js';
import { UserData, UserKeys, USER_DATA_KEY } from '../models/user-data';
import { v4 as uuidv4 } from 'uuid';
import { UserPublicOrigami, UsersPublicOrigami, USER_PUBLIC_ORIGAMI_KEY } from '../models/user-public-origami';
import { UserSharedOrigami, UserSharedOrigamiLink, USER_SHARED_ORIGAMI_KEY } from '../models/user-shared-origami';
import { ConnectedUser, USER_CONNECTED_USERS_KEY, KATLAMA_ACCOUNT_PUBLIC_KEY } from '../models/user-connected-users';
import * as cryptoJS from 'crypto-js';
import { EncryptionType } from '../models/encryption';
import { CachedUsers, SKYDB_CACHED_USERS_KEY } from '../models/users-cache';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { UserOrigami, UserOrigamiEncrypted, USER_ORIGAMI_KEY_PREFIX } from '../models/user-origami';
import { StreamOrigami, STREAM_ORIGAMI_KEYS, StreamOrigamis } from './../models/stream-origami';
import { Origami } from '../models/origami';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private skydbTimeout = 60000;
  private registerUserSkydbTimeout = 7000;
  private skynetClient: SkynetClient;

  // Cache mechanism
  private cachedUsersLocalStorageKey = "usersCache";
  private chacheTimeout = setTimeout(() => { }, 0);

  // TODO: create a backend for that!
  private publickatlamaSkyDBKey = "KEKE";

  constructor(
    @Optional() @Inject(PORTAL) private portal: string,
    @Inject(USER_DATA_KEY) private userDataKey: string,
    @Inject(USER_ORIGAMI_KEY_PREFIX) private _userorigamiSkydbKeyPrefix: string,
    @Inject(USER_PUBLIC_ORIGAMI_KEY) private userPublicorigamiSkydbKey: string,
    @Inject(USER_SHARED_ORIGAMI_KEY) private userSharedorigamiSkydbKey: string,
    @Inject(USER_CONNECTED_USERS_KEY) private userConnectedUsersSkydbKey: string,
    @Inject(KATLAMA_ACCOUNT_PUBLIC_KEY) private katlamaAccountPublicKey: string,
    @Inject(SKYDB_CACHED_USERS_KEY) private katlamaSkyDBCachedUsersKey: string,
    @Inject(STREAM_ORIGAMI_KEYS) private streamorigamiSkydbKey: string,
    private ng2ImgMax: Ng2ImgMaxService,
  ) {
    if (!portal) {
      this.portal = defaultSkynetPortalUrl;
    }
    this.skynetClient = new SkynetClient(this.portal);
  }

  private generateUserorigamiKey(basePassphrase: string): string {
    const userorigamiKeySuffix = cryptoJS.SHA256(`${basePassphrase}_USER_ORIGAMI`).toString();
    return `${this._userorigamiSkydbKeyPrefix}_${userorigamiKeySuffix}`;
  }

  private generateUserorigamiEncryptionKey(basePassphrase: string): string {
    const { privateKey } = genKeyPairFromSeed(`${basePassphrase}_USER_ORIGAMI_ENCRYPTION`);
    return privateKey;
  }

  public generateUserKeys(passphrase: string): UserKeys {
    const { publicKey, privateKey } = genKeyPairFromSeed(passphrase);
    const origamiEncryptionKey = this.generateUserorigamiEncryptionKey(passphrase);
    const origamiSkydbKey = this.generateUserorigamiKey(passphrase);

    return { publicKey, privateKey, origamiEncryptionKey, origamiSkydbKey };
  }

  public async getKatlamaData({ publicKey }: Partial<UserKeys>): Promise<UserData> {
    if (!publicKey) {
      throw new Error('No publicKey');
    }

    try {
      const { data } = await this.skynetClient.db.getJSON(
        publicKey,
        this.userDataKey,
        {
          timeout: this.skydbTimeout,
        },
      ) || {};
      if (data) {
        const user = data as UserData;
        this.silentCacheUser({ toCacheUserPublicKey: publicKey, user });
        return user;
      }
    } catch (error) { }

    throw new Error('Could not get  data');
  }

  private encryptUserOrigami({ origami, origamiEncryptionKey }: { origami: UserOrigami[] } & Partial<UserKeys>): string {
    if (!origamiEncryptionKey) {
      throw new Error('No origami encryption key');
    }

    return cryptoJS.AES.encrypt(
      JSON.stringify(origami),
      origamiEncryptionKey
    ).toString();
  }

  public async updateUserData({ user, privateKey, revision }: { user?: UserData, revision?: number }
    & Partial<UserKeys>): Promise<UserData> {
    if (!privateKey) {
      throw new Error('No privateKey');
    }

    user = user || { nickname: '' };

    const publicKey = privateKey.slice(privateKey.length - 64);
    this.silentCacheUser({ toCacheUserPublicKey: publicKey, user });

    try {
      await this.skynetClient.db.setJSON(
        privateKey,
        this.userDataKey,
        user,
        revision,
        {
          timeout: this.skydbTimeout,
        },
      );
    } catch (error) {
      throw new Error('Could not update user data');
    }

    return user;
  }

  public async storeorigami({ origami, privateKey, origamiSkydbKey, origamiEncryptionKey, revision }:
    { origami: UserOrigami[], revision?: number } & Partial<UserKeys>): Promise<void> {
    const encryptedOrigami = this.encryptUserOrigami({ origami, origamiEncryptionKey });
    const encryptedOrigamiToStore: UserOrigamiEncrypted = {
      encryptedOrigami,
      encryptionType: EncryptionType.KeyPairFromSeed
    };

    if (!origamiSkydbKey) {
      throw new Error('No origami Skydb key');
    }

    if (!privateKey) {
      throw new Error('No privateKey');
    }

    try {
      await this.skynetClient.db.setJSON(
        privateKey,
        origamiSkydbKey,
        encryptedOrigamiToStore,
        revision,
        {
          timeout: this.skydbTimeout,
        }
      );
    } catch (error) {
      throw new Error('origami could not be saved');
    }
  }

  private async initUserData({ user, privateKey, origamiSkydbKey, origamiEncryptionKey }:
    { user?: UserData } & Partial<UserKeys>): Promise<UserData> {
    if (!privateKey) {
      throw new Error('No privateKey');
    }

    const initialRevision = 0;

    // genratate random username
    user = user || { nickname: `katlama-${Math.random().toString(36).substring(6)}` };

    // init connected users with the katlama official publicKey
    const connectedUsers: ConnectedUser[] = [{
      publicKey: this.katlamaAccountPublicKey,
      startedAt: new Date(Date.now()),
    }];

    try {
      await this.skynetClient.db.setJSON(
        privateKey,
        this.userPublicorigamiSkydbKey,
        [] as UserPublicOrigami[],
        initialRevision,
        {
          timeout: this.skydbTimeout,
        },
      );

      await this.skynetClient.db.setJSON(
        privateKey,
        this.userConnectedUsersSkydbKey,
        connectedUsers,
        initialRevision,
        {
          timeout: this.skydbTimeout,
        },
      );

      await this.skynetClient.db.setJSON(
        privateKey,
        this.userSharedorigamiSkydbKey,
        [] as UserSharedOrigami[],
        initialRevision,
        {
          timeout: this.skydbTimeout,
        },
      );
    } catch (error) {
      throw new Error('The user database could not be initialized');
    }

    await this.storeorigami({
      origami: [], privateKey, origamiSkydbKey, origamiEncryptionKey,
      revision: initialRevision
    });

    // This should be executed as the last one to ensure that all the other schemas are stored.
    await this.updateUserData({ user, privateKey, revision: initialRevision });

    return user;
  }

  public async registerUser({ ...keys }: Partial<UserKeys>): Promise<UserData> {
    if (!keys.publicKey) {
      throw new Error('No publicKey');
    }

    // Check if exists
    let userExists;
    try {
      userExists = await this.skynetClient.db.getJSON(
        keys.publicKey,
        this.userDataKey,
        {
          timeout: this.registerUserSkydbTimeout,
        },
      );
    } catch (error) { }

    if (userExists) {
      return userExists.data as UserData;
    }

    return await this.initUserData({ ...keys });
  }

  private decryptUserOrigami({ encryptedorigami, origamiEncryptionKey }:
    { encryptedorigami: string } & Partial<UserKeys>
  ): UserOrigami[] {
    if (!origamiEncryptionKey) {
      throw new Error('No origami encryption key');
    }

    const decryptedorigami = cryptoJS.AES.decrypt(
      encryptedorigami,
      origamiEncryptionKey,
    ).toString(cryptoJS.enc.Utf8);
    const parsedDecrypted = JSON.parse(decryptedorigami);
    // tslint:disable-next-line: no-any
    return parsedDecrypted.map((m: any) => ({ ...m, added: new Date(m.added) }));
  }

  public async getOrigami({ publicKey, origamiSkydbKey, origamiEncryptionKey }: Partial<UserKeys>): Promise<UserOrigami[]> {
    if (!publicKey) {
      throw new Error('No publicKey');
    }

    if (!origamiSkydbKey) {
      throw new Error('No origami Skydb key');
    }

    let response;

    try {
      response = await this.skynetClient.db.getJSON(
        publicKey,
        origamiSkydbKey,
        {
          timeout: this.skydbTimeout,
        }
      );
    } catch (error) { }

    if (!response || !('data' in response)) {
      throw new Error(
        'Could not load origami',
      );
    }

    const storedEncryptedOrigami = response.data as UserOrigamiEncrypted;
    const origami = this.decryptUserOrigami({ encryptedorigami: storedEncryptedOrigami.encryptedOrigami, origamiEncryptionKey });

    return origami;
  }

  public async addKatlama({ katlama, file, origami, privateKey, origamiSkydbKey, origamiEncryptionKey }:
    { origami: UserOrigami[], katlama: Origami, file?: File } & Partial<UserKeys>
  ): Promise<UserOrigami> {

    const newKatlama = {
      id: uuidv4(),
      added: new Date(Date.now()),
      text: katlama.text,
      name: katlama.name,
      tags: katlama.tags,

    } as UserOrigami;

    if (file && file instanceof File) {
      // TODO: use skystandards for data format
      if (file.type.indexOf('image') === 0) {
        this.resizeImage(file, 1200).then(async success => {
          newKatlama.skylinkResized = await this.skynetClient.uploadFile(success);
        }, error => {
          console.log("Could not resize image: " + error)
        });
      }

      try {
        newKatlama.skylink = await this.skynetClient.uploadFile(file);
        newKatlama.mimeType = file.type;
      } catch (error) {
        throw new Error('The file could not be sent');
      }
    }

    origami.unshift(newKatlama);

    try {
      await this.storeorigami({ origami, privateKey, origamiSkydbKey, origamiEncryptionKey });
    } catch (error) {
      throw new Error('Could not add new katlama');
    }

    return newKatlama;
  }

  private resizeImage(file: File, maxWidth: number): Promise<File> {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.src = URL.createObjectURL(file);
      image.onload = () => {
        if (image.width > 1280) {
          this.ng2ImgMax.resizeImage(file, maxWidth, 10000).subscribe(
            async result => {
              resolve(result);
            },
            error => {
              reject(error);
            }
          );
        } else {
          reject("image width less than 1200px")
        }
      };
      image.onerror = reject;
    });
  }

  public async getPublicOrigami({ publicKey }: Partial<UserKeys>): Promise<UserPublicOrigami[]> {
    let response;
    try {
      response = await this.skynetClient.db.getJSON(
        publicKey,
        this.userPublicorigamiSkydbKey,
        {
          timeout: this.skydbTimeout,
        },
      );
    } catch (error) {
    }
    if (!response || !('data' in response)) {
      throw new Error(
        'Could not fetch public origami'
      );
    }

    const userPublicorigami = response.data as UserPublicOrigami[];
    userPublicorigami.forEach(m => {
      m.origami.added = new Date(m.origami.added);
      m.origami.isPublic = true;
    });

    return userPublicorigami;
  }

  public async getPublicKatlama({ id, publicKey }: { id: string } & Partial<UserKeys>): Promise<UserPublicOrigami> {
    const publicorigami = await this.getPublicOrigami({ publicKey });
    const found = publicorigami.find((m) => m.origami.id === id);
    if (found === undefined) {
      throw new Error(
        'Could not fetch public katlama: not found!'
      );
    }

    return found;
  }

  private async deleteFromPublicorigami({ id, publicKey, privateKey }: { id: string } & Partial<UserKeys>): Promise<void> {
    let publicorigami = await this.getPublicOrigami({ publicKey });
    const foundIndex = publicorigami.findIndex((pm) => pm.origami.id && pm.origami.id === id);
    if (foundIndex === -1) {
      return; // already deleted
    }

    if (foundIndex > -1) {
      publicorigami = [
        ...publicorigami.slice(0, foundIndex),
        ...publicorigami.slice(foundIndex + 1),
      ];

      try {
        await this.skynetClient.db.setJSON(
          privateKey,
          this.userPublicorigamiSkydbKey,
          publicorigami,
          undefined,
          {
            timeout: this.skydbTimeout,
          },
        );
      } catch (error) {
        throw new Error('Could not remove origami from public domain');
      }
    }
  }

  private async deleteFromSharedorigami({ id, publicKey, privateKey }: { id: string } & Partial<UserKeys>): Promise<void> {
    const sharedorigami = await this.getSharedOrigami({ publicKey });
    const filteredSharedorigami = sharedorigami.filter((m) => m.OrigamiId.search(id) === -1);

    if (filteredSharedorigami.length === sharedorigami.length) {
      return; // no elements to unshare
    }

    try {
      await this.skynetClient.db.setJSON(
        privateKey,
        this.userSharedorigamiSkydbKey,
        filteredSharedorigami,
        undefined,
        {
          timeout: 10000,
        },
      );
    } catch (error) {
      throw new Error('Could not delete from shared origami');
    }
  }

  public async deleteKatlama({ id, origami, publicKey, privateKey, origamiSkydbKey, origamiEncryptionKey }:
    { id: string, origami: UserOrigami[] } & Partial<UserKeys>): Promise<void> {
    const foundIndex = origami.findIndex(katlama => katlama.id === id);
    if (foundIndex === -1) {
      throw new Error('Could not find katlama to delete');
    }

    origami = [
      ...origami.slice(0, foundIndex),
      ...origami.slice(foundIndex + 1),
    ];

    try {
      await this.storeorigami({ origami, privateKey, origamiSkydbKey, origamiEncryptionKey });
    } catch (error) {
      throw new Error('Could not delete katlama');
    }

    await this.deleteFromPublicorigami({ id, publicKey, privateKey });
    await this.deleteFromSharedorigami({ id, publicKey, privateKey });
  }

  public async publicKatlama({ id, origami, privateKey, publicKey, origamiSkydbKey, origamiEncryptionKey }:
    { id: string, origami: UserOrigami[] } & Partial<UserKeys>): Promise<void> {
    const found = origami.find((katlama) => katlama.id && katlama.id === id);
    if (!found) {
      throw new Error('Could not find katlama to make them public');
    }

    const publicorigami = await this.getPublicOrigami({ publicKey });
    const foundIndex = publicorigami.findIndex((pm) => pm.origami.id && pm.origami.id === id);
    if (foundIndex > -1) {
      return;
    }

    found.isPublic = true;

    const tempFound = { ...found };
    /*
     It should be shared only with the person you want to share the katlama and never saved in public origami
     because of the fact that user can decide to unpublic the katlama without unshare.
    */
    delete tempFound.shareLink;

    const tempPublicKatlama: UserPublicOrigami = {
      publicAt: new Date(Date.now()),
      origami: tempFound,
    };

    publicorigami.unshift(tempPublicKatlama);

    try {
      await this.skynetClient.db.setJSON(
        privateKey,
        this.userPublicorigamiSkydbKey,
        publicorigami,
        undefined,
        {
          timeout: this.skydbTimeout,
        },
      );

    } catch (error) {
      throw new Error('Could not public origami');
    }

    this.storeorigami({ origami, privateKey, origamiSkydbKey, origamiEncryptionKey });
  }

  public async unpublicKatlama({ id, origami, publicKey, privateKey, origamiSkydbKey, origamiEncryptionKey }:
    { id: string, origami: UserOrigami[] } & Partial<UserKeys>): Promise<void> {
    await this.deleteFromPublicorigami({ id, publicKey, privateKey });

    const found = origami.find((katlama) => katlama.id && katlama.id === id);
    if (found) {
      delete found.isPublic;
      this.storeorigami({ origami, privateKey, origamiSkydbKey, origamiEncryptionKey });
    }
  }

  public async getConnectedUsers({ publicKey }: Partial<UserKeys>): Promise<ConnectedUser[]> {
    let response;
    try {
      response = await this.skynetClient.db.getJSON(
        publicKey,
        this.userConnectedUsersSkydbKey,
        {
          timeout: this.skydbTimeout,
        },
      );
    } catch (error) {
    }

    if (!response || !('data' in response)) {
      throw new Error(
        'Could not fetch connected users',
      );
    }

    // tslint:disable-next-line: no-any
    const connectedUsers = response.data.map((u: any) => ({ ...u, startedAt: new Date(u.startedAt) })) as ConnectedUser[];

    return connectedUsers;
  }

  public async connectUserByPublicKey({ connectedUserPublicKey, privateKey, connectedUsers }:
    { connectedUserPublicKey: string, connectedUsers: ConnectedUser[] } & Partial<UserKeys>): Promise<ConnectedUser> {
    // TODO: check public key length
    const found = connectedUsers.find((u) => u.publicKey === connectedUserPublicKey);
    if (found) {
      return found; // already connected
    }

    // IMPO: caching!
    this.silentCacheUser({ toCacheUserPublicKey: connectedUserPublicKey });

    const tempConnectedUser: ConnectedUser = {
      startedAt: new Date(Date.now()),
      publicKey: connectedUserPublicKey,
    };

    connectedUsers.unshift(tempConnectedUser);
    try {
      await this.skynetClient.db.setJSON(
        privateKey,
        this.userConnectedUsersSkydbKey,
        connectedUsers,
        undefined,
        {
          timeout: this.skydbTimeout,
        },
      );
    } catch (error) {
      throw new Error('Could not connect');
    }

    return tempConnectedUser;
  }

  public async unconnectUserByPublicKey({ connectedUserPublicKey, privateKey, connectedUsers }:
    { connectedUserPublicKey: string, connectedUsers: ConnectedUser[] } & Partial<UserKeys>): Promise<void> {
    // TODO: check public key length

    const foundIndex = connectedUsers.findIndex((u) => u.publicKey === connectedUserPublicKey);
    if (foundIndex === -1) {
      return; // already unconnected
    }

    if (foundIndex > -1) {
      connectedUsers = [
        ...connectedUsers.slice(0, foundIndex),
        ...connectedUsers.slice(foundIndex + 1),
      ];
      try {
        await this.skynetClient.db.setJSON(
          privateKey,
          this.userConnectedUsersSkydbKey,
          connectedUsers,
          undefined,
          {
            timeout: this.skydbTimeout,
          },
        );
      } catch (error) {
        throw new Error('Could not unconnect');
      }
    }
  }

  public async getPublicOrigamiOfConnectedUsers({ connectedUsers }: { connectedUsers: ConnectedUser[] }): Promise<UsersPublicOrigami> {
    const connectedUsersOrigami: UsersPublicOrigami = {};
    for (const fu of connectedUsers) {
      const connectedUserPublicOrigami: UserPublicOrigami[] = await this.getPublicOrigami({ publicKey: fu.publicKey });
      connectedUsersOrigami[fu.publicKey] = connectedUserPublicOrigami;
    }
    return connectedUsersOrigami;
  }

  private async getSharedOrigami({ publicKey }: Partial<UserKeys>): Promise<UserSharedOrigami[]> {
    let response;
    try {
      response = await this.skynetClient.db.getJSON(
        publicKey,
        this.userSharedorigamiSkydbKey,
        {
          timeout: this.skydbTimeout,
        },
      );
    } catch (error) {
      response = null;
    }

    if (!response || !('data' in response)) {
      throw new Error('Could not fetch shared origami');
    }

    return response.data as UserSharedOrigami[];
  }

  public async shareKatlama({ id, origami, publicKey, privateKey, origamiSkydbKey, origamiEncryptionKey }:
    { id: string, origami: UserOrigami[] } & Partial<UserKeys>): Promise<string> {
    const found = origami.find((katlama) => katlama.id && katlama.id === id);
    if (!found) {
      throw new Error('Katlama to share not found');
    }

    if (found.isShared && found.shareLink) {
      return found.shareLink;
    }

    const sharedorigami = await this.getSharedOrigami({ publicKey });
    const uniqueEncryptionKey = genKeyPairAndSeed().privateKey;
    const encryptedKatlama = cryptoJS.AES.encrypt(JSON.stringify(found), uniqueEncryptionKey);

    const tempSharedKatlama: UserSharedOrigami = {
      OrigamiId: found.id,
      sharedId: uuidv4(),
      encryptedOrigami: encryptedKatlama.toString(),
      encryptionType: EncryptionType.KeyPairFromSeed,
      sharedAt: new Date(Date.now()),
    };

    sharedorigami.unshift(tempSharedKatlama);

    try {
      await this.skynetClient.db.setJSON(
        privateKey,
        this.userSharedorigamiSkydbKey,
        sharedorigami,
        undefined,
        {
          timeout: this.skydbTimeout,
        },
      );
    } catch (error) {
      throw new Error('Could not share katlama');
    }

    found.isShared = true;
    const tempSharedKatlamaLink: UserSharedOrigamiLink = {
      publicKey: publicKey as string,
      sharedId: tempSharedKatlama.sharedId,
      encryptionKey: uniqueEncryptionKey,
    };
    found.shareLink = btoa(JSON.stringify(tempSharedKatlamaLink));

    await this.storeorigami({ origami, privateKey, origamiSkydbKey, origamiEncryptionKey });

    return found.shareLink;
  }

  public async unshareKatlama({ id, origami, publicKey, privateKey, origamiSkydbKey, origamiEncryptionKey }:
    { id: string, origami: UserOrigami[] } & Partial<UserKeys>): Promise<void> {
    await this.deleteFromSharedorigami({ id, publicKey, privateKey });

    const found = origami.find((katlama) => katlama.id && katlama.id === id);
    if (found) {
      delete found.isShared;
      delete found.shareLink;
      await this.storeorigami({ origami, privateKey, origamiSkydbKey, origamiEncryptionKey });
    }
  }


  public async resolveKatlamaFromBase64(base64Data: string): Promise<UserOrigami> {
    try {
      const decodedBase64 = atob(base64Data);
      const katlamaLink = JSON.parse(decodedBase64) as UserSharedOrigamiLink;
      const sharedorigami = await this.getSharedOrigami({ publicKey: katlamaLink.publicKey });
      const found = sharedorigami.find((m) => m.sharedId && m.sharedId.search(katlamaLink.sharedId) > -1);
      if (!found) {
        throw new Error('Shared katlama not found');
      }
      const decryptedKatlama = cryptoJS.AES.decrypt(found.encryptedOrigami, katlamaLink.encryptionKey).toString(cryptoJS.enc.Utf8);
      const parsedDecryptedKatlama = JSON.parse(decryptedKatlama);
      return parsedDecryptedKatlama;
    } catch (error) {
      throw new Error('origami could not be resolved');
    }
  }

  public resolvePublicKeyFromBase64(base64Data: string): string {
    try {
      const decodedBase64 = atob(base64Data);
      const katlamaLink = JSON.parse(decodedBase64) as UserSharedOrigamiLink;
      return katlamaLink.publicKey;
    } catch (error) {
      throw new Error('PublicKey could not be resolved');
    }
  }

  private async getCachedUsersFromSkyDB(): Promise<CachedUsers> {
    let response;
    try {
      response = await this.skynetClient.db.getJSON(
        this.publickatlamaSkyDBKey.substr(this.publickatlamaSkyDBKey.length - 64),
        this.katlamaSkyDBCachedUsersKey,
        { timeout: this.skydbTimeout },
      );
    } catch (error) {
      response = null;
      throw new Error(
        'Could not fetch katlama cached users'
      );
    }

    if (!response || !('data' in response)) {
      throw new Error('Could not fetch katlama cached users');
    }

    return response.data as CachedUsers;
  }

  private async silentCacheUser({ toCacheUserPublicKey, user }: { toCacheUserPublicKey: string, user?: UserData }) {
    if (!toCacheUserPublicKey || toCacheUserPublicKey.length != 64) {
      return;
    }

    try {
      let userData = user;
      if (!userData) {
        userData = await this.getKatlamaData({ publicKey: toCacheUserPublicKey });
      }

      if (this.userAlreadyCachedAndUpToDate({ publicKey: toCacheUserPublicKey, user: userData })) {
        return;
      }


      const cachedUser: CachedUser = {
        nickname: userData.nickname,
        description: userData.description,
        cachedAt: new Date(Date.now()),
      }

      this.cacheUserInLocalstorage({ publicKey: toCacheUserPublicKey, user: cachedUser, updatePull: false });

      clearTimeout(this.chacheTimeout);
      this.chacheTimeout = setTimeout(() => {
        this.syncCachedUsers();
      }, 3000);
    } catch (error) {
      console.log("Could not update cached users.");
    }
  }

  public async syncCachedUsers() {
    const localCachedUsers = this.getLocalCachedUsers();
    if (!localCachedUsers) {
      return;
    }

    const skyDBCachedUsers = await this.getCachedUsersFromSkyDB();
    let callSkyDB = false;

    for (let cachedUserPublicKey in localCachedUsers.cache) {
      let cachedUser = localCachedUsers.cache[cachedUserPublicKey];
      if (cachedUserPublicKey in skyDBCachedUsers) {
        const storedCachedUser = skyDBCachedUsers[cachedUserPublicKey];
        if (cachedUser.cachedAt > storedCachedUser.cachedAt) {
          if (cachedUser.description !== storedCachedUser.description ||
            cachedUser.nickname !== storedCachedUser.nickname) {
            skyDBCachedUsers[cachedUserPublicKey] = cachedUser;
            callSkyDB = true;
          }
        }
      } else {
        skyDBCachedUsers[cachedUserPublicKey] = cachedUser;
        callSkyDB = true;
      }
    }

    // Updating the localStorage with cache from SkyDB
    for (let skyDbCachedUserPublicKey in skyDBCachedUsers) {
      if (!(skyDbCachedUserPublicKey in localCachedUsers)) {
        const skyDBCachedUser = skyDBCachedUsers[skyDbCachedUserPublicKey];
        this.cacheUserInLocalstorage({ publicKey: skyDbCachedUserPublicKey, user: skyDBCachedUser, updatePull: true });
      }
    }

    if (!callSkyDB) {
      return;
    }

    await this.skynetClient.db.setJSON(
      this.publickatlamaSkyDBKey,
      this.katlamaSkyDBCachedUsersKey,
      skyDBCachedUsers,
      undefined,
      { timeout: this.skydbTimeout }
    );
  }

  private userAlreadyCachedAndUpToDate({ publicKey, user }: { user: UserData } & Partial<UserKeys>): Boolean {
    if (!publicKey) {
      throw new Error('userAlreadyCachedAndUpToDate: invalid publicKey');;
    }

    const localCachedUsers = this.getLocalCachedUsers();
    if (localCachedUsers) {
      if (publicKey in localCachedUsers.cache) {
        if (localCachedUsers.cache[publicKey].nickname === user.nickname &&
          localCachedUsers.cache[publicKey].description === user.description) {
          return true;
        }
      }
    }

    return false;
  }

  private cacheUserInLocalstorage({ publicKey, user, updatePull }:
    { user: CachedUser, updatePull: boolean } & Partial<UserKeys>) {
    if (!publicKey) {
      throw new Error('cacheUserInLocalstorage: invalid publicKey');;
    }

    const localCachedUsers = this.getLocalCachedUsers();
    if (updatePull) {
      localCachedUsers.lastPullAt = this.unixTimestampSeconds();
    }

    localCachedUsers.cache[publicKey] = user;
    localStorage.setItem(this.cachedUsersLocalStorageKey, JSON.stringify(localCachedUsers));
  }

  public unixTimestampSeconds(): number {
    return Math.round(+new Date() / 1000);
  }

  public getLocalCachedUsers(): UsersCache {
    let localCachedUsers = {} as UsersCache;
    localCachedUsers.lastPullAt = 0;
    localCachedUsers.cache = {} as CachedUsers;

    try {
      const fromStorage = localStorage.getItem(this.cachedUsersLocalStorageKey);
      if (fromStorage) {
        localCachedUsers = JSON.parse(fromStorage) as UsersCache;
      }
    } catch (error) { }

    return localCachedUsers;
  }

  public async getStreamorigami(): Promise<StreamOrigami[]> {
    let response;
    try {
      response = await this.skynetClient.db.getJSON(
        this.publickatlamaSkyDBKey.substr(this.publickatlamaSkyDBKey.length - 64),
        this.streamorigamiSkydbKey,
        {
          timeout: this.skydbTimeout,
        },
      );
    } catch (error) {
    }
    if (!response || !('data' in response)) {
      throw new Error(
        'Could not fetch stream origami'
      );
    }

    const responseStreamOrigami = response.data as StreamOrigamis;

    // TODO: create cron to do it on backend side. Lambda???
    const dayInMilliseconds = 1 * 1000 * 60 * 60 * 24 * 10;
    if (responseStreamOrigami) {
      if (Date.now() - new Date(responseStreamOrigami.lastProcessDate).getTime() > dayInMilliseconds) {
        return this.processStreamorigami();
      }
      return responseStreamOrigami.origami;
    }

    return [];
  }

  public async processStreamorigami(): Promise<StreamOrigami[]> {
    const skyDBCachedUsers = await this.getCachedUsersFromSkyDB();
    let origami: StreamOrigami[] = []

    for (let skyDbCachedUserPublicKey in skyDBCachedUsers) {
      const temporigami = await this.getPublicOrigami({ publicKey: skyDbCachedUserPublicKey })
      if (temporigami) {
        temporigami.forEach((m) => {
          let tempKatlama: StreamOrigami = { ...m.origami, ownerPublicKey: skyDbCachedUserPublicKey }
          origami.push(tempKatlama)
        })
      }
    }

    const sorted = origami.sort((a, b) => b.added.getTime() - a.added.getTime())

    const processedorigami: StreamOrigamis = {
      origami: sorted,
      lastProcessDate: new Date(Date.now()),
    }

    await this.skynetClient.db.setJSON(
      this.publickatlamaSkyDBKey,
      this.streamorigamiSkydbKey,
      processedorigami,
      undefined,
      { timeout: this.skydbTimeout }
    );

    return sorted;
  }
}
function STREAM_ORIGAMI_KEY(STREAM_ORIGAMI_KEY: any) {
  throw new Error('Function not implemented.');
}

