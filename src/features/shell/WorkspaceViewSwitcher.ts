import { WorkspaceControlsBar } from './WorkspaceControlsBar.ts';
import type { WorkspaceView } from './WorkspaceView.ts';
import type { TimeClusteringLayoutMode } from '../time-clustering/domain/types.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';

type WorkspaceViewSwitcherOptions = {
  runtime?: AppRuntime;
  showKanban?: boolean;
  showTimeClustering?: boolean;
  showRoutines?: boolean;
  showChat?: boolean;
  initialTimeClusteringOpen?: boolean;
  initialTimeClusteringLayoutMode?: TimeClusteringLayoutMode;
};

export class WorkspaceViewSwitcher {
  private readonly container: HTMLDivElement;
  private readonly controls: WorkspaceControlsBar;
  private readonly shouldRender: boolean;

  constructor(
    initialView: WorkspaceView,
    options: WorkspaceViewSwitcherOptions = {}
  ) {
    this.controls = new WorkspaceControlsBar({
      runtime: options.runtime ?? createAppRuntime(),
      initialView,
      initialTimeClusteringOpen: options.initialTimeClusteringOpen,
      initialTimeClusteringLayoutMode: options.initialTimeClusteringLayoutMode,
      showKanban: options.showKanban,
      showTimeClustering: options.showTimeClustering,
      showRoutines: options.showRoutines,
      showChat: options.showChat,
      variant: 'floating',
    });
    this.shouldRender = this.controls.shouldRender;

    this.container = document.createElement('div');
    this.container.id = 'workspace-view-switcher';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '16px';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.zIndex = '45';
    this.container.style.pointerEvents = 'none';
    this.container.appendChild(this.controls.element);
  }

  public mount(parent: HTMLElement = document.body): void {
    if (!this.shouldRender) return;
    if (this.container.parentElement) return;
    parent.appendChild(this.container);
  }

  public unmount(): void {
    this.controls.destroy();
    this.container.remove();
  }

  public setActiveView(view: WorkspaceView): void {
    this.controls.setActiveView(view);
  }

  public setVisible(visible: boolean): void {
    if (!this.shouldRender) return;
    this.container.style.display = visible ? 'block' : 'none';
  }

  public setChatOpen(open: boolean): void {
    this.controls.setChatOpen(open);
  }

  public setTimeClusteringOpen(open: boolean): void {
    this.controls.setTimeClusteringOpen(open);
  }

  public setTimeClusteringLayoutMode(mode: TimeClusteringLayoutMode): void {
    this.controls.setTimeClusteringLayoutMode(mode);
  }
}
