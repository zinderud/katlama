import { Inject, Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { EMPTY, from, Observable, zip } from 'rxjs';
import { map, catchError, first } from 'rxjs/operators';
import { Origami } from '../models/origami';
import { KATLAMA_ACCOUNT_PUBLIC_KEY } from '../models/user-connected-users';

import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class StreamResolver implements Resolve<{
  origami: Origami[],
}> {
  constructor(
    private apiService: ApiService,
    private router: Router,
    @Inject(KATLAMA_ACCOUNT_PUBLIC_KEY) private AccountPublicKey: string) { }

  resolve(
    route: ActivatedRouteSnapshot,
    _: RouterStateSnapshot
  ): Observable<{ origami: Origami[] }> {
    return zip(
      from(this.apiService.getKatlamaData({ publicKey: this.AccountPublicKey })), // fix not displayed user names
      from(this.apiService.getStreamorigami()),
    )
      .pipe(
        first(),
        map(([KatlamaData, publicorigami]) => {

          const origami = { ...publicorigami, KatlamaData: KatlamaData }

          return { origami };
        }),
        catchError(error => {
          this.router.navigate(['/404'], { queryParams: { error: error.message } });
          return EMPTY;
        })
      );
  }
}
