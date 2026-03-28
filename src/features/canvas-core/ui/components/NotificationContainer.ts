import { notifications$ } from '../../core/services/NotificationService.ts';
import { Notification } from '../../../../ui-lib/src/components/Notification.js';
import { Subscription } from 'rxjs';

// Container for in-app notifications
export class NotificationContainer {
  private container: HTMLDivElement;
  private subscription: Subscription | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className =
      'fixed top-20 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-3';
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscription = notifications$.subscribe(({ message, type }) => {
      const note = new Notification({
        message,
        type,
        onDismiss: () => note.getElement().remove(),
      });
      note.render(this.container);
    });
  }

  unmount(): void {
    this.subscription?.unsubscribe();
    if (this.container.parentElement) this.container.remove();
  }
}
