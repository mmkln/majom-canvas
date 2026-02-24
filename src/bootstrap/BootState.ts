export type BootState = 'auth_required' | 'booting' | 'ready' | 'boot_error';

export type BootEvent =
  | 'app_start'
  | 'session_found'
  | 'session_missing'
  | 'login_success'
  | 'boot_succeeded'
  | 'boot_failed'
  | 'retry'
  | 'logout';
