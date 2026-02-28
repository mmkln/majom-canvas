import { LoginCredentials } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';
import {
  normalizeLoginCredentials,
  validateLoginCredentialField,
  validateLoginCredentials,
  type LoginCredentialsFieldErrors,
} from '../../core/validation/loginCredentialsValidator.ts';
import {
  createField,
  createFormMessage,
  createInput,
  createTextButton,
  type FormMessage,
  type TextButtonElement,
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
  private readonly usernameField: ReturnType<typeof createField>;
  private readonly passwordField: ReturnType<typeof createField>;
  private readonly generalError: FormMessage;
  private readonly submitButton: TextButtonElement;
  private usernameCache = '';

  constructor(private readonly options: LoginPageOptions) {
    const root = document.createElement('div');
    root.className =
      'fixed inset-0 z-[190] flex items-center justify-center bg-[radial-gradient(circle_at_16%_18%,rgba(14,165,233,0.03),transparent_41%),radial-gradient(circle_at_84%_82%,rgba(249,115,22,0.02),transparent_43%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 py-8';

    const shell = document.createElement('section');
    shell.className =
      'w-full max-w-[26rem] rounded-2xl border border-slate-200/90 bg-white/95 px-7 py-7 sm:px-8 sm:py-8';
    shell.setAttribute('aria-label', this.options.title ?? 'Login');

    const header = document.createElement('div');
    header.className = 'mb-7 flex flex-col items-center text-center';

    const logo = document.createElement('img');
    logo.src = '/favicon.svg';
    logo.alt = 'Majom logo';
    logo.width = 48;
    logo.height = 48;
    logo.className = 'mb-3 h-12 w-12';

    const heading = document.createElement('h1');
    heading.className =
      'text-[25px] font-semibold leading-[1.1] tracking-tight text-slate-900';
    heading.textContent = this.options.title ?? 'Welcome back';

    const caption = document.createElement('p');
    caption.className = 'mt-1 text-sm leading-5 text-slate-500';
    caption.textContent = 'Sign in to Majom Canvas';

    header.append(logo, heading, caption);

    const form = document.createElement('form');
    form.className = 'space-y-0';
    form.noValidate = true;

    const usernameControl = createInput({
      kind: 'text',
      id: 'canvas-login-username',
      name: 'username',
      autoComplete: 'username',
      placeholder: 'Enter username',
      variant: 'default',
    });
    this.usernameInput = usernameControl.input;
    this.usernameField = createField({
      label: 'Username',
      control: usernameControl.element,
    });

    const passwordControl = createInput({
      kind: 'password',
      id: 'canvas-login-password',
      name: 'password',
      autoComplete: 'current-password',
      placeholder: 'Enter password',
      variant: 'default',
    });
    this.passwordInput = passwordControl.input;
    this.passwordField = createField({
      label: 'Password',
      control: passwordControl.element,
    });

    this.generalError = createFormMessage({
      tone: 'error',
      ariaLive: 'polite',
      className: 'mt-1 mb-2',
    });

    this.submitButton = createTextButton({
      tone: 'primary',
      size: 'lg',
      fullWidth: true,
      text: 'Sign in',
      loadingText: 'Logging in...',
      type: 'submit',
      className: 'mt-2',
    });

    this.usernameInput.addEventListener('input', () => {
      this.clearGeneralError();
      this.validateField('username');
    });
    this.passwordInput.addEventListener('input', () => {
      this.clearGeneralError();
      this.validateField('password');
    });

    form.addEventListener('submit', (event) => {
      void this.handleSubmit(event);
    });

    form.append(
      this.usernameField.element,
      this.passwordField.element,
      this.generalError.element,
      this.submitButton
    );

    shell.append(header, form);
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

    const credentials = this.getCredentialsValues();
    const validation = validateLoginCredentials(credentials);
    this.applyFieldErrors({
      username: validation.fieldErrors.username,
      password: validation.fieldErrors.password,
    });
    if (!validation.valid) {
      if (validation.fieldErrors.username) {
        this.usernameInput.focus();
      } else if (validation.fieldErrors.password) {
        this.passwordInput.focus();
      }
      return;
    }

    this.submitButton.loading = true;
    this.clearGeneralError();

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

  private showGeneralError(message: string): void {
    this.generalError.show(message, 'error');
  }

  private getCredentialsValues(): LoginCredentials {
    return normalizeLoginCredentials({
      username: this.usernameInput.value,
      password: this.passwordInput.value,
    });
  }

  private validateField(field: keyof LoginCredentials): void {
    const values = this.getCredentialsValues();
    const error = validateLoginCredentialField(field, values);
    this.applyFieldErrors({
      [field]: error ?? undefined,
    } as LoginCredentialsFieldErrors);
  }

  private applyFieldErrors(errors: LoginCredentialsFieldErrors): void {
    if (Object.prototype.hasOwnProperty.call(errors, 'username')) {
      this.usernameField.setState({
        invalid: Boolean(errors.username),
        error: errors.username,
      });
    }
    if (Object.prototype.hasOwnProperty.call(errors, 'password')) {
      this.passwordField.setState({
        invalid: Boolean(errors.password),
        error: errors.password,
      });
    }
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
