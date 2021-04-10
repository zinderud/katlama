import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import { environment } from '../../environments/environment';

import { MockUser, mockUser } from './auth.mock';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent implements OnInit {
  errorMessage = '';
  isUsableWithoutApi = environment.apiUrl === '';
  mockUser: MockUser = mockUser;

  /** Fake User to test app without running API */

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {}

  onErrorHappens(errorMessage: string): void {
    this.errorMessage = errorMessage;
    this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      this.errorMessage = '';
    }, 500);
  }
}
