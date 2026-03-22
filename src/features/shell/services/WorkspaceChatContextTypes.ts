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

export function isWorkspaceChatProfile(
  value: unknown
): value is WorkspaceChatProfile {
  return (
    typeof value === 'string' &&
    WORKSPACE_CHAT_PROFILES.includes(value as WorkspaceChatProfile)
  );
}
