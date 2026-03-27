import { firstValueFrom, type Observable } from 'rxjs';
import { createModalShell } from '../../../ui-lib/src/components/Modal.ts';
import {
  createField,
  createDisclosureRow,
  createFormMessage,
  createInput,
  createTextButton,
} from '../../../ui-lib/src/hud/index.ts';
import { Select } from '../../../ui-lib/src/components/Select.ts';
import { notify } from '../../canvas/core/services/NotificationService.ts';
import type {
  ChangePassword,
  User,
  Wallpaper,
} from '../../../majom-wrapper/interfaces/auth-interfaces.ts';
import {
  type AppLocale,
  getAppLocaleLabel,
  type I18nService,
  normalizeAppLocale,
  SUPPORTED_APP_LOCALES,
} from '../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import { UserApiService } from '../../../majom-wrapper/data-access/user-api-service.ts';
import {
  WallpaperService,
  resolveWallpaperUrl,
} from '../services/WallpaperService.ts';
import { confirmDeleteAccountModal } from './ConfirmDeleteAccountModal.ts';
import { openWallpaperPickerModal } from './WallpaperPickerModal.ts';

type ProfileSettingsUserApi = Pick<
  UserApiService,
  | 'updateUserProfile'
  | 'setUserProfileLanguage'
  | 'setUserWallpaper'
  | 'changePassword'
  | 'deleteUser'
>;

type ProfileSettingsWallpaperService = Pick<
  WallpaperService,
  'findWallpaperById' | 'setDefaultWallpaper'
> & {
  readonly wallpaperList: Wallpaper[];
};

type ProfileSettingsModalOptions = {
  runtime?: AppRuntime;
  userApiService: ProfileSettingsUserApi;
  wallpaperService: ProfileSettingsWallpaperService;
  onUserUpdated?: (user: User) => void;
  onLogout?: () => void;
  onAccountDeleted?: () => void;
  confirmDeleteAccount?: (options?: {
    accountLabel?: string;
  }) => Promise<boolean>;
};

type ProfileSettingsDraft = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  locale: AppLocale;
  wallpaperId: string | null;
};

type ProfileSettingsAccountField =
  | 'firstName'
  | 'lastName'
  | 'username'
  | 'email';

type AccountFieldErrors = Partial<Record<ProfileSettingsAccountField, string>>;

type ProfileSettingsPasswordField =
  | 'oldPassword'
  | 'newPassword'
  | 'confirmPassword';

type ProfileSettingsPasswordDraft = Record<ProfileSettingsPasswordField, string>;

type SecurityFieldErrors = Partial<
  Record<ProfileSettingsPasswordField, string>
>;

type SectionState = {
  saving: boolean;
  error: string | null;
  success: boolean;
};

type AccountState = SectionState & {
  fieldErrors: AccountFieldErrors;
};

type SecurityState = SectionState & {
  fieldErrors: SecurityFieldErrors;
};

type RenderedPasswordField = {
  element: HTMLElement;
  input: HTMLInputElement;
  control: ReturnType<typeof createInput>;
  field: ReturnType<typeof createField>;
};

const SECTION_ACTION_BUTTON_CLASS =
  'w-full justify-center sm:w-auto sm:min-w-[5.5rem]';
const ACCOUNT_INPUT_ROLE_BY_FIELD: Record<ProfileSettingsAccountField, string> = {
  firstName: 'profile-settings-account-first-name-input',
  lastName: 'profile-settings-account-last-name-input',
  username: 'profile-settings-account-username-input',
  email: 'profile-settings-account-email-input',
};
const SECURITY_INPUT_ROLE_BY_FIELD: Record<
  ProfileSettingsPasswordField,
  string
> = {
  oldPassword: 'profile-settings-old-password-input',
  newPassword: 'profile-settings-new-password-input',
  confirmPassword: 'profile-settings-confirm-password-input',
};

function createEmptyPasswordDraft(): ProfileSettingsPasswordDraft {
  return {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
}

function createInitialSecurityState(): SecurityState {
  return {
    saving: false,
    error: null,
    success: false,
    fieldErrors: {},
  };
}

function createInitialAccountState(): AccountState {
  return {
    saving: false,
    error: null,
    success: false,
    fieldErrors: {},
  };
}

function normalizeWallpaperId(
  value: string | number | null | undefined
): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function toDraft(user: User, fallbackLocale: AppLocale): ProfileSettingsDraft {
  return {
    firstName: user.first_name ?? '',
    lastName: user.last_name ?? '',
    username: user.username ?? '',
    email: user.email ?? '',
    locale: normalizeAppLocale(user.language) ?? fallbackLocale,
    wallpaperId: normalizeWallpaperId(user.wallpaper?.id ?? user.wallpaper_id),
  };
}

function getAccountFullName(user: User | null): string {
  if (!user) return '';
  return [user.first_name?.trim() ?? '', user.last_name?.trim() ?? '']
    .filter(Boolean)
    .join(' ')
    .trim();
}

function createSectionLayout(
  title: string,
  description: string,
  options: { tone?: 'default' | 'danger' } = {}
): {
  element: HTMLElement;
  content: HTMLDivElement;
  actions: HTMLDivElement;
} {
  const section = document.createElement('section');
  section.className =
    options.tone === 'danger'
      ? 'grid gap-5 rounded-2xl border border-rose-200/60 bg-rose-50/30 p-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-10 md:p-5'
      : 'grid gap-5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-10';

  const header = document.createElement('div');
  header.className = 'flex flex-col gap-1.5 pt-0.5';

  const titleEl = document.createElement('h3');
  titleEl.className =
    'text-[15px] font-semibold leading-6 tracking-tight text-slate-900';
  titleEl.textContent = title;

  const descriptionEl = document.createElement('p');
  descriptionEl.className = 'max-w-[26ch] text-[13px] leading-5 text-slate-500';
  descriptionEl.textContent = description;

  const panel = document.createElement('div');
  panel.className = 'min-w-0 flex flex-col gap-3.5';

  const content = document.createElement('div');
  content.className = 'flex flex-col gap-4';

  const actions = document.createElement('div');
  actions.className =
    'flex flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center';

  header.append(titleEl, descriptionEl);
  panel.append(content, actions);
  section.append(header, panel);
  return { element: section, content, actions };
}

function getAccountDisplayName(user: User | null): string {
  if (!user) return '';
  return (
    getAccountFullName(user) ||
    user.username?.trim() ||
    user.email?.trim() ||
    ''
  );
}

function getAccountSecondaryText(user: User | null): string {
  if (!user) return '';
  const displayName = getAccountDisplayName(user);
  const username = user.username?.trim() ?? '';
  const email = user.email?.trim() ?? '';
  const parts = [username, email].filter(
    (value, index, source) =>
      value.length > 0 && value !== displayName && source.indexOf(value) === index
  );
  return parts.join(' · ');
}

function getAccountInitials(user: User | null): string {
  const source = getAccountDisplayName(user);
  if (source.length === 0) return 'U';
  const base = source.includes('@') ? source.split('@')[0] : source;
  const parts = base
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function firstErrorMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstErrorMessage(item);
      if (message) return message;
    }
  }
  return null;
}

