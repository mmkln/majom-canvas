import type { WorkspaceView } from '../WorkspaceView.ts';
import type {
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatSelectionItem,
} from '../workspaceChatEvents.ts';
import {
  describeWorkspaceChatSelectionInline,
  getWorkspaceChatSelectedItems,
} from './WorkspaceChatContent.ts';
import {
  WORKSPACE_CHAT_CONTEXT_MODE_OPTIONS,
  type WorkspaceChatContextMode,
} from './WorkspaceChatContextMode.ts';
import { getWorkspaceChatQuickActions } from './WorkspaceChatQuickActions.ts';

export type WorkspaceChatCapabilityContext = {
  assistantScope: string;
  currentView: WorkspaceView;
  canvasTitle: string | null;
  currentSelection: {
    count: number;
    summary: string;
  };
  contextModes: Array<{
    mode: WorkspaceChatContextMode;
    label: string;
    description: string;
  }>;
  supportedWorkflows: string[];
  currentQuickActions: string[];
  currentAiActions: string[];
  constraints: string[];
};

export function buildWorkspaceChatCapabilityContext(params: {
  currentView: WorkspaceView;
  snapshot: WorkspaceChatCanvasSnapshot | null;
}): WorkspaceChatCapabilityContext {
  const selection = params.snapshot
    ? getWorkspaceChatSelectedItems(params.snapshot)
    : [];

  return {
    assistantScope:
      'Workspace-focused planning copilot for reviewing structure, clarifying work items, and suggesting confirm-first canvas changes.',
    currentView: params.currentView,
    canvasTitle: params.snapshot?.canvasTitle || null,
    currentSelection: {
      count: selection.length,
      summary: describeSelectionSummary(selection),
    },
    contextModes: WORKSPACE_CHAT_CONTEXT_MODE_OPTIONS.map((option) => ({
      mode: option.value,
      label: option.label,
      description: getContextModeDescription(option.value),
    })),
    supportedWorkflows: [
      'Review the current plan or selected work for gaps, weak structure, and planning risks.',
      'Explain what is missing, what is blocked, and what the next planning moves should be.',
      'Clarify or fill missing details on selected goals, stories, and tasks.',
      'Break a goal into stories or a story into tasks when the hierarchy supports it.',
      'Suggest dependency links, review recent changes, and point out duplicate titles or overlap.',
    ],
    currentQuickActions: getWorkspaceChatQuickActions(params.snapshot).map(
      (action) => action.label
    ),
    currentAiActions: resolveCurrentAiActionLabels(selection),
    constraints: [
      'This chat is workspace-scoped, not a general open-domain assistant.',
      'It should stay grounded in canvas data, retrieved tool results, memory, and frontend capability context.',
      'Any proposed canvas changes stay confirm-first and are not applied until the user explicitly confirms.',
    ],
  };
}

function describeSelectionSummary(selection: WorkspaceChatSelectionItem[]): string {
  if (selection.length === 0) {
    return 'No canvas items are currently selected.';
  }
  if (selection.length === 1) {
    return `Current selection: ${describeWorkspaceChatSelectionInline(selection)}.`;
  }
  return `Current selection: ${selection.length} items (${describeWorkspaceChatSelectionInline(selection)}).`;
}

function resolveCurrentAiActionLabels(
  selection: WorkspaceChatSelectionItem[]
): string[] {
  if (selection.length === 0) {
    return [];
  }

  if (selection.length > 1) {
    return ['Connect selected', 'Fill missing details'];
  }

  const item = selection[0];
  if (!item) {
    return [];
  }

  const actions: string[] = [];
  if (item.kind === 'goal') {
    actions.push('Break into stories');
  } else if (item.kind === 'story') {
    actions.push('Break into tasks');
  }

  actions.push('Clarify', 'Fill missing details', 'Link blockers');
  return actions;
}

function getContextModeDescription(mode: WorkspaceChatContextMode): string {
  switch (mode) {
    case 'none':
      return 'Use only the typed request and chat memory without grounding in canvas data.';
    case 'canvas':
      return 'Ground the answer in the full canvas snapshot.';
    case 'viewport':
      return 'Ground the answer in the items visible in the current viewport.';
    case 'selection':
      return 'Ground the answer in the selected items and their nearby structure.';
  }
}
