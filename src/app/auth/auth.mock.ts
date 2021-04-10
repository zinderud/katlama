import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

import { Account, Role } from '../core/models/user.model';

import {
  AuthError,
  LoggedInUser,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './auth.model';

export interface MockUser extends Account {
  password: string;
}

export const mockUser: MockUser = {
  id: 42,
  email: 'johndoe@email.com',
  password: 'JohnDoePass123',
  firstName: 'John',
  lastName: 'Doe',
  isConfirmed: true,
  createdAt: new Date('September 22, 2018 15:00:00'),
  updatedAt: new Date('October 12, 2020 19:00:00'),
  roles: [Role.Ghost],
};
const validToken = 'johndoe.test.token';

const mockDelay = 1000;

export const loginForTest$ = (input: LoginDto): Observable<LoggedInUser> => {
  const isEmailCorrect = input.email.toLowerCase() === mockUser.email;
  if (!isEmailCorrect) {
    return of(undefined).pipe(
      delay(mockDelay),
      switchMap(() => throwError(new Error('Invalid email'))),
    );
  }
  const isPasswordCorrect = input.password === mockUser.password;
  if (!isPasswordCorrect) {
    return of(undefined).pipe(
      delay(mockDelay),
      switchMap(() => throwError(new Error('Invalid password'))),
    );
  }
  const { password, ...account } = mockUser;

  return of({
    jwt: 'ey...',
    account,
  } as LoggedInUser).pipe(delay(mockDelay));
};

export const registerForTest$ = (
  input: RegisterDto,
): Observable<LoggedInUser> => {
  if (input.email.toLowerCase() === mockUser.email) {
    return of(undefined).pipe(
      delay(mockDelay),
      switchMap(() => throwError(new Error('Email already exists'))),
    );
  }

  return of({
    jwt: 'ey...',
    account: {
      id: 43,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      isConfirmed: false,
    },
  } as LoggedInUser).pipe(delay(mockDelay));
};

export const confirmEmailForTest$ = (
  account: Account | undefined,
  token: string,
): Observable<LoggedInUser> => {
  if (account === undefined) {
    return throwError(new Error(AuthError.EmailConfirmed));
  }
  if (account.isConfirmed) {
    return throwError(new Error(AuthError.EmailConfirmed));
  }
  if (token !== validToken) {
    return of(undefined).pipe(
      delay(mockDelay),
      switchMap(() => {
        return throwError(new Error(AuthError.InvalidToken));
      }),
    );
  }
  const confirmedMockUser = { ...mockUser, isConfirmed: true };

  return of({
    jwt: 'ey...',
    account: confirmedMockUser,
  }).pipe(delay(mockDelay));
};

export const resendConfirmationEmailForTest$ = (): Observable<{
  isSuccess: boolean;
}> => {
  return of({ isSuccess: true }).pipe(delay(2000));
};

export const forgotPasswordForTest$ = (): Observable<{
  isProcessed: boolean;
}> => {
  return of({ isProcessed: true }).pipe(delay(mockDelay));
};

export const resetPasswordForTest$ = (
  input: ResetPasswordDto,
  id: number,
  token: string,
): Observable<{ isProcessed: boolean }> => {
  const isParamsCorrect = id === mockUser.id && token === validToken;
  if (!isParamsCorrect) {
    return of(undefined).pipe(
      delay(mockDelay),
      switchMap(() => {
        return throwError(new Error(AuthError.InvalidToken));
      }),
    );
  }

  return of({ isProcessed: true }).pipe(delay(mockDelay));
};
