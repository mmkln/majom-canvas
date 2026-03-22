import { WorkspaceChatToolRegistry } from './WorkspaceChatToolRegistry.ts';
import {
  isPlainObject,
  type WorkspaceChatExecutionPlan,
  type WorkspaceChatToolResult,
  type WorkspaceChatToolRuntimeContext,
} from './WorkspaceChatToolTypes.ts';

type WorkspaceChatToolExecutorOptions = {
  registry?: WorkspaceChatToolRegistry;
  maxSteps?: number;
};

export class WorkspaceChatToolExecutor {
  private readonly registry: WorkspaceChatToolRegistry;
  private readonly maxSteps: number;

  constructor(options: WorkspaceChatToolExecutorOptions = {}) {
    this.registry = options.registry ?? new WorkspaceChatToolRegistry();
    this.maxSteps = options.maxSteps ?? 6;
  }

  public async executePlan(
    plan: WorkspaceChatExecutionPlan,
    runtime: WorkspaceChatToolRuntimeContext
  ): Promise<WorkspaceChatToolResult[]> {
    const results: WorkspaceChatToolResult[] = [];
    const cache = new Map<string, WorkspaceChatToolResult>();
    const calls = plan.calls.slice(0, this.maxSteps);

    for (const call of calls) {
      if (!isPlainObject(call.input)) {
        results.push({
          tool: call.tool,
          ok: false,
          error: 'Tool input must be a JSON object.',
        });
        break;
      }

      const definition = this.registry.get(call.tool);
      if (!definition) {
        results.push({
          tool: call.tool,
          ok: false,
          error: `Unknown tool "${call.tool}".`,
        });
        break;
      }

      const cacheKey = JSON.stringify({
        tool: call.tool,
        input: call.input,
      });
      const cached = cache.get(cacheKey);
      if (cached) {
        results.push(cached);
        continue;
      }

      try {
        const data = await definition.execute(call.input, {
          runtime,
          previousResults: results.slice(),
        });
        const result: WorkspaceChatToolResult = {
          tool: call.tool,
          ok: true,
          data,
        };
        cache.set(cacheKey, result);
        results.push(result);
      } catch (error) {
        const result: WorkspaceChatToolResult = {
          tool: call.tool,
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : `Tool "${call.tool}" failed.`,
        };
        cache.set(cacheKey, result);
        results.push(result);
        break;
      }
    }

    return results;
  }
}
