import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import {
  summarizeAiAssistantCanvas,
} from './AiAssistantContent.ts';
import {
  getFocusBundle,
  getSelectedElements,
} from './AiAssistantSnapshotLens.ts';
import type { AiAssistantMemoryState } from './AiAssistantContextTypes.ts';
import { EMPTY_AI_ASSISTANT_MEMORY_STATE } from './AiAssistantContextTypes.ts';

export class AiAssistantMemoryStore {
  private readonly memoryByConversation = new Map<string, AiAssistantMemoryState>();

  public get(conversationKey: string): AiAssistantMemoryState {
    return (
      this.memoryByConversation.get(conversationKey) ?? {
        ...EMPTY_AI_ASSISTANT_MEMORY_STATE,
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
    snapshot: AiAssistantCanvasSnapshot | null;
  }): AiAssistantMemoryState {
    const nextState: AiAssistantMemoryState = {
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
    snapshot: AiAssistantCanvasSnapshot | null;
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
    snapshot: AiAssistantCanvasSnapshot | null
  ): string[] {
    if (!snapshot) {
      return [];
    }

    const focus = getFocusBundle(snapshot);
    const selection = getSelectedElements(snapshot);
    const facts = [summarizeAiAssistantCanvas(snapshot)];
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
    snapshot: AiAssistantCanvasSnapshot | null
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
