import type { BootEvent, BootState } from './BootState.ts';

export function nextBootState(current: BootState, event: BootEvent): BootState {
  if (event === 'logout') return 'auth_required';

  switch (current) {
    case 'auth_required':
      if (event === 'session_found' || event === 'login_success') {
        return 'booting';
      }
      return 'auth_required';
    case 'booting':
      if (event === 'boot_succeeded') return 'ready';
      if (event === 'boot_failed') return 'boot_error';
      return 'booting';
    case 'ready':
      if (event === 'session_missing') return 'auth_required';
      return 'ready';
    case 'boot_error':
      if (
        event === 'retry' ||
        event === 'session_found' ||
        event === 'login_success'
      ) {
        return 'booting';
      }
      if (event === 'session_missing') return 'auth_required';
      return 'boot_error';
    default:
      return current;
  }
}
