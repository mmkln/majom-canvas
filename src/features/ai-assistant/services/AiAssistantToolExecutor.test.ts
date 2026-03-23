import { describe, expect, it, vi } from 'vitest';
import { AiAssistantToolExecutor } from './AiAssistantToolExecutor.ts';
import { AiAssistantToolRegistry } from './AiAssistantToolRegistry.ts';
import {
  createAiAssistantTestMemory,
  createAiAssistantTestSnapshot,
} from './AiAssistantTestUtils.ts';

function createRuntime() {
  return {
    snapshot: createAiAssistantTestSnapshot(),
    memory: createAiAssistantTestMemory(),
    prompt: 'Review current work',
    contextMode: 'selection' as const,
  };
}

describe('AiAssistantToolExecutor', () => {
  it('executes a linear plan', async () => {
    const registry = new AiAssistantToolRegistry([
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
    const executor = new AiAssistantToolExecutor({ registry });

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
    const registry = new AiAssistantToolRegistry([
      {
        name: 'cached',
        kind: 'read',
        description: 'Cached tool',
        inputSchema: '{}',
        execute,
      },
    ]);
    const executor = new AiAssistantToolExecutor({ registry });

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
    const executor = new AiAssistantToolExecutor({
      registry: new AiAssistantToolRegistry(),
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
    const registry = new AiAssistantToolRegistry([
      {
        name: 'valid',
        kind: 'read',
        description: 'Valid tool',
        inputSchema: '{}',
        execute: () => ({ ok: true }),
      },
    ]);
    const executor = new AiAssistantToolExecutor({ registry });

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
