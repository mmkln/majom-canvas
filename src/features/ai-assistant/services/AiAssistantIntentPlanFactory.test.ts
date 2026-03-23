import { describe, expect, it } from 'vitest';
import { createAiAssistantTestSnapshot } from './AiAssistantTestUtils.ts';
import {
  buildAiAssistantIntentPlan,
  resolveAiAssistantIntentInstructionIds,
  resolveAiAssistantIntentProfile,
} from './AiAssistantIntentPlanFactory.ts';

describe('AiAssistantIntentPlanFactory', () => {
  it('builds a fill-details plan with focus, cluster, and missing-description tools', () => {
    const snapshot = createAiAssistantTestSnapshot();

    const plan = buildAiAssistantIntentPlan({
      intent: 'fill_details',
      profile: undefined,
      snapshot,
      contextMode: 'selection',
    });

    expect(plan.profile).toBe('readiness-check');
    expect(plan.calls).toEqual([
      { tool: 'get_focus_bundle', input: { target: 'selection' } },
      { tool: 'get_selection_cluster', input: { ids: ['story-1'] } },
      { tool: 'find_missing_descriptions', input: { ids: ['story-1'] } },
    ]);
  });

  it('maps clarify intents to the clarify instruction packet and breakdown profile', () => {
    expect(resolveAiAssistantIntentInstructionIds('clarify')).toEqual([
      'planning.clarify-selection',
    ]);
    expect(resolveAiAssistantIntentProfile('clarify', undefined)).toBe('review-selection');
  });

  it('builds a dependency plan with cluster context for relation suggestions', () => {
    const snapshot = createAiAssistantTestSnapshot({
      selectionIds: ['story-1', 'story-2'],
      summary: {
        selectedCount: 2,
      },
      elements: createAiAssistantTestSnapshot().elements.map((element) => ({
        ...element,
        selected: element.id === 'story-1' || element.id === 'story-2',
        focused: element.id === 'story-1',
      })),
      focusId: 'story-1',
    });

    const plan = buildAiAssistantIntentPlan({
      intent: 'dependencies',
      profile: undefined,
      snapshot,
      contextMode: 'selection',
    });

    expect(plan.calls).toEqual([
      { tool: 'get_focus_bundle', input: { target: 'selection' } },
      { tool: 'get_selection_cluster', input: { ids: ['story-1', 'story-2'] } },
      { tool: 'get_related_relations', input: { ids: ['story-1', 'story-2'] } },
      { tool: 'find_dependency_gaps', input: { ids: ['story-1', 'story-2'] } },
    ]);
  });

  it('builds a strategic plan with no tool calls and the strategic profile', () => {
    const snapshot = createAiAssistantTestSnapshot({
      summary: {
        goalCount: 0,
        storyCount: 0,
        taskCount: 0,
        selectedCount: 0,
      },
      selectionIds: [],
      focusId: null,
      elements: [],
      connections: [],
      recentActivity: [],
      viewport: null,
    });

    const plan = buildAiAssistantIntentPlan({
      intent: 'strategic_plan',
      profile: undefined,
      snapshot,
      contextMode: 'canvas',
    });

    expect(plan.profile).toBe('strategic-plan');
    expect(plan.calls).toEqual([]);
    expect(resolveAiAssistantIntentInstructionIds('strategic_plan')).toEqual([
      'planning.strategic-plan',
    ]);
    expect(resolveAiAssistantIntentProfile('strategic_plan', undefined)).toBe(
      'strategic-plan'
    );
  });

  it('maps fallback runtime intents to instruction packets without forcing tool calls', () => {
    expect(buildAiAssistantIntentPlan({
      intent: 'next_steps',
      profile: undefined,
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'canvas',
    }).calls).toEqual([]);
    expect(resolveAiAssistantIntentInstructionIds('next_steps')).toEqual([
      'planning.next-steps',
    ]);
    expect(resolveAiAssistantIntentInstructionIds('recent_changes')).toEqual([
      'planning.recent-changes',
    ]);
    expect(resolveAiAssistantIntentInstructionIds('duplicates')).toEqual([
      'planning.duplicate-review',
    ]);
    expect(resolveAiAssistantIntentInstructionIds('capability_help')).toEqual([
      'planning.capability-help',
    ]);
    expect(resolveAiAssistantIntentInstructionIds('general_question')).toEqual([
      'planning.general-question',
    ]);
    expect(resolveAiAssistantIntentProfile('next_steps', undefined)).toBe(
      'next-steps'
    );
    expect(resolveAiAssistantIntentProfile('general_question', undefined)).toBe(
      'general-question'
    );
  });
});
