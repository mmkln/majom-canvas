import { createIcon, type IconName } from '../canvas/ui/icons.ts';
import { HabitsQuickModal } from './components/HabitsQuickModal.ts';
import type { WorkspaceView } from './WorkspaceView.ts';
import type { TimeClusteringLayoutMode } from '../time-clustering/domain/types.ts';
import { emitAiAssistantToggleRequested } from '../ai-assistant/aiAssistantEvents.ts';
import {
  emitTimeClusteringToggleRequested,
  emitWorkspaceViewChangeRequested,
} from './workspaceEvents.ts';
import {
  createSidebarDivider,
  createSidebarRailButton,
  setSidebarRailButtonActive,
  SIDEBAR_TOKENS,
} from '../../ui-lib/src/hud/index.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import type { I18nService } from '../../i18n/index.ts';

const CONTROL_TRANSITION = 'background-color 120ms ease, color 120ms ease';

type WorkspaceControlsBarVariant = 'floating' | 'header' | 'sidebar';

type ViewOption = {
  view: WorkspaceView;
  icon: IconName;
};

type WorkspaceControlsBarOptions = {
  runtime?: AppRuntime;
  initialView: WorkspaceView;
  initialChatOpen?: boolean;
  initialTimeClusteringOpen?: boolean;
  initialTimeClusteringLayoutMode?: TimeClusteringLayoutMode;
  showKanban?: boolean;
  showTimeClustering?: boolean;
  showRoutines?: boolean;
  showChat?: boolean;
  variant?: WorkspaceControlsBarVariant;
};

type VariantMetrics = {
  rootGap: string;
  groupGap: string;
  iconButtonSizePx: number;
  iconButtonRadiusPx: number;
  routinesHeightPx: number;
  routinesPadding: string;
  routinesRadiusPx: number;
  dividerHeightPx: number;
  dividerMargin: string;
  dividerColor: string;
  inactiveIconColor: string;
  inactiveTextColor: string;
  hoverBackground: string;
  hoverColor: string;
  activeBackground: string;
  activeColor: string;
  dividerWidthPx: number;
  showRoutinesLabel: boolean;
};

const VIEW_OPTIONS: ViewOption[] = [
  { view: 'canvas', icon: 'map' },
  { view: 'kanban', icon: 'view-columns' },
];

const VARIANT_METRICS: Record<WorkspaceControlsBarVariant, VariantMetrics> = {
  floating: {
    rootGap: '0',
    groupGap: '4px',
    iconButtonSizePx: 32,
    iconButtonRadiusPx: 9,
    routinesHeightPx: 32,
    routinesPadding: '0 10px',
    routinesRadiusPx: 9,
    dividerHeightPx: 18,
    dividerMargin: '0 6px',
    dividerColor: 'rgba(148, 163, 184, 0.45)',
    inactiveIconColor: '#475569',
    inactiveTextColor: '#334155',
    hoverBackground: '#f8fafc',
    hoverColor: '#0f172a',
    activeBackground: '#eef2ff',
    activeColor: '#4338ca',
    dividerWidthPx: 1,
    showRoutinesLabel: true,
  },
  header: {
    rootGap: '4px',
    groupGap: '2px',
    iconButtonSizePx: 30,
    iconButtonRadiusPx: 8,
    routinesHeightPx: 30,
    routinesPadding: '0 12px',
    routinesRadiusPx: 8,
    dividerHeightPx: 16,
    dividerMargin: '0 4px',
    dividerColor: 'rgba(203, 213, 225, 0.95)',
    inactiveIconColor: '#475569',
    inactiveTextColor: '#334155',
    hoverBackground: '#f8fafc',
    hoverColor: '#0f172a',
    activeBackground: '#eef2ff',
    activeColor: '#4338ca',
    dividerWidthPx: 1,
    showRoutinesLabel: true,
  },
  sidebar: {
    rootGap: `${SIDEBAR_TOKENS.controlGapPx}px`,
    groupGap: `${SIDEBAR_TOKENS.controlGapPx}px`,
    iconButtonSizePx: SIDEBAR_TOKENS.railButtonSizePx,
    iconButtonRadiusPx: SIDEBAR_TOKENS.railButtonRadiusPx,
    routinesHeightPx: SIDEBAR_TOKENS.railButtonSizePx,
    routinesPadding: '0',
    routinesRadiusPx: SIDEBAR_TOKENS.railButtonRadiusPx,
    dividerHeightPx: 1,
    dividerMargin: '0',
    dividerColor: 'rgba(226, 232, 240, 0.85)',
    inactiveIconColor: '#475569',
    inactiveTextColor: '#334155',
    hoverBackground: '#f8fafc',
    hoverColor: '#0f172a',
    activeBackground: '#eef2ff',
    activeColor: '#4338ca',
    dividerWidthPx: SIDEBAR_TOKENS.dividerWidthPx,
    showRoutinesLabel: false,
  },
};

