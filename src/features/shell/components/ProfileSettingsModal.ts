import { firstValueFrom } from 'rxjs';
import { createModalShell } from '../../../ui-lib/src/components/Modal.ts';
import {
  createDisclosureRow,
  createFormMessage,
  createTextButton,
} from '../../../ui-lib/src/hud/index.ts';
import { Select } from '../../../ui-lib/src/components/Select.ts';
import { notify } from '../../canvas/core/services/NotificationService.ts';
import type {
  User,
  Wallpaper,
} from '../../../majom-wrapper/interfaces/auth-interfaces.ts';
import {
  type AppLocale,
  type I18nService,
  normalizeAppLocale,
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
  'setUserProfileLanguage' | 'setUserWallpaper' | 'deleteUser'
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
  locale: AppLocale;
  wallpaperId: string | null;
};

type SectionState = {
  saving: boolean;
  error: string | null;
  success: boolean;
};

const SECTION_ACTION_BUTTON_CLASS =
  'w-full justify-center sm:w-auto sm:min-w-[5.5rem]';

function normalizeWallpaperId(
  value: string | number | null | undefined
): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function toDraft(user: User, fallbackLocale: AppLocale): ProfileSettingsDraft {
  return {
    locale: normalizeAppLocale(user.language) ?? fallbackLocale,
    wallpaperId: normalizeWallpaperId(user.wallpaper?.id ?? user.wallpaper_id),
  };
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
  return user.username?.trim() || user.email?.trim() || '';
}

function getAccountSecondaryText(user: User | null): string {
  if (!user) return '';
  const displayName = getAccountDisplayName(user);
  const email = user.email?.trim() ?? '';
  if (email.length > 0 && email !== displayName) {
    return email;
  }
  return '';
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
  private dangerState: SectionState = {
    saving: false,
    error: null,
    success: false,
  };
  private dangerExpanded = false;
  private languageSuccessTimeoutId: number | null = null;
  private wallpaperSuccessTimeoutId: number | null = null;

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
    this.languageState = { saving: false, error: null, success: false };
    this.wallpaperState = { saving: false, error: null, success: false };
    this.dangerState = { saving: false, error: null, success: false };
    this.dangerExpanded = Boolean(user.deletion_requested_at);
    this.clearSuccessTimeout('language');
    this.clearSuccessTimeout('wallpaper');

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
    this.languageState = { saving: false, error: null, success: false };
    this.wallpaperState = { saving: false, error: null, success: false };
    this.dangerState = { saving: false, error: null, success: false };
    this.dangerExpanded = false;
    this.clearSuccessTimeout('language');
    this.clearSuccessTimeout('wallpaper');
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

    actions.remove();
    return element;
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
      items: [
        {
          value: 'en',
          label: this.i18n.t('common.languageEnglish'),
        },
        {
          value: 'uk',
          label: this.i18n.t('common.languageUkrainian'),
        },
      ],
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

  private clearSuccessTimeout(section: 'language' | 'wallpaper'): void {
    const timeoutId =
      section === 'language'
        ? this.languageSuccessTimeoutId
        : this.wallpaperSuccessTimeoutId;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    if (section === 'language') {
      this.languageSuccessTimeoutId = null;
      return;
    }
    this.wallpaperSuccessTimeoutId = null;
  }

  private showSectionSuccess(section: 'language' | 'wallpaper'): void {
    this.clearSuccessTimeout(section);
    if (section === 'language') {
      this.languageState.success = true;
      this.languageSuccessTimeoutId = window.setTimeout(() => {
        this.languageSuccessTimeoutId = null;
        this.languageState.success = false;
        if (this.overlay) this.renderBody();
      }, 2400);
      return;
    }
    this.wallpaperState.success = true;
    this.wallpaperSuccessTimeoutId = window.setTimeout(() => {
      this.wallpaperSuccessTimeoutId = null;
      this.wallpaperState.success = false;
      if (this.overlay) this.renderBody();
    }, 2400);
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
