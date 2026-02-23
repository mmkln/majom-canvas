import { LoginCredentials } from '../../majom-wrapper/interfaces/auth-interfaces.ts';
import {
  createHudInput,
  createHudTextButton,
  type HudTextButtonElement,
} from '../primitives/index.ts';
import type { LoginSubmitResult } from '../auth/AuthController.ts';

type LoginPageOptions = {
  title?: string;
  onSubmit: (credentials: LoginCredentials) => Promise<LoginSubmitResult>;
};

export class LoginPage {
  private readonly root: HTMLDivElement;
  private readonly usernameInput: HTMLInputElement;
  private readonly passwordInput: HTMLInputElement;
  private readonly usernameError: HTMLParagraphElement;
  private readonly generalError: HTMLParagraphElement;
  private readonly submitButton: HudTextButtonElement;
  private readonly togglePasswordButton: HTMLButtonElement;
  private usernameCache = '';

  constructor(private readonly options: LoginPageOptions) {
    const root = document.createElement('div');
    root.className =
      'fixed inset-0 z-[190] flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4 py-8';

    const shell = document.createElement('section');
    shell.className =
      'w-full max-w-sm rounded-2xl border border-slate-200/90 bg-white p-8';
    shell.setAttribute('aria-label', this.options.title ?? 'Login');

    const caption = document.createElement('p');
    caption.className =
      'mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400';
    caption.textContent = 'Majom Canvas';

    const heading = document.createElement('h1');
    heading.className = 'text-[30px] font-semibold leading-none tracking-tight text-slate-900';
    heading.textContent = this.options.title ?? 'Login';

    const form = document.createElement('form');
    form.className = 'mt-6 space-y-5';
    form.noValidate = true;

    const usernameWrap = document.createElement('div');
    usernameWrap.className = 'space-y-2';
    const usernameLabel = document.createElement('label');
    usernameLabel.className = 'block text-sm font-medium text-slate-600';
    usernameLabel.htmlFor = 'canvas-login-username';
    usernameLabel.textContent = 'Username';
    this.usernameInput = createHudInput({
      id: 'canvas-login-username',
      name: 'username',
      type: 'text',
      autoComplete: 'username',
      placeholder: 'Enter username',
      variant: 'default',
    });
    this.usernameError = document.createElement('p');
    this.usernameError.className = 'hidden text-xs font-medium text-rose-600';
    usernameWrap.append(usernameLabel, this.usernameInput, this.usernameError);

    const passwordWrap = document.createElement('div');
    passwordWrap.className = 'space-y-2';
    const passwordLabel = document.createElement('label');
    passwordLabel.className = 'block text-sm font-medium text-slate-600';
    passwordLabel.htmlFor = 'canvas-login-password';
    passwordLabel.textContent = 'Password';
    const passwordInputRow = document.createElement('div');
    passwordInputRow.className = 'relative';
    this.passwordInput = createHudInput({
      id: 'canvas-login-password',
      name: 'password',
      type: 'password',
      autoComplete: 'current-password',
      placeholder: 'Enter password',
      variant: 'default',
      className: 'pr-14',
    });
    this.togglePasswordButton = document.createElement('button');
    this.togglePasswordButton.type = 'button';
    this.togglePasswordButton.className =
      'absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-700';
    this.togglePasswordButton.textContent = 'Show';
    this.togglePasswordButton.addEventListener('click', () =>
      this.togglePasswordVisibility()
    );
    passwordInputRow.append(this.passwordInput, this.togglePasswordButton);
    passwordWrap.append(passwordLabel, passwordInputRow);

    this.generalError = document.createElement('p');
    this.generalError.className =
      'hidden rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700';
    this.generalError.setAttribute('aria-live', 'polite');

    this.submitButton = createHudTextButton({
      tone: 'primary',
      text: 'Login',
      loadingText: 'Logging in...',
      type: 'submit',
      className:
        'mt-1 h-11 w-full justify-center rounded-lg border border-slate-900 bg-slate-900 px-4 text-white hover:bg-slate-800 active:bg-slate-950 focus-visible:ring-slate-300',
    });

    this.usernameInput.addEventListener('input', () => {
      this.validateUsername();
      this.clearGeneralError();
    });
    this.passwordInput.addEventListener('input', () => this.clearGeneralError());

    form.addEventListener('submit', (event) => {
      void this.handleSubmit(event);
    });

    form.append(
      usernameWrap,
      passwordWrap,
      this.generalError,
      this.submitButton
    );
    shell.append(caption, heading, form);
    root.appendChild(shell);
    this.root = root;
  }

  public show(parent: HTMLElement = document.body): void {
    if (!this.root.isConnected) {
      parent.appendChild(this.root);
    }
    this.prefillCachedUsername();
    this.focusPrimaryField();
  }

  public hide(): void {
    if (!this.root.isConnected) return;
    this.root.remove();
  }

  public isVisible(): boolean {
    return this.root.isConnected;
  }

  public focusPrimaryField(): void {
    window.requestAnimationFrame(() => {
      if (!this.root.isConnected) return;
      if (this.usernameInput.value.trim().length === 0) {
        this.usernameInput.focus();
        return;
      }
      this.passwordInput.focus();
    });
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitButton.loading) return;

    const hasUsernameError = this.validateUsername();
    if (hasUsernameError) {
      if (hasUsernameError) {
        this.usernameInput.focus();
      }
      return;
    }

    this.submitButton.loading = true;
    this.clearGeneralError();

    const credentials: LoginCredentials = {
      username: this.usernameInput.value.trim(),
      password: this.passwordInput.value,
    };
    this.usernameCache = credentials.username;

    try {
      const result = await this.options.onSubmit(credentials);
      this.submitButton.loading = false;

      if (result.ok) {
        this.passwordInput.value = '';
        this.hide();
        return;
      }

      this.showGeneralError(result.message);
    } catch (error: unknown) {
      this.submitButton.loading = false;
      this.showGeneralError(
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.'
      );
    }
  }

  private togglePasswordVisibility(): void {
    const hidden = this.passwordInput.type === 'password';
    this.passwordInput.type = hidden ? 'text' : 'password';
    this.togglePasswordButton.textContent = hidden ? 'Hide' : 'Show';
  }

  private validateUsername(): boolean {
    const value = this.usernameInput.value.trim();
    if (!value) {
      return this.setFieldError(
        this.usernameInput,
        this.usernameError,
        'Username is required.'
      );
    }
    if (value.length < 3) {
      return this.setFieldError(
        this.usernameInput,
        this.usernameError,
        'Minimum 3 characters.'
      );
    }
    return this.setFieldError(this.usernameInput, this.usernameError, null);
  }

  private setFieldError(
    input: HTMLInputElement,
    errorEl: HTMLElement,
    message: string | null
  ): boolean {
    const hasError = Boolean(message);
    input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    errorEl.classList.toggle('hidden', !hasError);
    errorEl.textContent = message ?? '';
    return hasError;
  }

  private showGeneralError(message: string): void {
    this.generalError.textContent = message;
    this.generalError.classList.remove('hidden');
  }

  private clearGeneralError(): void {
    this.generalError.textContent = '';
    this.generalError.classList.add('hidden');
  }

  private prefillCachedUsername(): void {
    if (!this.usernameCache) return;
    if (this.usernameInput.value.trim().length > 0) return;
    this.usernameInput.value = this.usernameCache;
  }
}
