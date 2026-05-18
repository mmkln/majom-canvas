import { describe, expect, it } from 'vitest';
import { nextBootState } from './BootStateMachine.ts';

describe('BootStateMachine public entry flow', () => {
  it('does not expose the public landing before the session check resolves', () => {
    expect(nextBootState('checking_session', 'app_start')).toBe(
      'checking_session'
    );
    expect(nextBootState('checking_session', 'session_found')).toBe('booting');
    expect(nextBootState('checking_session', 'session_missing')).toBe(
      'landing'
    );
  });

  it('keeps unauthenticated startup on the public landing state', () => {
    expect(nextBootState('landing', 'app_start')).toBe('landing');
    expect(nextBootState('landing', 'session_missing')).toBe('landing');
  });

  it('opens login as an internal SPA state without changing the public entry', () => {
    expect(nextBootState('landing', 'sign_in_requested')).toBe(
      'login_required'
    );
    expect(nextBootState('ready', 'sign_in_requested')).toBe('login_required');
    expect(nextBootState('login_required', 'login_cancelled')).toBe('landing');
    expect(nextBootState('login_required', 'session_missing')).toBe('landing');
  });

  it('boots the private workspace only after an existing or successful session', () => {
    expect(nextBootState('landing', 'session_found')).toBe('booting');
    expect(nextBootState('login_required', 'login_success')).toBe('booting');
    expect(nextBootState('ready', 'session_missing')).toBe('landing');
  });

  it('returns to the public landing when stored session restore fails', () => {
    expect(nextBootState('booting', 'session_restore_failed')).toBe('landing');
    expect(nextBootState('ready', 'session_restore_failed')).toBe('landing');
  });
});
