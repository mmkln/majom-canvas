import { notifications$ } from '../../core/services/NotificationService.ts';
import { Notification } from '../../ui-lib/src/components/Notification.js';
import { Subscription } from 'rxjs';

// Container for in-app notifications
export class NotificationContainer {
  private container: HTMLDivElement;
  private subscription: Subscription | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className =
      'fixed top-4 right-4 flex flex-col space-y-2 z-50';
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
      setTimeout(() => note.getElement().remove(), 3000);
    });
  }

  unmount(): void {
    this.subscription?.unsubscribe();
    if (this.container.parentElement) this.container.remove();
  }
}
