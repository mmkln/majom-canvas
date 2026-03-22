import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import {
  summarizeWorkspaceChatCanvas,
} from './WorkspaceChatContent.ts';
import {
  getFocusBundle,
  getSelectedElements,
} from './WorkspaceChatSnapshotLens.ts';
import type { WorkspaceChatMemoryState } from './WorkspaceChatContextTypes.ts';
import { EMPTY_WORKSPACE_CHAT_MEMORY_STATE } from './WorkspaceChatContextTypes.ts';

export class WorkspaceChatMemoryStore {
  private readonly memoryByConversation = new Map<string, WorkspaceChatMemoryState>();

  public get(conversationKey: string): WorkspaceChatMemoryState {
    return (
      this.memoryByConversation.get(conversationKey) ?? {
        ...EMPTY_WORKSPACE_CHAT_MEMORY_STATE,
      }
    );
  }

  public clear(conversationKey: string): void {
    this.memoryByConversation.delete(conversationKey);
  }

  public updateAfterReply(params: {
    conversationKey: string;
    prompt: string;
    reply: string;
    snapshot: WorkspaceChatCanvasSnapshot | null;
  }): WorkspaceChatMemoryState {
    const nextState: WorkspaceChatMemoryState = {
      currentIntent: params.prompt.trim().slice(0, 160) || null,
      conversationSummary: this.buildConversationSummary(params),
      agreedFacts: this.buildAgreedFacts(params.snapshot),
      workingSet: this.buildWorkingSet(params.snapshot),
      lastRecommendations: this.extractRecommendations(params.reply),
      updatedAt: Date.now(),
    };
    this.memoryByConversation.set(params.conversationKey, nextState);
    return nextState;
  }

  private buildConversationSummary(params: {
    prompt: string;
    snapshot: WorkspaceChatCanvasSnapshot | null;
  }): string | null {
    const focusTitle = getFocusBundle(params.snapshot)?.item.title?.trim() ?? '';
    const prompt = params.prompt.trim();
    if (focusTitle.length > 0 && prompt.length > 0) {
      return `${prompt.slice(0, 120)} | focus: ${focusTitle}`.slice(0, 180);
    }
    if (prompt.length > 0) {
      return prompt.slice(0, 180);
    }
    return null;
  }

  private buildAgreedFacts(
    snapshot: WorkspaceChatCanvasSnapshot | null
  ): string[] {
    if (!snapshot) {
      return [];
    }

    const focus = getFocusBundle(snapshot);
    const selection = getSelectedElements(snapshot);
    const facts = [summarizeWorkspaceChatCanvas(snapshot)];
    if (focus) {
      facts.push(
        `Focus: ${focus.item.kind} "${focus.item.title || 'Untitled'}".`
      );
    }
    if (selection.length > 1) {
      facts.push(
        `Selection includes ${selection.length} items.`
      );
    }
    return facts.filter(Boolean).slice(0, 4);
  }

  private buildWorkingSet(
    snapshot: WorkspaceChatCanvasSnapshot | null
  ): string[] {
    if (!snapshot) {
      return [];
    }

    const selection = getSelectedElements(snapshot);
    const focus = getFocusBundle(snapshot);
    const ids = new Set<string>();
    selection.forEach((item) => ids.add(item.id));
    focus?.children.forEach((item) => ids.add(item.id));
    if (focus) {
      ids.add(focus.item.id);
      if (focus.parent) {
        ids.add(focus.parent.id);
      }
    }
    return Array.from(ids).slice(0, 8);
  }

  private extractRecommendations(reply: string): string[] {
    return reply
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^(\d+\.|-|\*)\s+/.test(line))
      .map((line) => line.replace(/^(\d+\.|-|\*)\s+/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 4);
  }
}
