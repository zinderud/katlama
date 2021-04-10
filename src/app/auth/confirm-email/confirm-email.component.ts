import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';

import { Account } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { AuthError } from '../auth.model';
import { AuthService } from '../auth.service';
import { ConfirmEmailDialogComponent } from '../confirm-email-dialog/confirm-email-dialog.component';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmailComponent implements OnInit, OnDestroy {
  isLoading = false;
  isProcessing = false;
  isAccountAlreadyConfirmed = false;
  token: string | undefined = undefined;
  account: Account | undefined = undefined;
  private readonly isDestroyed$ = new Subject<boolean>();

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.userService.account$
      .pipe(takeUntil(this.isDestroyed$))
      .subscribe((account) => {
        this.isAccountAlreadyConfirmed = account?.isConfirmed ?? false;

        this.token =
          this.activatedRoute.snapshot.paramMap.get('token') ?? undefined;

        return this.token === undefined
          ? undefined
          : this.verifyToken(this.token);
      })
      .unsubscribe();
  }

  ngOnDestroy(): void {
    this.isDestroyed$.next(true);
    this.isDestroyed$.complete();
  }

  onRequestConfirmEmail(): Subscription {
    this.isProcessing = true;

    return this.userService.account$
      .pipe(
        switchMap((account) =>
          this.authService.resendConfirmationEmail$(
            (account as Account)?.email,
          ),
        ),
        switchMap((res) =>
          this.dialog.open(ConfirmEmailDialogComponent).afterClosed(),
        ),
        takeUntil(this.isDestroyed$),
      )
      .subscribe((afterClosed) => this.router.navigate(['/']));
  }

  private verifyToken(token: string): Subscription {
    this.isAccountAlreadyConfirmed = false;
    this.isLoading = true;

    return this.authService
      .confirmEmail$(token)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }),
        takeUntil(this.isDestroyed$),
      )
      .subscribe(
        (loggedInUser) => {
          this.account = loggedInUser.account;
          this.changeDetectorRef.detectChanges();
        },
        (err) => {
          if ((err as Error)?.message === AuthError.EmailConfirmed) {
            this.isAccountAlreadyConfirmed = true;
            this.changeDetectorRef.detectChanges();
          }
        },
      );
  }
}
