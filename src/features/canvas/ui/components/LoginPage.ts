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
  private readonly viewportResizeHandler: () => void;
  private viewportListenersBound = false;
  private usernameCache = '';

  constructor(private readonly options: LoginPageOptions) {
    const root = document.createElement('div');
    root.className =
      'fixed inset-0 z-[190] flex items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_16%_18%,rgba(14,165,233,0.03),transparent_41%),radial-gradient(circle_at_84%_82%,rgba(249,115,22,0.02),transparent_43%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]';

    const shell = document.createElement('section');
    shell.className =
      'w-full max-w-[26rem] rounded-2xl border border-slate-200/90 bg-white/95 px-5 py-6 sm:px-8 sm:py-8';
    shell.setAttribute('aria-label', this.options.title ?? 'Login');

    const header = document.createElement('div');
    header.className = 'mb-8 flex flex-col items-center text-center';

    const logo = document.createElement('img');
    logo.src = '/favicon.svg';
    logo.alt = 'Majom logo';
    logo.width = 48;
    logo.height = 48;
    logo.className = 'mb-3 h-10 w-10 sm:h-12 sm:w-12';

    const heading = document.createElement('h1');
    heading.className =
      'text-[22px] font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-[25px]';
    heading.textContent = this.options.title ?? 'Welcome back';

    const caption = document.createElement('p');
    caption.className = 'mt-2 text-sm leading-5 text-slate-600';
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
      placeholder: 'Username',
      variant: 'default',
      inputClassName: 'text-base sm:text-sm',
    });
    this.usernameInput = usernameControl.input;
    this.usernameInput.autocapitalize = 'none';
    this.usernameInput.spellcheck = false;
    this.usernameInput.setAttribute('autocorrect', 'off');
    this.usernameInput.setAttribute('enterkeyhint', 'next');
    this.usernameField = createField({
      label: 'Username',
      control: usernameControl.element,
      className: 'mb-0',
    });

    const passwordControl = createInput({
      kind: 'password',
      id: 'canvas-login-password',
      name: 'password',
      autoComplete: 'current-password',
      placeholder: 'Password',
      variant: 'default',
      inputClassName: 'text-base sm:text-sm',
    });
    this.passwordInput = passwordControl.input;
    this.passwordInput.autocapitalize = 'none';
    this.passwordInput.setAttribute('autocorrect', 'off');
    this.passwordInput.setAttribute('enterkeyhint', 'go');
    this.passwordField = createField({
      label: 'Password',
      control: passwordControl.element,
      className: 'mb-0',
    });

    this.generalError = createFormMessage({
      tone: 'error',
      ariaLive: 'polite',
      className: 'w-full',
    });

    this.submitButton = createTextButton({
      tone: 'primary',
      size: 'lg',
      fullWidth: true,
      text: 'Sign in',
      loadingText: 'Logging in...',
      type: 'submit',
    });

    this.usernameInput.addEventListener('input', () => {
      this.clearGeneralError();
      this.validateField('username');
    });
    this.usernameInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      this.passwordInput.focus();
    });
    this.passwordInput.addEventListener('input', () => {
      this.clearGeneralError();
      this.validateField('password');
    });

    form.addEventListener('submit', (event) => {
      void this.handleSubmit(event);
    });

    const errorSlot = document.createElement('div');
    errorSlot.className = 'min-h-[2.75rem]';
    errorSlot.appendChild(this.generalError.element);

    form.append(
      this.usernameField.element,
      this.passwordField.element,
      errorSlot,
      this.submitButton
    );

    shell.append(header, form);
    root.appendChild(shell);
    this.root = root;
    this.viewportResizeHandler = () => {
      this.applyVerticalPlacement();
    };
    form.className = 'space-y-4';
  }

  public show(parent: HTMLElement = document.body): void {
    if (!this.root.isConnected) {
      parent.appendChild(this.root);
    }
    this.bindViewportListeners();
    this.applyVerticalPlacement();
    this.prefillCachedUsername();
    this.focusPrimaryField();
  }

  public hide(): void {
    if (!this.root.isConnected) return;
    this.unbindViewportListeners();
    this.root.remove();
  }

  public isVisible(): boolean {
    return this.root.isConnected;
  }

  public focusPrimaryField(): void {
    if (!this.shouldAutoFocusPrimaryField()) return;
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

  private shouldAutoFocusPrimaryField(): boolean {
    if (typeof window === 'undefined') return true;
    if (typeof window.matchMedia !== 'function') return true;
    return !(
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(max-width: 640px)').matches
    );
  }

  private bindViewportListeners(): void {
    if (this.viewportListenersBound) return;
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', this.viewportResizeHandler);
    window.visualViewport?.addEventListener('resize', this.viewportResizeHandler);
    this.viewportListenersBound = true;
  }

  private unbindViewportListeners(): void {
    if (!this.viewportListenersBound) return;
    if (typeof window === 'undefined') return;
    window.removeEventListener('resize', this.viewportResizeHandler);
    window.visualViewport?.removeEventListener(
      'resize',
      this.viewportResizeHandler
    );
    this.viewportListenersBound = false;
  }

  private applyVerticalPlacement(): void {
    if (typeof window === 'undefined') return;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const shortViewport = viewportHeight < 720;
    this.root.classList.toggle('items-start', shortViewport);
    this.root.classList.toggle('items-center', !shortViewport);
  }
}
