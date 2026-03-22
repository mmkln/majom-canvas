import { describe, expect, it, vi } from 'vitest';
import {
  buildWorkspaceChatRouterRepairMessages,
  completeWorkspaceChatTextWithRepair,
  tryParseWorkspaceChatJsonCandidate,
} from './WorkspaceChatRepair.ts';

describe('WorkspaceChatRepair', () => {
  it('repairs one invalid response into valid JSON', async () => {
    const client = {
      completeText: vi
        .fn()
        .mockResolvedValueOnce('not json at all')
        .mockResolvedValueOnce('{"kind":"finalize"}'),
    };

    const result = await completeWorkspaceChatTextWithRepair({
      client,
      messages: [{ role: 'user', content: 'Return JSON' }],
      validate: (content) => {
        const parsed = tryParseWorkspaceChatJsonCandidate<{ kind?: string }>(content);
        if (!parsed || parsed.kind !== 'finalize') {
          throw new Error('Invalid finalize payload.');
        }
        return parsed.kind;
      },
      buildRepairMessages: ({ invalidResponse, validationError }) =>
        buildWorkspaceChatRouterRepairMessages({
          invalidResponse,
          validationError,
        }),
      maxRepairAttempts: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('finalize');
      expect(result.repairAttempts).toBe(1);
    }
    expect(client.completeText).toHaveBeenCalledTimes(2);
  });

  it('returns the last invalid response after repair attempts are exhausted', async () => {
    const client = {
      completeText: vi
        .fn()
        .mockResolvedValueOnce('bad 1')
        .mockResolvedValueOnce('bad 2'),
    };

    const result = await completeWorkspaceChatTextWithRepair({
      client,
      messages: [{ role: 'user', content: 'Return JSON' }],
      validate: (content) => {
        const parsed = tryParseWorkspaceChatJsonCandidate(content);
        if (!parsed) {
          throw new Error('Still invalid JSON.');
        }
        return parsed;
      },
      buildRepairMessages: ({ invalidResponse, validationError }) =>
        buildWorkspaceChatRouterRepairMessages({
          invalidResponse,
          validationError,
        }),
      maxRepairAttempts: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rawContent).toBe('bad 2');
      expect(result.error.message).toBe('Still invalid JSON.');
      expect(result.repairAttempts).toBe(1);
    }
  });
});
