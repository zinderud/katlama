import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SnackbarService } from '../../core/services/snackbar.service';
import { AuthError } from '../auth.model';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent implements OnInit, OnDestroy {
  @Output() readonly errorHappens = new EventEmitter<string>();
  formGroup: FormGroup;
  isLoading = false;
  isPasswordHidden = true;
  errorMessage = '';
  private readonly isDestroyed$ = new Subject<boolean>();

  get f(): { [key: string]: AbstractControl } {
    return this.formGroup.controls;
  }

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackbarService: SnackbarService,
  ) {
    this.formGroup = this.createFormGroup('change');
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.isDestroyed$.next(true);
    this.isDestroyed$.complete();
  }

  onSubmit(): Subscription | undefined {
    this.isLoading = true;
    this.formGroup.disable();
    this.isPasswordHidden = true;

    return this.authService
      .login$({
        email: this.f.identifier?.value as string,
        password: this.f.password?.value as string,
      })
      .pipe(takeUntil(this.isDestroyed$))
      .subscribe(
        (res) => this.router.navigate(['/']),
        (err) => {
          this.errorHappens.emit((err as Error).message);
          this.errorMessage = (err as Error).message;
          this.isLoading = false;
          this.formGroup.enable();
        },
      );
  }

  private createFormGroup(
    updateOn: 'submit' | 'change',
    previousValue?: { [key: string]: unknown },
  ): FormGroup {
    // tslint:disable
    const formGroup = this.formBuilder.group(
      {
        identifier: [undefined, [Validators.required, Validators.email]],
        password: [undefined, [Validators.required]],
      },
      {
        updateOn,
        validators: this.mustNotBeRejectedValidator(),
      },
      // tslint:enable
    );
    if (previousValue !== undefined) {
      formGroup.setValue(previousValue);
    }

    return formGroup;
  }

  private mustNotBeRejectedValidator(): () => void {
    return () => {
      if (this.errorMessage === AuthError.InvalidEmail) {
        this.f.identifier.setErrors({ mustNotBeRejected: true });
      } else if (this.errorMessage === AuthError.InvalidPassword) {
        this.f.password.setErrors({ mustNotBeRejected: true });
      } else if (this.errorMessage !== '') {
        this.snackbarService.open(this.errorMessage, 'warn');
      }
      this.errorMessage = '';
    };
  }
}
