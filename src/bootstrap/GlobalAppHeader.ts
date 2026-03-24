import type { Subscription } from 'rxjs';
import { environment } from '../config/environment.ts';
import {
  IS_DEVELOPMENT_MODE,
  KANBAN_DEV_ENABLED,
  ROUTINES_ENABLED,
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
  createDropdownItem,
  createIconButton,
  createSurface,
} from '../features/canvas/ui/primitives/index.ts';
import { WorkspaceControlsBar } from '../features/shell/WorkspaceControlsBar.ts';
import {
  loadPersistedAiAssistantOpen,
  loadPersistedWorkspaceView,
} from '../features/shell/workspaceUiState.ts';
import {
  emitAiAssistantToggleRequested,
  AI_ASSISTANT_VISIBILITY_CHANGED_EVENT,
  isAiAssistantVisibilityChangedDetail,
} from '../features/ai-assistant/aiAssistantEvents.ts';
import {
  WORKSPACE_VIEW_CHANGED_EVENT,
  isWorkspaceViewChangedDetail,
} from '../features/shell/workspaceEvents.ts';
import { AuthService } from '../majom-wrapper/data-access/auth-service.ts';
import { HttpInterceptorClient } from '../majom-wrapper/data-access/http-interceptor.ts';
import { UserApiService } from '../majom-wrapper/data-access/user-api-service.ts';

export const GLOBAL_APP_SIDEBAR_WIDTH_PX = IS_DEVELOPMENT_MODE ? 72 : 0;
export const GLOBAL_APP_SIDEBAR_OFFSET_CSS_VALUE =
  'var(--majom-global-app-sidebar-offset, 0px)';

const GLOBAL_APP_SIDEBAR_Z_INDEX = 260;
const GLOBAL_APP_SIDEBAR_OFFSET_CSS_VAR = '--majom-global-app-sidebar-offset';

const setGlobalAppSidebarOffset = (offsetPx: number): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(
    GLOBAL_APP_SIDEBAR_OFFSET_CSS_VAR,
    `${offsetPx}px`
  );
};

export class GlobalAppHeader {
  private readonly element: HTMLDivElement | null;
  private readonly authService = new AuthService();
  private readonly authController = new AuthController(
    this.authService,
    new UserApiService(new HttpInterceptorClient(environment.apiUrl))
  );
  private readonly controls: WorkspaceControlsBar | null;
  private readonly routinesModal: HabitsQuickModal | null;
  private readonly routinesButton: HTMLButtonElement | null;
  private readonly chatButton: HTMLButtonElement | null;
  private readonly menuContainer: HTMLDivElement | null;
  private readonly menuButton: HTMLButtonElement | null;
  private readonly menuPanel: HTMLDivElement | null;
  private readonly menuController: AnchoredMenu | null;
  private readonly viewChangedHandler: (event: Event) => void;
  private readonly chatVisibilityChangedHandler: (event: Event) => void;
  private stateSubscription: Subscription | null = null;
  private authState: AuthState = {
    isAuthenticated: this.authService.isLoggedIn(),
    isLoginRequested: false,
    isSubmitting: false,
    isUserLoading: false,
    user: null,
    error: null,
  };

