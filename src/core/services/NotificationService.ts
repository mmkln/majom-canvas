import { Subject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
}

// Central notification service
export const notifications$ = new Subject<Notification>();

/**
 * Trigger a new notification
 */
export function notify(message: string, type: NotificationType = 'info'): void {
  notifications$.next({ message, type });
}
