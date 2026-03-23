import { describe, expect, it } from 'vitest';
import { getAiAssistantCreateTargetRules, isAiAssistantStructuredActionEntryKind } from './AiAssistantStructuredTransport.ts';

describe('AiAssistantStructuredTransport', () => {
  it('describes goal-targeted create_goal and strategic batch rules', () => {
    const rules = getAiAssistantCreateTargetRules().join('\n');

    expect(rules).toContain('create_goal');
    expect(rules).toContain('target.kind may be "goal" or "canvas"');
    expect(rules).toContain('create_goals may target the canvas or a goal');
    expect(rules).toContain('create_goal_blueprint may target the canvas or a goal');
  });

  it('treats strategic batch entry kinds as structured action kinds', () => {
    expect(isAiAssistantStructuredActionEntryKind('create_goals')).toBe(true);
    expect(isAiAssistantStructuredActionEntryKind('create_goal_blueprint')).toBe(
      true
    );
  });
});
