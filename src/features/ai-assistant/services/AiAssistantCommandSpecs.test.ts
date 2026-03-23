import { describe, expect, it } from 'vitest';
import { getAiAssistantCommandSpec } from './AiAssistantCommandSpecs.ts';
import {
  createAiAssistantTestMemory,
  createAiAssistantTestSnapshot,
} from './AiAssistantTestUtils.ts';

function createFocusedFillDetailsSnapshot() {
  const baseSnapshot = createAiAssistantTestSnapshot();
  return {
    ...baseSnapshot,
    selectionIds: ['story-2'],
    focusId: 'story-2',
    summary: {
      ...baseSnapshot.summary,
      selectedCount: 1,
    },
    elements: baseSnapshot.elements.map((element) => ({
      ...element,
      selected: element.id === 'story-2',
      focused: element.id === 'story-2',
    })),
  };
}

function createDependenciesSelectionSnapshot() {
  const baseSnapshot = createAiAssistantTestSnapshot();
  return {
    ...baseSnapshot,
    selectionIds: ['story-1', 'story-2'],
    focusId: 'story-1',
    summary: {
      ...baseSnapshot.summary,
      selectedCount: 2,
    },
    elements: baseSnapshot.elements.map((element) => ({
      ...element,
      selected: element.id === 'story-1' || element.id === 'story-2',
      focused: element.id === 'story-1',
    })),
    connections: baseSnapshot.connections.filter(
      (connection) => connection.relationType === 'parent_child'
    ),
  };
}

function createDependenciesSelectionSnapshotWithExistingRelation() {
  const baseSnapshot = createAiAssistantTestSnapshot();
  return {
    ...baseSnapshot,
    selectionIds: ['story-1', 'story-2'],
    focusId: 'story-1',
    summary: {
      ...baseSnapshot.summary,
      selectedCount: 2,
    },
    elements: baseSnapshot.elements.map((element) => ({
      ...element,
      selected: element.id === 'story-1' || element.id === 'story-2',
      focused: element.id === 'story-1',
    })),
  };
}

function createDependenciesSelectionSnapshotWithConflictingRelationType() {
  const baseSnapshot = createDependenciesSelectionSnapshotWithExistingRelation();
  return {
    ...baseSnapshot,
    connections: [
      ...baseSnapshot.connections,
      {
        id: 'rel-extra-1',
        fromId: 'story-1',
        toId: 'story-2',
        relationType: 'leads_to',
      },
    ],
  };
}

function createThinFillDetailsSnapshot() {
  return {
    canvasId: 'canvas-physique',
    canvasTitle: 'Body goals',
    summary: {
      goalCount: 1,
      storyCount: 0,
      taskCount: 0,
      selectedCount: 1,
    },
    selectionIds: ['goal-physique'],
    focusId: 'goal-physique',
    highlightedIds: [],
    elements: [
      {
        id: 'goal-physique',
        kind: 'goal',
        title: 'Єбєйша фіз форма',
        description: '',
        status: 'todo',
        priority: 'high',
        childCount: 0,
        parentId: null,
        childIds: [],
        selected: true,
        focused: true,
        highlighted: false,
      },
    ],
    connections: [],
    viewport: null,
    recentActivity: [],
  };
}

function createEmptyCanvasSnapshot() {
  return {
    canvasId: 'canvas-empty',
    canvasTitle: 'Empty strategy canvas',
    summary: {
      goalCount: 0,
      storyCount: 0,
      taskCount: 0,
      selectedCount: 0,
    },
    selectionIds: [],
    focusId: null,
    highlightedIds: [],
    elements: [],
    connections: [],
    viewport: null,
    recentActivity: [],
  };
}

function createSelectedGoalSnapshot() {
  return {
    canvasId: 'canvas-strategy',
    canvasTitle: 'Strategy canvas',
    summary: {
      goalCount: 1,
      storyCount: 0,
      taskCount: 0,
      selectedCount: 1,
    },
    selectionIds: ['goal-strategy'],
    focusId: 'goal-strategy',
    highlightedIds: [],
    elements: [
      {
        id: 'goal-strategy',
        kind: 'goal',
        title: 'Стратегічний план вивчення автоматизації маркетингу',
        description:
          'Основи, інструменти, концепції, практика, аналітика, кейси.',
        status: 'defined',
        priority: 'low',
        childCount: 0,
        parentId: null,
        childIds: [],
        selected: true,
        focused: true,
        highlighted: false,
      },
    ],
    connections: [],
    viewport: null,
    recentActivity: [],
  };
}

