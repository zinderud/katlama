import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiError } from '../models/error.model';
import { LogService } from '../services/log.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private readonly logService: LogService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      // tslint:disable-next-line: rxjs-no-implicit-any-catch
      catchError((err: HttpErrorResponse) => {
        const messageToDev = `${this.constructor.name} - ${err.message}`;
        this.logService.error(messageToDev);

        let messageToEndUser = '';
        if (err.error instanceof ErrorEvent) {
          messageToEndUser = err?.error?.message;
        } else if (err.error instanceof ProgressEvent) {
          messageToEndUser = err.message;
        } else {
          messageToEndUser = (err.error as ApiError)?.message;
        }

        return throwError(new Error(messageToEndUser));
      }),
    );
  }
}