export class ProfileSettingsModal {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly userApiService: ProfileSettingsUserApi;
  private readonly wallpaperService: ProfileSettingsWallpaperService;
  private readonly onUserUpdated?: (user: User) => void;
  private readonly onLogout?: () => void;
  private readonly onAccountDeleted?: () => void;
  private readonly confirmDeleteAccount: (
    options?: { accountLabel?: string }
  ) => Promise<boolean>;
  private readonly disposeRuntimeSubscription: () => void;
  private overlay: HTMLDivElement | null = null;
  private header: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private footer: HTMLDivElement | null = null;
  private serverSnapshot: User | null = null;
  private draft: ProfileSettingsDraft | null = null;
  private passwordDraft: ProfileSettingsPasswordDraft = createEmptyPasswordDraft();
  private accountState: AccountState = createInitialAccountState();
  private languageState: SectionState = {
    saving: false,
    error: null,
    success: false,
  };
  private wallpaperState: SectionState = {
    saving: false,
    error: null,
    success: false,
  };
  private securityState: SecurityState = createInitialSecurityState();
  private dangerState: SectionState = {
    saving: false,
    error: null,
    success: false,
  };
  private securityExpanded = false;
  private accountExpanded = false;
  private dangerExpanded = false;
  private accountSuccessTimeoutId: number | null = null;
  private languageSuccessTimeoutId: number | null = null;
  private wallpaperSuccessTimeoutId: number | null = null;
  private securitySuccessTimeoutId: number | null = null;

