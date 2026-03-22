import type { WorkspaceChatAssembledContext, WorkspaceChatMemoryState } from './WorkspaceChatContextTypes.ts';
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
    assembledContext: WorkspaceChatAssembledContext;
  }): WorkspaceChatMemoryState {
    const nextState: WorkspaceChatMemoryState = {
      currentIntent: params.prompt.trim().slice(0, 160) || null,
      agreedFacts: this.buildAgreedFacts(params.assembledContext),
      workingSet: this.buildWorkingSet(params.assembledContext),
      lastRecommendations: this.extractRecommendations(params.reply),
      updatedAt: Date.now(),
    };
    this.memoryByConversation.set(params.conversationKey, nextState);
    return nextState;
  }

  private buildAgreedFacts(
    assembledContext: WorkspaceChatAssembledContext
  ): string[] {
    const facts = [assembledContext.workspaceSummary];
    if (assembledContext.focus) {
      facts.push(
        `Focus: ${assembledContext.focus.item.kind} "${assembledContext.focus.item.title || 'Untitled'}".`
      );
    }
    if (assembledContext.selection.length > 1) {
      facts.push(
        `Selection includes ${assembledContext.selection.length} items.`
      );
    }
    return facts.filter(Boolean).slice(0, 4);
  }

  private buildWorkingSet(
    assembledContext: WorkspaceChatAssembledContext
  ): string[] {
    const ids = new Set<string>();
    assembledContext.selection.forEach((item) => ids.add(item.id));
    assembledContext.focus?.children.forEach((item) => ids.add(item.id));
    if (assembledContext.focus) {
      ids.add(assembledContext.focus.item.id);
      if (assembledContext.focus.parent) {
        ids.add(assembledContext.focus.parent.id);
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