export class WorkspaceControlsBar {
  public readonly element: HTMLDivElement;
  public readonly shouldRender: boolean;
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly variant: WorkspaceControlsBarVariant;
  private readonly metrics: VariantMetrics;
  private readonly routinesModal: HabitsQuickModal | null;
  private readonly viewButtons = new Map<WorkspaceView, HTMLButtonElement>();
  private readonly timeClusteringButton: HTMLButtonElement | null;
  private readonly chatButton: HTMLButtonElement | null;
  private viewGroup: HTMLDivElement | null = null;
  private routinesButton: HTMLButtonElement | null = null;
  private routinesLabel: HTMLSpanElement | null = null;
  private activeView: WorkspaceView;
  private chatOpen: boolean;
  private timeClusteringOpen: boolean;
  private timeClusteringLayoutMode: TimeClusteringLayoutMode;
  private disposeRuntimeSubscription: (() => void) | null = null;

  constructor(options: WorkspaceControlsBarOptions) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.i18n = this.runtime.i18n;
    this.variant = options.variant ?? 'floating';
    this.metrics = VARIANT_METRICS[this.variant];
    this.activeView = options.initialView;
    this.chatOpen = options.initialChatOpen ?? false;
    this.timeClusteringOpen = options.initialTimeClusteringOpen ?? false;
    this.timeClusteringLayoutMode =
      options.initialTimeClusteringLayoutMode ?? 'docked-left';

    const showKanban = options.showKanban ?? true;
    const showTimeClustering = options.showTimeClustering ?? true;
    const showRoutines = options.showRoutines ?? true;
    const showChat = options.showChat ?? true;
    const viewOptions = VIEW_OPTIONS.filter((option) => {
      if (option.view === 'kanban') return showKanban;
      return true;
    });
    const shouldRenderViewGroup = viewOptions.length > 1;
    this.shouldRender =
      showTimeClustering || shouldRenderViewGroup || showRoutines || showChat;

    this.element = document.createElement('div');
    this.applyRootStyles();

    this.timeClusteringButton = showTimeClustering
      ? this.createIconButton({
          label: this.i18n.t('workspaceControls.toggleTimeClusteringPanel'),
          icon: 'rectangle-stack',
          title: this.i18n.t('workspaceControls.timeClustering'),
        })
      : null;
    this.timeClusteringButton?.addEventListener('click', () => {
      emitTimeClusteringToggleRequested();
    });
    if (this.timeClusteringButton) {
      this.element.appendChild(this.timeClusteringButton);
      if (shouldRenderViewGroup || showRoutines || showChat) {
        this.element.appendChild(this.createDivider());
      }
    }

    if (shouldRenderViewGroup) {
      const group = document.createElement('div');
      group.setAttribute('role', 'radiogroup');
      group.setAttribute(
        'aria-label',
        this.i18n.t('workspaceControls.workspaceView')
      );
      if (this.variant === 'sidebar') {
        group.className = 'flex flex-col items-center gap-1.5';
      } else {
        group.style.display = 'flex';
        group.style.flexDirection = 'row';
        group.style.alignItems = 'center';
        group.style.gap = this.metrics.groupGap;
      }

      viewOptions.forEach((option) => {
        const label = this.getViewLabel(option.view);
        const button = this.createIconButton({
          label,
          icon: option.icon,
          title: label,
        });
        button.dataset.view = option.view;
        button.setAttribute('role', 'radio');
        button.addEventListener('click', () => {
          if (this.activeView === option.view && !this.timeClusteringOpen) {
            return;
          }
          emitWorkspaceViewChangeRequested(option.view);
        });
        this.viewButtons.set(option.view, button);
        group.appendChild(button);
      });

      this.viewGroup = group;
      this.element.appendChild(group);
    }

    this.routinesModal = showRoutines
      ? new HabitsQuickModal(undefined, this.runtime)
      : null;
    if (showRoutines) {
      if (shouldRenderViewGroup) {
        this.element.appendChild(this.createDivider());
      }
      this.routinesButton = this.createRoutinesButton(() =>
        this.routinesModal?.open()
      );
      this.element.appendChild(this.routinesButton);
    }

