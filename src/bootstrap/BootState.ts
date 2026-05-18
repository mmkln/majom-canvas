export type BootState =
  | 'checking_session'
  | 'landing'
  | 'login_required'
  | 'booting'
  | 'ready'
  | 'boot_error';

export type BootEvent =
  | 'app_start'
  | 'session_found'
  | 'session_missing'
  | 'session_restore_failed'
  | 'sign_in_requested'
  | 'login_cancelled'
  | 'login_success'
  | 'boot_succeeded'
  | 'boot_failed'
  | 'retry'
  | 'logout';
