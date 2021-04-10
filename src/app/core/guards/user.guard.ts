import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { LogService, LogSubject } from '../services/log.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class UserGuard implements CanActivate {
  constructor(
    private readonly logService: LogService,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    const jwt = this.userService.jwt;

    return this.userService.account$.pipe(
      map((account) => {
        if (jwt === undefined || account === undefined) {
          this.logService.info(LogSubject.Guard, this.constructor.name);

          return this.router.parseUrl('/auth');
        }

        return true;
      }),
    );
  }
}
