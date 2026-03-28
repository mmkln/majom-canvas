import {
  AI_ASSISTANT_VISIBILITY_CHANGED_EVENT,
  isAiAssistantVisibilityChangedDetail,
} from '../../ai-assistant/aiAssistantEvents.ts';
import { loadPersistedAiAssistantOpen } from '../../shell/workspaceUiState.ts';
import { applyCanvasHudEdgeInset } from './canvasHudLayout.ts';

export class CanvasHudLayoutController {
  private root: HTMLElement | null = null;
  private compact = false;
  private readonly chatVisibilityChangedHandler: (event: Event) => void;

  constructor() {
    this.chatVisibilityChangedHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isAiAssistantVisibilityChangedDetail(customEvent.detail)) return;
      this.setCompact(customEvent.detail.open);
    };
  }

  public mount(root: HTMLElement): void {
    if (this.root === root) return;
    this.unmount();
    this.root = root;
    this.setCompact(loadPersistedAiAssistantOpen());
    window.addEventListener(
      AI_ASSISTANT_VISIBILITY_CHANGED_EVENT,
      this.chatVisibilityChangedHandler as EventListener
    );
  }

  public unmount(): void {
    window.removeEventListener(
      AI_ASSISTANT_VISIBILITY_CHANGED_EVENT,
      this.chatVisibilityChangedHandler as EventListener
    );
    this.root = null;
  }

  public setCompact(compact: boolean): void {
    this.compact = compact;
    if (!this.root) return;
    applyCanvasHudEdgeInset(this.root, this.compact);
  }
}
