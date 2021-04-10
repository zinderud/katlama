import { Account } from '../core/models/user.model';

export enum AuthError {
  InvalidEmail = 'Invalid email',
  InvalidPassword = 'Invalid password',
  EmailExists = 'Email already exists',
  EmailConfirmed = 'Email already confirmed',
  EmailNotFound = 'Email not found',
  InvalidToken = 'Invalid token',
  NewPasswordMustBeDifferentFromCurrent = 'New password must be different from current',
}

export interface ForogtPasswordDto {
  email: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ResetPasswordDto {
  newPassword: string;
}

export interface LoggedInUser {
  jwt: string;
  account: Account;
}
