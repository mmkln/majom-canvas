import { describe, expect, it } from 'vitest';
import { createWorkspaceChatTestSnapshot } from './WorkspaceChatTestUtils.ts';
import {
  buildWorkspaceChatIntentPlan,
  resolveWorkspaceChatIntentInstructionIds,
  resolveWorkspaceChatIntentProfile,
} from './WorkspaceChatIntentPlanFactory.ts';

describe('WorkspaceChatIntentPlanFactory', () => {
  it('builds a fill-details plan with focus, cluster, and missing-description tools', () => {
    const snapshot = createWorkspaceChatTestSnapshot();

    const plan = buildWorkspaceChatIntentPlan({
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
    expect(resolveWorkspaceChatIntentInstructionIds('clarify')).toEqual([
      'planning.clarify-selection',
    ]);
    expect(resolveWorkspaceChatIntentProfile('clarify', undefined)).toBe('breakdown');
  });

  it('builds a dependency plan with cluster context for relation suggestions', () => {
    const snapshot = createWorkspaceChatTestSnapshot({
      selectionIds: ['story-1', 'story-2'],
      summary: {
        selectedCount: 2,
      },
      elements: createWorkspaceChatTestSnapshot().elements.map((element) => ({
        ...element,
        selected: element.id === 'story-1' || element.id === 'story-2',
        focused: element.id === 'story-1',
      })),
      focusId: 'story-1',
    });

    const plan = buildWorkspaceChatIntentPlan({
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
    const snapshot = createWorkspaceChatTestSnapshot({
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

    const plan = buildWorkspaceChatIntentPlan({
      intent: 'strategic_plan',
      profile: undefined,
      snapshot,
      contextMode: 'canvas',
    });

    expect(plan.profile).toBe('strategic-plan');
    expect(plan.calls).toEqual([]);
    expect(resolveWorkspaceChatIntentInstructionIds('strategic_plan')).toEqual([
      'planning.strategic-plan',
    ]);
    expect(resolveWorkspaceChatIntentProfile('strategic_plan', undefined)).toBe(
      'strategic-plan'
    );
  });
});
