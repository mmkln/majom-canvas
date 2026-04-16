import {
  IS_DEVELOPMENT_MODE,
  KANBAN_DEV_ENABLED,
  LEARNING_STUDIO_DEV_ENABLED,
  ROUTINES_ENABLED,
  TIME_CLUSTERING_DEV_ENABLED,
} from '../config/env/index.ts';
import { HabitsQuickModal } from '../features/shell/components/HabitsQuickModal.ts';
import type { HabitsQuickStatusSnapshot } from '../features/shell/components/HabitsQuickModal.ts';
import { NotesQuickModal } from '../features/shell/components/NotesQuickModal.ts';
import {
  createSidebarRailButton,
  setSidebarRailButtonActive,
  setSidebarRailButtonBadge,
  SIDEBAR_TOKENS,
} from '../features/canvas/ui/primitives/index.ts';
import { WorkspaceControlsBar } from '../features/shell/WorkspaceControlsBar.ts';
import { EnergySelectorControl } from '../features/shell/components/EnergySelectorControl.ts';
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
import { type I18nService } from '../i18n/index.ts';
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
  private readonly controls: WorkspaceControlsBar | null;
  private readonly routinesModal: HabitsQuickModal | null;
  private readonly notesModal: NotesQuickModal | null;
  private readonly routinesButton: HTMLButtonElement | null;
  private readonly notesButton: HTMLButtonElement | null;
  private readonly timeClusteringButton: HTMLButtonElement | null;
  private readonly chatButton: HTMLButtonElement | null;
  private readonly energyControl: EnergySelectorControl | null;
  private readonly menuContainer: HTMLDivElement | null;
  private routinesStatus: HabitsQuickStatusSnapshot = {
    openCount: 0,
    completedCount: 0,
    totalDue: 0,
    archivedCount: 0,
    activeCount: 0,
  };
  private readonly viewChangedHandler: (event: Event) => void;
  private readonly chatVisibilityChangedHandler: (event: Event) => void;
  private readonly timeClusteringLayoutModeChangedHandler: (
    event: Event
  ) => void;
  private readonly timeClusteringVisibilityChangedHandler: (
    event: Event
  ) => void;
  private disposeRuntimeSubscription: (() => void) | null = null;

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
      this.notesModal = null;
      this.routinesButton = null;
      this.notesButton = null;
      this.timeClusteringButton = null;
      this.chatButton = null;
      this.energyControl = null;
      this.menuContainer = null;
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
    this.routinesModal = ROUTINES_ENABLED
      ? new HabitsQuickModal(undefined, this.runtime, {
          onOpenChange: (open) => this.syncRoutinesButtonState(open),
          onStatusChange: (snapshot) => this.syncRoutinesStatus(snapshot),
        })
      : null;
    this.notesModal = new NotesQuickModal(undefined, this.runtime, {
      onOpenChange: (open) => this.syncNotesButtonState(open),
    });

    this.controls = new WorkspaceControlsBar({
      runtime: this.runtime,
      initialView: 'canvas',
      initialChatOpen,
      initialTimeClusteringOpen,
      initialTimeClusteringLayoutMode: 'docked-left',
      showKanban: KANBAN_DEV_ENABLED,
      showLearningStudio: LEARNING_STUDIO_DEV_ENABLED,
      showTimeClustering: false,
      showRoutines: false,
      showNotes: false,
      showChat: false,
      showEnergy: false,
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
    this.syncRoutinesButtonState(false);
    this.syncRoutinesStatus(this.routinesStatus);

    this.notesButton = this.createSidebarActionButton({
      title: this.i18n.t('header.notes'),
      ariaLabel: this.i18n.t('header.openNotes'),
      iconName: 'document',
      onClick: () => {
        this.notesModal?.open();
      },
    });
    this.syncNotesButtonState(false);

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
    this.energyControl = new EnergySelectorControl({
      runtime: this.runtime,
      variant: 'sidebar',
    });

    this.menuContainer.appendChild(this.energyControl.element);
    if (this.routinesButton) {
      this.menuContainer.appendChild(this.routinesButton);
    }
    if (this.notesButton) {
      this.menuContainer.appendChild(this.notesButton);
    }
    if (this.timeClusteringButton) {
      this.menuContainer.appendChild(this.timeClusteringButton);
    }
    this.menuContainer.append(this.chatButton);
    element.append(brand, this.controls.element, this.menuContainer);
    this.element = element;
  }

  public mount(parent: HTMLElement = document.body): void {
    if (!this.element || this.element.isConnected) return;
    this.controls?.setActiveView(
      loadPersistedWorkspaceView({
        allowKanban: KANBAN_DEV_ENABLED,
        allowLearningStudio: LEARNING_STUDIO_DEV_ENABLED,
      })
    );
    parent.appendChild(this.element);
    setGlobalAppSidebarOffset(GLOBAL_APP_SIDEBAR_WIDTH_PX);
    this.routinesModal?.prime();
    this.notesModal?.prime();
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.refreshTranslations();
    }, { emitCurrent: true });
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
    this.notesModal?.destroy();
    this.controls?.destroy();
    this.energyControl?.destroy();
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
    if (this.notesButton) {
      this.notesButton.title = this.i18n.t('header.notes');
      this.notesButton.setAttribute(
        'aria-label',
        this.i18n.t('header.openNotes')
      );
    }
    if (this.chatButton) {
      this.chatButton.title = this.i18n.t('header.aiAssistant');
      this.chatButton.setAttribute(
        'aria-label',
        this.i18n.t('header.toggleAiAssistantPanel')
      );
    }
  }

  private createSidebarActionButton(options: {
    title: string;
    ariaLabel: string;
    iconName:
      | 'chat-bubble-left'
      | 'bookmark-square'
      | 'document'
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

  private syncRoutinesButtonState(open: boolean): void {
    if (!this.routinesButton) return;
    setSidebarRailButtonActive(this.routinesButton, open);
  }

  private syncRoutinesStatus(snapshot: HabitsQuickStatusSnapshot): void {
    this.routinesStatus = snapshot;
    if (!this.routinesButton) return;
    const badge = setSidebarRailButtonBadge(
      this.routinesButton,
      snapshot.openCount > 0
        ? {
            variant: 'count',
            tone: 'success',
            value: snapshot.openCount,
            max: 9,
          }
        : null
    );
    if (badge) {
      badge.dataset.role = 'global-routines-button-badge';
    }
  }

  private syncNotesButtonState(open: boolean): void {
    if (!this.notesButton) return;
    setSidebarRailButtonActive(this.notesButton, open);
  }

  private syncTimeClusteringButtonState(open: boolean): void {
    if (!this.timeClusteringButton) return;
    setSidebarRailButtonActive(this.timeClusteringButton, open);
  }
}
