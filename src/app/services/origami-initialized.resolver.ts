import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { Observable } from 'rxjs';
import { first, map, withLatestFrom, filter } from 'rxjs/operators';




@Injectable({
  providedIn: 'root'
})
export class origamiInitializedService implements Resolve<boolean> {
  constructor(private store: Store<State>) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.store.pipe(
      select(selectIsInitialized),
      withLatestFrom(this.store.select(selectIsLoading)),
      map(([initialized, isLoading]) => {
        if (initialized) {
          return true;
        }
        if (!isLoading) {
          this.store.dispatch(getorigami());
        }
        return initialized;
      }),
      filter(i => i),
      first()
    );
  }
}