    this.chatButton = showChat
      ? this.createIconButton({
          label: this.i18n.t('workspaceControls.toggleAiAssistantPanel'),
          icon: 'chat-bubble-left',
          title: this.i18n.t('workspaceControls.aiAssistant'),
        })
      : null;
    this.chatButton?.addEventListener('click', () => {
      emitAiAssistantToggleRequested();
    });
    if (this.chatButton) {
      if (shouldRenderViewGroup || showRoutines) {
        this.element.appendChild(this.createDivider());
      }
      this.element.appendChild(this.chatButton);
    }

    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => this.refreshTranslations(),
      { emitCurrent: true }
    );
    this.syncButtons();
  }

  public destroy(): void {
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.routinesModal?.destroy();
  }

  public setActiveView(view: WorkspaceView): void {
    this.activeView = view;
    this.syncButtons();
  }

  public setChatOpen(open: boolean): void {
    this.chatOpen = open;
    this.syncButtons();
  }

  public setTimeClusteringOpen(open: boolean): void {
    this.timeClusteringOpen = open;
    this.syncButtons();
  }

  public setTimeClusteringLayoutMode(mode: TimeClusteringLayoutMode): void {
    this.timeClusteringLayoutMode = mode;
    this.syncButtons();
  }

  private applyRootStyles(): void {
    if (this.variant === 'sidebar') {
      this.element.className = 'flex w-full flex-col items-center gap-1.5';
      this.element.style.fontFamily = 'Poppins, sans-serif';
      return;
    }

    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'row';
    this.element.style.alignItems = 'center';
    this.element.style.gap = this.metrics.rootGap;
    this.element.style.fontFamily = 'Poppins, sans-serif';

    if (this.variant === 'floating') {
      this.element.style.padding = '4px';
      this.element.style.border = '1px solid rgba(203, 213, 225, 0.88)';
      this.element.style.borderRadius = '14px';
      this.element.style.background = 'rgba(255, 255, 255, 0.98)';
      this.element.style.backdropFilter = 'none';
      this.element.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.08)';
      this.element.style.pointerEvents = 'auto';
      return;
    }

    this.element.style.height = '100%';
    this.element.style.minWidth = '0';
    this.element.style.flexShrink = '1';
  }

  private createIconButton(options: {
    label: string;
    icon: IconName;
    title: string;
  }): HTMLButtonElement {
    if (this.variant === 'sidebar') {
      return createSidebarRailButton({
        icon: options.icon,
        title: options.title,
        ariaLabel: options.label,
      });
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.title = options.title;
    button.setAttribute('aria-label', options.label);
    button.style.border = 'none';
    button.style.borderRadius = `${this.metrics.iconButtonRadiusPx}px`;
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.width = `${this.metrics.iconButtonSizePx}px`;
    button.style.height = `${this.metrics.iconButtonSizePx}px`;
    button.style.padding = '0';
    button.style.cursor = 'pointer';
    button.style.background = 'transparent';
    button.style.color = this.metrics.inactiveIconColor;
    button.style.transition = CONTROL_TRANSITION;
    button.addEventListener('mouseenter', () => {
      if (button.dataset.active === 'true') return;
      button.style.background = this.metrics.hoverBackground;
      button.style.color = this.metrics.hoverColor;
    });
    button.addEventListener('mouseleave', () => {
      if (button.dataset.active === 'true') {
        button.style.background = this.metrics.activeBackground;
        button.style.color = this.metrics.activeColor;
        return;
      }
      button.style.background = 'transparent';
      button.style.color = this.metrics.inactiveIconColor;
    });

    const icon = createIcon(options.icon, { size: 14, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);
    return button;
  }

  private createRoutinesButton(onClick: () => void): HTMLButtonElement {
    this.routinesLabel = null;
    if (this.variant === 'sidebar') {
      return createSidebarRailButton({
        icon: 'check-circle',
        title: this.i18n.t('workspaceControls.routines'),
        ariaLabel: this.i18n.t('workspaceControls.openRoutines'),
        onClick: () => onClick(),
      });
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.title = this.i18n.t('workspaceControls.routines');
    button.setAttribute(
      'aria-label',
      this.i18n.t('workspaceControls.openRoutines')
    );
    button.style.border = 'none';
    button.style.borderRadius = `${this.metrics.routinesRadiusPx}px`;
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.gap = '6px';
    button.style.width = 'auto';
    button.style.height = `${this.metrics.routinesHeightPx}px`;
    button.style.padding = this.metrics.routinesPadding;
    button.style.cursor = 'pointer';
    button.style.background = 'transparent';
    button.style.color = this.metrics.inactiveTextColor;
    button.style.transition = CONTROL_TRANSITION;
    button.addEventListener('mouseenter', () => {
      button.style.background = this.metrics.hoverBackground;
      button.style.color = this.metrics.hoverColor;
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'transparent';
      button.style.color = this.metrics.inactiveTextColor;
    });
    button.addEventListener('click', onClick);

    const icon = createIcon('check-circle', { size: 15, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);
    if (this.metrics.showRoutinesLabel) {
      const label = document.createElement('span');
      label.textContent = this.i18n.t('workspaceControls.routines');
      label.style.fontSize = '12px';
      label.style.fontWeight = '600';
      label.style.lineHeight = '1';
      this.routinesLabel = label;
      button.appendChild(label);
    }
    return button;
  }

  private refreshTranslations(): void {
    this.viewGroup?.setAttribute(
      'aria-label',
      this.i18n.t('workspaceControls.workspaceView')
    );
    this.viewButtons.forEach((button, view) => {
      const label = this.getViewLabel(view);
      button.title = label;
      button.setAttribute('aria-label', label);
    });
    if (this.routinesButton) {
      this.routinesButton.title = this.i18n.t('workspaceControls.routines');
      this.routinesButton.setAttribute(
        'aria-label',
        this.i18n.t('workspaceControls.openRoutines')
      );
    }
    if (this.routinesLabel) {
      this.routinesLabel.textContent = this.i18n.t('workspaceControls.routines');
    }
    if (this.timeClusteringButton) {
      this.timeClusteringButton.title = this.i18n.t(
        'workspaceControls.timeClustering'
      );
      this.timeClusteringButton.setAttribute(
        'aria-label',
        this.i18n.t('workspaceControls.toggleTimeClusteringPanel')
      );
    }
    if (this.chatButton) {
      this.chatButton.title = this.i18n.t('workspaceControls.aiAssistant');
      this.chatButton.setAttribute(
        'aria-label',
        this.i18n.t('workspaceControls.toggleAiAssistantPanel')
      );
    }
  }

  private getViewLabel(view: WorkspaceView): string {
    return view === 'kanban'
      ? this.i18n.t('workspaceControls.kanban')
      : this.i18n.t('workspaceControls.canvas');
  }

  private createDivider(): HTMLSpanElement {
    if (this.variant === 'sidebar') {
      return createSidebarDivider();
    }

    const divider = document.createElement('span');
    divider.setAttribute('aria-hidden', 'true');
    divider.style.display = 'block';
    divider.style.width = `${this.metrics.dividerWidthPx}px`;
    divider.style.height = `${this.metrics.dividerHeightPx}px`;
    divider.style.margin = this.metrics.dividerMargin;
    divider.style.background = this.metrics.dividerColor;
    divider.style.alignSelf = 'center';
    return divider;
  }

  private syncButtons(): void {
    const suppressBaseViewActiveState =
      this.timeClusteringOpen && this.timeClusteringLayoutMode === 'fullscreen';
    this.viewButtons.forEach((button, view) => {
      const isActive = !suppressBaseViewActiveState && this.activeView === view;
      button.setAttribute('aria-checked', isActive ? 'true' : 'false');
      button.setAttribute('aria-disabled', 'false');
      if (this.variant === 'sidebar') {
        setSidebarRailButtonActive(button, isActive);
        return;
      }
      button.dataset.active = isActive ? 'true' : 'false';
      button.style.background = isActive
        ? this.metrics.activeBackground
        : 'transparent';
      button.style.color = isActive
        ? this.metrics.activeColor
        : this.metrics.inactiveIconColor;
    });

    if (this.timeClusteringButton) {
      const isActive = this.timeClusteringOpen;
      if (this.variant === 'sidebar') {
        setSidebarRailButtonActive(this.timeClusteringButton, isActive);
      } else {
        this.timeClusteringButton.dataset.active = isActive ? 'true' : 'false';
        this.timeClusteringButton.style.background = isActive
          ? this.metrics.activeBackground
          : 'transparent';
        this.timeClusteringButton.style.color = isActive
          ? this.metrics.activeColor
          : this.metrics.inactiveIconColor;
      }
    }

    if (this.chatButton) {
      if (this.variant === 'sidebar') {
        setSidebarRailButtonActive(this.chatButton, this.chatOpen);
      } else {
        this.chatButton.dataset.active = this.chatOpen ? 'true' : 'false';
        this.chatButton.style.background = this.chatOpen
          ? this.metrics.activeBackground
          : 'transparent';
        this.chatButton.style.color = this.chatOpen
          ? this.metrics.activeColor
          : this.metrics.inactiveIconColor;
      }
    }
  }
}
