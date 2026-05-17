import { LoginCredentials } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { GLOBAL_APP_SIDEBAR_OFFSET_CSS_VALUE } from '../../../../bootstrap/GlobalAppHeader.ts';
import {
  normalizeLoginCredentials,
  validateLoginCredentialField,
  validateLoginCredentials,
  type LoginCredentialsFieldErrors,
  type LoginCredentialsValidationMessages,
} from '../../core/validation/loginCredentialsValidator.ts';
import { type I18nService } from '../../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';
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
  runtime?: AppRuntime;
  secondaryAction?: {
    text: string | ((i18n: I18nService) => string);
    onClick: () => void;
  };
  onSubmit: (credentials: LoginCredentials) => Promise<LoginSubmitResult>;
};

export class LoginPage {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly root: HTMLDivElement;
  private readonly shell: HTMLElement;
  private readonly heading: HTMLHeadingElement;
  private readonly caption: HTMLParagraphElement;
  private readonly accessNote: HTMLParagraphElement;
  private readonly trustNote: HTMLParagraphElement;
  private readonly usernameInput: HTMLInputElement;
  private readonly passwordInput: HTMLInputElement;
  private readonly usernameField: ReturnType<typeof createField>;
  private readonly passwordField: ReturnType<typeof createField>;
  private readonly generalError: FormMessage;
  private readonly submitButton: TextButtonElement;
  private readonly secondaryButton: TextButtonElement | null;
  private readonly viewportResizeHandler: () => void;
  private validationMessages: LoginCredentialsValidationMessages;
  private viewportListenersBound = false;
  private usernameCache = '';
  private disposeRuntimeSubscription: (() => void) | null = null;

  constructor(private readonly options: LoginPageOptions) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.i18n = this.runtime.i18n;
    this.validationMessages = this.buildValidationMessages();
    const root = document.createElement('div');
    root.className =
      'fixed inset-0 z-[190] flex items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_16%_18%,rgba(14,165,233,0.03),transparent_41%),radial-gradient(circle_at_84%_82%,rgba(249,115,22,0.02),transparent_43%),linear-gradient(to_bottom,#ffffff,#f8fafc)] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]';
    root.style.left = GLOBAL_APP_SIDEBAR_OFFSET_CSS_VALUE;

    const shell = document.createElement('section');
    shell.className =
      'w-full max-w-[26rem] rounded-2xl border border-slate-200/90 bg-white/95 px-5 py-6 sm:px-8 sm:py-8';
    shell.setAttribute(
      'aria-label',
      this.options.title ?? this.i18n.t('login.title')
    );

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
    heading.textContent = this.options.title ?? this.i18n.t('login.title');

    const caption = document.createElement('p');
    caption.className = 'mt-2 text-sm leading-5 text-slate-600';
    caption.textContent = this.i18n.t('login.caption');

    const accessNote = document.createElement('p');
    accessNote.className = 'mt-3 text-xs leading-5 text-slate-500';
    accessNote.textContent = this.i18n.t('login.accessLimited');

    header.append(logo, heading, caption, accessNote);

    const form = document.createElement('form');
    form.className = 'space-y-0';
    form.noValidate = true;

    const usernameControl = createInput({
      kind: 'text',
      id: 'canvas-login-username',
      name: 'username',
      autoComplete: 'username',
      placeholder: this.i18n.t('login.username.placeholder'),
      variant: 'default',
      inputClassName: 'text-base md:text-sm',
    });
    this.usernameInput = usernameControl.input;
    this.usernameInput.autocapitalize = 'none';
    this.usernameInput.spellcheck = false;
    this.usernameInput.setAttribute('autocorrect', 'off');
    this.usernameInput.setAttribute('enterkeyhint', 'next');
    this.usernameField = createField({
      label: this.i18n.t('login.username.label'),
      control: usernameControl.element,
      className: 'mb-0',
    });

