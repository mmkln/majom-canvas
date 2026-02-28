type LoadingScreenState = 'loading' | 'error';

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
`;
  document.head.appendChild(style);
}

export class LoadingScreen {
  private readonly root: HTMLDivElement;
  private readonly lineFill: HTMLDivElement;
  private readonly message: HTMLParagraphElement;
  private readonly actions: HTMLDivElement;
  private readonly retryButton: HTMLButtonElement;
  private retryHandler: (() => void) | null = null;
  private state: LoadingScreenState = 'loading';

  constructor() {
    ensureLoadingLineStyle();

    this.root = document.createElement('div');
    this.root.className =
      'fixed inset-0 z-[205] hidden items-center justify-center bg-[linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4';

    const content = document.createElement('section');
    content.className = 'flex w-full max-w-xs flex-col items-center';
    content.setAttribute('aria-label', 'Loading screen');

    const logo = document.createElement('img');
    logo.src = '/favicon.svg';
    logo.alt = 'Majom logo';
    logo.width = 40;
    logo.height = 40;
    logo.className = 'mb-5 h-10 w-10';

    const lineTrack = document.createElement('div');
    lineTrack.className =
      'relative h-1.5 w-52 overflow-hidden rounded-full bg-slate-200';

    this.lineFill = document.createElement('div');
    this.lineFill.className =
      'absolute left-0 top-0 h-full w-2/5 rounded-full bg-slate-700/85';
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
      'inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100';
    this.retryButton.textContent = 'Retry';
    this.actions.appendChild(this.retryButton);

    content.append(logo, lineTrack, this.message, this.actions);
    this.root.appendChild(content);
  }

  public showLoading(_message: string = 'Loading canvas...'): void {
    this.mount();
    this.setState('loading');
  }

  public showError(message: string, onRetry: () => void): void {
    this.mount();
    this.setState('error');
    this.message.textContent = message;
    this.bindRetry(onRetry);
  }

  public hide(): void {
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
}
