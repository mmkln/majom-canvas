import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import type { AiAssistantAction } from '../aiAssistantActions.ts';
import {
  summarizeAiAssistantCanvas,
} from './AiAssistantContent.ts';
import {
  getFocusBundle,
  getSelectedElements,
} from './AiAssistantSnapshotLens.ts';
import type { AiAssistantIntentContext } from './AiAssistantIntentContext.ts';
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

  public recordUserInput(params: {
    conversationKey: string;
    prompt: string;
    snapshot: AiAssistantCanvasSnapshot | null;
    intent?: string | null;
    intentContext?: AiAssistantIntentContext;
  }): AiAssistantMemoryState {
    const current = this.get(params.conversationKey);
    const recordedAt = Date.now();
    const nextState: AiAssistantMemoryState = {
      ...current,
      currentIntent: this.describeCurrentIntent(params.prompt, params.intent),
      conversationSummary: this.buildConversationSummary(params),
      agreedFacts: this.buildAgreedFacts(params.snapshot),
      workingSet: this.buildWorkingSet(params.snapshot),
      confirmedFacts: this.mergeFactRecords(
        current.confirmedFacts,
        this.buildConfirmedFacts(params.snapshot, recordedAt)
      ),
      userConstraints: this.mergeConstraintRecords(
        current.userConstraints,
        this.buildUserConstraintRecords(
          params.prompt,
          params.intent,
          params.intentContext,
          recordedAt
        )
      ),
      openFollowUpSlots: [],
      awaitingInput: null,
      updatedAt: recordedAt,
    };
    this.memoryByConversation.set(params.conversationKey, nextState);
    return nextState;
  }

  public updateAfterReply(params: {
    conversationKey: string;
    prompt: string;
    reply: string;
    snapshot: AiAssistantCanvasSnapshot | null;
    awaitingUserInput?: boolean;
  }): AiAssistantMemoryState {
    const current = this.get(params.conversationKey);
    const recordedAt = Date.now();
    const nextState: AiAssistantMemoryState = {
      ...current,
      conversationSummary: this.buildConversationSummary(params),
      agreedFacts: this.buildAgreedFacts(params.snapshot),
      workingSet: this.buildWorkingSet(params.snapshot),
      lastRecommendations: this.extractRecommendations(params.reply),
      confirmedFacts: this.mergeFactRecords(
        current.confirmedFacts,
        this.buildConfirmedFacts(params.snapshot, recordedAt)
      ),
      awaitingInput: params.awaitingUserInput
        ? {
            prompt: params.prompt.trim().slice(0, 180),
            replyPreview: params.reply.trim().slice(0, 180),
            recordedAt,
          }
        : null,
      openFollowUpSlots: params.awaitingUserInput
        ? [params.reply.trim().slice(0, 180)].filter(Boolean)
        : [],
      updatedAt: recordedAt,
    };
    this.memoryByConversation.set(params.conversationKey, nextState);
    return nextState;
  }

  public recordAppliedActions(params: {
    conversationKey: string;
    actions: AiAssistantAction[];
    sourceMessageId?: string;
  }): AiAssistantMemoryState {
    if (params.actions.length === 0) {
      return this.get(params.conversationKey);
    }

    const current = this.get(params.conversationKey);
    const recordedAt = Date.now();
    const actionRecords = params.actions.map((action) => ({
      actionKind: action.kind,
      label: this.describeActionLabel(action),
      summary: this.describeAppliedActionSummary(action),
      sourceMessageId: params.sourceMessageId,
      createdElementIds:
        typeof action.createdElementId === 'string' &&
        action.createdElementId.length > 0
          ? [action.createdElementId]
          : [],
      affectedElementIds: Array.isArray(action.affectedElementIds)
        ? action.affectedElementIds.filter((id) => typeof id === 'string')
        : [],
      recordedAt,
    }));

    const nextState: AiAssistantMemoryState = {
      ...current,
      confirmedFacts: this.mergeFactRecords(
        current.confirmedFacts,
        actionRecords.map((record) => ({
          text: record.summary,
          source: 'action' as const,
          recordedAt: record.recordedAt,
        }))
      ),
      appliedActions: [...current.appliedActions, ...actionRecords].slice(-10),
      updatedAt: recordedAt,
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

  private describeCurrentIntent(prompt: string, intent?: string | null): string | null {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0 && !intent) {
      return null;
    }
    if (intent && trimmedPrompt.length > 0) {
      return `${intent}: ${trimmedPrompt.slice(0, 120)}`.slice(0, 160);
    }
    if (intent) {
      return intent;
    }
    return trimmedPrompt.slice(0, 160) || null;
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

  private buildConfirmedFacts(
    snapshot: AiAssistantCanvasSnapshot | null,
    recordedAt: number
  ) {
    if (!snapshot) {
      return [];
    }

    const facts: Array<{
      text: string;
      source: 'snapshot';
      recordedAt: number;
    }> = [];
    const summary = summarizeAiAssistantCanvas(snapshot);
    if (summary.trim().length > 0) {
      facts.push({
        text: summary,
        source: 'snapshot',
        recordedAt,
      });
    }

    const focus = getFocusBundle(snapshot);
    if (focus) {
      facts.push({
        text: `Focus: ${focus.item.kind} "${focus.item.title || 'Untitled'}".`,
        source: 'snapshot',
        recordedAt,
      });
    }

    const selection = getSelectedElements(snapshot);
    if (selection.length > 1) {
      facts.push({
        text: `Selection includes ${selection.length} items.`,
        source: 'snapshot',
        recordedAt,
      });
    }

    return facts.slice(0, 4);
  }

  private buildUserConstraintRecords(
    prompt: string,
    intent: string | null | undefined,
    intentContext: AiAssistantIntentContext | undefined,
    recordedAt: number
  ) {
    const constraints: Array<{
      text: string;
      source: 'user';
      recordedAt: number;
    }> = [];
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length > 0) {
      constraints.push({
        text: intent
          ? `${intent}: ${trimmedPrompt}`.slice(0, 220)
          : trimmedPrompt.slice(0, 220),
        source: 'user',
        recordedAt,
      });
    }

    const intentContextText = this.describeIntentContext(intentContext);
    if (intentContextText) {
      constraints.push({
        text: intentContextText,
        source: 'user',
        recordedAt,
      });
    }

    return constraints.slice(0, 4);
  }

  private describeIntentContext(
    intentContext: AiAssistantIntentContext | undefined
  ): string | null {
    if (!intentContext) {
      return null;
    }

    const parts = [
      intentContext.strategicPlanMode
        ? `strategicPlanMode=${intentContext.strategicPlanMode}`
        : null,
      intentContext.breakdownMode
        ? `breakdownMode=${intentContext.breakdownMode}`
        : null,
    ].filter(Boolean);

    return parts.length > 0 ? `Intent context: ${parts.join(', ')}` : null;
  }

  private mergeFactRecords(
    existing: AiAssistantMemoryState['confirmedFacts'],
    additions: AiAssistantMemoryState['confirmedFacts']
  ): AiAssistantMemoryState['confirmedFacts'] {
    return this.mergeRecords(existing, additions, 12);
  }

  private mergeConstraintRecords(
    existing: AiAssistantMemoryState['userConstraints'],
    additions: AiAssistantMemoryState['userConstraints']
  ): AiAssistantMemoryState['userConstraints'] {
    return this.mergeRecords(existing, additions, 12);
  }

  private mergeRecords<T extends { text: string }>(
    existing: readonly T[],
    additions: readonly T[],
    limit: number
  ): T[] {
    const result: T[] = [];
    const seen = new Set<string>();
    const addRecord = (record: T): void => {
      const key = record.text.trim().toLowerCase();
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      result.push(record);
    };

    existing.forEach(addRecord);
    additions.forEach(addRecord);
    return result.slice(-limit);
  }

  private describeActionLabel(action: AiAssistantAction): string {
    switch (action.kind) {
      case 'create_goal':
        return `Create goal "${action.title}"`;
      case 'create_story':
        return `Create story "${action.title}"`;
      case 'create_task':
        return `Create task "${action.title}"`;
      case 'create_goal_blueprint':
        return `Create plan "${action.title}"`;
      case 'create_goals':
        return action.title?.trim().length
          ? `Create goals "${action.title}"`
          : 'Create goals';
      case 'suggest_relation':
        return `${action.relationType} relation`;
      case 'remove_relation':
        return `${action.relationType} relation removal`;
      case 'update_relation':
        return `${action.currentRelationType} relation update`;
      case 'suggest_update':
        return `Update ${action.elementKind} "${action.targetTitle || action.elementId}"`;
      default:
        return String(action.kind);
    }
  }

  private describeAppliedActionSummary(action: AiAssistantAction): string {
    const label = this.describeActionLabel(action);
    const targets = [
      ...(typeof action.createdElementId === 'string' &&
      action.createdElementId.length > 0
        ? [action.createdElementId]
        : []),
      ...(Array.isArray(action.affectedElementIds)
        ? action.affectedElementIds
        : []),
    ];
    if (targets.length === 0) {
      return label;
    }
    return `${label} (${targets.join(', ')})`;
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
