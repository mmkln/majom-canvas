import { describe, expect, it } from 'vitest';
import {
  createWorkspaceChatInstructionRegistry,
  WorkspaceChatInstructionRegistry,
} from './WorkspaceChatInstructionRegistry.ts';

describe('WorkspaceChatInstructionRegistry', () => {
  it('exposes instruction index entries without packet bodies', () => {
    const registry = createWorkspaceChatInstructionRegistry();

    const index = registry.listIndex();

    expect(index.length).toBeGreaterThan(0);
    expect(index.some((entry) => entry.id === 'planning.readiness-check')).toBe(true);
    expect(index.every((entry) => typeof entry.summary === 'string')).toBe(true);
  });

  it('returns detailed instruction packets for explicit ids', () => {
    const registry = new WorkspaceChatInstructionRegistry();

    const packets = registry.getPackets([
      'planning.review-selection',
      'response.structured-reply',
    ]);

    expect(packets.map((packet) => packet.id)).toEqual([
      'planning.review-selection',
      'response.structured-reply',
    ]);
    expect(packets[0]?.body).toContain('Review the targeted canvas work');
  });
});
