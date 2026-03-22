import { describe, expect, it, vi } from 'vitest';
import { WorkspaceChatToolExecutor } from './WorkspaceChatToolExecutor.ts';
import { WorkspaceChatToolRegistry } from './WorkspaceChatToolRegistry.ts';
import {
  createWorkspaceChatTestMemory,
  createWorkspaceChatTestSnapshot,
} from './WorkspaceChatTestUtils.ts';

function createRuntime() {
  return {
    snapshot: createWorkspaceChatTestSnapshot(),
    memory: createWorkspaceChatTestMemory(),
    prompt: 'Review current work',
    contextMode: 'selection' as const,
  };
}

describe('WorkspaceChatToolExecutor', () => {
  it('executes a linear plan', async () => {
    const registry = new WorkspaceChatToolRegistry([
      {
        name: 'one',
        kind: 'read',
        description: 'First',
        inputSchema: '{}',
        execute: () => ({ value: 1 }),
      },
      {
        name: 'two',
        kind: 'analysis',
        description: 'Second',
        inputSchema: '{}',
        execute: () => ({ value: 2 }),
      },
    ]);
    const executor = new WorkspaceChatToolExecutor({ registry });

    const results = await executor.executePlan(
      {
        profile: 'review-selection',
        contextMode: 'selection',
        calls: [
          { tool: 'one', input: {} },
          { tool: 'two', input: {} },
        ],
      },
      createRuntime()
    );

    expect(results.map((result) => result.tool)).toEqual(['one', 'two']);
    expect(results.every((result) => result.ok)).toBe(true);
  });

  it('caches identical tool calls within one request', async () => {
    const execute = vi.fn(() => ({ value: 1 }));
    const registry = new WorkspaceChatToolRegistry([
      {
        name: 'cached',
        kind: 'read',
        description: 'Cached tool',
        inputSchema: '{}',
        execute,
      },
    ]);
    const executor = new WorkspaceChatToolExecutor({ registry });

    const results = await executor.executePlan(
      {
        profile: 'review-selection',
        contextMode: 'selection',
        calls: [
          { tool: 'cached', input: { ids: ['story-1'] } },
          { tool: 'cached', input: { ids: ['story-1'] } },
        ],
      },
      createRuntime()
    );

    expect(execute).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(results[1]);
  });

  it('stops on an unknown tool', async () => {
    const executor = new WorkspaceChatToolExecutor({
      registry: new WorkspaceChatToolRegistry(),
    });

    const results = await executor.executePlan(
      {
        profile: 'review-selection',
        contextMode: 'selection',
        calls: [{ tool: 'missing', input: {} }],
      },
      createRuntime()
    );

    expect(results).toEqual([
      {
        tool: 'missing',
        ok: false,
        error: 'Unknown tool "missing".',
      },
    ]);
  });

  it('stops on invalid tool input', async () => {
    const registry = new WorkspaceChatToolRegistry([
      {
        name: 'valid',
        kind: 'read',
        description: 'Valid tool',
        inputSchema: '{}',
        execute: () => ({ ok: true }),
      },
    ]);
    const executor = new WorkspaceChatToolExecutor({ registry });

    const results = await executor.executePlan(
      {
        profile: 'review-selection',
        contextMode: 'selection',
        calls: [{ tool: 'valid', input: null as unknown as Record<string, unknown> }],
      },
      createRuntime()
    );

    expect(results[0]).toEqual({
      tool: 'valid',
      ok: false,
      error: 'Tool input must be a JSON object.',
    });
  });
});
