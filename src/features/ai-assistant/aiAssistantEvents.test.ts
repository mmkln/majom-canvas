import { describe, expect, it } from 'vitest';
import { isAiAssistantIntentRequestDetail } from './aiAssistantEvents.ts';

describe('aiAssistantEvents', () => {
  it('rejects bootstrap aliases in intent request details', () => {
    expect(
      isAiAssistantIntentRequestDetail({
        intent: 'bootstrap_plan',
        open: true,
      })
    ).toBe(false);
    expect(
      isAiAssistantIntentRequestDetail({
        intent: 'strategic_plan',
        open: true,
      })
    ).toBe(true);
    expect(
      isAiAssistantIntentRequestDetail({
        intent: 'next_steps',
        open: true,
      })
    ).toBe(true);
    expect(
      isAiAssistantIntentRequestDetail({
        intent: 'general_question',
        open: true,
      })
    ).toBe(true);
  });
});
