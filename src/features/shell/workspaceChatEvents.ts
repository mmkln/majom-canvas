export const WORKSPACE_CHAT_TOGGLE_REQUEST_EVENT =
  'workspaceChatToggleRequested';
export const WORKSPACE_CHAT_VISIBILITY_CHANGED_EVENT =
  'workspaceChatVisibilityChanged';
export const WORKSPACE_CHAT_CONTEXT_CHANGED_EVENT =
  'workspaceChatContextChanged';
export const WORKSPACE_CHAT_PROMPT_REQUEST_EVENT =
  'workspaceChatPromptRequested';
export const WORKSPACE_CHAT_INTENT_REQUEST_EVENT =
  'workspaceChatIntentRequested';

export type WorkspaceChatToggleRequestDetail = {
  open?: boolean;
};

export type WorkspaceChatVisibilityChangedDetail = {
  open: boolean;
};

export type WorkspaceChatPromptRequestDetail = {
  prompt: string;
  open?: boolean;
};

export type WorkspaceChatIntentKind =
  | 'review'
  | 'breakdown'
  | 'dependencies'
  | 'missing'
  | 'clarify'
  | 'fill_details';
export type WorkspaceChatIntentScope = 'selection' | 'canvas';

export type WorkspaceChatElementKind = 'goal' | 'story' | 'task';

export type WorkspaceChatConnectionRelationType =
  | 'leads_to'
  | 'blocks'
  | 'parent_child'
  | 'relates_to';

export type WorkspaceChatSelectionItem = {
  id: string;
  kind: WorkspaceChatElementKind;
  title: string;
  description: string;
  status?: string;
  priority?: string;
  childCount?: number;
};

export type WorkspaceChatIntentRequestDetail = {
  intent: WorkspaceChatIntentKind;
  scope?: WorkspaceChatIntentScope;
  targetIds?: string[];
  open?: boolean;
};

export type WorkspaceChatCanvasElement = WorkspaceChatSelectionItem & {
  parentId: string | null;
  childIds: string[];
  selected: boolean;
  focused: boolean;
  highlighted: boolean;
};

export type WorkspaceChatConnectionEdge = {
  id: string;
  fromId: string;
  toId: string;
  relationType: WorkspaceChatConnectionRelationType;
};

export type WorkspaceChatRecentActivityItem = {
  id: string;
  type: 'added' | 'removed' | 'updated' | 'selection' | 'focus';
  label: string;
  entityIds: string[];
  timestamp: number;
};

export type WorkspaceChatViewport = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  visibleElementIds: string[];
};

export type WorkspaceChatCanvasSnapshot = {
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
  elements: WorkspaceChatCanvasElement[];
  connections: WorkspaceChatConnectionEdge[];
  viewport: WorkspaceChatViewport | null;
  recentActivity: WorkspaceChatRecentActivityItem[];
};

export type WorkspaceChatContextDetail = WorkspaceChatCanvasSnapshot;

export function isWorkspaceChatToggleRequestDetail(
  detail: unknown
): detail is WorkspaceChatToggleRequestDetail {
  if (!detail) return true;
  if (typeof detail !== 'object') return false;
  const value = detail as Partial<WorkspaceChatToggleRequestDetail>;
  return value.open === undefined || typeof value.open === 'boolean';
}

export function isWorkspaceChatVisibilityChangedDetail(
  detail: unknown
): detail is WorkspaceChatVisibilityChangedDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<WorkspaceChatVisibilityChangedDetail>;
  return typeof value.open === 'boolean';
}

export function isWorkspaceChatContextDetail(
  detail: unknown
): detail is WorkspaceChatContextDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<WorkspaceChatContextDetail>;
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
    WorkspaceChatContextDetail['summary']
  >;
  return (
    typeof summary.goalCount === 'number' &&
    typeof summary.storyCount === 'number' &&
    typeof summary.taskCount === 'number' &&
    typeof summary.selectedCount === 'number'
  );
}

export function isWorkspaceChatPromptRequestDetail(
  detail: unknown
): detail is WorkspaceChatPromptRequestDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<WorkspaceChatPromptRequestDetail>;
  return (
    typeof value.prompt === 'string' &&
    (value.open === undefined || typeof value.open === 'boolean')
  );
}

export function isWorkspaceChatIntentRequestDetail(
  detail: unknown
): detail is WorkspaceChatIntentRequestDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<WorkspaceChatIntentRequestDetail>;
  return (
    (value.intent === 'review' ||
      value.intent === 'breakdown' ||
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

export function emitWorkspaceChatToggleRequested(open?: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceChatToggleRequestDetail>(
      WORKSPACE_CHAT_TOGGLE_REQUEST_EVENT,
      { detail: typeof open === 'boolean' ? { open } : {} }
    )
  );
}

export function emitWorkspaceChatVisibilityChanged(open: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceChatVisibilityChangedDetail>(
      WORKSPACE_CHAT_VISIBILITY_CHANGED_EVENT,
      { detail: { open } }
    )
  );
}

export function emitWorkspaceChatContextChanged(
  detail: WorkspaceChatContextDetail
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceChatContextDetail>(
      WORKSPACE_CHAT_CONTEXT_CHANGED_EVENT,
      { detail }
    )
  );
}

export function emitWorkspaceChatPromptRequested(
  prompt: string,
  open = true
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceChatPromptRequestDetail>(
      WORKSPACE_CHAT_PROMPT_REQUEST_EVENT,
      {
        detail: {
          prompt,
          open,
        },
      }
    )
  );
}

export function emitWorkspaceChatIntentRequested(
  intent: WorkspaceChatIntentKind,
  options: {
    scope?: WorkspaceChatIntentScope;
    targetIds?: string[];
    open?: boolean;
  } = {}
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceChatIntentRequestDetail>(
      WORKSPACE_CHAT_INTENT_REQUEST_EVENT,
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
