import { firstValueFrom, type Subscription } from 'rxjs';
import { environment } from '../config/environment.ts';
import {
  IS_DEVELOPMENT_MODE,
  KANBAN_DEV_ENABLED,
  ROUTINES_ENABLED,
  TIME_CLUSTERING_DEV_ENABLED,
} from '../config/env/index.ts';
import { performManualLogout } from '../features/canvas/ui/auth/manualLogout.ts';
import {
  AuthController,
  type AuthState,
} from '../features/canvas/ui/auth/AuthController.ts';
import { openTopbarDropdown } from '../features/canvas/ui/components/topbarDropdownLayout.ts';
import { createAccountMenuProfileSection } from '../features/canvas/ui/components/accountMenuProfileSection.ts';
import { HabitsQuickModal } from '../features/shell/components/HabitsQuickModal.ts';
import {
  AnchoredMenu,
  createDivider,
  createDropdownItem,
  createSidebarRailButton,
  createSurface,
  setSidebarRailButtonActive,
  SIDEBAR_TOKENS,
} from '../features/canvas/ui/primitives/index.ts';
import { WorkspaceControlsBar } from '../features/shell/WorkspaceControlsBar.ts';
import {
  createLocaleSubmenu,
  type LocaleSubmenuHandle,
} from '../features/canvas/ui/components/LocaleSubmenu.ts';
import {
  loadPersistedAiAssistantOpen,
  loadPersistedTimeClusteringOpen,
  loadPersistedWorkspaceView,
} from '../features/shell/workspaceUiState.ts';
import {
  emitAiAssistantToggleRequested,
  AI_ASSISTANT_VISIBILITY_CHANGED_EVENT,
  isAiAssistantVisibilityChangedDetail,
} from '../features/ai-assistant/aiAssistantEvents.ts';
import {
  emitTimeClusteringToggleRequested,
  TIME_CLUSTERING_LAYOUT_MODE_CHANGED_EVENT,
  TIME_CLUSTERING_VISIBILITY_CHANGED_EVENT,
  WORKSPACE_VIEW_CHANGED_EVENT,
  isTimeClusteringLayoutModeChangedDetail,
  isTimeClusteringVisibilityChangedDetail,
  isWorkspaceViewChangedDetail,
} from '../features/shell/workspaceEvents.ts';
import { AuthService } from '../majom-wrapper/data-access/auth-service.ts';
import { HttpInterceptorClient } from '../majom-wrapper/data-access/http-interceptor.ts';
import { UserApiService } from '../majom-wrapper/data-access/user-api-service.ts';
import { type AppLocale, type I18nService } from '../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../app-runtime/index.ts';

export const GLOBAL_APP_SIDEBAR_WIDTH_PX = IS_DEVELOPMENT_MODE
  ? SIDEBAR_TOKENS.compactWidthPx
  : 0;
export const GLOBAL_APP_SIDEBAR_OFFSET_CSS_VALUE =
  'var(--majom-global-app-sidebar-offset, 0px)';

const GLOBAL_APP_SIDEBAR_Z_INDEX = 260;
const GLOBAL_APP_SIDEBAR_OFFSET_CSS_VAR = '--majom-global-app-sidebar-offset';
const GLOBAL_APP_SIDEBAR_CLASS =
  'fixed inset-y-0 left-0 box-border flex flex-col items-stretch justify-start gap-3 border-r border-slate-200/85 bg-white px-2 py-3';
const GLOBAL_APP_SIDEBAR_BRAND_CLASS =
  'mb-4 flex w-full items-center justify-center';
const GLOBAL_APP_SIDEBAR_BRAND_BADGE_CLASS =
  'inline-flex h-10 w-10 items-center justify-center';
const GLOBAL_APP_SIDEBAR_MENU_CLUSTER_CLASS =
  'relative mt-auto flex w-full shrink-0 flex-col items-center gap-1.5';

const setGlobalAppSidebarOffset = (offsetPx: number): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(
    GLOBAL_APP_SIDEBAR_OFFSET_CSS_VAR,
    `${offsetPx}px`
  );
};