describe('AiAssistantCommandSpecs', () => {
  it('rejects dependency analysis replies that do not return actions or one concise follow-up question', () => {
    const spec = getAiAssistantCommandSpec('dependencies');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Connect selected',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createDependenciesSelectionSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: [
          'Cluster overview:',
          'Checkout flow likely leads_to Post-purchase.',
          'Which relation should I suggest first?',
        ].join('\n'),
        actions: [],
      },
      compiledContext,
    });

    expect(error).toBe(
      'Dependencies command must return relation suggestions or one concise follow-up question.'
    );
  });

  it('accepts dependency relation suggestions inside the prepared command scope', () => {
    const spec = getAiAssistantCommandSpec('dependencies');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Connect selected',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createDependenciesSelectionSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown:
          'I suggested one sequence link so the selected stories read in execution order.',
        actions: [
          {
            kind: 'suggest_relations',
            relations: [
              {
                fromId: 'story-1',
                toId: 'story-2',
                relationType: 'leads_to',
                reason:
                  'Checkout flow naturally precedes post-purchase work in the selected cluster.',
              },
            ],
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });

  it('accepts dependency relation removals when the relation already exists in scope', () => {
    const spec = getAiAssistantCommandSpec('dependencies');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Remove the incorrect relation between the selected stories.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createDependenciesSelectionSnapshotWithExistingRelation(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown:
          'I prepared one relation cleanup to remove a noisy link from the selected cluster.',
        actions: [
          {
            kind: 'remove_relations',
            relations: [
              {
                fromId: 'story-1',
                toId: 'story-2',
                relationType: 'relates_to',
                reason:
                  'This relation currently adds noise without clarifying execution order or blocker risk.',
              },
            ],
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });

  it('rejects dependency relation removals when the relation does not already exist', () => {
    const spec = getAiAssistantCommandSpec('dependencies');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Remove the incorrect relation between the selected stories.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createDependenciesSelectionSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I prepared one cleanup action.',
        actions: [
          {
            kind: 'remove_relation',
            fromId: 'story-1',
            toId: 'story-2',
            relationType: 'relates_to',
            reason: 'This relation is not useful here anymore.',
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBe(
      'Removed dependency must already exist in the prepared command context.'
    );
  });

  it('accepts dependency relation type updates when the current relation exists and the next one does not', () => {
    const spec = getAiAssistantCommandSpec('dependencies');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Change the selected relation type.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createDependenciesSelectionSnapshotWithExistingRelation(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown:
          'I prepared one relation type change so the selected stories reflect execution order more clearly.',
        actions: [
          {
            kind: 'update_relation',
            fromId: 'story-1',
            toId: 'story-2',
            currentRelationType: 'relates_to',
            nextRelationType: 'leads_to',
            reason:
              'The selected stories have moved from loose overlap to a clearer sequence.',
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });

  it('rejects dependency relation type updates when the target relation type already exists', () => {
    const spec = getAiAssistantCommandSpec('dependencies');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Change the selected relation type.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createDependenciesSelectionSnapshotWithConflictingRelationType(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I prepared one relation type change.',
        actions: [
          {
            kind: 'update_relation',
            fromId: 'story-1',
            toId: 'story-2',
            currentRelationType: 'relates_to',
            nextRelationType: 'leads_to',
            reason: 'The relation should be directional now.',
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBe(
      'Updated dependency cannot change into a relation that already exists in the prepared command context.'
    );
  });

  it('rejects fill-details description updates that only restate the current item', () => {
    const spec = getAiAssistantCommandSpec('fill_details');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Fill missing details',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createFocusedFillDetailsSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I prepared one update.',
        actions: [
          {
            kind: 'suggest_update',
            elementId: 'story-2',
            patch: {
              description: 'Clarify the post-purchase scope for the current plan.',
            },
            reason: 'This keeps the wording general without inventing extra scope.',
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBe(
      'Fill_details description must add concrete detail from user input or nearby context instead of restating the current item.'
    );
  });

  it('accepts fill-details description updates that use nearby canvas evidence', () => {
    const spec = getAiAssistantCommandSpec('fill_details');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Fill missing details',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createFocusedFillDetailsSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I found one concrete detail to add.',
        actions: [
          {
            kind: 'suggest_update',
            elementId: 'story-2',
            patch: {
              description:
                'Cover the receipt email follow-up after purchase so the next step is explicit.',
            },
            reason:
              'This uses the child task about the receipt email to make the story scope concrete.',
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });

  it('accepts fill-details description updates that use explicit user-provided details in thin context', () => {
    const spec = getAiAssistantCommandSpec('fill_details');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt:
        'кілограм 85 це мінімум, далі великі плечі, великі грудні мязи, 6 пак прес, здорові передпліччя і ноги накачані.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createThinFillDetailsSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown:
          'Я підготував опис на основі деталей, які ти щойно дав.',
        actions: [
          {
            kind: 'suggest_update',
            elementId: 'goal-physique',
            patch: {
              description:
                'Мінімум 85 кг, великі плечі й грудні мязи, 6-пак прес, сильні передпліччя та накачані ноги.',
            },
            reason:
              'Це напряму використовує конкретні критерії форми, які користувач щойно задав.',
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });

  it('rejects another follow-up question when the user already provided concrete fill-details input', () => {
    const spec = getAiAssistantCommandSpec('fill_details');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt:
        'кілограм 85 це мінімум, далі великі плечі, великі грудні мязи, 6 пак прес, здорові передпліччя і ноги накачані.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createThinFillDetailsSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown:
          'What parent project or related goals support adding 85kg minimum, big shoulders, chest, abs, forearms, and legs?',
        actions: [],
      },
      compiledContext,
    });

    expect(error).toBe(
      'Fill_details should use the explicit user details instead of asking another follow-up question.'
    );
  });

  it('includes the latest user input in the fill-details command context', () => {
    const spec = getAiAssistantCommandSpec('fill_details');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt:
        '85kg minimum, broad shoulders, big chest, 6-pack abs, strong forearms, glutes and legs trained.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createFocusedFillDetailsSnapshot(),
    }) as { latestUserInput?: string };

    expect(compiledContext.latestUserInput).toBe(
      '85kg minimum, broad shoulders, big chest, 6-pack abs, strong forearms, glutes and legs trained.'
    );
  });

  it('accepts strategic_plan create_goals proposals on an empty canvas', () => {
    const spec = getAiAssistantCommandSpec('strategic_plan');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Generate a strategic learning plan for marketing automation.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createEmptyCanvasSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I prepared a flat strategic plan with the main learning tracks.',
        actions: [
          {
            kind: 'create_goals',
            title: 'Strategic goals',
            summary: 'High-level tracks for learning marketing automation.',
            items: [
              {
                title: 'Learn automation fundamentals',
                priority: 'high',
              },
              {
                title: 'Build first automated flow',
                priority: 'high',
              },
              {
                title: 'Measure and optimize results',
                priority: 'medium',
              },
            ],
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });

  it('accepts strategic_plan blueprints with hierarchy and leads_to links', () => {
    const spec = getAiAssistantCommandSpec('strategic_plan');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Generate a strategic learning plan for marketing automation.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createEmptyCanvasSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I prepared one strategic skeleton with major stages.',
        actions: [
          {
            kind: 'create_goal_blueprint',
            title: 'Marketing automation learning plan',
            summary: 'One main outcome with strategic subgoals.',
            pattern: 'goal_tree_with_sequence',
            goals: [
              {
                ref: 'root',
                title: 'Master marketing automation strategically',
                priority: 'high',
              },
              {
                ref: 'fundamentals',
                title: 'Learn core automation concepts',
                parentRef: 'root',
              },
              {
                ref: 'practice',
                title: 'Build real automation workflows',
                parentRef: 'root',
              },
            ],
            relations: [
              {
                fromRef: 'fundamentals',
                toRef: 'practice',
                relationType: 'leads_to',
                reason: 'Foundations should come before real workflow building.',
              },
            ],
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });

  it('accepts strategic_plan child goals anchored to a selected goal on a non-empty canvas', () => {
    const spec = getAiAssistantCommandSpec('strategic_plan');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'декомпозуй поточну ціль у підцілі',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createSelectedGoalSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I prepared strategic subgoals under the selected goal.',
        actions: [
          {
            kind: 'create_goals',
            title: 'Strategic goals',
            target: {
              kind: 'goal',
              id: 'goal-strategy',
            },
            items: [
              { title: 'Освоїти основи automation' },
              { title: 'Зібрати перші workflow' },
            ],
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });

  it('uses explicit intent context to mark selected-goal replanning as goal_replan', () => {
    const spec = getAiAssistantCommandSpec('strategic_plan');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Rebuild the strategic structure around the selected goal.',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createSelectedGoalSnapshot(),
      intentContext: {
        strategicPlanMode: 'goal_replan',
      },
    }) as { mode?: string };

    expect(compiledContext.mode).toBe('goal_replan');
  });

  it('requires goal-level strategic proposals to target the selected goal explicitly', () => {
    const spec = getAiAssistantCommandSpec('strategic_plan');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'декомпозуй поточну ціль у підцілі',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createSelectedGoalSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I prepared strategic subgoals.',
        actions: [
          {
            kind: 'create_goals',
            title: 'Strategic goals',
            items: [{ title: 'Goal A' }, { title: 'Goal B' }],
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBe(
      'Strategic decomposition around a selected goal must target that goal explicitly.'
    );
  });

  it('accepts an ambiguous goal breakdown follow-up without relying on a question mark', () => {
    const spec = getAiAssistantCommandSpec('breakdown');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'декомпозуй',
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      snapshot: createSelectedGoalSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown:
          'Choose the target level for this goal: strategic subgoals or execution-level stories.',
        actions: [],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });
});
