import { Subject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationMessage {
  message: string;
  type: NotificationType;
}

export const notifications$ = new Subject<NotificationMessage>();

export function notify(message: string, type: NotificationType = 'info'): void {
  notifications$.next({ message, type });
}