export class GlobalAppHeader {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly element: HTMLDivElement | null;
  private readonly authService = new AuthService();
  private readonly userApiService = new UserApiService(
    new HttpInterceptorClient(environment.apiUrl)
  );
  private readonly authController = new AuthController(
    this.authService,
    this.userApiService
  );
  private readonly controls: WorkspaceControlsBar | null;
  private readonly routinesModal: HabitsQuickModal | null;
  private readonly routinesButton: HTMLButtonElement | null;
  private readonly timeClusteringButton: HTMLButtonElement | null;
  private readonly chatButton: HTMLButtonElement | null;
  private readonly menuContainer: HTMLDivElement | null;
  private readonly menuButton: HTMLButtonElement | null;
  private readonly menuPanel: HTMLDivElement | null;
  private readonly menuController: AnchoredMenu | null;
  private readonly viewChangedHandler: (event: Event) => void;
  private readonly chatVisibilityChangedHandler: (event: Event) => void;
  private readonly timeClusteringLayoutModeChangedHandler: (
    event: Event
  ) => void;
  private readonly timeClusteringVisibilityChangedHandler: (
    event: Event
  ) => void;
  private stateSubscription: Subscription | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private localeSubmenu: LocaleSubmenuHandle | null = null;
  private localePersistInFlight = false;
  private authState: AuthState = {
    isAuthenticated: this.authService.isLoggedIn(),
    isLoginRequested: false,
    isSubmitting: false,
    isUserLoading: false,
    user: null,
    error: null,
  };

