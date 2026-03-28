import type { LoginCredentials } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { createFormValidator } from './createFormValidator.ts';
import { required } from './rules.ts';
import type { FieldErrors, ValidationResult } from './types.ts';

export type LoginCredentialsValidationMessages = {
  usernameRequired: string;
  passwordRequired: string;
};

const DEFAULT_LOGIN_CREDENTIALS_VALIDATION_MESSAGES: LoginCredentialsValidationMessages =
  {
    usernameRequired: 'Username is required.',
    passwordRequired: 'Password is required.',
  };

function createLoginCredentialsValidator(
  messages: LoginCredentialsValidationMessages = DEFAULT_LOGIN_CREDENTIALS_VALIDATION_MESSAGES
) {
  return createFormValidator<LoginCredentials>({
    fields: {
      username: [
        required<LoginCredentials>(messages.usernameRequired, { trim: true }),
      ],
      password: [required<LoginCredentials>(messages.passwordRequired)],
    },
  });
}

export function normalizeLoginCredentials(
  values: LoginCredentials
): LoginCredentials {
  return {
    username: values.username.trim(),
    password: values.password,
  };
}

export function validateLoginCredentials(
  values: LoginCredentials,
  messages?: LoginCredentialsValidationMessages
): ValidationResult<LoginCredentials> {
  return createLoginCredentialsValidator(messages).validate(values);
}

export function validateLoginCredentialField(
  field: keyof LoginCredentials,
  values: LoginCredentials,
  messages?: LoginCredentialsValidationMessages
): string | null {
  return createLoginCredentialsValidator(messages).validateField(field, values);
}

export type LoginCredentialsFieldErrors = FieldErrors<LoginCredentials>;
