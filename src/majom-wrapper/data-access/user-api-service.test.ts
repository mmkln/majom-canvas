// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { toUserProfileLanguageCode } from './user-api-service.ts';

describe('UserApiService language adapter', () => {
  it('maps the app ukrainian locale to the backend profile language code', () => {
    expect(toUserProfileLanguageCode('uk')).toBe('ua');
  });

  it('keeps english unchanged', () => {
    expect(toUserProfileLanguageCode('en')).toBe('en');
  });

  it('passes through already normalized backend language codes', () => {
    expect(toUserProfileLanguageCode('ua')).toBe('ua');
  });
});
