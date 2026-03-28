import { createFormValidator } from './createFormValidator.ts';
import { email, required } from './rules.ts';
import type { FieldErrors, ValidationResult } from './types.ts';

export type AccountDetailsValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

export type AccountDetailsValidationMessages = {
  usernameRequired: string;
  emailRequired: string;
  emailInvalid: string;
};

const DEFAULT_ACCOUNT_DETAILS_VALIDATION_MESSAGES: AccountDetailsValidationMessages =
  {
    usernameRequired: 'Username is required.',
    emailRequired: 'Email is required.',
    emailInvalid: 'Enter a valid email address.',
  };

function createAccountDetailsValidator(
  messages: AccountDetailsValidationMessages = DEFAULT_ACCOUNT_DETAILS_VALIDATION_MESSAGES
) {
  return createFormValidator<AccountDetailsValues>({
    fields: {
      username: [
        required<AccountDetailsValues>(messages.usernameRequired, { trim: true }),
      ],
      email: [
        required<AccountDetailsValues>(messages.emailRequired, { trim: true }),
        email<AccountDetailsValues>(messages.emailInvalid),
      ],
    },
  });
}

export function normalizeAccountDetails(
  values: AccountDetailsValues
): AccountDetailsValues {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    username: values.username.trim(),
    email: values.email.trim(),
  };
}

export function validateAccountDetails(
  values: AccountDetailsValues,
  messages?: AccountDetailsValidationMessages
): ValidationResult<AccountDetailsValues> {
  return createAccountDetailsValidator(messages).validate(values);
}

export function validateAccountDetailsField(
  field: keyof AccountDetailsValues,
  values: AccountDetailsValues,
  messages?: AccountDetailsValidationMessages
): string | null {
  return createAccountDetailsValidator(messages).validateField(field, values);
}

export type AccountDetailsFieldErrors = FieldErrors<AccountDetailsValues>;
