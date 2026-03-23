import type { WorkspaceChatIntentKind } from '../workspaceChatEvents.ts';
import type { WorkspaceChatProfile } from './WorkspaceChatContextTypes.ts';
import { isWorkspaceChatProfile } from './WorkspaceChatContextTypes.ts';
import type { WorkspaceChatOrchestratorRequest } from './WorkspaceChatOrchestrator.ts';
import type { WorkspaceChatExecutionPlan } from './WorkspaceChatToolTypes.ts';

export function buildWorkspaceChatIntentPlan(
  request: Pick<
    WorkspaceChatOrchestratorRequest,
    'intent' | 'profile' | 'snapshot' | 'contextMode'
  >
): WorkspaceChatExecutionPlan {
  const selectionIds = request.snapshot?.selectionIds.slice() ?? [];
  const idsInput = selectionIds.length > 0 ? { ids: selectionIds } : {};
  const profile = resolveWorkspaceChatIntentProfile(request.intent, request.profile);

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
    case 'breakdown':
    default:
      return {
        profile,
        contextMode: request.contextMode,
        calls: [{ tool: 'get_focus_bundle', input: { target: 'selection' } }],
      };
  }
}

export function resolveWorkspaceChatIntentInstructionIds(
  intent: WorkspaceChatIntentKind | undefined
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
    default:
      return ['planning.general-question'];
  }
}

export function resolveWorkspaceChatIntentProfile(
  intent: WorkspaceChatIntentKind | undefined,
  profile: WorkspaceChatProfile | undefined
): WorkspaceChatProfile {
  if (profile && isWorkspaceChatProfile(profile)) {
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
      return 'breakdown';
    case 'breakdown':
      return 'breakdown';
    default:
      return 'general-question';
  }
}
