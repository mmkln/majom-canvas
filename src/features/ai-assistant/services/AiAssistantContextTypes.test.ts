import { describe, expect, it } from 'vitest';
import {
  isAiAssistantProfile,
  normalizeAiAssistantProfile,
} from './AiAssistantContextTypes.ts';

describe('AiAssistantContextTypes', () => {
  it('rejects bootstrap aliases while keeping strategic profiles canonical', () => {
    expect(normalizeAiAssistantProfile('bootstrap_plan')).toBeNull();
    expect(normalizeAiAssistantProfile('bootstrap-plan')).toBeNull();
    expect(normalizeAiAssistantProfile('bootstrap')).toBeNull();
    expect(isAiAssistantProfile('bootstrap_plan')).toBe(false);
    expect(normalizeAiAssistantProfile('strategic_plan')).toBe('strategic-plan');
    expect(isAiAssistantProfile('strategic_plan')).toBe(true);
  });
});
