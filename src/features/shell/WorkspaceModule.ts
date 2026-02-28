import type { WorkspaceView } from './WorkspaceView.ts';

export interface WorkspaceModule {
  readonly id: WorkspaceView;
  mount(parent: HTMLElement): Promise<void> | void;
  unmount(): void;
}
