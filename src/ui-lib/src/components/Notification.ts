import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { NotificationType } from '../../../core/services/NotificationService.ts';

// Inject keyframes for toast progress bar animation
const PROGRESS_STYLE_ID = 'ui-lib-toast-progress-style';
if (
  typeof document !== 'undefined' &&
  !document.getElementById(PROGRESS_STYLE_ID)
) {
  const style = document.createElement('style');
  style.id = PROGRESS_STYLE_ID;
  style.textContent = `
@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}`;
  document.head.appendChild(style);
}

export interface NotificationProps {
  message: string;
  type?: NotificationType;
  className?: string;
  duration?: number;
  onDismiss?: () => void;
}

// SVG icons per type
const ICON_SVGS: Record<NotificationType, string> = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01"/><circle cx="12" cy="12" r="9"/></svg>`,
};
const CLOSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;

export class Notification extends Component<NotificationProps> {
  private timeoutId: number | null = null;
  private remaining: number;
  private startTime: number;
  constructor(props: NotificationProps) {
    super(props);
    this.remaining = props.duration ?? 3000;
    this.startTime = 0;
  }
  /** Render and setup auto-dismiss with pause/resume */
  public render(container: HTMLElement): void {
    super.render(container);
    const el = this.getElement();
    if (!el) return;
    // Trigger CSS entry animation
    requestAnimationFrame(() =>
      el.classList.remove('opacity-0', 'translate-x-2')
    );
    // Setup progress bar element
    const bar = el.querySelector<HTMLElement>('.progress-bar');
    // Initialize timing
    this.startTime = Date.now();
    // Start CSS animation
    if (bar) bar.style.animationPlayState = 'running';
    // Auto-dismiss handler
    const dismiss = () => {
      if (this.props.onDismiss) this.props.onDismiss();
      // Cleanup
      el.remove();
      if (bar) {
        bar.style.animationPlayState = 'paused';
      }
      if (this.timeoutId) clearTimeout(this.timeoutId);
    };
    // Schedule auto-dismiss
    this.timeoutId = window.setTimeout(dismiss, this.remaining);
    // Pause/resume on hover
    el.addEventListener('mouseenter', () => {
      if (this.timeoutId) clearTimeout(this.timeoutId);
      if (bar) bar.style.animationPlayState = 'paused';
      this.remaining -= Date.now() - this.startTime;
    });
    el.addEventListener('mouseleave', () => {
      this.startTime = Date.now();
      if (bar) bar.style.animationPlayState = 'running';
      this.timeoutId = window.setTimeout(dismiss, this.remaining);
    });
  }

  protected createElement(): HTMLElement {
    const {
      message,
      type = 'info',
      className = '',
      onDismiss,
      duration = 3000,
    } = this.props;
    // Container
    const note = document.createElement('div');
    // Initial hidden state for animation
    const hiddenClasses =
      'opacity-0 translate-x-2 transition ease-out duration-300';
    const base =
      'flex items-start justify-between p-4 rounded-md shadow-md transition relative overflow-hidden';
    const variant = {
      success: 'bg-green-50 text-green-800',
      error: 'bg-red-50 text-red-800',
      info: 'bg-blue-50 text-blue-800',
    }[type];
    note.className = twMerge(base, variant, className, hiddenClasses);

    // Progress bar
    const barWrap = document.createElement('div');
    barWrap.className = 'absolute bottom-0 left-0 w-full h-1 bg-gray-200';
    const bar = document.createElement('div');
    // Progress bar filler
    bar.className = 'h-full bg-current progress-bar';
    bar.style.width = '100%';
    // Use CSS animation for progress
    bar.style.animationName = 'toast-progress';
    bar.style.animationDuration = `${duration}ms`;
    bar.style.animationTimingFunction = 'linear';
    bar.style.animationFillMode = 'forwards';
    bar.style.animationPlayState = 'paused';
    barWrap.appendChild(bar);
    note.appendChild(barWrap);

    // Icon
    const iconEl = document.createElement('span');
    iconEl.innerHTML = ICON_SVGS[type];
    // Message
    const msgEl = document.createElement('div');
    msgEl.className = 'ml-3 flex-1 text-sm font-medium';
    msgEl.textContent = message;
    // Close button
    const btnEl = document.createElement('button');
    btnEl.type = 'button';
    btnEl.className =
      'ml-4 p-1 rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary';
    btnEl.innerHTML = CLOSE_SVG;
    if (onDismiss) btnEl.addEventListener('click', onDismiss);

    note.append(iconEl, msgEl, btnEl);
    return note;
  }
}