  constructor() {
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

    if (!IS_DEVELOPMENT_MODE || GLOBAL_APP_SIDEBAR_WIDTH_PX <= 0) {
      this.element = null;
      this.controls = null;
      this.routinesModal = null;
      this.routinesButton = null;
      this.chatButton = null;
      this.menuContainer = null;
      this.menuButton = null;
      this.menuPanel = null;
      this.menuController = null;
      return;
    }

    const element = document.createElement('div');
    element.id = 'global-app-header';
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.bottom = '0';
    element.style.width = `${GLOBAL_APP_SIDEBAR_WIDTH_PX}px`;
    element.style.zIndex = `${GLOBAL_APP_SIDEBAR_Z_INDEX}`;
    element.style.boxSizing = 'border-box';
    element.style.borderRight = '1px solid rgba(226, 232, 240, 0.92)';
    element.style.background = 'rgba(255, 255, 255, 1)';
    element.style.display = 'flex';
    element.style.flexDirection = 'column';
    element.style.alignItems = 'stretch';
    element.style.justifyContent = 'flex-start';
    element.style.padding = '12px 10px';
    element.style.gap = '12px';

    const brand = document.createElement('div');
    brand.style.display = 'flex';
    brand.style.alignItems = 'center';
    brand.style.justifyContent = 'center';
    brand.style.width = '100%';
    brand.style.marginBottom = '16px';

    const brandBadge = document.createElement('div');
    brandBadge.style.display = 'inline-flex';
    brandBadge.style.alignItems = 'center';
    brandBadge.style.justifyContent = 'center';
    brandBadge.style.width = '40px';
    brandBadge.style.height = '40px';
    brandBadge.style.border = 'none';
    brandBadge.style.background = 'none';

    const brandIcon = document.createElement('img');
    brandIcon.src = '/favicon.svg';
    brandIcon.alt = 'Majom';
    brandIcon.width = 24;
    brandIcon.height = 24;
    brandBadge.appendChild(brandIcon);
    brand.appendChild(brandBadge);

    const initialChatOpen = loadPersistedAiAssistantOpen();
    this.routinesModal = ROUTINES_ENABLED ? new HabitsQuickModal() : null;

    this.controls = new WorkspaceControlsBar({
      initialView: loadPersistedWorkspaceView({
        allowKanban: KANBAN_DEV_ENABLED,
      }),
      initialChatOpen,
      showKanban: KANBAN_DEV_ENABLED,
      showRoutines: false,
      showChat: false,
      variant: 'sidebar',
    });
    this.controls.element.style.width = '100%';
    this.controls.element.style.flex = '1 1 auto';

    this.menuContainer = document.createElement('div');
    this.menuContainer.style.position = 'relative';
    this.menuContainer.style.display = 'flex';
    this.menuContainer.style.alignItems = 'center';
    this.menuContainer.style.justifyContent = 'center';
    this.menuContainer.style.flexDirection = 'column';
    this.menuContainer.style.gap = '8px';
    this.menuContainer.style.width = '100%';
    this.menuContainer.style.marginTop = 'auto';
    this.menuContainer.style.flexShrink = '0';

    this.routinesButton = this.routinesModal
      ? this.createSidebarActionButton({
          title: 'Routines',
          ariaLabel: 'Open routines',
          iconName: 'check-circle',
          onClick: () => {
            this.routinesModal?.open();
          },
        })
      : null;

    this.chatButton = this.createSidebarActionButton({
      title: 'AI Assistant',
      ariaLabel: 'Toggle AI assistant panel',
      iconName: 'chat-bubble-left',
      onClick: () => {
        emitAiAssistantToggleRequested();
      },
    });
    this.syncChatButtonState(initialChatOpen);

    this.menuButton = createIconButton({
      icon: 'ellipsis-vertical',
      title: 'Open app menu',
      ariaLabel: 'Open app menu',
      tone: 'text',
      size: 'md',
      className:
        'border border-slate-200/90 text-slate-600 hover:bg-slate-100 hover:text-slate-800',
    });
    this.menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleMenu();
    });
    this.menuButton.style.alignSelf = 'center';
    this.menuButton.style.marginTop = '8px';

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
        this.menuButton.classList.toggle('bg-slate-100', open);
        this.menuButton.classList.toggle('text-slate-900', open);
      },
    });

    if (this.routinesButton) {
      this.menuContainer.appendChild(this.routinesButton);
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
  }

  public unmount(): void {
    if (!this.element) return;
    setGlobalAppSidebarOffset(0);
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
    this.routinesModal?.close();
    this.controls?.destroy();
    this.authController.destroy();
    this.menuController?.close();
    this.menuController?.unmount();
    this.element.remove();
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

    const logoutButton = createDropdownItem({
      label: 'Logout',
      variant: 'emphasis',
      disabled: !this.authState.isAuthenticated,
      onClick: () => this.handleLogout(),
    });

    this.menuPanel.replaceChildren(
      ...createAccountMenuProfileSection(
        this.authState.user,
        this.authState.isUserLoading
      ),
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

  private createSidebarActionButton(options: {
    title: string;
    ariaLabel: string;
    iconName: 'chat-bubble-left' | 'ellipsis-vertical' | 'check-circle';
    onClick: () => void;
  }): HTMLButtonElement {
    const button = createIconButton({
      icon: options.iconName,
      title: options.title,
      ariaLabel: options.ariaLabel,
      tone: 'text',
      size: 'md',
      className:
        'border border-slate-200/90 text-slate-600 hover:bg-slate-100 hover:text-slate-800',
    });
    button.style.alignSelf = 'center';
    button.addEventListener('click', options.onClick);
    return button;
  }

  private syncChatButtonState(open: boolean): void {
    if (!this.chatButton) return;
    this.chatButton.classList.toggle('bg-slate-100', open);
    this.chatButton.classList.toggle('text-slate-900', open);
  }
}
