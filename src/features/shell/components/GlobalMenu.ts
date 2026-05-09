import { firstValueFrom, type Subscription } from 'rxjs';
import { environment } from '../../../config/environment.ts';
import { performManualLogout } from '../../canvas/ui/auth/manualLogout.ts';
import {
  AuthController,
  type AuthState,
} from '../../canvas/ui/auth/AuthController.ts';
import {
  TOPBAR_DROPDOWN_GAP,
  TOPBAR_DROPDOWN_MARGIN,
} from '../../canvas/ui/components/topbarDropdownLayout.ts';
import { createAccountMenuProfileSection } from '../../canvas/ui/components/accountMenuProfileSection.ts';
import {
  AnchoredMenu,
  createDivider,
  createDropdownItem,
  createIconButton,
  type IconButtonTone,
  createSurface,
} from '../../canvas/ui/primitives/index.ts';
import {
  createLocaleSubmenu,
  type LocaleSubmenuHandle,
} from '../../canvas/ui/components/LocaleSubmenu.ts';
import { AuthService } from '../../../majom-wrapper/data-access/auth-service.ts';
import { HttpInterceptorClient } from '../../../majom-wrapper/data-access/http-interceptor.ts';
import { UserApiService } from '../../../majom-wrapper/data-access/user-api-service.ts';
import type { Wallpaper } from '../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { type AppLocale, type I18nService } from '../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import { WallpaperService } from '../services/WallpaperService.ts';
import { ProfileSettingsModal } from './ProfileSettingsModal.ts';
import { authFlowService } from '../../canvas/ui/auth/authFlowService.ts';

const GLOBAL_MENU_Z_INDEX = 46;

type ProfileSettingsWallpaperService = Pick<
  WallpaperService,
  'findWallpaperById' | 'setDefaultWallpaper'
> & {
  readonly wallpaperList: Wallpaper[];
};

type GlobalMenuOptions = {
  wallpaperService?: ProfileSettingsWallpaperService;
  triggerButtonTone?: IconButtonTone;
  triggerButtonSize?: 'sm' | 'md' | 'lg';
  triggerButtonIconStrokeWidth?: number;
  triggerButtonClassName?: string;
};

export class GlobalMenu {
  public readonly element: HTMLDivElement;
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly userApiService: UserApiService;
  private readonly profileSettingsModal: ProfileSettingsModal;
  private readonly button: HTMLButtonElement;
  private readonly panel: HTMLDivElement;
  private readonly controller: AnchoredMenu;
  private readonly authController: AuthController;
  private authState: AuthState = {
    isAuthenticated: false,
    isLoginRequested: false,
    isSubmitting: false,
    isUserLoading: false,
    user: null,
    error: null,
  };
  private stateSubscription: Subscription | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private localeSubmenu: LocaleSubmenuHandle | null = null;
  private localePersistInFlight = false;
  private mounted = false;

