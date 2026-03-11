import { describe, expect, it } from 'vitest';
import { identityConnectableOrderResolver } from './connectableOrderPolicy.ts';

describe('identityConnectableOrderResolver', () => {
  it('returns input list unchanged', () => {
    const connectables = [{ id: 'a' }, { id: 'b' }];
    const result = identityConnectableOrderResolver({
      connectables,
      isCreatingConnection: false,
    });

    expect(result).toBe(connectables);
    expect(result).toEqual(connectables);
  });
});
