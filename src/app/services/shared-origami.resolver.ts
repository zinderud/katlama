
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { EMPTY, from, Observable, zip } from 'rxjs';
import { map, catchError, first } from 'rxjs/operators';

import { ApiService } from './api.service';
import { UserData } from '../models/user-data';
import { Origami } from '../models/origami';
import { UserOrigami } from '../models/user-origami';
import { ConnectedUser } from '../models/user-connected-users';

@Injectable({
  providedIn: 'root'
})
export class SharedOrigamiervice implements Resolve<{
  sharedOrigami: Origami, connectedUsers: ConnectedUser[],
  origamiData: UserData, publicKey: string
}> {
  constructor(private apiService: ApiService, private router: Router) { }

  resolve(
    route: ActivatedRouteSnapshot,
    _: RouterStateSnapshot
  ): Observable<{ sharedOrigami: UserOrigami, connectedUsers: ConnectedUser[], origamiData: UserData, publicKey: string }> {
    if (!route.params.code) {
      this.router.navigate(['/404'], { queryParams: { error: 'Invalid shared link' } });
      return EMPTY;
    }

    let publicKey: string;

    try {
      publicKey = this.apiService.resolvePublicKeyFromBase64(route.params.code);
    } catch (error) {
      this.router.navigate(['/404'], { queryParams: { error: 'Invalid shared link' } });
      return EMPTY;
    }

    return zip(
      from(this.apiService.resolveKatlamaFromBase64(route.params.code)),
      from(this.apiService.getConnectedUsers({ publicKey })),
      from(this.apiService.getKatlamaData({ publicKey }))
    )
      .pipe(
        first(),
        map(([sharedOrigami, connectedUsers, origamiData]) => {
          const data = { sharedOrigami, connectedUsers, origamiData, publicKey: publicKey }

          return data;
        }),
        catchError(error => {
          this.router.navigate(['/404'], { queryParams: { error: error.message } });
          return EMPTY;
        })
      );
  }
}
