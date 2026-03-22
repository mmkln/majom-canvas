import type { WorkspaceView } from './WorkspaceView.ts';
import type { WorkspaceChatCanvasSnapshot } from './workspaceChatEvents.ts';

export interface WorkspaceModule {
  readonly id: WorkspaceView;
  mount(parent: HTMLElement): Promise<void> | void;
  unmount(): void;
  getWorkspaceChatSnapshot(): WorkspaceChatCanvasSnapshot | null;
}