  constructor(runtime: AppRuntime = createAppRuntime()) {
    this.runtime = runtime;
    this.i18n = runtime.i18n;
    this.viewChangedHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isWorkspaceViewChangedDetail(customEvent.detail)) return;
      this.controls?.setActiveView(customEvent.detail.view);
    };
    this.chatVisibilityChangedHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isAiAssistantVisibilityChangedDetail(customEvent.detail)) return;
      this.controls?.setChatOpen(customEvent.detail.open);
      this.syncChatButtonState(customEvent.detail.open);
    };
    this.timeClusteringVisibilityChangedHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isTimeClusteringVisibilityChangedDetail(customEvent.detail)) return;
      this.controls?.setTimeClusteringOpen(customEvent.detail.open);
      this.syncTimeClusteringButtonState(customEvent.detail.open);
    };
    this.timeClusteringLayoutModeChangedHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isTimeClusteringLayoutModeChangedDetail(customEvent.detail)) return;
      this.controls?.setTimeClusteringLayoutMode(customEvent.detail.mode);
    };

    if (!IS_DEVELOPMENT_MODE || GLOBAL_APP_SIDEBAR_WIDTH_PX <= 0) {
      this.element = null;
      this.controls = null;
      this.routinesModal = null;
      this.routinesButton = null;
      this.timeClusteringButton = null;
      this.chatButton = null;
      this.menuContainer = null;
      this.menuButton = null;
      this.menuPanel = null;
      this.menuController = null;
      return;
    }

    const element = document.createElement('div');
    element.id = 'global-app-header';
    element.className = GLOBAL_APP_SIDEBAR_CLASS;
    element.style.width = `${GLOBAL_APP_SIDEBAR_WIDTH_PX}px`;
    element.style.zIndex = `${GLOBAL_APP_SIDEBAR_Z_INDEX}`;

    const brand = document.createElement('div');
    brand.className = GLOBAL_APP_SIDEBAR_BRAND_CLASS;

    const brandBadge = document.createElement('div');
    brandBadge.className = GLOBAL_APP_SIDEBAR_BRAND_BADGE_CLASS;

    const brandIcon = document.createElement('img');
    brandIcon.src = '/favicon.svg';
    brandIcon.alt = 'Majom';
    brandIcon.width = 24;
    brandIcon.height = 24;
    brandBadge.appendChild(brandIcon);
    brand.appendChild(brandBadge);

    const initialChatOpen = loadPersistedAiAssistantOpen();
    const initialTimeClusteringOpen = loadPersistedTimeClusteringOpen(
      TIME_CLUSTERING_DEV_ENABLED
    );
    const initialWorkspaceView = loadPersistedWorkspaceView({
      allowKanban: KANBAN_DEV_ENABLED,
    });
    this.routinesModal = ROUTINES_ENABLED
      ? new HabitsQuickModal(undefined, this.runtime)
      : null;

    this.controls = new WorkspaceControlsBar({
      runtime: this.runtime,
      initialView: initialWorkspaceView,
      initialChatOpen,
      initialTimeClusteringOpen,
      initialTimeClusteringLayoutMode: 'docked-left',
      showKanban: KANBAN_DEV_ENABLED,
      showTimeClustering: false,
      showRoutines: false,
      showChat: false,
      variant: 'sidebar',
    });
    this.controls.element.classList.add('w-full', 'flex-1');

    this.menuContainer = document.createElement('div');
    this.menuContainer.className = GLOBAL_APP_SIDEBAR_MENU_CLUSTER_CLASS;

    this.routinesButton = this.routinesModal
      ? this.createSidebarActionButton({
          title: this.i18n.t('header.routines'),
          ariaLabel: this.i18n.t('header.openRoutines'),
          iconName: 'check-circle',
          onClick: () => {
            this.routinesModal?.open();
          },
        })
      : null;

    this.timeClusteringButton = TIME_CLUSTERING_DEV_ENABLED
      ? this.createSidebarActionButton({
          title: this.i18n.t('header.timeClustering'),
          ariaLabel: this.i18n.t('header.toggleTimeClusteringPanel'),
          iconName: 'rectangle-stack',
          onClick: () => {
            emitTimeClusteringToggleRequested();
          },
        })
      : null;
    this.syncTimeClusteringButtonState(initialTimeClusteringOpen);

    this.chatButton = this.createSidebarActionButton({
      title: this.i18n.t('header.aiAssistant'),
      ariaLabel: this.i18n.t('header.toggleAiAssistantPanel'),
      iconName: 'chat-bubble-left',
      onClick: () => {
        emitAiAssistantToggleRequested();
      },
    });
    this.syncChatButtonState(initialChatOpen);

    this.menuButton = createSidebarRailButton({
      icon: 'ellipsis-vertical',
      title: this.i18n.t('header.openAppMenu'),
      ariaLabel: this.i18n.t('header.openAppMenu'),
    });
    this.menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleMenu();
    });

    this.menuPanel = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 hidden min-w-[10rem] overflow-hidden',
    });
    this.menuPanel.style.zIndex = `${GLOBAL_APP_SIDEBAR_Z_INDEX + 1}`;

    this.menuController = new AnchoredMenu({
      container: this.menuContainer,
      panel: this.menuPanel,
      onOpenChange: (open) => {
        if (!this.menuButton) return;
        setSidebarRailButtonActive(this.menuButton, open);
        if (!open) {
          this.localeSubmenu?.close();
        }
      },
    });

    if (this.routinesButton) {
      this.menuContainer.appendChild(this.routinesButton);
    }
    if (this.timeClusteringButton) {
      this.menuContainer.appendChild(this.timeClusteringButton);
    }
    this.menuContainer.append(this.chatButton, this.menuButton, this.menuPanel);
    element.append(brand, this.controls.element, this.menuContainer);
    this.element = element;
  }

  public mount(parent: HTMLElement = document.body): void {
    if (!this.element || this.element.isConnected) return;
    parent.appendChild(this.element);
    setGlobalAppSidebarOffset(GLOBAL_APP_SIDEBAR_WIDTH_PX);
    this.menuController?.mount();
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.refreshTranslations();
    }, { emitCurrent: true });
    this.authController.initialize();
    this.stateSubscription = this.authController.state$.subscribe((state) => {
      this.authState = state;
      if (this.menuController?.isOpen()) {
        this.renderMenu();
      }
    });
    window.addEventListener(
      WORKSPACE_VIEW_CHANGED_EVENT,
      this.viewChangedHandler as EventListener
    );
    window.addEventListener(
      AI_ASSISTANT_VISIBILITY_CHANGED_EVENT,
      this.chatVisibilityChangedHandler as EventListener
    );
    window.addEventListener(
      TIME_CLUSTERING_LAYOUT_MODE_CHANGED_EVENT,
      this.timeClusteringLayoutModeChangedHandler as EventListener
    );
    window.addEventListener(
      TIME_CLUSTERING_VISIBILITY_CHANGED_EVENT,
      this.timeClusteringVisibilityChangedHandler as EventListener
    );
  }

  public unmount(): void {
    if (!this.element) return;
    setGlobalAppSidebarOffset(0);
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = null;
    window.removeEventListener(
      WORKSPACE_VIEW_CHANGED_EVENT,
      this.viewChangedHandler as EventListener
    );
    window.removeEventListener(
      AI_ASSISTANT_VISIBILITY_CHANGED_EVENT,
      this.chatVisibilityChangedHandler as EventListener
    );
    window.removeEventListener(
      TIME_CLUSTERING_LAYOUT_MODE_CHANGED_EVENT,
      this.timeClusteringLayoutModeChangedHandler as EventListener
    );
    window.removeEventListener(
      TIME_CLUSTERING_VISIBILITY_CHANGED_EVENT,
      this.timeClusteringVisibilityChangedHandler as EventListener
    );
    this.routinesModal?.destroy();
    this.localeSubmenu?.destroy();
    this.localeSubmenu = null;
    this.controls?.destroy();
    this.authController.destroy();
    this.menuController?.close();
    this.menuController?.unmount();
    this.element.remove();
  }

  private refreshTranslations(): void {
    if (this.routinesButton) {
      this.routinesButton.title = this.i18n.t('header.routines');
      this.routinesButton.setAttribute(
        'aria-label',
        this.i18n.t('header.openRoutines')
      );
    }
    if (this.timeClusteringButton) {
      this.timeClusteringButton.title = this.i18n.t('header.timeClustering');
      this.timeClusteringButton.setAttribute(
        'aria-label',
        this.i18n.t('header.toggleTimeClusteringPanel')
      );
    }
    if (this.chatButton) {
      this.chatButton.title = this.i18n.t('header.aiAssistant');
      this.chatButton.setAttribute(
        'aria-label',
        this.i18n.t('header.toggleAiAssistantPanel')
      );
    }
    if (this.menuButton) {
      this.menuButton.title = this.i18n.t('header.openAppMenu');
      this.menuButton.setAttribute(
        'aria-label',
        this.i18n.t('header.openAppMenu')
      );
    }
    if (this.menuController?.isOpen()) {
      this.renderMenu();
    }
  }

  private toggleMenu(): void {
    if (!this.menuButton || !this.menuPanel || !this.menuController) return;
    if (this.menuController.isOpen()) {
      this.menuController.close();
      return;
    }
    if (this.authState.isAuthenticated && !this.authState.user) {
      this.authController.loadUserIfNeeded();
    }
    this.renderMenu();
    openTopbarDropdown({
      controller: this.menuController,
      anchor: this.menuButton,
      align: 'end',
    });
  }

  private renderMenu(): void {
    if (!this.menuPanel || !this.menuController) return;
    this.localeSubmenu?.destroy();
    this.localeSubmenu = createLocaleSubmenu({
      i18n: this.i18n,
      currentLocale: this.i18n.getLocale(),
      disabled: this.localePersistInFlight,
      panelZIndex: GLOBAL_APP_SIDEBAR_Z_INDEX + 2,
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

    this.menuPanel.replaceChildren(
      ...createAccountMenuProfileSection(
        this.authState.user,
        this.authState.isUserLoading,
        {
          loadingLabel: this.i18n.t('common.accountLoading'),
        }
      ),
      this.localeSubmenu.trigger,
      createDivider(),
      logoutButton
    );
    if (this.menuController.isOpen()) {
      this.menuController.reposition();
    }
  }

  private handleLogout(): void {
    if (!this.authState.isAuthenticated) return;
    performManualLogout({
      logout: () => this.authController.logout(),
      onAfterLogout: () => this.menuController?.close(),
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

  private createSidebarActionButton(options: {
    title: string;
    ariaLabel: string;
    iconName:
      | 'chat-bubble-left'
      | 'ellipsis-vertical'
      | 'check-circle'
      | 'rectangle-stack';
    onClick: () => void;
  }): HTMLButtonElement {
    return createSidebarRailButton({
      icon: options.iconName,
      title: options.title,
      ariaLabel: options.ariaLabel,
      onClick: () => options.onClick(),
    });
  }

  private syncChatButtonState(open: boolean): void {
    if (!this.chatButton) return;
    setSidebarRailButtonActive(this.chatButton, open);
  }

  private syncTimeClusteringButtonState(open: boolean): void {
    if (!this.timeClusteringButton) return;
    setSidebarRailButtonActive(this.timeClusteringButton, open);
  }
}
