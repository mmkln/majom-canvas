// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createPlanningEntityIcon } from './PlanningEntityIcon.ts';

describe('PlanningEntityIcon', () => {
  it('renders solid and ghost variants with kind-specific tokens', () => {
    const solidStory = createPlanningEntityIcon({
      kind: 'story',
      variant: 'solid',
    });
    const ghostTask = createPlanningEntityIcon({
      kind: 'task',
      variant: 'ghost',
    });
    const ghostGoal = createPlanningEntityIcon({
      kind: 'goal',
      variant: 'ghost',
    });

    expect(solidStory.getAttribute('data-entity-kind')).toBe('story');
    expect(solidStory.className).toContain('bg-blue-600');
    expect(solidStory.className).toContain('text-white');

    expect(ghostTask.getAttribute('data-entity-kind')).toBe('task');
    expect(ghostTask.className).toContain('text-emerald-600');
    expect(ghostTask.className).toContain('bg-transparent');

    expect(ghostGoal.getAttribute('data-entity-kind')).toBe('goal');
    expect(ghostGoal.className).toContain('text-violet-600');
  });
});
