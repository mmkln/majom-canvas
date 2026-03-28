import { describe, expect, it } from 'vitest';
import {
  normalizeAccountDetails,
  validateAccountDetails,
  validateAccountDetailsField,
} from './accountDetailsValidator.ts';

const messages = {
  usernameRequired: 'Username is required.',
  emailRequired: 'Email is required.',
  emailInvalid: 'Enter a valid email address.',
};

describe('accountDetailsValidator', () => {
  it('normalizes string fields by trimming them', () => {
    expect(
      normalizeAccountDetails({
        firstName: '  Mila ',
        lastName: ' Stone  ',
        username: ' mila-user ',
        email: ' user@example.com ',
      })
    ).toEqual({
      firstName: 'Mila',
      lastName: 'Stone',
      username: 'mila-user',
      email: 'user@example.com',
    });
  });

  it('requires a username', () => {
    const validation = validateAccountDetails(
      {
        firstName: '',
        lastName: '',
        username: '   ',
        email: 'user@example.com',
      },
      messages
    );

    expect(validation.valid).toBe(false);
    expect(validation.fieldErrors.username).toBe(messages.usernameRequired);
  });

  it('requires an email and validates its format', () => {
    expect(
      validateAccountDetailsField(
        'email',
        {
          firstName: '',
          lastName: '',
          username: 'mila',
          email: '',
        },
        messages
      )
    ).toBe(messages.emailRequired);

    expect(
      validateAccountDetailsField(
        'email',
        {
          firstName: '',
          lastName: '',
          username: 'mila',
          email: 'invalid-email',
        },
        messages
      )
    ).toBe(messages.emailInvalid);
  });
});
