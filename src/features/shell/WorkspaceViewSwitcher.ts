import type { WorkspaceView } from './WorkspaceView.ts';
import { emitWorkspaceViewChangeRequested } from './workspaceEvents.ts';
import { createIcon, type IconName } from '../canvas/ui/icons.ts';

type ViewOption = {
  view: WorkspaceView;
  label: string;
  icon: IconName;
};

const VIEW_OPTIONS: ViewOption[] = [
  { view: 'canvas', label: 'Canvas', icon: 'map' },
  { view: 'kanban', label: 'Kanban', icon: 'view-columns' },
];

type WorkspaceViewSwitcherOptions = {
  showKanban?: boolean;
  layoutMode?: WorkspaceViewSwitcherLayout;
};

export type WorkspaceViewSwitcherLayout = 'desktop' | 'mobile';

export class WorkspaceViewSwitcher {
  private readonly container: HTMLDivElement;
  private readonly group: HTMLDivElement;
  private readonly shouldRender: boolean;
  private readonly buttons = new Map<WorkspaceView, HTMLButtonElement>();
  private activeView: WorkspaceView;
  private layoutMode: WorkspaceViewSwitcherLayout;
  private bottomOffsetPx = 16;

  constructor(
    initialView: WorkspaceView,
    options: WorkspaceViewSwitcherOptions = {}
  ) {
    this.activeView = initialView;
    this.layoutMode = options.layoutMode ?? 'desktop';
    const showKanban = options.showKanban ?? true;
    const viewOptions = showKanban
      ? VIEW_OPTIONS
      : VIEW_OPTIONS.filter((option) => option.view !== 'kanban');
    this.shouldRender = viewOptions.length > 1;

    this.container = document.createElement('div');
    this.container.id = 'workspace-view-switcher';
    this.container.style.position = 'fixed';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.zIndex = '45';
    this.container.style.pointerEvents = 'none';
    this.container.style.transition = 'top 160ms ease, bottom 160ms ease';

    this.group = document.createElement('div');
    this.group.setAttribute('role', 'radiogroup');
    this.group.setAttribute('aria-label', 'Workspace view');
    this.group.style.display = 'inline-flex';
    this.group.style.alignItems = 'center';
    this.group.style.gap = '4px';
    this.group.style.padding = '4px';
    this.group.style.border = '1px solid rgba(148, 163, 184, 0.3)';
    this.group.style.borderRadius = '999px';
    this.group.style.background = 'rgba(255, 255, 255, 0.92)';
    this.group.style.backdropFilter = 'blur(12px)';
    this.group.style.boxShadow = '0 8px 22px rgba(15, 23, 42, 0.13)';
    this.group.style.pointerEvents = 'auto';
    this.group.style.fontFamily = 'Poppins, sans-serif';

    viewOptions.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.view = option.view;
      button.setAttribute('role', 'radio');
      button.style.border = '1px solid transparent';
      button.style.borderRadius = '9px';
      button.style.display = 'inline-flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.padding = '0';
      button.style.width = '32px';
      button.style.height = '32px';
      button.style.cursor = 'pointer';
      button.style.transition =
        'background-color 140ms ease, color 140ms ease, box-shadow 140ms ease, border-color 140ms ease';
      button.title = option.label;
      button.setAttribute('aria-label', option.label);

      const icon = createIcon(option.icon, { size: 14, strokeWidth: 1.8 });
      icon.setAttribute('aria-hidden', 'true');
      button.append(icon);

      button.addEventListener('click', () => {
        if (this.activeView === option.view) return;
        emitWorkspaceViewChangeRequested(option.view);
      });

      this.buttons.set(option.view, button);
      this.group.appendChild(button);
    });

    this.container.appendChild(this.group);
    this.applyLayoutModeStyles();
    this.syncButtons();
  }

  public mount(parent: HTMLElement = document.body): void {
    if (!this.shouldRender) return;
    if (this.container.parentElement) return;
    parent.appendChild(this.container);
  }

  public unmount(): void {
    this.container.remove();
  }

  public setActiveView(view: WorkspaceView): void {
    this.activeView = view;
    this.syncButtons();
  }

  public setVisible(visible: boolean): void {
    if (!this.shouldRender) return;
    this.container.style.display = visible ? 'block' : 'none';
  }

  public setBottomOffset(bottomOffsetPx: number): void {
    this.bottomOffsetPx = Math.max(0, Math.round(bottomOffsetPx));
  }

  public setLayoutMode(mode: WorkspaceViewSwitcherLayout): void {
    if (this.layoutMode === mode) return;
    this.layoutMode = mode;
    this.applyLayoutModeStyles();
    this.syncButtons();
  }

  private syncButtons(): void {
    this.buttons.forEach((button, view) => {
      const isActive = this.activeView === view;
      button.setAttribute('aria-checked', isActive ? 'true' : 'false');
      button.setAttribute('aria-disabled', 'false');
      if (this.layoutMode === 'mobile') {
        button.style.background = isActive ? '#0f172a' : 'transparent';
        button.style.color = isActive ? '#f8fafc' : '#475569';
        button.style.borderColor = isActive
          ? 'rgba(15, 23, 42, 0.36)'
          : 'rgba(148, 163, 184, 0)';
        button.style.boxShadow = isActive
          ? '0 6px 12px rgba(15, 23, 42, 0.22)'
          : 'none';
        return;
      }
      button.style.background = isActive ? '#e2e8f0' : 'transparent';
      button.style.color = isActive ? '#0f172a' : '#475569';
      button.style.borderColor = isActive
        ? 'rgba(148, 163, 184, 0.45)'
        : 'transparent';
      button.style.boxShadow = 'none';
    });
  }

  private applyMobileTopOffset(): void {
    this.container.style.top =
      'calc(max(0.75rem, env(safe-area-inset-top)) + 8px)';
  }

  private applyLayoutModeStyles(): void {
    if (this.layoutMode === 'mobile') {
      this.container.style.bottom = '';
      this.applyMobileTopOffset();
      this.group.style.gap = '2px';
      this.group.style.padding = '3px';
      this.group.style.border = '1px solid rgba(148, 163, 184, 0.3)';
      this.group.style.borderRadius = '999px';
      this.group.style.background = 'rgba(255, 255, 255, 0.82)';
      this.group.style.backdropFilter = 'blur(14px)';
      this.group.style.boxShadow = '0 10px 22px rgba(15, 23, 42, 0.14)';
      this.buttons.forEach((button) => {
        button.style.width = '30px';
        button.style.height = '30px';
        button.style.borderRadius = '999px';
      });
      return;
    }

    this.container.style.bottom = '';
    this.container.style.top = 'calc(0.75rem + env(safe-area-inset-top))';
    this.group.style.gap = '6px';
    this.group.style.padding = '5px';
    this.group.style.border = '1px solid rgba(15, 23, 42, 0.16)';
    this.group.style.borderRadius = '16px';
    this.group.style.background = 'rgba(255, 255, 255, 0.96)';
    this.group.style.backdropFilter = 'blur(10px)';
    this.group.style.boxShadow = '0 14px 32px rgba(15, 23, 42, 0.16)';
    this.buttons.forEach((button) => {
      button.style.width = '34px';
      button.style.height = '34px';
      button.style.borderRadius = '10px';
    });
  }
}