  constructor(
    runtime: AppRuntime = createAppRuntime(),
    options: GlobalMenuOptions = {}
  ) {
    this.runtime = runtime;
    this.i18n = runtime.i18n;
    this.userApiService = new UserApiService(
      new HttpInterceptorClient(environment.apiUrl)
    );
    this.authController = new AuthController(
      new AuthService(),
      this.userApiService
    );
    this.profileSettingsModal = new ProfileSettingsModal({
      runtime: this.runtime,
      userApiService: this.userApiService,
      wallpaperService:
        options.wallpaperService ??
        ({
          wallpaperList: [],
          findWallpaperById: () => null,
          setDefaultWallpaper: () => {},
        } satisfies ProfileSettingsWallpaperService),
      onUserUpdated: (user) => {
        this.authController.syncUser(user);
      },
      onLogout: () => this.handleLogout(),
      onAccountDeleted: () => {
        this.authController.logout();
        authFlowService.requestLogout('manual');
      },
    });

    this.element = document.createElement('div');
    this.element.className = 'relative flex items-center shrink-0';
    this.element.style.pointerEvents = 'auto';
    this.element.style.zIndex = `${GLOBAL_MENU_Z_INDEX}`;

    this.button = createIconButton({
      icon: 'ellipsis-vertical',
      tone: options.triggerButtonTone ?? 'soft',
      size: options.triggerButtonSize ?? 'md',
      iconStrokeWidth: options.triggerButtonIconStrokeWidth,
      className: options.triggerButtonClassName,
      title: this.i18n.t('header.openGlobalMenu'),
      ariaLabel: this.i18n.t('header.openGlobalMenu'),
      onClick: (event) => {
        event.stopPropagation();
        this.toggleMenu();
      },
    });

    this.panel = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 hidden min-w-[10rem] overflow-hidden',
    });
    this.panel.style.zIndex = `${GLOBAL_MENU_Z_INDEX + 1}`;

    this.controller = new AnchoredMenu({
      container: this.element,
      panel: this.panel,
      onOpenChange: (open) => {
        this.button.classList.toggle('bg-indigo-50', open);
        this.button.classList.toggle('text-indigo-700', open);
        if (!open) {
          this.localeSubmenu?.close();
        }
      },
    });

    this.element.append(this.button, this.panel);
  }

  public mount(): void {
    if (this.mounted) return;
    this.controller.mount();
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.refreshTranslations();
    }, { emitCurrent: true });
    this.authController.initialize();
    this.stateSubscription = this.authController.state$.subscribe((state) => {
      this.authState = state;
      if (this.controller.isOpen()) {
        this.renderMenu();
      }
    });
    this.mounted = true;
  }

  public unmount(): void {
    if (!this.mounted) return;
    this.close();
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = null;
    this.localeSubmenu?.destroy();
    this.localeSubmenu = null;
    this.profileSettingsModal.destroy();
    this.authController.destroy();
    this.controller.unmount();
    this.mounted = false;
  }

  public close(): void {
    this.localeSubmenu?.close();
    this.controller.close();
  }

  public isOpen(): boolean {
    return this.controller.isOpen();
  }

  private refreshTranslations(): void {
    this.button.title = this.i18n.t('header.openGlobalMenu');
    this.button.setAttribute('aria-label', this.i18n.t('header.openGlobalMenu'));
    if (this.controller.isOpen()) {
      this.renderMenu();
    }
  }

  private toggleMenu(): void {
    if (this.controller.isOpen()) {
      this.close();
      return;
    }
    if (this.authState.isAuthenticated && !this.authState.user) {
      this.authController.loadUserIfNeeded();
    }
    this.renderMenu();
    this.controller.openAt({
      anchor: this.button,
      placement: 'top-start',
      fallbackPlacements: ['top-end', 'bottom-start', 'bottom-end'],
      gap: TOPBAR_DROPDOWN_GAP,
      margin: TOPBAR_DROPDOWN_MARGIN,
      lockPlacementAfterOpen: true,
    });
  }

  private renderMenu(): void {
    this.localeSubmenu?.destroy();
    this.localeSubmenu = createLocaleSubmenu({
      i18n: this.i18n,
      currentLocale: this.i18n.getLocale(),
      disabled: this.localePersistInFlight,
      panelZIndex: GLOBAL_MENU_Z_INDEX + 2,
      onSelect: (locale) => {
        void this.handleLocaleChange(locale);
      },
    });

    const logoutButton = createDropdownItem({
      label: this.i18n.t('header.logout'),
      variant: 'emphasis',
      disabled: !this.authState.isAuthenticated,
      onClick: () => this.handleLogout(),
    });
    const profileSettingsButton = createDropdownItem({
      label: this.i18n.t('profileSettings.open'),
      disabled:
        !this.authState.isAuthenticated ||
        this.authState.isUserLoading ||
        !this.authState.user,
      onClick: () => {
        if (!this.authState.user) return;
        this.close();
        this.profileSettingsModal.open(this.authState.user);
      },
    });
    profileSettingsButton.dataset.role = 'profile-settings-open-button';

    this.panel.replaceChildren(
      ...createAccountMenuProfileSection(
        this.authState.user,
        this.authState.isUserLoading,
        {
          loadingLabel: this.i18n.t('common.accountLoading'),
        }
      ),
      profileSettingsButton,
      this.localeSubmenu.trigger,
      createDivider(),
      logoutButton
    );

    if (this.controller.isOpen()) {
      this.controller.reposition();
    }
  }

  private handleLogout(): void {
    if (!this.authState.isAuthenticated) return;
    performManualLogout({
      logout: () => this.authController.logout(),
      onAfterLogout: () => this.close(),
    });
  }

  private async handleLocaleChange(nextLocale: AppLocale): Promise<void> {
    if (this.localePersistInFlight) return;
    const previousLocale = this.i18n.getLocale();
    if (previousLocale === nextLocale) return;

    this.localePersistInFlight = true;
    this.runtime.setLocale(nextLocale);
    try {
      if (this.authState.isAuthenticated) {
        const updatedUser = await firstValueFrom(
          this.userApiService.setUserProfileLanguage(nextLocale)
        );
        this.authController.syncUser(updatedUser);
      }
    } catch (error: unknown) {
      console.warn('Failed to persist user language.', error);
      this.runtime.setLocale(previousLocale);
    } finally {
      this.localePersistInFlight = false;
      this.refreshTranslations();
    }
  }
}
