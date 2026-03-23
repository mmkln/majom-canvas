import type { AiAssistantCanvasElement } from '../aiAssistantEvents.ts';

export type AiAssistantProfile =
  | 'summarize'
  | 'review-selection'
  | 'next-steps'
  | 'breakdown'
  | 'strategic-plan'
  | 'dependency-review'
  | 'readiness-check'
  | 'general-question';

export const AI_ASSISTANT_PROFILES: AiAssistantProfile[] = [
  'summarize',
  'review-selection',
  'next-steps',
  'breakdown',
  'strategic-plan',
  'dependency-review',
  'readiness-check',
  'general-question',
];

export type AiAssistantMemoryState = {
  currentIntent: string | null;
  conversationSummary: string | null;
  agreedFacts: string[];
  workingSet: string[];
  lastRecommendations: string[];
  updatedAt: number | null;
};

export type AiAssistantFocusItem = {
  item: AiAssistantCanvasElement;
  parent: AiAssistantCanvasElement | null;
  children: AiAssistantCanvasElement[];
  siblings: AiAssistantCanvasElement[];
  related: Array<{
    item: AiAssistantCanvasElement;
    relationType: string;
  }>;
};

export const EMPTY_AI_ASSISTANT_MEMORY_STATE: AiAssistantMemoryState = {
  currentIntent: null,
  conversationSummary: null,
  agreedFacts: [],
  workingSet: [],
  lastRecommendations: [],
  updatedAt: null,
};

export function describeAiAssistantProfiles(): string {
  return AI_ASSISTANT_PROFILES.map((profile) => `"${profile}"`).join(' | ');
}

export function normalizeAiAssistantProfile(
  value: unknown
): AiAssistantProfile | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (AI_ASSISTANT_PROFILES.includes(value as AiAssistantProfile)) {
    return value as AiAssistantProfile;
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
    case 'bootstrap':
    case 'bootstrap_plan':
    case 'bootstrap-plan':
    case 'plan-bootstrap':
    case 'strategic':
    case 'strategic_plan':
    case 'strategic-plan':
    case 'plan-strategic':
      return 'strategic-plan';
    case 'readiness':
    case 'missing':
    case 'readiness_check':
      return 'readiness-check';
    default:
      return null;
  }
}

export function isAiAssistantProfile(
  value: unknown
): value is AiAssistantProfile {
  return normalizeAiAssistantProfile(value) !== null;
}
