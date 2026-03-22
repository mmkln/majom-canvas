import type { WorkspaceModule } from './WorkspaceModule.ts';
import type { WorkspaceView } from './WorkspaceView.ts';

export class WorkspaceShell {
  private readonly modules = new Map<WorkspaceView, WorkspaceModule>();
  private activeView: WorkspaceView | null = null;

  constructor(private readonly mountPoint: HTMLElement) {}

  public register(module: WorkspaceModule): void {
    this.modules.set(module.id, module);
  }

  public async show(view: WorkspaceView): Promise<void> {
    if (this.activeView === view) return;

    if (this.activeView) {
      const active = this.modules.get(this.activeView);
      active?.unmount();
    }

    const next = this.modules.get(view);
    if (!next) {
      throw new Error(`Workspace module "${view}" is not registered.`);
    }
    await next.mount(this.mountPoint);
    this.activeView = view;
  }

  public getActiveView(): WorkspaceView | null {
    return this.activeView;
  }

  public getActiveModule(): WorkspaceModule | null {
    if (!this.activeView) return null;
    return this.modules.get(this.activeView) ?? null;
  }

  public dispose(): void {
    if (this.activeView) {
      this.modules.get(this.activeView)?.unmount();
    }
    this.modules.clear();
    this.activeView = null;
  }
}
