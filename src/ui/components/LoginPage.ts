import { LoginCredentials } from '../../majom-wrapper/interfaces/auth-interfaces.ts';
import {
  createHudField,
  createHudFormMessage,
  createHudInput,
  createHudTextButton,
  type HudFormMessage,
  type HudTextButtonElement,
} from '../primitives/index.ts';
import {
  HUD_PAGE_EYEBROW_CLASS,
  HUD_PAGE_TITLE_CLASS,
} from '../primitives/hudClassNames.ts';
import type { LoginSubmitResult } from '../auth/AuthController.ts';

type LoginPageOptions = {
  title?: string;
  onSubmit: (credentials: LoginCredentials) => Promise<LoginSubmitResult>;
};

export class LoginPage {
  private readonly root: HTMLDivElement;
  private readonly usernameInput: HTMLInputElement;
  private readonly passwordInput: HTMLInputElement;
  private readonly usernameField: ReturnType<typeof createHudField>;
  private readonly passwordField: ReturnType<typeof createHudField>;
  private readonly generalError: HudFormMessage;
  private readonly submitButton: HudTextButtonElement;
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
    caption.className = HUD_PAGE_EYEBROW_CLASS;
    caption.textContent = 'Majom Canvas';

    const heading = document.createElement('h1');
    heading.className = HUD_PAGE_TITLE_CLASS;
    heading.textContent = this.options.title ?? 'Welcome to Majom';

    const description = document.createElement('p');
    description.className = 'mt-2 text-sm text-slate-500';
    description.textContent = 'The single place to organize the whole life.';

    const form = document.createElement('form');
    form.className = 'mt-6 space-y-5';
    form.noValidate = true;

    const usernameControl = createHudInput({
      kind: 'text',
      id: 'canvas-login-username',
      name: 'username',
      autoComplete: 'username',
      placeholder: 'Enter username',
      variant: 'default',
    });
    this.usernameInput = usernameControl.input;
    this.usernameField = createHudField({
      label: 'Username',
      control: usernameControl.element,
    });

    const passwordControl = createHudInput({
      kind: 'password',
      id: 'canvas-login-password',
      name: 'password',
      autoComplete: 'current-password',
      placeholder: 'Enter password',
      variant: 'default',
    });
    this.passwordInput = passwordControl.input;
    this.passwordField = createHudField({
      label: 'Password',
      control: passwordControl.element,
    });

    this.generalError = createHudFormMessage({
      tone: 'error',
      ariaLive: 'polite',
    });

    this.submitButton = createHudTextButton({
      tone: 'primary',
      size: 'lg',
      fullWidth: true,
      text: 'Login',
      loadingText: 'Logging in...',
      type: 'submit',
      className: 'mt-1',
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
      this.usernameField.element,
      this.passwordField.element,
      this.generalError.element,
      this.submitButton
    );

    const accessHint = document.createElement('p');
    accessHint.className = 'mt-4 text-xs text-slate-500';
    accessHint.textContent =
      'Need an account? Contact the administrator to get access.';

    shell.append(caption, heading, description, form, accessHint);
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

  private validateUsername(): boolean {
    const value = this.usernameInput.value.trim();
    if (!value) {
      this.usernameField.setState({
        invalid: true,
        error: 'Username is required.',
      });
      return true;
    }
    if (value.length < 3) {
      this.usernameField.setState({
        invalid: true,
        error: 'Minimum 3 characters.',
      });
      return true;
    }
    this.usernameField.setState({ invalid: false, error: undefined });
    return false;
  }

  private showGeneralError(message: string): void {
    this.generalError.show(message, 'error');
  }

  private clearGeneralError(): void {
    this.generalError.clear();
  }

  private prefillCachedUsername(): void {
    if (!this.usernameCache) return;
    if (this.usernameInput.value.trim().length > 0) return;
    this.usernameInput.value = this.usernameCache;
  }
}
