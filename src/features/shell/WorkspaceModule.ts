import type { WorkspaceView } from './WorkspaceView.ts';
import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import type { AiAssistantToolHost } from '../ai-assistant/services/AiAssistantToolTypes.ts';

export interface WorkspaceModule {
  readonly id: WorkspaceView;
  mount(parent: HTMLElement): Promise<void> | void;
  unmount(): void;
  getAiAssistantSnapshot(): AiAssistantCanvasSnapshot | null;
  getAiAssistantToolHost?(): AiAssistantToolHost | null;
}
