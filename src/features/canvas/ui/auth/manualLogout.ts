import { notify } from '../../core/services/NotificationService.ts';
import { authFlowService } from './authFlowService.ts';

type PerformManualLogoutOptions = {
  logout: () => void;
  onAfterLogout?: () => void;
};

export function performManualLogout(options: PerformManualLogoutOptions): void {
  options.logout();
  notify('Logged out', 'info');
  options.onAfterLogout?.();
  authFlowService.requestLogout('manual');
}
