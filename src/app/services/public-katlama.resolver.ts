import { UserData } from './../models/user-data';
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { EMPTY, from, Observable, zip } from 'rxjs';
import { map, catchError, first } from 'rxjs/operators';

import { ApiService } from './api.service';
import { ConnectedUser } from '../models/user-connected-users';
import { Origami } from '../models/origami';
import { UserPublicOrigami } from '../models/user-public-origami';

@Injectable({
  providedIn: 'root'
})
export class PublicKatlamaResolver implements Resolve<{
  publicOrigami: UserPublicOrigami[],
  connectedUsers: ConnectedUser[],
  brainData: UserData
}> {
  constructor(private apiService: ApiService, private router: Router) { }

  resolve(
    route: ActivatedRouteSnapshot,
    _: RouterStateSnapshot
  ): Observable<{ publicOrigami: UserPublicOrigami[], connectedUsers: ConnectedUser[], brainData: UserData }> {
    return zip(
      from(this.apiService.getPublicOrigami({ publicKey: route.params.publicKey })),
      from(this.apiService.getConnectedUsers({ publicKey: route.params.publicKey })),
      from(this.apiService.getKatlamaData({ publicKey: route.params.publicKey }))
    )
      .pipe(
        first(),
        map(([publicOrigami, connectedUsers, brainData]) => {
          return { publicOrigami, connectedUsers, brainData };


        }),
        catchError(error => {
          this.router.navigate(['/404'], { queryParams: { error: error.message } });
          return EMPTY;
        })
      );
  }
}