  constructor(options: ProfileSettingsModalOptions) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.i18n = this.runtime.i18n;
    this.userApiService = options.userApiService;
    this.wallpaperService = options.wallpaperService;
    this.onUserUpdated = options.onUserUpdated;
    this.onLogout = options.onLogout;
    this.onAccountDeleted = options.onAccountDeleted;
    this.confirmDeleteAccount =
      options.confirmDeleteAccount ??
      ((confirmOptions) =>
        confirmDeleteAccountModal({
          i18n: this.i18n,
          accountLabel: confirmOptions?.accountLabel,
        }));
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.refreshTranslations();
    });
  }

  public open(user: User): void {
    this.serverSnapshot = { ...user };
    this.draft = toDraft(user, this.runtime.i18n.getLocale());
    this.passwordDraft = createEmptyPasswordDraft();
    this.accountState = createInitialAccountState();
    this.languageState = { saving: false, error: null, success: false };
    this.wallpaperState = { saving: false, error: null, success: false };
    this.securityState = createInitialSecurityState();
    this.dangerState = { saving: false, error: null, success: false };
    this.accountExpanded = false;
    this.securityExpanded = false;
    this.dangerExpanded = Boolean(user.deletion_requested_at);
    this.clearSuccessTimeout('account');
    this.clearSuccessTimeout('language');
    this.clearSuccessTimeout('wallpaper');
    this.clearSuccessTimeout('security');

    if (!this.overlay) {
      const { overlay, container, header, body, footer } = createModalShell(
        this.i18n.t('profileSettings.title'),
        {
          subtitle: this.i18n.t('profileSettings.subtitle'),
          onClose: () => this.close(),
          intent: 'form',
          zIndex: 280,
        }
      );
      container.style.width = 'min(48rem, calc(100vw - 2rem))';
      container.style.maxWidth = 'min(48rem, calc(100vw - 2rem))';
      const subtitle = header.querySelector('p');
      if (subtitle instanceof HTMLParagraphElement) {
        subtitle.style.maxWidth = '32rem';
      }
      this.overlay = overlay;
      this.header = header;
      this.body = body;
      this.footer = footer;
    }

    this.renderFooter();
    this.renderBody();
  }

  public close(): void {
    this.overlay?.remove();
    this.overlay = null;
    this.header = null;
    this.body = null;
    this.footer = null;
    this.serverSnapshot = null;
    this.draft = null;
    this.passwordDraft = createEmptyPasswordDraft();
    this.accountState = createInitialAccountState();
    this.languageState = { saving: false, error: null, success: false };
    this.wallpaperState = { saving: false, error: null, success: false };
    this.securityState = createInitialSecurityState();
    this.dangerState = { saving: false, error: null, success: false };
    this.accountExpanded = false;
    this.securityExpanded = false;
    this.dangerExpanded = false;
    this.clearSuccessTimeout('account');
    this.clearSuccessTimeout('language');
    this.clearSuccessTimeout('wallpaper');
    this.clearSuccessTimeout('security');
  }

  public destroy(): void {
    this.close();
    this.disposeRuntimeSubscription();
  }

  private refreshTranslations(): void {
    if (!this.overlay) return;
    this.updateModalHeader();
    this.renderFooter();
    this.renderBody();
  }

  private updateModalHeader(): void {
    if (!this.header) return;
    const title = this.header.querySelector('h2');
    if (title) {
      title.textContent = this.i18n.t('profileSettings.title');
    }
    const subtitle = this.header.querySelector('p');
    if (subtitle) {
      subtitle.textContent = this.i18n.t('profileSettings.subtitle');
    }
  }

  private renderFooter(): void {
    if (!this.footer) return;
    this.footer.replaceChildren();
    this.footer.style.display = 'none';
  }

  private renderBody(): void {
    if (!this.body || !this.serverSnapshot || !this.draft) return;
    const stack = document.createElement('div');
    stack.className = 'flex flex-col gap-10';
    stack.append(
      this.renderAccountSection(),
      this.renderLanguageSection(),
      this.renderWallpaperSection(),
      this.renderSecuritySection(),
      this.renderDangerSection()
    );
    this.body.replaceChildren(stack);
  }

  private renderAccountSection(): HTMLElement {
    const { element, content, actions } = createSectionLayout(
      this.i18n.t('profileSettings.account.title'),
      this.i18n.t('profileSettings.account.description')
    );
    element.dataset.role = 'profile-settings-account-section';

    const identityCard = document.createElement('div');
    identityCard.className =
      'flex flex-col gap-3 rounded-2xl bg-slate-50/85 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_1px_3px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between';

    const identityMain = document.createElement('div');
    identityMain.className = 'flex min-w-0 items-center gap-3.5';

    const avatar = document.createElement('div');
    avatar.className =
      'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold tracking-[0.08em] text-white';
    avatar.textContent = getAccountInitials(this.serverSnapshot);

    const identityText = document.createElement('div');
    identityText.className = 'min-w-0 flex flex-col gap-0.5';

    const name = document.createElement('div');
    name.className = 'truncate text-[15px] font-semibold leading-6 text-slate-900';
    name.textContent = getAccountDisplayName(this.serverSnapshot);

    const secondary = getAccountSecondaryText(this.serverSnapshot);
    if (secondary.length > 0) {
      const meta = document.createElement('div');
      meta.className = 'truncate text-sm leading-5 text-slate-500';
      meta.textContent = secondary;
      identityText.append(name, meta);
    } else {
      identityText.appendChild(name);
    }

    identityMain.append(avatar, identityText);

    const logoutButton = createTextButton({
      text: this.i18n.t('profileSettings.account.logout'),
      tone: 'secondary',
      size: 'sm',
      className: 'w-full justify-center sm:w-auto',
      onClick: () => {
        this.close();
        this.onLogout?.();
      },
    });
    logoutButton.dataset.role = 'profile-settings-logout-button';

    identityCard.append(identityMain, logoutButton);
    content.appendChild(identityCard);

    const toggleButton = createDisclosureRow({
      label: this.i18n.t('profileSettings.account.details'),
      description: this.getAccountDisclosureDescription(),
      expanded: this.accountExpanded,
      onClick: () => {
        if (this.accountExpanded) {
          this.collapseAccountSection();
          return;
        }
        this.expandAccountSection();
      },
    });
    toggleButton.dataset.role = 'profile-settings-account-toggle';
    content.appendChild(toggleButton);

    if (this.accountExpanded) {
      const panel = document.createElement('div');
      panel.className =
        'grid gap-4 rounded-2xl bg-slate-50/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_3px_rgba(15,23,42,0.04)]';
      panel.dataset.role = 'profile-settings-account-panel';

      const intro = document.createElement('p');
      intro.className = 'text-sm leading-5 text-slate-500';
      intro.textContent = this.i18n.t('profileSettings.account.panelDescription');
      panel.appendChild(intro);

      let syncAccountForm = (): void => {};

      const errorMessage = createFormMessage({
        tone: 'error',
        className: 'block',
      });
      errorMessage.setState({ message: this.accountState.error });

      const fields = document.createElement('div');
      fields.className = 'grid gap-4 md:grid-cols-2';

      const firstNameControl = createInput({
        name: 'first_name',
        value: this.draft?.firstName ?? '',
        placeholder: this.i18n.t('profileSettings.account.firstName'),
        inputClassName: 'text-base md:text-sm',
        disabled: this.accountState.saving,
        invalid: Boolean(this.accountState.fieldErrors.firstName),
        onInput: (value) => {
          if (!this.draft) return;
          this.draft.firstName = value;
          this.handleAccountInput('firstName');
          syncAccountForm();
        },
        onKeyDown: (event) => {
          this.handleAccountFieldKeyDown(event);
        },
      });
      firstNameControl.input.dataset.role =
        ACCOUNT_INPUT_ROLE_BY_FIELD.firstName;
      firstNameControl.input.autocapitalize = 'words';

      const firstNameField = createField({
        label: this.i18n.t('profileSettings.account.firstName'),
        control: firstNameControl.element,
        className: 'mb-0',
        error: this.accountState.fieldErrors.firstName,
        disabled: this.accountState.saving,
      });
      fields.appendChild(firstNameField.element);

      const lastNameControl = createInput({
        name: 'last_name',
        value: this.draft?.lastName ?? '',
        placeholder: this.i18n.t('profileSettings.account.lastName'),
        inputClassName: 'text-base md:text-sm',
        disabled: this.accountState.saving,
        invalid: Boolean(this.accountState.fieldErrors.lastName),
        onInput: (value) => {
          if (!this.draft) return;
          this.draft.lastName = value;
          this.handleAccountInput('lastName');
          syncAccountForm();
        },
        onKeyDown: (event) => {
          this.handleAccountFieldKeyDown(event);
        },
      });
      lastNameControl.input.dataset.role = ACCOUNT_INPUT_ROLE_BY_FIELD.lastName;
      lastNameControl.input.autocapitalize = 'words';

      const lastNameField = createField({
        label: this.i18n.t('profileSettings.account.lastName'),
        control: lastNameControl.element,
        className: 'mb-0',
        error: this.accountState.fieldErrors.lastName,
        disabled: this.accountState.saving,
      });
      fields.appendChild(lastNameField.element);

      const usernameControl = createInput({
        name: 'username',
        value: this.draft?.username ?? '',
        placeholder: this.i18n.t('profileSettings.account.username'),
        inputClassName: 'text-base md:text-sm',
        disabled: this.accountState.saving,
        invalid: Boolean(this.accountState.fieldErrors.username),
        onInput: (value) => {
          if (!this.draft) return;
          this.draft.username = value;
          this.handleAccountInput('username');
          syncAccountForm();
        },
        onKeyDown: (event) => {
          this.handleAccountFieldKeyDown(event);
        },
      });
      usernameControl.input.dataset.role = ACCOUNT_INPUT_ROLE_BY_FIELD.username;
      usernameControl.input.autocapitalize = 'none';
      usernameControl.input.setAttribute('autocorrect', 'off');

      const usernameField = createField({
        label: this.i18n.t('profileSettings.account.username'),
        control: usernameControl.element,
        className: 'mb-0',
        error: this.accountState.fieldErrors.username,
        disabled: this.accountState.saving,
      });
      fields.appendChild(usernameField.element);

      const emailControl = createInput({
        kind: 'email',
        name: 'email',
        value: this.draft?.email ?? '',
        placeholder: this.i18n.t('profileSettings.account.email'),
        required: true,
        inputClassName: 'text-base md:text-sm',
        disabled: this.accountState.saving,
        invalid: Boolean(this.accountState.fieldErrors.email),
        onInput: (value) => {
          if (!this.draft) return;
          this.draft.email = value;
          this.handleAccountInput('email');
          syncAccountForm();
        },
        onKeyDown: (event) => {
          this.handleAccountFieldKeyDown(event);
        },
      });
      emailControl.input.dataset.role = ACCOUNT_INPUT_ROLE_BY_FIELD.email;
      emailControl.input.autocapitalize = 'none';
      emailControl.input.setAttribute('autocorrect', 'off');

      const emailField = createField({
        label: this.i18n.t('profileSettings.account.email'),
        control: emailControl.element,
        className: 'mb-0',
        error: this.accountState.fieldErrors.email,
        disabled: this.accountState.saving,
      });
      fields.appendChild(emailField.element);

      panel.appendChild(fields);
      panel.appendChild(errorMessage.element);

      const actionRow = document.createElement('div');
      actionRow.className =
        'flex flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center';

      const cancelButton = createTextButton({
        text: this.i18n.t('common.cancel'),
        tone: 'secondary',
        size: 'sm',
        className: SECTION_ACTION_BUTTON_CLASS,
        disabled: this.accountState.saving,
        onClick: () => {
          this.collapseAccountSection();
        },
      });
      cancelButton.dataset.role = 'profile-settings-account-cancel';

      const saveButton = createTextButton({
        text: this.i18n.t('common.save'),
        tone: 'primary',
        size: 'sm',
        className: SECTION_ACTION_BUTTON_CLASS,
        loading: this.accountState.saving,
        loadingText: this.i18n.t('common.save'),
        disabled: !this.isAccountReadyToSubmit(),
        onClick: () => {
          void this.saveAccount();
        },
      });
      saveButton.dataset.role = 'profile-settings-account-save';

      actionRow.append(cancelButton, saveButton);
      panel.appendChild(actionRow);
      content.appendChild(panel);

      syncAccountForm = () => {
        const firstNameError = this.getAccountFieldError('firstName');
        const lastNameError = this.getAccountFieldError('lastName');
        const usernameError = this.getAccountFieldError('username');
        const emailError = this.getAccountFieldError('email');

        firstNameField.setState({
          disabled: this.accountState.saving,
          error: firstNameError,
        });
        firstNameControl.setState({
          disabled: this.accountState.saving,
          invalid: Boolean(firstNameError),
        });
        lastNameField.setState({
          disabled: this.accountState.saving,
          error: lastNameError,
        });
        lastNameControl.setState({
          disabled: this.accountState.saving,
          invalid: Boolean(lastNameError),
        });
        usernameField.setState({
          disabled: this.accountState.saving,
          error: usernameError,
        });
        usernameControl.setState({
          disabled: this.accountState.saving,
          invalid: Boolean(usernameError),
        });
        emailField.setState({
          disabled: this.accountState.saving,
          error: emailError,
        });
        emailControl.setState({
          disabled: this.accountState.saving,
          invalid: Boolean(emailError),
        });
        saveButton.disabled =
          this.accountState.saving || !this.isAccountReadyToSubmit();
        if (this.accountState.error) {
          errorMessage.show(this.accountState.error, 'error');
        } else {
          errorMessage.clear();
        }
      };
      syncAccountForm();
    }

    if (this.accountState.success && !this.accountExpanded) {
      const success = createFormMessage({ tone: 'success', className: 'block' });
      success.show(this.i18n.t('profileSettings.account.saved'), 'success');
      content.appendChild(success.element);
    }

    actions.remove();

    return element;
  }

  private validateAccountDraft(): AccountFieldErrors {
    const fieldErrors: AccountFieldErrors = {};

    if (!this.draft || this.draft.username.trim().length === 0) {
      fieldErrors.username = this.i18n.t(
        'profileSettings.account.usernameRequired'
      );
    }

    const emailValidationError = this.getNativeAccountEmailValidationError();
    if (emailValidationError) {
      fieldErrors.email = emailValidationError;
    }

    return fieldErrors;
  }

  private getAccountDisclosureDescription(): string {
    if (this.accountState.success) {
      return this.i18n.t('profileSettings.account.updatedDescription');
    }
    const displayName = getAccountDisplayName(this.serverSnapshot);
    const secondary = getAccountSecondaryText(this.serverSnapshot);
    return [displayName, secondary].filter(Boolean).join(' · ');
  }

  private getFirstAccountErrorField(
    fieldErrors: AccountFieldErrors
  ): ProfileSettingsAccountField | null {
    const orderedFields: ProfileSettingsAccountField[] = [
      'firstName',
      'lastName',
      'username',
      'email',
    ];
    return orderedFields.find((field) => Boolean(fieldErrors[field])) ?? null;
  }

  private focusAccountField(field: ProfileSettingsAccountField): void {
    window.requestAnimationFrame(() => {
      const input = this.overlay?.querySelector<HTMLInputElement>(
        `input[data-role="${ACCOUNT_INPUT_ROLE_BY_FIELD[field]}"]`
      );
      input?.focus();
    });
  }

  private getAccountEmailInput(): HTMLInputElement | null {
    return (
      this.overlay?.querySelector<HTMLInputElement>(
        `input[data-role="${ACCOUNT_INPUT_ROLE_BY_FIELD.email}"]`
      ) ?? null
    );
  }

  private getNativeAccountEmailValidationError(): string | null {
    const input = this.getAccountEmailInput();
    if (!input) {
      const email = this.draft?.email.trim() ?? '';
      if (email.length === 0) {
        return this.i18n.t('profileSettings.account.emailRequired');
      }
      return null;
    }

    if (input.validity.valueMissing) {
      return this.i18n.t('profileSettings.account.emailRequired');
    }

    if (input.validity.typeMismatch) {
      return this.i18n.t('profileSettings.account.emailInvalid');
    }

    return null;
  }

  private getAccountFieldError(
    field: ProfileSettingsAccountField
  ): string | undefined {
    const savedError = this.accountState.fieldErrors[field];
    if (savedError) {
      return savedError;
    }

    if (field === 'username') {
      const username = this.draft?.username.trim() ?? '';
      if (username.length === 0) {
        return this.i18n.t('profileSettings.account.usernameRequired');
      }
      return undefined;
    }

    if (field === 'email') {
      return this.getNativeAccountEmailValidationError() ?? undefined;
    }

    return undefined;
  }

  private parseAccountErrorData(data: Record<string, unknown> | null): {
    fieldErrors: AccountFieldErrors;
    error: string | null;
  } | null {
    if (!data) return null;

    const fieldErrors: AccountFieldErrors = {};
    const firstNameMessage = firstErrorMessage(data.first_name);
    const lastNameMessage = firstErrorMessage(data.last_name);
    const usernameMessage = firstErrorMessage(data.username);
    const emailMessage = firstErrorMessage(data.email);
    const detailMessage =
      firstErrorMessage(data.detail) ?? firstErrorMessage(data.non_field_errors);

    if (firstNameMessage) {
      fieldErrors.firstName = firstNameMessage;
    }
    if (lastNameMessage) {
      fieldErrors.lastName = lastNameMessage;
    }
    if (usernameMessage) {
      fieldErrors.username = usernameMessage;
    }
    if (emailMessage) {
      fieldErrors.email = emailMessage;
    }

    if (Object.keys(fieldErrors).length === 0 && !detailMessage) {
      return null;
    }

    return {
      fieldErrors,
      error: detailMessage ?? null,
    };
  }

  private async resolveAccountSaveError(error: unknown): Promise<{
    fieldErrors: AccountFieldErrors;
    error: string | null;
  }> {
    const fallbackError = this.i18n.t('profileSettings.account.saveError');
    const directResolution = this.parseAccountErrorData(
      error && typeof error === 'object'
        ? (error as Record<string, unknown>)
        : null
    );
    if (directResolution) {
      return directResolution;
    }

    const httpError = error as
      | {
          json?: () => Observable<unknown>;
        }
      | undefined;

    if (!httpError || typeof httpError.json !== 'function') {
      return {
        fieldErrors: {},
        error: fallbackError,
      };
    }

    try {
      const payload = await firstValueFrom(httpError.json());
      const data =
        payload && typeof payload === 'object'
          ? (payload as Record<string, unknown>)
          : null;
      const parsedResolution = this.parseAccountErrorData(data);
      if (parsedResolution) {
        return parsedResolution;
      }
      return {
        fieldErrors: {},
        error: fallbackError,
      };
    } catch {
      return {
        fieldErrors: {},
        error: fallbackError,
      };
    }
  }

  private isAccountDirty(): boolean {
    if (!this.serverSnapshot || !this.draft) return false;
    return (
      (this.serverSnapshot.first_name ?? '') !== this.draft.firstName.trim() ||
      (this.serverSnapshot.last_name ?? '') !== this.draft.lastName.trim() ||
      this.serverSnapshot.username !== this.draft.username.trim() ||
      this.serverSnapshot.email !== this.draft.email.trim()
    );
  }

  private isAccountReadyToSubmit(): boolean {
    if (!this.draft || !this.isAccountDirty()) return false;
    return Object.keys(this.validateAccountDraft()).length === 0;
  }

  private resetAccountDraft(): void {
    if (!this.draft || !this.serverSnapshot) return;
    this.draft.firstName = this.serverSnapshot.first_name ?? '';
    this.draft.lastName = this.serverSnapshot.last_name ?? '';
    this.draft.username = this.serverSnapshot.username ?? '';
    this.draft.email = this.serverSnapshot.email ?? '';
  }

  private expandAccountSection(): void {
    this.clearSuccessTimeout('account');
    this.accountState = createInitialAccountState();
    this.resetAccountDraft();
    this.accountExpanded = true;
    this.renderBody();
    this.focusAccountField('firstName');
  }

  private collapseAccountSection(): void {
    if (this.accountState.saving) return;
    this.clearSuccessTimeout('account');
    this.accountState = createInitialAccountState();
    this.resetAccountDraft();
    this.accountExpanded = false;
    this.renderBody();
  }

  private handleAccountFieldKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (this.accountState.saving) return;
    void this.saveAccount();
  }

  private handleAccountInput(field: ProfileSettingsAccountField): void {
    const nextFieldErrors = { ...this.accountState.fieldErrors };

    if (field === 'username') {
      const username = this.draft?.username.trim() ?? '';
      if (username.length === 0) {
        nextFieldErrors.username = this.i18n.t(
          'profileSettings.account.usernameRequired'
        );
      } else {
        delete nextFieldErrors.username;
      }
    } else if (field === 'email') {
      const emailError = this.getNativeAccountEmailValidationError();
      if (emailError) {
        nextFieldErrors.email = emailError;
      } else {
        delete nextFieldErrors.email;
      }
    } else {
      delete nextFieldErrors[field];
    }

    this.accountState.fieldErrors = nextFieldErrors;
    if (this.accountState.error) {
      this.accountState.error = null;
    }
  }

  private async saveAccount(): Promise<void> {
    if (this.accountState.saving || !this.draft) return;

    const fieldErrors = this.validateAccountDraft();
    const firstInvalidField = this.getFirstAccountErrorField(fieldErrors);
    if (firstInvalidField) {
      this.accountState = {
        saving: false,
        error: null,
        success: false,
        fieldErrors,
      };
      this.accountExpanded = true;
      this.renderBody();
      this.focusAccountField(firstInvalidField);
      return;
    }

    if (!this.isAccountDirty()) {
      return;
    }

    this.accountState = {
      saving: true,
      error: null,
      success: false,
      fieldErrors: {},
    };
    this.accountExpanded = true;
    this.renderBody();

    try {
      const updatedUser = await firstValueFrom(
        this.userApiService.updateUserProfile({
          first_name: this.draft.firstName.trim(),
          last_name: this.draft.lastName.trim(),
          username: this.draft.username.trim(),
          email: this.draft.email.trim(),
        })
      );
      this.serverSnapshot = updatedUser;
      this.draft = toDraft(updatedUser, this.runtime.i18n.getLocale());
      this.onUserUpdated?.(updatedUser);
    } catch (error) {
      console.warn('Failed to persist account details.', error);
      const resolvedError = await this.resolveAccountSaveError(error);
      this.accountState = {
        saving: false,
        error: resolvedError.error,
        success: false,
        fieldErrors: resolvedError.fieldErrors,
      };
      this.accountExpanded = true;
      this.renderBody();
      const firstErrorField = this.getFirstAccountErrorField(
        resolvedError.fieldErrors
      );
      if (firstErrorField) {
        this.focusAccountField(firstErrorField);
      }
      return;
    }

    this.accountState = {
      saving: false,
      error: null,
      success: false,
      fieldErrors: {},
    };
    this.accountExpanded = false;
    this.showSectionSuccess('account');
    this.renderBody();
  }

  private renderLanguageSection(): HTMLElement {
    const { element, content } = createSectionLayout(
      this.i18n.t('profileSettings.language.title'),
      this.i18n.t('profileSettings.language.description')
    );
    element.dataset.role = 'profile-settings-language-section';

    const row = document.createElement('div');
    row.className = 'flex flex-col gap-2.5';

    const labelWrap = document.createElement('div');
    labelWrap.className = 'flex flex-col gap-1';
    const label = document.createElement('div');
    label.className = 'text-sm font-medium text-slate-700';
    label.textContent = this.i18n.t('profileSettings.language.appLanguage');
    labelWrap.appendChild(label);

    const controlsRow = document.createElement('div');
    controlsRow.className =
      'flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-end';

    const controlWrap = document.createElement('div');
    controlWrap.className = 'w-full sm:max-w-[16.5rem]';
    const control = new Select({
      items: SUPPORTED_APP_LOCALES.map((locale) => ({
        value: locale,
        label: getAppLocaleLabel(this.i18n, locale),
      })),
      selectedValue: this.draft?.locale ?? this.runtime.i18n.getLocale(),
      disabled: this.languageState.saving,
      className: 'w-full',
      onChange: (value) => {
        if (!this.draft) return;
        this.draft.locale = normalizeAppLocale(value) ?? this.draft.locale;
        this.languageState.error = null;
        this.languageState.success = false;
        this.renderBody();
      },
    }).getElement() as HTMLSelectElement;
    control.dataset.role = 'profile-settings-language-control';
    control.setAttribute(
      'aria-label',
      this.i18n.t('profileSettings.language.appLanguage')
    );
    controlWrap.appendChild(control);

    const saveButton = createTextButton({
      text: this.i18n.t('common.save'),
      tone: 'primary',
      size: 'sm',
      className: SECTION_ACTION_BUTTON_CLASS,
      loading: this.languageState.saving,
      loadingText: this.i18n.t('common.save'),
      disabled: !this.isLanguageDirty(),
      onClick: () => {
        void this.saveLanguage();
      },
    });
    saveButton.dataset.role = 'profile-settings-language-save';
    controlsRow.append(controlWrap, saveButton);
    row.append(labelWrap, controlsRow);
    content.appendChild(row);
    if (this.languageState.success) {
      const success = createFormMessage({ tone: 'success', className: 'block' });
      success.show(this.i18n.t('profileSettings.language.saved'), 'success');
      content.appendChild(success.element);
    }
    if (this.languageState.error) {
      const error = createFormMessage({ tone: 'error', className: 'block' });
      error.show(this.languageState.error, 'error');
      content.appendChild(error.element);
    }
    return element;
  }

  private renderWallpaperSection(): HTMLElement {
    const { element, content, actions } = createSectionLayout(
      this.i18n.t('profileSettings.appearance.title'),
      this.i18n.t('profileSettings.appearance.description')
    );
    element.dataset.role = 'profile-settings-wallpaper-section';

    const wallpaperList = this.wallpaperService.wallpaperList;
    const currentWallpaper = this.wallpaperService.findWallpaperById(
      this.draft?.wallpaperId
    );

    const surface = document.createElement('div');
    surface.className =
      'rounded-2xl bg-slate-50/75 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_1px_3px_rgba(15,23,42,0.03)]';
    surface.dataset.role = 'profile-settings-wallpaper-summary';

    if (wallpaperList.length === 0) {
      const empty = document.createElement('div');
      empty.className =
        'col-span-full rounded-xl bg-white/80 px-3 py-4 text-sm text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]';
      empty.textContent = this.i18n.t('profileSettings.appearance.empty');
      surface.appendChild(empty);
    } else {
      const preview = document.createElement('div');
      preview.className =
        'relative aspect-[16/9] overflow-hidden rounded-[1rem] bg-slate-100';
      if (currentWallpaper?.image_file) {
        preview.style.backgroundImage = `url("${resolveWallpaperUrl(
          currentWallpaper.image_file
        )}")`;
        preview.style.backgroundPosition = 'center';
        preview.style.backgroundRepeat = 'no-repeat';
        preview.style.backgroundSize = 'cover';
      }
      const currentBadge = document.createElement('div');
      currentBadge.className = 'absolute left-3 top-3';
      currentBadge.appendChild(
        document.createTextNode(
          this.i18n.t('profileSettings.appearance.current')
        )
      );
      currentBadge.className =
        'absolute left-3 top-3 inline-flex items-center rounded-md bg-white/88 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 backdrop-blur-[2px]';
      preview.appendChild(currentBadge);
      surface.appendChild(preview);
    }
    content.appendChild(surface);
    if (this.wallpaperState.success) {
      const success = createFormMessage({ tone: 'success', className: 'block' });
      success.show(this.i18n.t('profileSettings.appearance.saved'), 'success');
      content.appendChild(success.element);
    }
    if (this.wallpaperState.error) {
      const error = createFormMessage({ tone: 'error', className: 'block' });
      error.show(this.wallpaperState.error, 'error');
      content.appendChild(error.element);
    }

    const browseButton = createTextButton({
      text: this.i18n.t('profileSettings.appearance.change'),
      tone: 'secondary',
      size: 'sm',
      className: SECTION_ACTION_BUTTON_CLASS,
      loading: this.wallpaperState.saving,
      loadingText: this.i18n.t('profileSettings.appearance.change'),
      disabled: wallpaperList.length === 0,
      onClick: () => {
        void this.openWallpaperPicker();
      },
    });
    browseButton.dataset.role = 'profile-settings-wallpaper-browse';
    actions.appendChild(browseButton);
    return element;
  }

  private renderSecuritySection(): HTMLElement {
    const { element, content, actions } = createSectionLayout(
      this.i18n.t('profileSettings.security.title'),
      this.i18n.t('profileSettings.security.description')
    );
    element.dataset.role = 'profile-settings-security-section';

    const toggleButton = createDisclosureRow({
      label: this.i18n.t('profileSettings.security.changePassword'),
      description: this.getSecurityDisclosureDescription(),
      expanded: this.securityExpanded,
      onClick: () => {
        if (this.securityExpanded) {
          this.collapseSecuritySection();
          return;
        }
        this.expandSecuritySection();
      },
    });
    toggleButton.dataset.role = 'profile-settings-security-toggle';
    content.appendChild(toggleButton);

    if (this.securityExpanded) {
      const panel = document.createElement('div');
      panel.className =
        'grid gap-4 rounded-2xl bg-slate-50/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_3px_rgba(15,23,42,0.04)]';
      panel.dataset.role = 'profile-settings-security-panel';

      const intro = document.createElement('p');
      intro.className = 'text-sm leading-5 text-slate-500';
      intro.textContent = this.i18n.t('profileSettings.security.panelDescription');
      panel.appendChild(intro);

      let syncSecurityForm = (): void => {};
      const onSecurityInput =
        (field: ProfileSettingsPasswordField) =>
        (): void => {
          this.handleSecurityInput(field);
          syncSecurityForm();
        };
      const onSecurityKeyDown = (event: KeyboardEvent): void => {
        this.handleSecurityFieldKeyDown(event);
      };

      const passwordFields: Record<
        ProfileSettingsPasswordField,
        RenderedPasswordField
      > = {
        oldPassword: this.createPasswordField({
          field: 'oldPassword',
          label: this.i18n.t('profileSettings.security.currentPassword'),
          autoComplete: 'current-password',
          onInput: onSecurityInput('oldPassword'),
          onKeyDown: onSecurityKeyDown,
        }),
        newPassword: this.createPasswordField({
          field: 'newPassword',
          label: this.i18n.t('profileSettings.security.newPassword'),
          autoComplete: 'new-password',
          onInput: onSecurityInput('newPassword'),
          onKeyDown: onSecurityKeyDown,
        }),
        confirmPassword: this.createPasswordField({
          field: 'confirmPassword',
          label: this.i18n.t('profileSettings.security.confirmPassword'),
          autoComplete: 'new-password',
          onInput: onSecurityInput('confirmPassword'),
          onKeyDown: onSecurityKeyDown,
        }),
      };

      passwordFields.oldPassword.element.classList.add('md:col-span-2');

      const fields = document.createElement('div');
      fields.className = 'grid gap-4 md:grid-cols-2';
      fields.append(
        passwordFields.oldPassword.element,
        passwordFields.newPassword.element,
        passwordFields.confirmPassword.element
      );
      panel.appendChild(fields);

      const errorMessage = createFormMessage({
        tone: 'error',
        className: 'block',
      });
      errorMessage.setState({ message: this.securityState.error });
      panel.appendChild(errorMessage.element);

      const actionRow = document.createElement('div');
      actionRow.className =
        'flex flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center';

      const cancelButton = createTextButton({
        text: this.i18n.t('common.cancel'),
        tone: 'secondary',
        size: 'sm',
        className: SECTION_ACTION_BUTTON_CLASS,
        disabled: this.securityState.saving,
        onClick: () => {
          this.collapseSecuritySection();
        },
      });
      cancelButton.dataset.role = 'profile-settings-security-cancel';

      const saveButton = createTextButton({
        text: this.i18n.t('common.save'),
        tone: 'primary',
        size: 'sm',
        className: SECTION_ACTION_BUTTON_CLASS,
        loading: this.securityState.saving,
        loadingText: this.i18n.t('common.save'),
        disabled: !this.isSecurityReadyToSubmit(),
        onClick: () => {
          void this.savePassword();
        },
      });
      saveButton.dataset.role = 'profile-settings-security-save';

      actionRow.append(cancelButton, saveButton);
      panel.appendChild(actionRow);
      content.appendChild(panel);

      syncSecurityForm = () => {
        this.syncSecurityFormState(passwordFields, saveButton, errorMessage);
      };
      syncSecurityForm();
    }

    if (this.securityState.success && !this.securityExpanded) {
      const success = createFormMessage({ tone: 'success', className: 'block' });
      success.show(this.i18n.t('profileSettings.security.saved'), 'success');
      content.appendChild(success.element);
    }

    actions.remove();

    return element;
  }

  private renderDangerSection(): HTMLElement {
    const { element, content, actions } = createSectionLayout(
      this.i18n.t('profileSettings.danger.title'),
      this.i18n.t('profileSettings.danger.description')
    );
    element.dataset.role = 'profile-settings-danger-section';

    const toggleButton = createDisclosureRow({
      label: this.i18n.t('profileSettings.danger.accountActionsTitle'),
      description: this.i18n.t(
        'profileSettings.danger.accountActionsDescription'
      ),
      expanded: this.dangerExpanded,
      tone: 'danger',
      onClick: () => {
        this.dangerExpanded = !this.dangerExpanded;
        this.renderBody();
      },
    });
    toggleButton.dataset.role = 'profile-settings-danger-toggle';
    content.appendChild(toggleButton);

    if (this.dangerExpanded) {
      const panel = document.createElement('div');
      panel.className =
        'rounded-2xl bg-rose-50/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.74),0_1px_4px_rgba(244,63,94,0.04)]';

      if (this.serverSnapshot?.deletion_requested_at) {
        const info = createFormMessage({ tone: 'info', className: 'block' });
        info.show(
          this.i18n.t('profileSettings.danger.deleteRequested', {
            date: this.i18n.formatDate(
              this.serverSnapshot.deletion_requested_at,
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }
            ),
          }),
          'info'
        );
        panel.appendChild(info.element);
      }

      if (this.dangerState.error) {
        const error = createFormMessage({ tone: 'error', className: 'mt-3 block' });
        error.show(this.dangerState.error, 'error');
        panel.appendChild(error.element);
      }

      const deleteButton = createTextButton({
        text: this.i18n.t('profileSettings.danger.delete'),
        tone: 'danger',
        size: 'sm',
        className: `${SECTION_ACTION_BUTTON_CLASS} mt-3`,
        loading: this.dangerState.saving,
        loadingText: this.i18n.t('profileSettings.danger.delete'),
        disabled:
          this.dangerState.saving ||
          Boolean(this.serverSnapshot?.deletion_requested_at),
        onClick: () => {
          void this.requestDeleteAccount();
        },
      });
      deleteButton.dataset.role = 'profile-settings-delete-button';
      panel.appendChild(deleteButton);
      content.appendChild(panel);
    }

    actions.remove();
    return element;
  }

  private createPasswordField(options: {
    field: ProfileSettingsPasswordField;
    label: string;
    autoComplete: string;
    onInput: () => void;
    onKeyDown: (event: KeyboardEvent) => void;
  }): RenderedPasswordField {
    const presentation = this.getSecurityFieldPresentation(options.field);
    const control = createInput({
      kind: 'password',
      name: options.field,
      value: this.passwordDraft[options.field],
      autoComplete: options.autoComplete,
      placeholder: options.label,
      inputClassName: 'text-base md:text-sm',
      passwordToggleLabels: {
        show: this.i18n.t('login.showPassword'),
        hide: this.i18n.t('login.hidePassword'),
      },
      disabled: this.securityState.saving,
      invalid: Boolean(presentation.error),
      onInput: (value) => {
        this.passwordDraft[options.field] = value;
        options.onInput();
      },
      onKeyDown: options.onKeyDown,
    });
    control.input.dataset.role = SECURITY_INPUT_ROLE_BY_FIELD[options.field];
    control.input.autocapitalize = 'none';
    control.input.setAttribute('autocorrect', 'off');

    const field = createField({
      label: options.label,
      control: control.element,
      className: 'mb-0',
      error: presentation.error,
      hint: presentation.hint,
      disabled: this.securityState.saving,
    });
    return {
      element: field.element,
      input: control.input,
      control,
      field,
    };
  }

  private clearSuccessTimeout(
    section: 'account' | 'language' | 'wallpaper' | 'security'
  ): void {
    const timeoutId =
      section === 'account'
        ? this.accountSuccessTimeoutId
        : section === 'language'
        ? this.languageSuccessTimeoutId
        : section === 'wallpaper'
          ? this.wallpaperSuccessTimeoutId
          : this.securitySuccessTimeoutId;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    if (section === 'account') {
      this.accountSuccessTimeoutId = null;
      return;
    }
    if (section === 'language') {
      this.languageSuccessTimeoutId = null;
      return;
    }
    if (section === 'wallpaper') {
      this.wallpaperSuccessTimeoutId = null;
      return;
    }
    this.securitySuccessTimeoutId = null;
  }

  private showSectionSuccess(
    section: 'account' | 'language' | 'wallpaper' | 'security'
  ): void {
    this.clearSuccessTimeout(section);
    if (section === 'account') {
      this.accountState.success = true;
      this.accountSuccessTimeoutId = window.setTimeout(() => {
        this.accountSuccessTimeoutId = null;
        this.accountState.success = false;
        if (this.overlay) this.renderBody();
      }, 2400);
      return;
    }
    if (section === 'language') {
      this.languageState.success = true;
      this.languageSuccessTimeoutId = window.setTimeout(() => {
        this.languageSuccessTimeoutId = null;
        this.languageState.success = false;
        if (this.overlay) this.renderBody();
      }, 2400);
      return;
    }
    if (section === 'wallpaper') {
      this.wallpaperState.success = true;
      this.wallpaperSuccessTimeoutId = window.setTimeout(() => {
        this.wallpaperSuccessTimeoutId = null;
        this.wallpaperState.success = false;
        if (this.overlay) this.renderBody();
      }, 2400);
      return;
    }
    this.securityState.success = true;
    this.securitySuccessTimeoutId = window.setTimeout(() => {
      this.securitySuccessTimeoutId = null;
      this.securityState.success = false;
      if (this.overlay) this.renderBody();
    }, 2400);
  }

  private validatePasswordDraft(): SecurityFieldErrors {
    const fieldErrors: SecurityFieldErrors = {};

    if (this.passwordDraft.oldPassword.trim().length === 0) {
      fieldErrors.oldPassword = this.i18n.t(
        'profileSettings.security.oldPasswordRequired'
      );
    }

    if (this.passwordDraft.newPassword.length === 0) {
      fieldErrors.newPassword = this.i18n.t(
        'profileSettings.security.newPasswordRequired'
      );
    } else if (this.passwordDraft.newPassword.length < 8) {
      fieldErrors.newPassword = this.i18n.t(
        'profileSettings.security.passwordMinLength'
      );
    }

    if (this.passwordDraft.confirmPassword.length === 0) {
      fieldErrors.confirmPassword = this.i18n.t(
        'profileSettings.security.confirmPasswordRequired'
      );
    } else if (
      this.passwordDraft.newPassword.length > 0 &&
      this.passwordDraft.newPassword !== this.passwordDraft.confirmPassword
    ) {
      fieldErrors.confirmPassword = this.i18n.t(
        'profileSettings.security.passwordMismatch'
      );
    }

    return fieldErrors;
  }

  private getSecurityDisclosureDescription(): string {
    if (this.securityState.success) {
      return this.i18n.t('profileSettings.security.updatedDescription');
    }
    return this.i18n.t('profileSettings.security.changePasswordDescription');
  }

  private getSecurityFieldPresentation(
    field: ProfileSettingsPasswordField
  ): { error?: string; hint?: string } {
    const savedError = this.securityState.fieldErrors[field];
    if (savedError) {
      return { error: savedError };
    }

    if (field === 'newPassword') {
      return {
        hint: this.i18n.t('profileSettings.security.passwordHint'),
      };
    }

    if (
      field === 'confirmPassword' &&
      this.passwordDraft.confirmPassword.length > 0
    ) {
      if (this.passwordDraft.newPassword !== this.passwordDraft.confirmPassword) {
        return {
          error: this.i18n.t('profileSettings.security.passwordMismatch'),
        };
      }
      if (this.passwordDraft.newPassword.length >= 8) {
        return {
          hint: this.i18n.t('profileSettings.security.passwordMatch'),
        };
      }
    }

    return {};
  }

  private getFirstSecurityErrorField(
    fieldErrors: SecurityFieldErrors
  ): ProfileSettingsPasswordField | null {
    const orderedFields: ProfileSettingsPasswordField[] = [
      'oldPassword',
      'newPassword',
      'confirmPassword',
    ];
    return orderedFields.find((field) => Boolean(fieldErrors[field])) ?? null;
  }

  private focusSecurityField(field: ProfileSettingsPasswordField): void {
    window.requestAnimationFrame(() => {
      const input = this.overlay?.querySelector<HTMLInputElement>(
        `input[data-role="${SECURITY_INPUT_ROLE_BY_FIELD[field]}"]`
      );
      input?.focus();
    });
  }

  private clearSecurityFieldErrors(
    ...fields: ProfileSettingsPasswordField[]
  ): void {
    if (fields.length === 0) return;

    const nextFieldErrors = { ...this.securityState.fieldErrors };
    let changed = false;
    for (const field of fields) {
      if (!Object.prototype.hasOwnProperty.call(nextFieldErrors, field)) {
        continue;
      }
      delete nextFieldErrors[field];
      changed = true;
    }

    if (changed) {
      this.securityState.fieldErrors = nextFieldErrors;
    }
  }

  private handleSecurityInput(field: ProfileSettingsPasswordField): void {
    if (field === 'newPassword') {
      this.clearSecurityFieldErrors('newPassword', 'confirmPassword');
    } else {
      this.clearSecurityFieldErrors(field);
    }
    if (this.securityState.error) {
      this.securityState.error = null;
    }
  }

  private syncSecurityFormState(
    passwordFields: Record<ProfileSettingsPasswordField, RenderedPasswordField>,
    saveButton: HTMLButtonElement,
    errorMessage: ReturnType<typeof createFormMessage>
  ): void {
    (
      Object.keys(passwordFields) as ProfileSettingsPasswordField[]
    ).forEach((fieldName) => {
      const presentation = this.getSecurityFieldPresentation(fieldName);
      passwordFields[fieldName].field.setState({
        disabled: this.securityState.saving,
        error: presentation.error,
        hint: presentation.hint,
      });
      passwordFields[fieldName].control.setState({
        disabled: this.securityState.saving,
        invalid: Boolean(presentation.error),
      });
    });

    saveButton.disabled =
      this.securityState.saving || !this.isSecurityReadyToSubmit();

    if (this.securityState.error) {
      errorMessage.show(this.securityState.error, 'error');
    } else {
      errorMessage.clear();
    }
  }

  private isSecurityReadyToSubmit(): boolean {
    return (
      this.passwordDraft.oldPassword.trim().length > 0 &&
      this.passwordDraft.newPassword.length >= 8 &&
      this.passwordDraft.confirmPassword.length > 0 &&
      this.passwordDraft.newPassword === this.passwordDraft.confirmPassword
    );
  }

  private expandSecuritySection(): void {
    this.clearSuccessTimeout('security');
    this.passwordDraft = createEmptyPasswordDraft();
    this.securityState = createInitialSecurityState();
    this.securityExpanded = true;
    this.renderBody();
    this.focusSecurityField('oldPassword');
  }

  private collapseSecuritySection(): void {
    if (this.securityState.saving) return;
    this.clearSuccessTimeout('security');
    this.passwordDraft = createEmptyPasswordDraft();
    this.securityState = createInitialSecurityState();
    this.securityExpanded = false;
    this.renderBody();
  }

  private handleSecurityFieldKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (this.securityState.saving) return;
    void this.savePassword();
  }

  private parseChangePasswordErrorData(data: Record<string, unknown> | null): {
    fieldErrors: SecurityFieldErrors;
    error: string | null;
  } | null {
    if (!data) return null;

    const fieldErrors: SecurityFieldErrors = {};
    const oldPasswordMessage = firstErrorMessage(data.old_password);
    const newPasswordMessage = firstErrorMessage(data.new_password);
    const confirmPasswordMessage = firstErrorMessage(data.confirm_password);
    const detailMessage = firstErrorMessage(data.detail);

    if (oldPasswordMessage) {
      fieldErrors.oldPassword = oldPasswordMessage;
    }
    if (newPasswordMessage) {
      fieldErrors.newPassword = newPasswordMessage;
    }
    if (confirmPasswordMessage) {
      fieldErrors.confirmPassword = confirmPasswordMessage;
    }

    if (Object.keys(fieldErrors).length === 0 && !detailMessage) {
      return null;
    }

    return {
      fieldErrors,
      error: detailMessage ?? null,
    };
  }

  private async resolveChangePasswordError(error: unknown): Promise<{
    fieldErrors: SecurityFieldErrors;
    error: string | null;
  }> {
    const fallbackError = this.i18n.t('profileSettings.security.saveError');
    const directResolution = this.parseChangePasswordErrorData(
      error && typeof error === 'object'
        ? (error as Record<string, unknown>)
        : null
    );
    if (directResolution) {
      return directResolution;
    }

    const httpError = error as
      | {
          status?: number;
          json?: () => Observable<unknown>;
        }
      | undefined;

    if (!httpError || typeof httpError.json !== 'function') {
      return {
        fieldErrors: {},
        error: fallbackError,
      };
    }

    try {
      const payload = await firstValueFrom(httpError.json());
      const data =
        payload && typeof payload === 'object'
          ? (payload as Record<string, unknown>)
          : null;
      const parsedResolution = this.parseChangePasswordErrorData(data);
      if (parsedResolution) {
        return parsedResolution;
      }
      return {
        fieldErrors: {},
        error: fallbackError,
      };
    } catch {
      return {
        fieldErrors: {},
        error: fallbackError,
      };
    }
  }

  private buildChangePasswordPayload(): ChangePassword {
    return {
      old_password: this.passwordDraft.oldPassword,
      new_password: this.passwordDraft.newPassword,
      confirm_password: this.passwordDraft.confirmPassword,
    };
  }

  private async savePassword(): Promise<void> {
    if (this.securityState.saving) return;

    const fieldErrors = this.validatePasswordDraft();
    const firstInvalidField = this.getFirstSecurityErrorField(fieldErrors);
    if (firstInvalidField) {
      this.securityState = {
        saving: false,
        error: null,
        success: false,
        fieldErrors,
      };
      this.securityExpanded = true;
      this.renderBody();
      this.focusSecurityField(firstInvalidField);
      return;
    }

    this.securityState = {
      saving: true,
      error: null,
      success: false,
      fieldErrors: {},
    };
    this.securityExpanded = true;
    this.renderBody();

    try {
      await firstValueFrom(
        this.userApiService.changePassword(this.buildChangePasswordPayload())
      );
    } catch (error) {
      console.warn('Failed to update account password.', error);
      const resolvedError = await this.resolveChangePasswordError(error);
      this.securityState = {
        saving: false,
        error: resolvedError.error,
        success: false,
        fieldErrors: resolvedError.fieldErrors,
      };
      this.securityExpanded = true;
      this.renderBody();
      const firstErrorField = this.getFirstSecurityErrorField(
        resolvedError.fieldErrors
      );
      if (firstErrorField) {
        this.focusSecurityField(firstErrorField);
      }
      return;
    }

    this.passwordDraft = createEmptyPasswordDraft();
    this.securityState = createInitialSecurityState();
    this.securityExpanded = false;
    this.showSectionSuccess('security');
    this.renderBody();
  }

  private isLanguageDirty(): boolean {
    if (!this.serverSnapshot || !this.draft) return false;
    return (
      (normalizeAppLocale(this.serverSnapshot.language) ??
        this.runtime.i18n.getLocale()) !== this.draft.locale
    );
  }

  private async openWallpaperPicker(): Promise<void> {
    if (this.wallpaperState.saving || !this.serverSnapshot) return;
    const nextWallpaperId = await openWallpaperPickerModal({
      i18n: this.i18n,
      wallpapers: this.wallpaperService.wallpaperList,
      currentWallpaperId:
        this.serverSnapshot.wallpaper?.id ?? this.serverSnapshot.wallpaper_id,
      selectedWallpaperId: this.draft?.wallpaperId,
    });
    if (nextWallpaperId === null) return;
    await this.saveWallpaper(nextWallpaperId);
  }

  private async saveLanguage(): Promise<void> {
    if (!this.serverSnapshot || !this.draft || !this.isLanguageDirty()) return;

    const previousLocale = this.runtime.i18n.getLocale();
    const nextLocale = this.draft.locale;

    this.languageState = { saving: true, error: null, success: false };
    this.renderBody();
    this.runtime.setLocale(nextLocale);

    try {
      const updatedUser = await firstValueFrom(
        this.userApiService.setUserProfileLanguage(nextLocale)
      );
      this.serverSnapshot = updatedUser;
      this.draft = toDraft(updatedUser, this.runtime.i18n.getLocale());
      this.onUserUpdated?.(updatedUser);
    } catch (error) {
      console.warn('Failed to persist profile language.', error);
      this.runtime.setLocale(previousLocale);
      this.languageState = {
        saving: false,
        error: this.i18n.t('profileSettings.language.saveError'),
        success: false,
      };
      this.renderBody();
      return;
    }

    this.languageState = { saving: false, error: null, success: false };
    this.showSectionSuccess('language');
    this.renderBody();
  }

  private async saveWallpaper(nextWallpaperId: string | null): Promise<void> {
    if (!this.serverSnapshot || !this.draft) return;
    const previousWallpaperId = normalizeWallpaperId(
      this.serverSnapshot.wallpaper?.id ?? this.serverSnapshot.wallpaper_id
    );
    if (previousWallpaperId === nextWallpaperId) return;
    const previousWallpaper =
      this.wallpaperService.findWallpaperById(previousWallpaperId);
    const nextWallpaper = this.wallpaperService.findWallpaperById(
      nextWallpaperId
    );

    this.wallpaperState = { saving: true, error: null, success: false };
    this.renderBody();
    this.wallpaperService.setDefaultWallpaper(nextWallpaper);

    try {
      const updatedUser = await firstValueFrom(
        this.userApiService.setUserWallpaper(nextWallpaperId)
      );
      this.serverSnapshot = updatedUser;
      this.draft = toDraft(updatedUser, this.runtime.i18n.getLocale());
      this.onUserUpdated?.(updatedUser);
      this.wallpaperService.setDefaultWallpaper(
        updatedUser.wallpaper ??
          this.wallpaperService.findWallpaperById(updatedUser.wallpaper_id)
      );
    } catch (error) {
      console.warn('Failed to persist profile wallpaper.', error);
      this.wallpaperService.setDefaultWallpaper(previousWallpaper);
      this.wallpaperState = {
        saving: false,
        error: this.i18n.t('profileSettings.appearance.saveError'),
        success: false,
      };
      this.renderBody();
      return;
    }

    this.wallpaperState = { saving: false, error: null, success: false };
    this.showSectionSuccess('wallpaper');
    this.renderBody();
  }

  private async requestDeleteAccount(): Promise<void> {
    if (this.dangerState.saving || !this.serverSnapshot) return;

    const confirmed = await this.confirmDeleteAccount({
      accountLabel: this.serverSnapshot.email || this.serverSnapshot.username,
    });
    if (!confirmed) return;

    this.dangerState = { saving: true, error: null, success: false };
    this.renderBody();

    try {
      await firstValueFrom(this.userApiService.deleteUser());
      notify(this.i18n.t('profileSettings.delete.success'), 'info');
      this.close();
      this.onAccountDeleted?.();
    } catch (error) {
      console.warn('Failed to request account deletion.', error);
      this.dangerExpanded = true;
      this.dangerState = {
        saving: false,
        error: this.i18n.t('profileSettings.danger.deleteError'),
        success: false,
      };
      this.renderBody();
    }
  }
}
