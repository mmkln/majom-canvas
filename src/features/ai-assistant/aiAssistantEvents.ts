export const AI_ASSISTANT_TOGGLE_REQUEST_EVENT =
  'aiAssistantToggleRequested';
export const AI_ASSISTANT_VISIBILITY_CHANGED_EVENT =
  'aiAssistantVisibilityChanged';
export const AI_ASSISTANT_CONTEXT_CHANGED_EVENT =
  'aiAssistantContextChanged';
export const AI_ASSISTANT_PROMPT_REQUEST_EVENT =
  'aiAssistantPromptRequested';
export const AI_ASSISTANT_INTENT_REQUEST_EVENT =
  'aiAssistantIntentRequested';

export type AiAssistantToggleRequestDetail = {
  open?: boolean;
};

export type AiAssistantVisibilityChangedDetail = {
  open: boolean;
};

export type AiAssistantPromptRequestDetail = {
  prompt: string;
  open?: boolean;
};

export type AiAssistantIntentKind =
  | 'review'
  | 'breakdown'
  | 'strategic_plan'
  | 'dependencies'
  | 'missing'
  | 'clarify'
  | 'fill_details';
export type AiAssistantIntentScope = 'selection' | 'canvas';

export type AiAssistantElementKind = 'goal' | 'story' | 'task';

export type AiAssistantConnectionRelationType =
  | 'leads_to'
  | 'blocks'
  | 'parent_child'
  | 'relates_to';

export type AiAssistantSelectionItem = {
  id: string;
  kind: AiAssistantElementKind;
  title: string;
  description: string;
  status?: string;
  priority?: string;
  childCount?: number;
};

export type AiAssistantIntentRequestDetail = {
  intent: AiAssistantIntentKind;
  scope?: AiAssistantIntentScope;
  targetIds?: string[];
  open?: boolean;
};

export type AiAssistantCanvasElement = AiAssistantSelectionItem & {
  parentId: string | null;
  childIds: string[];
  selected: boolean;
  focused: boolean;
  highlighted: boolean;
};

export type AiAssistantConnectionEdge = {
  id: string;
  fromId: string;
  toId: string;
  relationType: AiAssistantConnectionRelationType;
};

export type AiAssistantRecentActivityItem = {
  id: string;
  type: 'added' | 'removed' | 'updated' | 'selection' | 'focus';
  label: string;
  entityIds: string[];
  timestamp: number;
};

export type AiAssistantViewport = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  visibleElementIds: string[];
};

export type AiAssistantCanvasSnapshot = {
  canvasId: string | null;
  canvasTitle: string;
  summary: {
    goalCount: number;
    storyCount: number;
    taskCount: number;
    selectedCount: number;
  };
  selectionIds: string[];
  focusId: string | null;
  highlightedIds: string[];
  elements: AiAssistantCanvasElement[];
  connections: AiAssistantConnectionEdge[];
  viewport: AiAssistantViewport | null;
  recentActivity: AiAssistantRecentActivityItem[];
};

export type AiAssistantContextDetail = AiAssistantCanvasSnapshot;

export function isAiAssistantToggleRequestDetail(
  detail: unknown
): detail is AiAssistantToggleRequestDetail {
  if (!detail) return true;
  if (typeof detail !== 'object') return false;
  const value = detail as Partial<AiAssistantToggleRequestDetail>;
  return value.open === undefined || typeof value.open === 'boolean';
}

export function isAiAssistantVisibilityChangedDetail(
  detail: unknown
): detail is AiAssistantVisibilityChangedDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<AiAssistantVisibilityChangedDetail>;
  return typeof value.open === 'boolean';
}

export function isAiAssistantContextDetail(
  detail: unknown
): detail is AiAssistantContextDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<AiAssistantContextDetail>;
  if (value.canvasId !== null && value.canvasId !== undefined) {
    if (typeof value.canvasId !== 'string') return false;
  }
  if (typeof value.canvasTitle !== 'string') return false;
  if (!value.summary || typeof value.summary !== 'object') return false;
  if (!Array.isArray(value.selectionIds)) return false;
  if (!Array.isArray(value.highlightedIds)) return false;
  if (!Array.isArray(value.elements)) return false;
  if (!Array.isArray(value.connections)) return false;
  if (!Array.isArray(value.recentActivity)) return false;
  const summary = value.summary as Partial<
    AiAssistantContextDetail['summary']
  >;
  return (
    typeof summary.goalCount === 'number' &&
    typeof summary.storyCount === 'number' &&
    typeof summary.taskCount === 'number' &&
    typeof summary.selectedCount === 'number'
  );
}

export function isAiAssistantPromptRequestDetail(
  detail: unknown
): detail is AiAssistantPromptRequestDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<AiAssistantPromptRequestDetail>;
  return (
    typeof value.prompt === 'string' &&
    (value.open === undefined || typeof value.open === 'boolean')
  );
}

export function isAiAssistantIntentRequestDetail(
  detail: unknown
): detail is AiAssistantIntentRequestDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<AiAssistantIntentRequestDetail>;
  return (
    (value.intent === 'review' ||
      value.intent === 'breakdown' ||
      value.intent === 'strategic_plan' ||
      value.intent === 'bootstrap_plan' ||
      value.intent === 'dependencies' ||
      value.intent === 'missing' ||
      value.intent === 'clarify' ||
      value.intent === 'fill_details') &&
    (value.scope === undefined ||
      value.scope === 'selection' ||
      value.scope === 'canvas') &&
    (value.targetIds === undefined ||
      (Array.isArray(value.targetIds) &&
        value.targetIds.every((id) => typeof id === 'string'))) &&
    (value.open === undefined || typeof value.open === 'boolean')
  );
}

export function emitAiAssistantToggleRequested(open?: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AiAssistantToggleRequestDetail>(
      AI_ASSISTANT_TOGGLE_REQUEST_EVENT,
      { detail: typeof open === 'boolean' ? { open } : {} }
    )
  );
}

export function emitAiAssistantVisibilityChanged(open: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AiAssistantVisibilityChangedDetail>(
      AI_ASSISTANT_VISIBILITY_CHANGED_EVENT,
      { detail: { open } }
    )
  );
}

export function emitAiAssistantContextChanged(
  detail: AiAssistantContextDetail
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AiAssistantContextDetail>(
      AI_ASSISTANT_CONTEXT_CHANGED_EVENT,
      { detail }
    )
  );
}

export function emitAiAssistantPromptRequested(
  prompt: string,
  open = true
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AiAssistantPromptRequestDetail>(
      AI_ASSISTANT_PROMPT_REQUEST_EVENT,
      {
        detail: {
          prompt,
          open,
        },
      }
    )
  );
}

export function emitAiAssistantIntentRequested(
  intent: AiAssistantIntentKind,
  options: {
    scope?: AiAssistantIntentScope;
    targetIds?: string[];
    open?: boolean;
  } = {}
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AiAssistantIntentRequestDetail>(
      AI_ASSISTANT_INTENT_REQUEST_EVENT,
      {
        detail: {
          intent,
          scope: options.scope,
          targetIds: options.targetIds,
          open: options.open ?? true,
        },
      }
    )
  );
}
