import type { Subscription } from 'rxjs';
import { environment } from '../config/environment.ts';
import { KANBAN_DEV_ENABLED, ROUTINES_ENABLED } from '../config/env/index.ts';
import { performManualLogout } from '../features/canvas/ui/auth/manualLogout.ts';
import {
  AuthController,
  type AuthState,
} from '../features/canvas/ui/auth/AuthController.ts';
import { openTopbarDropdown } from '../features/canvas/ui/components/topbarDropdownLayout.ts';
import { createAccountMenuProfileSection } from '../features/canvas/ui/components/accountMenuProfileSection.ts';
import {
  AnchoredMenu,
  createDropdownItem,
  createSurface,
} from '../features/canvas/ui/primitives/index.ts';
import { WorkspaceControlsBar } from '../features/shell/WorkspaceControlsBar.ts';
import {
  loadPersistedAiAssistantOpen,
  loadPersistedWorkspaceView,
} from '../features/shell/workspaceUiState.ts';
import {
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
import { createIcon } from '../ui-lib/src/hud/icons.ts';

export const GLOBAL_APP_HEADER_HEIGHT_PX = import.meta.env.DEV ? 48 : 0;

const GLOBAL_APP_HEADER_Z_INDEX = 260;

export class GlobalAppHeader {
  private readonly element: HTMLDivElement | null;
  private readonly authService = new AuthService();
  private readonly authController = new AuthController(
    this.authService,
    new UserApiService(new HttpInterceptorClient(environment.apiUrl))
  );
  private readonly controls: WorkspaceControlsBar | null;
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
    };

    if (!import.meta.env.DEV || GLOBAL_APP_HEADER_HEIGHT_PX <= 0) {
      this.element = null;
      this.controls = null;
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
    element.style.right = '0';
    element.style.height = `${GLOBAL_APP_HEADER_HEIGHT_PX}px`;
    element.style.zIndex = `${GLOBAL_APP_HEADER_Z_INDEX}`;
    element.style.boxSizing = 'border-box';
    element.style.borderBottom = '1px solid rgba(226, 232, 240, 0.92)';
    element.style.background = 'rgba(255, 255, 255, 0.9)';
    element.style.backdropFilter = 'blur(12px)';
    element.style.webkitBackdropFilter = 'blur(12px)';
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.padding = '0 12px';

    this.controls = new WorkspaceControlsBar({
      initialView: loadPersistedWorkspaceView({
        allowKanban: KANBAN_DEV_ENABLED,
      }),
      initialChatOpen: loadPersistedAiAssistantOpen(),
      showKanban: KANBAN_DEV_ENABLED,
      showRoutines: ROUTINES_ENABLED,
      variant: 'header',
    });
    this.controls.element.style.maxWidth = 'calc(100% - 88px)';

    this.menuContainer = document.createElement('div');
    this.menuContainer.style.position = 'absolute';
    this.menuContainer.style.top = '50%';
    this.menuContainer.style.right = '12px';
    this.menuContainer.style.transform = 'translateY(-50%)';
    this.menuContainer.style.display = 'flex';
    this.menuContainer.style.alignItems = 'center';
    this.menuContainer.style.flexShrink = '0';

    this.menuButton = document.createElement('button');
    this.menuButton.type = 'button';
    this.menuButton.title = 'Open header menu';
    this.menuButton.setAttribute('aria-label', 'Open header menu');
    this.menuButton.style.display = 'inline-flex';
    this.menuButton.style.alignItems = 'center';
    this.menuButton.style.justifyContent = 'center';
    this.menuButton.style.width = '28px';
    this.menuButton.style.height = '28px';
    this.menuButton.style.padding = '0';
    this.menuButton.style.border = 'none';
    this.menuButton.style.borderRadius = '8px';
    this.menuButton.style.background = 'transparent';
    this.menuButton.style.color = '#475569';
    this.menuButton.style.cursor = 'pointer';
    this.menuButton.style.transition =
      'background-color 120ms ease, color 120ms ease';
    this.menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleMenu();
    });
    const menuIcon = createIcon('ellipsis-vertical', {
      size: 16,
      strokeWidth: 1.9,
    });
    menuIcon.setAttribute('aria-hidden', 'true');
    this.menuButton.appendChild(menuIcon);

    this.menuPanel = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 hidden min-w-[10rem] overflow-hidden',
    });
    this.menuPanel.style.zIndex = `${GLOBAL_APP_HEADER_Z_INDEX + 1}`;

    this.menuController = new AnchoredMenu({
      container: this.menuContainer,
      panel: this.menuPanel,
      onOpenChange: (open) => {
        if (!this.menuButton) return;
        this.menuButton.style.background = open ? '#f1f5f9' : 'transparent';
        this.menuButton.style.color = open ? '#0f172a' : '#475569';
      },
    });

    this.menuContainer.append(this.menuButton, this.menuPanel);
    element.append(this.controls.element, this.menuContainer);
    this.element = element;
  }

  public mount(parent: HTMLElement = document.body): void {
    if (!this.element || this.element.isConnected) return;
    parent.appendChild(this.element);
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
}
