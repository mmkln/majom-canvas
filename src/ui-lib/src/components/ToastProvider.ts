import { Subscription } from 'rxjs';
import {
  notifications$,
  Notification as NotificationData,
  NotificationType,
} from '../../../core/services/NotificationService.ts';
import { Notification } from './Notification.ts';

export interface ToastProviderOptions {
  parent?: HTMLElement;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration?: number;
  maxToasts?: number;
}

/**
 * Centralized Toast/Notification provider for UI-lib
 */
export class ToastProvider {
  private container: HTMLDivElement;
  private subscription: Subscription;
  private duration: number;
  private maxToasts: number;
  private queue: NotificationData[] = [];
  private activeCount = 0;

  constructor(options: ToastProviderOptions = {}) {
    const parent = options.parent ?? document.body;
    const position = options.position ?? 'top-right';
    this.duration = options.duration ?? 3000;
    this.maxToasts = (options as any).maxToasts ?? 3;
    this.container = document.createElement('div');
    // Position classes
    const posClasses: Record<string, string> = {
      'top-right': 'fixed top-4 right-4 flex flex-col space-y-2',
      'top-left': 'fixed top-4 left-4 flex flex-col space-y-2',
      'bottom-right': 'fixed bottom-4 right-4 flex flex-col-reverse space-y-2',
      'bottom-left': 'fixed bottom-4 left-4 flex flex-col-reverse space-y-2',
    };
    this.container.className = `${posClasses[position]} z-50`;
    parent.appendChild(this.container);

    // Subscribe to notifications with enqueue logic
    this.subscription = notifications$.subscribe((data) => this.enqueue(data));
  }

  /** Destroy provider and cleanup */
  public destroy(): void {
    this.subscription.unsubscribe();
    if (this.container.parentElement) {
      this.container.remove();
    }
  }

  /** Enqueue or display toast */
  private enqueue(data: NotificationData): void {
    const key = `${data.type}-${data.message}`;
    // Group duplicate: reset progress bar if exists
    const existing = this.container.querySelector(
      `[data-toast-key="${key}"]`
    ) as HTMLElement;
    if (existing) {
      const bar = existing.querySelector('.progress-bar') as HTMLElement;
      if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '100%';
        void bar.offsetWidth;
        bar.style.transition = `width linear ${this.duration}ms`;
        bar.style.width = '0%';
      }
      return;
    }
    if (this.activeCount < this.maxToasts) this.showToast(data, key);
    else this.queue.push(data);
  }

  /** Create and show a toast */
  private showToast(data: NotificationData, key: string): void {
    this.activeCount++;
    const container = this.container;
    const destroy = (): void => {
      this.activeCount--;
      if (this.queue.length) {
        const next = this.queue.shift()!;
        this.showToast(next, `${next.type}-${next.message}`);
      }
    };
    const toast = new Notification({
      message: data.message,
      type: data.type,
      duration: this.duration,
      onDismiss: destroy,
    });
    toast.render(container);
    const el = toast.getElement();
    if (el) el.setAttribute('data-toast-key', key);
  }
}
