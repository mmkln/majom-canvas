import type { BootEvent, BootState } from './BootState.ts';

export function nextBootState(current: BootState, event: BootEvent): BootState {
  if (event === 'logout') return 'landing';

  switch (current) {
    case 'landing':
      if (event === 'session_found' || event === 'login_success') {
        return 'booting';
      }
      if (event === 'sign_in_requested') return 'login_required';
      return 'landing';
    case 'login_required':
      if (event === 'session_found' || event === 'login_success') {
        return 'booting';
      }
      if (event === 'login_cancelled' || event === 'session_missing') {
        return 'landing';
      }
      return 'login_required';
    case 'booting':
      if (event === 'boot_succeeded') return 'ready';
      if (event === 'boot_failed') return 'boot_error';
      if (event === 'session_missing') return 'landing';
      return 'booting';
    case 'ready':
      if (event === 'session_missing') return 'landing';
      if (event === 'sign_in_requested') return 'login_required';
      return 'ready';
    case 'boot_error':
      if (
        event === 'retry' ||
        event === 'session_found' ||
        event === 'login_success'
      ) {
        return 'booting';
      }
      if (event === 'session_missing') return 'landing';
      if (event === 'sign_in_requested') return 'login_required';
      return 'boot_error';
    default:
      return current;
  }
}
