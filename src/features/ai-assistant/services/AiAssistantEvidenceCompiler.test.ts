import { describe, expect, it } from 'vitest';
import type { AiAssistantFocusItem } from './AiAssistantContextTypes.ts';
import { compileAiAssistantEvidencePacket, renderAiAssistantEvidencePacket } from './AiAssistantEvidenceCompiler.ts';
import { createAiAssistantTestSnapshot } from './AiAssistantTestUtils.ts';

describe('AiAssistantEvidenceCompiler', () => {
  it('compiles a compact evidence packet from the active canvas snapshot', () => {
    const snapshot = createAiAssistantTestSnapshot();
    const goal = snapshot.elements.find((element) => element.id === 'goal-1');
    const story = snapshot.elements.find((element) => element.id === 'story-1');
    const task1 = snapshot.elements.find((element) => element.id === 'task-1');
    const task2 = snapshot.elements.find((element) => element.id === 'task-2');
    if (!goal || !story || !task1 || !task2) {
      throw new Error('Expected test snapshot to include seeded elements.');
    }

    const focus: AiAssistantFocusItem = {
      item: story,
      parent: goal,
      children: [task1, task2],
      siblings: snapshot.elements.filter(
        (element) => element.parentId === goal.id && element.id !== story.id
      ),
      related: [],
    };

    const packet = compileAiAssistantEvidencePacket({
      snapshot,
      focus,
      selection: [story],
    });

    expect(packet.summary.length).toBeGreaterThan(0);
    expect(packet.contextScope).toBe('neighborhood');
    expect(packet.supportedBy).toContain('story-1');
    expect(packet.supportedBy).toContain('goal-1');
    expect(packet.evidenceIds).toContain('story-1');
    expect(packet.evidenceIds).toContain('goal-1');
    expect(packet.scenarioId).toBeUndefined();
    expect(packet.bullets.join('\n')).toContain('Payment form');
    expect(packet.bullets.join('\n')).toContain('Receipt email');
    expect(packet.sourceContext).toContain('Main current flow');
    expect(packet.sourceContext).toContain('Checkout flow');
  });

  it('renders a human-readable evidence packet without raw tool dumps', () => {
    const snapshot = createAiAssistantTestSnapshot();
    const story = snapshot.elements.find((element) => element.id === 'story-1');
    const goal = snapshot.elements.find((element) => element.id === 'goal-1');
    if (!story || !goal) {
      throw new Error('Expected test snapshot to include seeded goal and story.');
    }

    const packet = compileAiAssistantEvidencePacket({
      snapshot,
      focus: {
        item: story,
        parent: goal,
        children: [],
        siblings: [],
        related: [],
      },
      selection: [story],
      maxBullets: 3,
    });

    const rendered = renderAiAssistantEvidencePacket(packet);

    expect(rendered).toContain('Evidence summary:');
    expect(rendered).toContain('Supported by:');
    expect(rendered).toContain('Context scope:');
    expect(rendered).not.toContain('"tool"');
    expect(rendered).toContain('Canonical context:');
  });

  it('includes scenario metadata when supplied', () => {
    const snapshot = createAiAssistantTestSnapshot();
    const packet = compileAiAssistantEvidencePacket({
      snapshot,
      scenario: {
        id: 'strategic_plan.goal_subgoals',
        kind: 'strategic_plan',
        variant: 'typed',
        intent: 'strategic_plan',
        mode: 'goal_subgoals',
        scope: 'item',
        target: null,
        confidence: 0.95,
        missingSlots: [],
        allowedActions: [],
        confirmationMode: 'none',
      },
    });

    expect(packet.scenarioId).toBe('strategic_plan.goal_subgoals');
    expect(packet.scenarioMode).toBe('goal_subgoals');
    expect(packet.scenarioKind).toBe('typed');
    expect(renderAiAssistantEvidencePacket(packet)).toContain('Scenario:');
  });
});
