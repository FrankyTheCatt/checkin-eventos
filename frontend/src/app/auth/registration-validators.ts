import { ValidatorFn } from '@angular/forms';

export const passwordBytes: ValidatorFn = (control) =>
  new TextEncoder().encode(control.value ?? '').length > 72 ? { passwordBytes: true } : null;

export const fullName: ValidatorFn = (control) =>
  (control.value ?? '').trim().length < 2 ? { fullName: true } : null;
