import { describe, expect, it } from 'vitest';
import { AllowAllRelationPolicy } from './relationPolicy.ts';

describe('canvas-core relation policy', () => {
  it('allows connection by default', () => {
    const policy = new AllowAllRelationPolicy<{ id: string }>();
    const result = policy.canConnect({
      source: { id: 'source' },
      target: { id: 'target' },
    });

    expect(result).toEqual({ allowed: true });
  });
});

