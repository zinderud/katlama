import { FormGroup } from '@angular/forms';

// tslint:disable-next-line: only-arrow-functions
export function mustMatchValidator(
  controlName: string,
  matchingControlName: string,
): (formGroup: FormGroup) => void {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];
    if (matchingControl.errors !== null && !matchingControl.errors.mustMatch) {
      return;
    }
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
    } else {
      // tslint:disable-next-line: no-null-keyword
      matchingControl.setErrors(null);
    }

    return;
  };
}
