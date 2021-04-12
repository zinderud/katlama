import { UserData } from './../models/user-data';
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { EMPTY, from, Observable, zip } from 'rxjs';
import { map, catchError, first } from 'rxjs/operators';

import { ApiService } from './api.service';
import { ConnectedUser } from '../models/user-connected-users';
import { Origami } from '../models/origami';

@Injectable({
  providedIn: 'root'
})
export class PublicBrainResolver implements Resolve<{
  origami: Origami[],
  connectedUsers: ConnectedUser[],
  brainData: UserData
}> {
  constructor(private apiService: ApiService, private router: Router) { }

  resolve(
    route: ActivatedRouteSnapshot,
    _: RouterStateSnapshot
  ): Observable<{ origami: Origami[], connectedUsers: ConnectedUser[], brainData: UserData }> {
    return zip(
      from(this.apiService.getPublicorigami({ publicKey: route.params.publicKey })),
      from(this.apiService.getConnectedUsers({ publicKey: route.params.publicKey })),
      from(this.apiService.getBrainData({ publicKey: route.params.publicKey }))
    )
      .pipe(
        first(),
        map(([publicorigami, connectedUsers, brainData]) => {
          const origami = publicorigami.map(mapPublicSkyToOrigami);
          return { origami, connectedUsers, brainData };
        }),
        catchError(error => {
          this.router.navigate(['/404'], { queryParams: { error: error.message } });
          return EMPTY;
        })
      );
  }
}
