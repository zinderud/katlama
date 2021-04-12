import { UserPublicOrigami } from './../models/user-public-memories';
import { ConnectedUser } from 'src/app/models/user-connected-users';
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { EMPTY, from, Observable, zip } from 'rxjs';
import { map, catchError, first } from 'rxjs/operators';

import { ApiService } from './api.service';
import { UserData } from '../models/user-data';

@Injectable({
  providedIn: 'root'
})
export class PublicOrigamiService implements Resolve<{
  publicOrigami: UserPublicOrigami, connectedUsers: ConnectedUser[], origamiData: UserData
}> {
  constructor(private apiService: ApiService, private router: Router) { }

  resolve(
    route: ActivatedRouteSnapshot,
    _: RouterStateSnapshot
  ): Observable<{ publicOrigami: UserPublicOrigami, connectedUsers: ConnectedUser[], origamiData: UserData }> {
    if (!route.params.publicKey || !route.params.OrigamiId) {
      this.router.navigate(['/404'], { queryParams: { error: 'Invalid public Origami link' } });
      return EMPTY;
    }

    const publicKey: string = route.params.publicKey;
    const id = route.params.OrigamiId;

    return zip(
      from(this.apiService.getPublicOrigami({ id, publicKey })),
      from(this.apiService.getConnectedUsers({ publicKey })),
      from(this.apiService.getorigamiData({ publicKey }))
    )
      .pipe(
        first(),
        map(([publicOrigami, connectedUsers, origamiData]) => {
          return { publicOrigami, connectedUsers, origamiData };
        }),
        catchError(error => {
          this.router.navigate(['/404'], { queryParams: { error: error.message } });
          return EMPTY;
        })
      );
  }
}
