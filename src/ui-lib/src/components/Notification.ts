import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import type { NotificationType } from '../services/NotificationService.ts';
import { createIcon, type IconName } from '../hud/icons.ts';

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

const NOTIFICATION_TONE: Record<
  NotificationType,
  {
    icon: IconName;
    iconClassName: string;
    progressClassName: string;
  }
> = {
  success: {
    icon: 'check-circle',
    iconClassName: 'text-emerald-600',
    progressClassName: 'bg-emerald-500',
  },
  error: {
    icon: 'x-mark',
    iconClassName: 'text-rose-600',
    progressClassName: 'bg-rose-500',
  },
  info: {
    icon: 'exclamation-circle',
    iconClassName: 'text-sky-600',
    progressClassName: 'bg-sky-500',
  },
};

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
    const dismiss = () => {
      if (this.timeoutId) clearTimeout(this.timeoutId);
      if (this.props.onDismiss) this.props.onDismiss();
      if (bar) {
        bar.style.animationPlayState = 'paused';
      }
      el.remove();
    };

    const dismissButton = el.querySelector<HTMLButtonElement>(
      '[data-toast-dismiss="true"]'
    );
    dismissButton?.addEventListener('click', dismiss);
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
      duration = 3000,
    } = this.props;
    const tone = NOTIFICATION_TONE[type];
    // Container
    const note = document.createElement('div');
    // Initial hidden state for animation
    const hiddenClasses =
      'translate-x-2 opacity-0 transition duration-200 ease-out motion-reduce:translate-x-0 motion-reduce:transition-none';
    const base =
      'pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 text-slate-700 shadow-[0_14px_32px_rgba(15,23,42,0.14)]';
    note.className = twMerge(base, className, hiddenClasses);

    // Progress bar
    const barWrap = document.createElement('div');
    barWrap.className = 'absolute bottom-0 left-0 h-1 w-full bg-slate-200/80';
    const bar = document.createElement('div');
    // Progress bar filler
    bar.className = twMerge('progress-bar h-full', tone.progressClassName);
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
    iconEl.className = twMerge(
      'mt-0.5 inline-flex shrink-0 items-center justify-center',
      tone.iconClassName
    );
    const icon = createIcon(tone.icon, { size: 18, strokeWidth: 1.9 });
    icon.setAttribute('aria-hidden', 'true');
    iconEl.appendChild(icon);
    // Message
    const msgEl = document.createElement('div');
    msgEl.className = 'min-w-0 flex-1 text-[13px] font-medium leading-[1.45]';
    msgEl.textContent = message;
    // Close button
    const btnEl = document.createElement('button');
    btnEl.type = 'button';
    btnEl.className =
      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-[background-color,color,box-shadow] duration-150 ease-out hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1';
    btnEl.setAttribute('data-toast-dismiss', 'true');
    btnEl.setAttribute('aria-label', 'Dismiss notification');
    const closeIcon = createIcon('x-mark', { size: 14, strokeWidth: 1.9 });
    closeIcon.setAttribute('aria-hidden', 'true');
    btnEl.appendChild(closeIcon);

    note.append(iconEl, msgEl, btnEl);
    return note;
  }
}
