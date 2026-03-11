import { describe, expect, it } from 'vitest';
import {
  identityDragGroupResolver,
  type DragGroupResolver,
} from './dragGroupPolicy.ts';

describe('dragGroupPolicy', () => {
  it('identity resolver returns the same selection by default', () => {
    const selected = [{ id: 'a' }, { id: 'b' }];
    const resolved = identityDragGroupResolver(selected);
    expect(resolved).toBe(selected);
    expect(resolved).toEqual(selected);
  });

  it('supports custom resolvers', () => {
    const resolver: DragGroupResolver<{ id: string; children?: string[] }> = (
      selected
    ) => {
      const ids = new Set(selected.map((item) => item.id));
      selected.forEach((item) => item.children?.forEach((id) => ids.add(id)));
      return Array.from(ids).map((id) => ({ id }));
    };

    const selected = [{ id: 'story-1', children: ['task-1'] }];
    expect(resolver(selected)).toEqual([{ id: 'story-1' }, { id: 'task-1' }]);
  });
});
