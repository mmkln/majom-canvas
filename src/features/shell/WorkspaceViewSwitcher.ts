import type { WorkspaceView } from './WorkspaceView.ts';
import { emitWorkspaceViewChangeRequested } from './workspaceEvents.ts';
import { createIcon, type IconName } from '../canvas/ui/icons.ts';
import { HabitsQuickModal } from './components/HabitsQuickModal.ts';

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
  showRoutines?: boolean;
};

export class WorkspaceViewSwitcher {
  private readonly container: HTMLDivElement;
  private readonly row: HTMLDivElement;
  private readonly group: HTMLDivElement;
  private readonly routinesButton: HTMLButtonElement;
  private readonly routinesModal = new HabitsQuickModal();
  private readonly shouldRenderViewGroup: boolean;
  private readonly shouldRender: boolean;
  private readonly buttons = new Map<WorkspaceView, HTMLButtonElement>();
  private activeView: WorkspaceView;

  constructor(
    initialView: WorkspaceView,
    options: WorkspaceViewSwitcherOptions = {}
  ) {
    this.activeView = initialView;
    const showKanban = options.showKanban ?? true;
    const showRoutines = options.showRoutines ?? true;
    const viewOptions = showKanban
      ? VIEW_OPTIONS
      : VIEW_OPTIONS.filter((option) => option.view !== 'kanban');
    this.shouldRenderViewGroup = viewOptions.length > 1;
    this.shouldRender = this.shouldRenderViewGroup || showRoutines;

    this.container = document.createElement('div');
    this.container.id = 'workspace-view-switcher';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '16px';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.zIndex = '45';
    this.container.style.pointerEvents = 'none';

    this.row = document.createElement('div');
    this.row.style.display = 'inline-flex';
    this.row.style.alignItems = 'center';
    this.row.style.gap = '0';
    this.row.style.padding = '4px';
    this.row.style.border = '1px solid rgba(148, 163, 184, 0.35)';
    this.row.style.borderRadius = '12px';
    this.row.style.background = 'rgba(255, 255, 255, 0.92)';
    this.row.style.backdropFilter = 'blur(8px)';
    this.row.style.boxShadow = '0 10px 26px rgba(15, 23, 42, 0.14)';
    this.row.style.pointerEvents = 'auto';
    this.row.style.fontFamily = 'Poppins, sans-serif';

    this.group = document.createElement('div');
    this.group.setAttribute('role', 'radiogroup');
    this.group.setAttribute('aria-label', 'Workspace view');
    this.group.style.display = 'inline-flex';
    this.group.style.alignItems = 'center';
    this.group.style.gap = '4px';

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

    this.routinesButton = document.createElement('button');
    this.routinesButton.type = 'button';
    this.routinesButton.style.border = 'none';
    this.routinesButton.style.borderRadius = '9px';
    this.routinesButton.style.display = 'inline-flex';
    this.routinesButton.style.alignItems = 'center';
    this.routinesButton.style.justifyContent = 'center';
    this.routinesButton.style.gap = '6px';
    this.routinesButton.style.padding = '0 10px';
    this.routinesButton.style.width = 'auto';
    this.routinesButton.style.height = '32px';
    this.routinesButton.style.cursor = 'pointer';
    this.routinesButton.style.background = 'transparent';
    this.routinesButton.style.color = '#334155';
    this.routinesButton.style.transition =
      'background-color 120ms ease, color 120ms ease';
    this.routinesButton.title = 'Routines';
    this.routinesButton.setAttribute('aria-label', 'Open routines');
    this.routinesButton.addEventListener('mouseenter', () => {
      this.routinesButton.style.background = '#f1f5f9';
      this.routinesButton.style.color = '#0f172a';
    });
    this.routinesButton.addEventListener('mouseleave', () => {
      this.routinesButton.style.background = 'transparent';
      this.routinesButton.style.color = '#334155';
    });
    this.routinesButton.addEventListener('click', () => {
      this.routinesModal.open();
    });

    const routinesIcon = createIcon('check-circle', {
      size: 15,
      strokeWidth: 1.8,
    });
    routinesIcon.setAttribute('aria-hidden', 'true');
    const routinesLabel = document.createElement('span');
    routinesLabel.textContent = 'Routines';
    routinesLabel.style.fontSize = '12px';
    routinesLabel.style.fontWeight = '600';
    routinesLabel.style.lineHeight = '1';
    this.routinesButton.append(routinesIcon, routinesLabel);

    if (this.shouldRenderViewGroup) {
      this.row.appendChild(this.group);
    }
    if (this.shouldRenderViewGroup && showRoutines) {
      const divider = document.createElement('span');
      divider.setAttribute('aria-hidden', 'true');
      divider.style.display = 'inline-block';
      divider.style.width = '1px';
      divider.style.height = '18px';
      divider.style.margin = '0 6px';
      divider.style.background = 'rgba(148, 163, 184, 0.45)';
      this.row.appendChild(divider);
    }
    if (showRoutines) {
      this.row.appendChild(this.routinesButton);
    }
    this.container.appendChild(this.row);
    this.syncButtons();
  }

  public mount(parent: HTMLElement = document.body): void {
    if (!this.shouldRender) return;
    if (this.container.parentElement) return;
    parent.appendChild(this.container);
  }

  public unmount(): void {
    this.routinesModal.close();
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
