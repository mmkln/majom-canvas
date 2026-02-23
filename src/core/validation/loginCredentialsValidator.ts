import type { LoginCredentials } from '../../majom-wrapper/interfaces/auth-interfaces.ts';
import { createFormValidator } from './createFormValidator.ts';
import { minLength, required } from './rules.ts';
import type { FieldErrors, ValidationResult } from './types.ts';

const validator = createFormValidator<LoginCredentials>({
  fields: {
    username: [
      required<LoginCredentials>('Username is required.', { trim: true }),
    ],
    password: [required<LoginCredentials>('Password is required.')],
  },
});

export function normalizeLoginCredentials(
  values: LoginCredentials
): LoginCredentials {
  return {
    username: values.username.trim(),
    password: values.password,
  };
}

export function validateLoginCredentials(
  values: LoginCredentials
): ValidationResult<LoginCredentials> {
  return validator.validate(values);
}

export function validateLoginCredentialField(
  field: keyof LoginCredentials,
  values: LoginCredentials
): string | null {
  return validator.validateField(field, values);
}

export type LoginCredentialsFieldErrors = FieldErrors<LoginCredentials>;
