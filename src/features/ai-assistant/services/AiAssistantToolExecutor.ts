import { AiAssistantToolRegistry } from './AiAssistantToolRegistry.ts';
import {
  isPlainObject,
  type AiAssistantExecutionPlan,
  type AiAssistantToolCall,
  type AiAssistantToolDefinition,
  type AiAssistantToolResult,
  type AiAssistantToolRuntimeContext,
} from './AiAssistantToolTypes.ts';

type AiAssistantToolExecutorOptions = {
  registry?: AiAssistantToolRegistry;
  maxSteps?: number;
};

type AiAssistantToolExecutorRunOptions = {
  onToolStart?: (params: {
    call: AiAssistantToolCall;
    definition: AiAssistantToolDefinition;
    step: number;
    totalSteps: number;
  }) => void;
};

export class AiAssistantToolExecutor {
  private readonly registry: AiAssistantToolRegistry;
  private readonly maxSteps: number;

  constructor(options: AiAssistantToolExecutorOptions = {}) {
    this.registry = options.registry ?? new AiAssistantToolRegistry();
    this.maxSteps = options.maxSteps ?? 6;
  }

  public async executePlan(
    plan: AiAssistantExecutionPlan,
    runtime: AiAssistantToolRuntimeContext,
    options: AiAssistantToolExecutorRunOptions = {}
  ): Promise<AiAssistantToolResult[]> {
    const results: AiAssistantToolResult[] = [];
    const cache = new Map<string, AiAssistantToolResult>();
    const calls = plan.calls.slice(0, this.maxSteps);

    for (const [index, call] of calls.entries()) {
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

      options.onToolStart?.({
        call,
        definition,
        step: index + 1,
        totalSteps: calls.length,
      });

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
        const result: AiAssistantToolResult = {
          tool: call.tool,
          ok: true,
          data,
        };
        cache.set(cacheKey, result);
        results.push(result);
      } catch (error) {
        const result: AiAssistantToolResult = {
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
