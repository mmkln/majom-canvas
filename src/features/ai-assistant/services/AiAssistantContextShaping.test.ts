import { describe, expect, it } from 'vitest';
import {
  buildAiAssistantContextExpansionRequest,
  describeAiAssistantContextBudget,
  resolveAiAssistantContextBudget,
} from './AiAssistantContextShaping.ts';
import { createAiAssistantTestSnapshot } from './AiAssistantTestUtils.ts';

describe('AiAssistantContextShaping', () => {
  it('resolves a neighborhood budget for rich focus evidence', () => {
    const snapshot = createAiAssistantTestSnapshot();
    const story = snapshot.elements.find((element) => element.id === 'story-1');
    const goal = snapshot.elements.find((element) => element.id === 'goal-1');
    const task = snapshot.elements.find((element) => element.id === 'task-1');
    const task2 = snapshot.elements.find((element) => element.id === 'task-2');

    if (!story || !goal || !task || !task2) {
      throw new Error('Expected test snapshot to include seeded items.');
    }

    const budget = resolveAiAssistantContextBudget({
      focus: {
        item: story,
        parent: goal,
        children: [task, task2],
        siblings: [],
        related: [],
      },
      selection: [story],
    });

    expect(budget.scope).toBe('neighborhood');
    expect(budget.maxBullets).toBeGreaterThan(0);
    expect(describeAiAssistantContextBudget(budget)).toContain(
      'Context scope: neighborhood'
    );
  });

  it('builds a bounded expansion request for branch context', () => {
    const snapshot = createAiAssistantTestSnapshot();
    const story = snapshot.elements.find((element) => element.id === 'story-1');
    const goal = snapshot.elements.find((element) => element.id === 'goal-1');
    const task = snapshot.elements.find((element) => element.id === 'task-1');
    if (!story || !goal) {
      throw new Error('Expected test snapshot to include seeded items.');
    }
    if (!task) {
      throw new Error('Expected test snapshot to include a task.');
    }

    const budget = resolveAiAssistantContextBudget({
      intent: 'strategic_plan',
      snapshot,
      focus: {
        item: story,
        parent: goal,
        children: [],
        siblings: [],
        related: [],
      },
      selection: [story, task],
    });
    const request = buildAiAssistantContextExpansionRequest({
      budget,
      intent: 'strategic_plan',
      snapshot,
      focus: {
        item: story,
        parent: goal,
        children: [],
        siblings: [],
        related: [],
      },
      selection: [story, task],
    });

    expect(request.scope).toBe('branch');
    expect(request.maxToolCalls).toBeLessThanOrEqual(2);
    expect(request.requestedToolNames.length).toBeGreaterThan(0);
    expect(JSON.stringify(request)).toContain('strategic_plan');
  });
});
