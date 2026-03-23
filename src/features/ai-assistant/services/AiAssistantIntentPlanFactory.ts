import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type { AiAssistantProfile } from './AiAssistantContextTypes.ts';
import { isAiAssistantProfile } from './AiAssistantContextTypes.ts';
import type { AiAssistantOrchestratorRequest } from './AiAssistantOrchestrator.ts';
import type { AiAssistantExecutionPlan } from './AiAssistantToolTypes.ts';

export function buildAiAssistantIntentPlan(
  request: Pick<
    AiAssistantOrchestratorRequest,
    'intent' | 'profile' | 'snapshot' | 'contextMode'
  >
): AiAssistantExecutionPlan {
  const selectionIds = request.snapshot?.selectionIds.slice() ?? [];
  const idsInput = selectionIds.length > 0 ? { ids: selectionIds } : {};
  const profile = resolveAiAssistantIntentProfile(request.intent, request.profile);

  switch (request.intent) {
    case 'review':
      return {
        profile,
        contextMode: request.contextMode,
        calls: [
          { tool: 'get_focus_bundle', input: { target: 'selection' } },
          { tool: 'find_structure_gaps', input: idsInput },
          { tool: 'find_dependency_gaps', input: idsInput },
        ],
      };
    case 'strategic_plan':
      return {
        profile,
        contextMode: request.contextMode,
        calls:
          selectionIds.length === 1
            ? [{ tool: 'get_focus_bundle', input: { target: 'selection' } }]
            : [],
      };
    case 'missing':
      return {
        profile,
        contextMode: request.contextMode,
        calls: [
          { tool: 'get_focus_bundle', input: { target: 'selection' } },
          { tool: 'find_structure_gaps', input: idsInput },
          { tool: 'find_dependency_gaps', input: idsInput },
          { tool: 'find_missing_descriptions', input: idsInput },
        ],
      };
    case 'fill_details':
      return {
        profile,
        contextMode: request.contextMode,
        calls: [
          { tool: 'get_focus_bundle', input: { target: 'selection' } },
          { tool: 'get_selection_cluster', input: idsInput },
          { tool: 'find_missing_descriptions', input: idsInput },
        ],
      };
    case 'dependencies':
      return {
        profile,
        contextMode: request.contextMode,
        calls: [
          { tool: 'get_focus_bundle', input: { target: 'selection' } },
          { tool: 'get_selection_cluster', input: idsInput },
          { tool: 'get_related_relations', input: idsInput },
          { tool: 'find_dependency_gaps', input: idsInput },
        ],
      };
    case 'clarify':
      return {
        profile,
        contextMode: request.contextMode,
        calls: [
          { tool: 'get_focus_bundle', input: { target: 'selection' } },
          { tool: 'get_selection_cluster', input: idsInput },
        ],
      };
    case 'next_steps':
    case 'recent_changes':
    case 'duplicates':
    case 'capability_help':
    case 'general_question':
      return {
        profile,
        contextMode: request.contextMode,
        calls: [],
      };
    case 'breakdown':
    default:
      return {
        profile,
        contextMode: request.contextMode,
        calls: [{ tool: 'get_focus_bundle', input: { target: 'selection' } }],
      };
  }
}

export function resolveAiAssistantIntentInstructionIds(
  intent: AiAssistantIntentKind | null | undefined
): string[] {
  switch (intent) {
    case 'review':
      return ['planning.review-selection'];
    case 'missing':
      return ['planning.readiness-check'];
    case 'fill_details':
      return ['planning.fill-details'];
    case 'strategic_plan':
      return ['planning.strategic-plan'];
    case 'dependencies':
      return ['planning.dependency-review'];
    case 'clarify':
      return ['planning.clarify-selection'];
    case 'breakdown':
      return ['planning.breakdown'];
    case 'next_steps':
      return ['planning.next-steps'];
    case 'recent_changes':
      return ['planning.recent-changes'];
    case 'duplicates':
      return ['planning.duplicate-review'];
    case 'capability_help':
      return ['planning.capability-help'];
    case 'general_question':
      return ['planning.general-question'];
    default:
      return ['planning.general-question'];
  }
}

export function resolveAiAssistantIntentProfile(
  intent: AiAssistantIntentKind | null | undefined,
  profile: AiAssistantProfile | undefined
): AiAssistantProfile {
  if (profile && isAiAssistantProfile(profile)) {
    return profile;
  }
  switch (intent) {
    case 'review':
      return 'review-selection';
    case 'dependencies':
      return 'dependency-review';
    case 'strategic_plan':
      return 'strategic-plan';
    case 'missing':
      return 'readiness-check';
    case 'fill_details':
      return 'readiness-check';
    case 'clarify':
      return 'review-selection';
    case 'breakdown':
      return 'breakdown';
    case 'next_steps':
      return 'next-steps';
    case 'recent_changes':
    case 'duplicates':
    case 'capability_help':
    case 'general_question':
      return 'general-question';
    default:
      return 'general-question';
  }
}
