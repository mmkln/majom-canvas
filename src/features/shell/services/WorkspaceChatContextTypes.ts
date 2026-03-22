import type {
  WorkspaceChatCanvasElement,
  WorkspaceChatCanvasSnapshot,
} from '../workspaceChatEvents.ts';
import type { WorkspaceChatContextMode } from './WorkspaceChatContextMode.ts';

export type WorkspaceChatProfile =
  | 'summarize'
  | 'review-selection'
  | 'next-steps'
  | 'breakdown'
  | 'dependency-review'
  | 'readiness-check'
  | 'general-question';

export const WORKSPACE_CHAT_PROFILES: WorkspaceChatProfile[] = [
  'summarize',
  'review-selection',
  'next-steps',
  'breakdown',
  'dependency-review',
  'readiness-check',
  'general-question',
];

export type WorkspaceChatMemoryState = {
  currentIntent: string | null;
  conversationSummary: string | null;
  agreedFacts: string[];
  workingSet: string[];
  lastRecommendations: string[];
  updatedAt: number | null;
};

export type WorkspaceChatFocusItem = {
  item: WorkspaceChatCanvasElement;
  parent: WorkspaceChatCanvasElement | null;
  children: WorkspaceChatCanvasElement[];
  siblings: WorkspaceChatCanvasElement[];
  related: Array<{
    item: WorkspaceChatCanvasElement;
    relationType: string;
  }>;
};

export const EMPTY_WORKSPACE_CHAT_MEMORY_STATE: WorkspaceChatMemoryState = {
  currentIntent: null,
  conversationSummary: null,
  agreedFacts: [],
  workingSet: [],
  lastRecommendations: [],
  updatedAt: null,
};

export function describeWorkspaceChatProfiles(): string {
  return WORKSPACE_CHAT_PROFILES.map((profile) => `"${profile}"`).join(' | ');
}

export function normalizeWorkspaceChatProfile(
  value: unknown
): WorkspaceChatProfile | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (WORKSPACE_CHAT_PROFILES.includes(value as WorkspaceChatProfile)) {
    return value as WorkspaceChatProfile;
  }

  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'workspace':
    case 'general':
    case 'general-help':
    case 'general_question':
    case 'help':
    case 'capability-help':
    case 'capabilities':
      return 'general-question';
    case 'review':
    case 'review_selection':
      return 'review-selection';
    case 'next':
    case 'next_steps':
      return 'next-steps';
    case 'dependency':
    case 'dependencies':
    case 'dependency_review':
      return 'dependency-review';
    case 'readiness':
    case 'missing':
    case 'readiness_check':
      return 'readiness-check';
    default:
      return null;
  }
}

export function isWorkspaceChatProfile(
  value: unknown
): value is WorkspaceChatProfile {
  return normalizeWorkspaceChatProfile(value) !== null;
}
