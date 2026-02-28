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
};

export class WorkspaceViewSwitcher {
  private readonly container: HTMLDivElement;
  private readonly group: HTMLDivElement;
  private readonly shouldRender: boolean;
  private readonly buttons = new Map<WorkspaceView, HTMLButtonElement>();
  private activeView: WorkspaceView;

  constructor(
    initialView: WorkspaceView,
    options: WorkspaceViewSwitcherOptions = {}
  ) {
    this.activeView = initialView;
    const showKanban = options.showKanban ?? true;
    const viewOptions = showKanban
      ? VIEW_OPTIONS
      : VIEW_OPTIONS.filter((option) => option.view !== 'kanban');
    this.shouldRender = viewOptions.length > 1;

    this.container = document.createElement('div');
    this.container.id = 'workspace-view-switcher';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '16px';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.zIndex = '45';
    this.container.style.pointerEvents = 'none';

    this.group = document.createElement('div');
    this.group.setAttribute('role', 'radiogroup');
    this.group.setAttribute('aria-label', 'Workspace view');
    this.group.style.display = 'inline-flex';
    this.group.style.alignItems = 'center';
    this.group.style.gap = '4px';
    this.group.style.padding = '4px';
    this.group.style.border = '1px solid rgba(148, 163, 184, 0.35)';
    this.group.style.borderRadius = '12px';
    this.group.style.background = 'rgba(255, 255, 255, 0.92)';
    this.group.style.backdropFilter = 'blur(8px)';
    this.group.style.boxShadow = '0 10px 26px rgba(15, 23, 42, 0.14)';
    this.group.style.pointerEvents = 'auto';
    this.group.style.fontFamily = 'Poppins, sans-serif';

    viewOptions.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.view = option.view;
      button.setAttribute('role', 'radio');
      button.style.border = 'none';
      button.style.borderRadius = '9px';
      button.style.display = 'inline-flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.padding = '0';
      button.style.width = '32px';
      button.style.height = '32px';
      button.style.cursor = 'pointer';
      button.style.transition = 'background-color 120ms ease, color 120ms ease';
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

  private syncButtons(): void {
    this.buttons.forEach((button, view) => {
      const isActive = this.activeView === view;
      button.setAttribute('aria-checked', isActive ? 'true' : 'false');
      button.setAttribute('aria-disabled', 'false');
      button.style.background = isActive ? '#f1f5f9' : 'transparent';
      button.style.color = isActive ? '#0f172a' : '#475569';
    });
  }
}
