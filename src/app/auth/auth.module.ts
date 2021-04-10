import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NotUserGuard } from '../core/guards/not-user.guard';
import { UserGuard } from '../core/guards/user.guard';
import { SharedModule } from '../shared/shared.module';

import { AuthComponent } from './auth.component';
import { ConfirmEmailDialogComponent } from './confirm-email-dialog/confirm-email-dialog.component';
import { ConfirmEmailComponent } from './confirm-email/confirm-email.component';
import { ForgotPasswordDialogComponent } from './forgot-password-dialog/forgot-password-dialog.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Routes = [
  { path: '', component: AuthComponent, canActivate: [NotUserGuard] },
  {
    path: 'confirm-email',
    component: ConfirmEmailComponent,
    canActivate: [UserGuard],
  },
  {
    path: 'confirm-email/:token',
    component: ConfirmEmailComponent,
    canActivate: [UserGuard],
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [NotUserGuard],
  },
  {
    path: 'reset-password/:id/:token',
    component: ResetPasswordComponent,
  },
];

@NgModule({
  declarations: [
    AuthComponent,
    LoginFormComponent,
    RegisterFormComponent,
    ConfirmEmailDialogComponent,
    ConfirmEmailComponent,
    ForgotPasswordComponent,
    ForgotPasswordDialogComponent,
    ResetPasswordComponent,
  ],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule],
})
export class AuthModule {}
