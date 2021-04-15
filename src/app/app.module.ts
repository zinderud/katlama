import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { APP_NAME } from './tokens/app-name.token';
import { MarkdownEditorModule } from './modules/markdown-editor/markdown-editor.module';
import { USER_DATA_KEY } from './models/user-data';
import { USER_ORIGAMI_KEY_PREFIX } from './models/user-origami';
import { USER_CONNECTED_USERS_KEY, KATLAMA_ACCOUNT_PUBLIC_KEY } from './models/user-connected-users';
import { USER_SHARED_ORIGAMI_KEY } from './models/user-shared-origami';
import { USER_PUBLIC_ORIGAMI_KEY } from './models/user-public-origami';
import { SKYDB_CACHED_USERS_KEY } from './models/users-cache';
import { PORTAL } from './tokens/portal.token';
import { STREAM_ORIGAMI_KEYS } from './models/stream-origami';


import { StreamResolver } from './services/stream.resolver';
import { ApiService } from './services/api.service';
import { CacheService } from './services/cache.service';
import { PublicKatlamaResolver } from './services/public-katlama.resolver';
import { PublicOrigamiService } from './services/public-origami.resolver';
import { SharedOrigamiervice } from './services/shared-origami.resolver';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'not-found',
    loadChildren: () =>
      import('./not-found/not-found.module').then((m) => m.NotFoundModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'article',
    loadChildren: () =>
      import('./article/article.module').then((m) => m.ArticleModule),
  },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];

@NgModule({
  declarations: [
    AppComponent

  ],
  imports: [
    CoreModule,
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    ReactiveFormsModule,
    FontAwesomeModule,
    MarkdownEditorModule,
    Ng2ImgMaxModule
  ],
  providers: [
    { provide: USER_DATA_KEY, useValue: 'USER_DATA' },
    { provide: USER_ORIGAMI_KEY_PREFIX, useValue: 'USER_ORIGAMI' },
    { provide: USER_PUBLIC_ORIGAMI_KEY, useValue: 'KATLAMA__USER_PUBLIC_ORIGAMI' },
    { provide: USER_SHARED_ORIGAMI_KEY, useValue: 'KATLAMA__USER_SHARED_ORIGAMI' },
    { provide: USER_CONNECTED_USERS_KEY, useValue: 'KATLAMA__USER_FOLLOWS' },
    { provide: KATLAMA_ACCOUNT_PUBLIC_KEY, useValue: 'key--------------' },
    { provide: APP_NAME, useValue: 'katlama' },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: SKYDB_CACHED_USERS_KEY, useValue: 'SKYDB_CACHED_USERS' },
    { provide: STREAM_ORIGAMI_KEYS, useValue: 'STREAM_ORIGAMI' },
    { provide: PORTAL, useValue: 'https://origami.hns.siasky.net' },
    /* ApiService,
    CacheService,
    PublicKatlamaResolver,
    PublicOrigamiService,
    SharedOrigamiervice,
    StreamResolver */


  ],

  bootstrap: [AppComponent],
})
export class AppModule { }
