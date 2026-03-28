import { GLOBAL_APP_SIDEBAR_OFFSET_CSS_VALUE } from '../../../../bootstrap/GlobalAppHeader.ts';
import { type I18nService } from '../../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';

type LoadingScreenState = 'loading' | 'error';
type LoadingScreenMessageResolver = (i18n: I18nService) => string;
type LoadingScreenOptions = {
  runtime?: AppRuntime;
};

const LOADING_LINE_STYLE_ID = 'majom-loading-line-style';

function ensureLoadingLineStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(LOADING_LINE_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = LOADING_LINE_STYLE_ID;
  style.textContent = `
@keyframes majom-loading-slide {
  0% { transform: translateX(-140%); }
  100% { transform: translateX(260%); }
}

@media (prefers-reduced-motion: reduce) {
  .majom-loading-line-fill {
    animation: none !important;
    transform: translateX(0) !important;
    width: 100% !important;
  }
}
`;
  document.head.appendChild(style);
}

export class LoadingScreen {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly root: HTMLDivElement;
  private readonly content: HTMLElement;
  private readonly lineFill: HTMLDivElement;
  private readonly message: HTMLParagraphElement;
  private readonly actions: HTMLDivElement;
  private readonly retryButton: HTMLButtonElement;
  private retryHandler: (() => void) | null = null;
  private state: LoadingScreenState = 'loading';
  private disposeRuntimeSubscription: (() => void) | null = null;
  private messageResolver: LoadingScreenMessageResolver = (i18n) =>
    i18n.t('loading.canvas');

  constructor(options: LoadingScreenOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.i18n = this.runtime.i18n;
    ensureLoadingLineStyle();

    this.root = document.createElement('div');
    this.root.className =
      'fixed inset-0 z-[205] hidden items-center justify-center bg-[linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]';
    this.root.style.left = GLOBAL_APP_SIDEBAR_OFFSET_CSS_VALUE;

    const content = document.createElement('section');
    content.className = 'flex w-full max-w-xs flex-col items-center';
    content.setAttribute('aria-label', this.i18n.t('loading.screenAria'));

    const logo = document.createElement('img');
    logo.src = '/favicon.svg';
    logo.alt = 'Majom logo';
    logo.width = 40;
    logo.height = 40;
    logo.className = 'mb-5 h-10 w-10';

    const lineTrack = document.createElement('div');
    lineTrack.className =
      'relative h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-slate-200';

    this.lineFill = document.createElement('div');
    this.lineFill.className =
      'majom-loading-line-fill absolute left-0 top-0 h-full w-2/5 rounded-full bg-slate-700/85';
    this.lineFill.style.animation = 'majom-loading-slide 1.05s linear infinite';
    lineTrack.appendChild(this.lineFill);

    this.message = document.createElement('p');
    this.message.className =
      'mt-3 hidden text-center text-xs leading-5 text-rose-700';

    this.actions = document.createElement('div');
    this.actions.className = 'mt-2 hidden';

    this.retryButton = document.createElement('button');
    this.retryButton.type = 'button';
    this.retryButton.className =
      'inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100';
    this.retryButton.textContent = this.i18n.t('common.retry');
    this.actions.appendChild(this.retryButton);

    content.append(logo, lineTrack, this.message, this.actions);
    this.root.appendChild(content);
    this.content = content;
  }

  public showLoading(
    messageResolver: LoadingScreenMessageResolver = (i18n) =>
      i18n.t('loading.canvas')
  ): void {
    this.messageResolver = messageResolver;
    this.mount();
    this.setState('loading');
    this.refreshTranslations();
  }

  public showError(
    messageResolver: LoadingScreenMessageResolver,
    onRetry: () => void
  ): void {
    this.messageResolver = messageResolver;
    this.mount();
    this.setState('error');
    this.bindRetry(onRetry);
    this.refreshTranslations();
  }

  public hide(): void {
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.unbindRetry();
    this.root.classList.add('hidden');
    this.root.classList.remove('flex');
  }

  public isVisible(): boolean {
    return this.root.classList.contains('flex');
  }

  private setState(state: LoadingScreenState): void {
    this.state = state;
    const loading = this.state === 'loading';

    if (loading) {
      this.lineFill.classList.remove('bg-rose-600/85');
      this.lineFill.classList.add('bg-slate-700/85');
      this.lineFill.style.animation =
        'majom-loading-slide 1.05s linear infinite';
    } else {
      this.lineFill.classList.remove('bg-slate-700/85');
      this.lineFill.classList.add('bg-rose-600/85');
      this.lineFill.style.animation = 'none';
      this.lineFill.style.transform = 'translateX(0)';
      this.lineFill.style.width = '100%';
    }

    if (loading) {
      this.lineFill.style.width = '40%';
    }

    this.message.classList.toggle('hidden', loading);
    this.actions.classList.toggle('hidden', loading);
    this.actions.classList.toggle('block', !loading);
  }

  private mount(parent: HTMLElement = document.body): void {
    if (!this.root.isConnected) {
      parent.appendChild(this.root);
    }
    if (!this.disposeRuntimeSubscription) {
      this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
        this.refreshTranslations();
      }, { emitCurrent: true });
    }
    this.root.classList.remove('hidden');
    this.root.classList.add('flex');
  }

  private bindRetry(handler: () => void): void {
    this.unbindRetry();
    this.retryHandler = handler;
    this.retryButton.addEventListener('click', this.retryHandler);
  }

  private unbindRetry(): void {
    if (!this.retryHandler) return;
    this.retryButton.removeEventListener('click', this.retryHandler);
    this.retryHandler = null;
  }

  private refreshTranslations(): void {
    const message = this.messageResolver(this.i18n);
    this.content.setAttribute('aria-label', this.i18n.t('loading.screenAria'));
    this.retryButton.textContent = this.i18n.t('common.retry');
    this.root.setAttribute('aria-label', message);
    this.message.textContent = this.state === 'error' ? message : '';
  }
}
