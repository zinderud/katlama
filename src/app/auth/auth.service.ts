import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { UserService } from '../core/services/user.service';

import {
  confirmEmailForTest$,
  forgotPasswordForTest$,
  loginForTest$,
  registerForTest$,
  resendConfirmationEmailForTest$,
  resetPasswordForTest$,
} from './auth.mock';
import {
  LoggedInUser,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isUsableWithoutApi = environment.apiUrl === '';

  constructor(
    private readonly userService: UserService,
    private readonly http: HttpClient,
  ) {}

  login$(input: LoginDto): Observable<LoggedInUser> {
    if (this.isUsableWithoutApi) {
      return loginForTest$(input).pipe(
        tap((res) => this.userService.update(res.account, res.jwt)),
      );
    }

    return this.http
      .post<LoggedInUser>(`${environment.apiUrl}/auth/login`, input)
      .pipe(tap((res) => this.userService.update(res.account, res.jwt)));
  }

  register$(input: RegisterDto): Observable<LoggedInUser> {
    if (this.isUsableWithoutApi) {
      return registerForTest$(input).pipe(
        tap((res) => this.userService.update(res.account, res.jwt)),
      );
    }

    return this.http
      .post<LoggedInUser>(`${environment.apiUrl}/auth/register`, input)
      .pipe(tap((res) => this.userService.update(res.account, res.jwt)));
  }

  resendConfirmationEmail$(email: string): Observable<{ isSuccess: boolean }> {
    if (this.isUsableWithoutApi) {
      return resendConfirmationEmailForTest$();
    }

    return this.http.get<{ isSuccess: boolean }>(
      `${environment.apiUrl}/auth/resend-confirmation-email/${email}`,
    );
  }

  confirmEmail$(token: string): Observable<LoggedInUser> {
    if (this.isUsableWithoutApi) {
      return this.userService.account$.pipe(
        take(1),
        switchMap((account) => confirmEmailForTest$(account, token)),
        tap((loggedInUser) => {
          this.userService.update(loggedInUser.account, loggedInUser.jwt);
        }),
      );
    }

    return this.http
      .get<LoggedInUser>(`${environment.apiUrl}/auth/confirm-email/${token}`)
      .pipe(
        tap((loggedInUser) =>
          this.userService.update(loggedInUser.account, loggedInUser.jwt),
        ),
      );
  }

  forgotPassword$(email: string): Observable<{ isProcessed: boolean }> {
    const lowerCaseEmail = email.toLowerCase();

    if (this.isUsableWithoutApi) {
      return forgotPasswordForTest$();
    }

    return this.http.get<{ isProcessed: boolean }>(
      `${environment.apiUrl}/auth/forgot-password/${lowerCaseEmail}`,
    );
  }

  resetPassword$(
    input: ResetPasswordDto,
    id: number,
    token: string,
  ): Observable<{ isProcessed: boolean }> {
    if (this.isUsableWithoutApi) {
      return resetPasswordForTest$(input, id, token);
    }

    return this.http.post<{ isProcessed: boolean }>(
      `${environment.apiUrl}/auth/reset-password/${id}/${token}`,
      input,
    );
  }
}