    const passwordControl = createInput({
      kind: 'password',
      id: 'canvas-login-password',
      name: 'password',
      autoComplete: 'current-password',
      placeholder: this.i18n.t('login.password.placeholder'),
      variant: 'default',
      passwordToggleLabels: {
        show: this.i18n.t('login.showPassword'),
        hide: this.i18n.t('login.hidePassword'),
      },
      inputClassName: 'text-base md:text-sm',
    });
    this.passwordInput = passwordControl.input;
    this.passwordInput.autocapitalize = 'none';
    this.passwordInput.setAttribute('autocorrect', 'off');
    this.passwordInput.setAttribute('enterkeyhint', 'go');
    this.passwordField = createField({
      label: this.i18n.t('login.password.label'),
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
      text: this.i18n.t('login.submit'),
      loadingText: this.i18n.t('login.submitLoading'),
      type: 'submit',
    });
    const trustNote = document.createElement('p');
    trustNote.className = 'text-center text-xs leading-5 text-slate-500';
    trustNote.textContent = this.i18n.t('login.privateWorkspaceNote');

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
    errorSlot.className = 'min-h-1';
    errorSlot.appendChild(this.generalError.element);

    form.append(
      this.usernameField.element,
      this.passwordField.element,
      errorSlot,
      this.submitButton,
      trustNote
    );

    let secondaryButton: TextButtonElement | null = null;
    if (this.options.secondaryAction) {
      secondaryButton = createTextButton({
        tone: 'text',
        size: 'sm',
        fullWidth: true,
        text: this.getSecondaryActionText(),
        type: 'button',
        onClick: () => {
          this.clearGeneralError();
          this.options.secondaryAction?.onClick();
        },
      });
      form.appendChild(secondaryButton);
    }

    shell.append(header, form);
    root.appendChild(shell);
    this.root = root;
    this.shell = shell;
    this.heading = heading;
    this.caption = caption;
    this.accessNote = accessNote;
    this.trustNote = trustNote;
    this.viewportResizeHandler = () => {
      this.applyVerticalPlacement();
    };
    this.secondaryButton = secondaryButton;
    form.className = 'space-y-3';
  }

  public show(parent: HTMLElement = document.body): void {
    if (!this.root.isConnected) {
      parent.appendChild(this.root);
    }
    if (!this.disposeRuntimeSubscription) {
      this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
        this.refreshTranslations();
      }, { emitCurrent: true });
    } else {
      this.refreshTranslations();
    }
    this.bindViewportListeners();
    this.applyVerticalPlacement();
    this.prefillCachedUsername();
    this.focusPrimaryField();
  }

  public hide(): void {
    if (!this.root.isConnected) return;
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.unbindViewportListeners();
    this.root.remove();
  }

  public isVisible(): boolean {
    return this.root.isConnected;
  }

  private refreshTranslations(): void {
    const title = this.options.title ?? this.i18n.t('login.title');
    this.validationMessages = this.buildValidationMessages();
    this.shell.setAttribute('aria-label', title);
    this.heading.textContent = title;
    this.caption.textContent = this.i18n.t('login.caption');
    this.accessNote.textContent = this.i18n.t('login.accessLimited');
    this.trustNote.textContent = this.i18n.t('login.privateWorkspaceNote');
    this.usernameInput.placeholder = this.i18n.t('login.username.placeholder');
    this.passwordInput.placeholder = this.i18n.t('login.password.placeholder');
    this.usernameField.label.textContent = this.i18n.t('login.username.label');
    this.passwordField.label.textContent = this.i18n.t('login.password.label');
    if (!this.submitButton.loading) {
      this.submitButton.textContent = this.i18n.t('login.submit');
    }
    this.submitButton.loadingText = this.i18n.t('login.submitLoading');
    if (this.secondaryButton) {
      this.secondaryButton.textContent = this.getSecondaryActionText();
    }
  }

  private getSecondaryActionText(): string {
    const secondaryAction = this.options.secondaryAction;
    if (!secondaryAction) return '';
    return typeof secondaryAction.text === 'function'
      ? secondaryAction.text(this.i18n)
      : secondaryAction.text;
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
    const validation = validateLoginCredentials(
      credentials,
      this.validationMessages
    );
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
          : this.i18n.t('login.errorFallback')
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

  private buildValidationMessages(): LoginCredentialsValidationMessages {
    return {
      usernameRequired: this.i18n.t('login.usernameRequired'),
      passwordRequired: this.i18n.t('login.passwordRequired'),
    };
  }

  private validateField(field: keyof LoginCredentials): void {
    const values = this.getCredentialsValues();
    const error = validateLoginCredentialField(
      field,
      values,
      this.validationMessages
    );
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
    window.visualViewport?.addEventListener(
      'resize',
      this.viewportResizeHandler
    );
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
