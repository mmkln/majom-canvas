import type {
  AiAssistantCanvasSnapshot,
  AiAssistantIntentKind,
} from '../aiAssistantEvents.ts';
import type { AiAssistantStructuredReply } from '../aiAssistantActions.ts';
import type { AiAssistantIntentContext } from './AiAssistantIntentContext.ts';
import {
  parseAiAssistantStructuredReply,
  tryParseAiAssistantStructuredReplyEnvelope,
} from './AiAssistantStructuredReplyParser.ts';
import { AiAssistantToolExecutor } from './AiAssistantToolExecutor.ts';
import {
  createAiAssistantInstructionRegistry,
  AiAssistantInstructionRegistry,
} from './AiAssistantInstructionRegistry.ts';
import {
  createAiAssistantToolRegistry,
  AiAssistantToolRegistry,
} from './AiAssistantToolRegistry.ts';
import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type {
  AiAssistantMemoryState,
  AiAssistantProfile,
} from './AiAssistantContextTypes.ts';
import { isAiAssistantProfile } from './AiAssistantContextTypes.ts';
import {
  buildAiAssistantDecisionMessages,
  buildAiAssistantRouterMessages,
} from './AiAssistantPlannerPromptBuilder.ts';
import { buildAiAssistantAnswerMessages } from './AiAssistantAnswerPromptBuilder.ts';
import {
  buildAiAssistantIntentPlan,
  resolveAiAssistantIntentInstructionIds,
  resolveAiAssistantIntentProfile,
} from './AiAssistantIntentPlanFactory.ts';
import { getAiAssistantCommandSpec } from './AiAssistantCommandSpecs.ts';
import type { AiAssistantApiMessage } from './AiAssistantApiTypes.ts';
import type { AiAssistantReplyProgress } from './AiAssistantTypes.ts';
import {
  buildAiAssistantRouterRepairMessages,
  buildAiAssistantStructuredReplyRepairMessages,
  completeAiAssistantTextWithRepair,
  tryParseAiAssistantJsonCandidate,
} from './AiAssistantRepair.ts';
import type { AiAssistantTokenUsage } from './AiAssistantTelemetryTypes.ts';
import type {
  AiAssistantTelemetryCollector,
  AiAssistantTelemetryContext,
} from './AiAssistantTelemetryTypes.ts';
import {
  getSharedAiAssistantTelemetryCollector,
} from './AiAssistantTelemetryStore.ts';
import type {
  AiAssistantInstructionPacket,
  AiAssistantRouterDecision,
} from './AiAssistantInstructionTypes.ts';
import {
  normalizeAiAssistantRouterDecision,
} from './AiAssistantInstructionTypes.ts';
import type {
  AiAssistantExecutionPlan,
  AiAssistantToolHost,
  AiAssistantToolResult,
  AiAssistantToolRuntimeContext,
} from './AiAssistantToolTypes.ts';

type AiAssistantLlmClient = {
  completeText: (
    messages: AiAssistantApiMessage[],
    options?: {
      signal?: AbortSignal;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) => Promise<string>;
  completeTextWithMetadata?: (
    messages: AiAssistantApiMessage[],
    options?: {
      signal?: AbortSignal;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) => Promise<{
    content: string;
    usage?: AiAssistantTokenUsage;
  }>;
};

export type AiAssistantOrchestratorRequest = {
  prompt: string;
  source: 'manual' | 'intent';
  intent?: AiAssistantIntentKind;
  intentContext?: AiAssistantIntentContext;
  telemetryContext?: AiAssistantTelemetryContext;
  profile?: AiAssistantProfile;
  snapshot: AiAssistantCanvasSnapshot | null;
  contextMode: AiAssistantContextMode;
  memory: AiAssistantMemoryState;
  allowActions: boolean;
  validationSnapshot?: AiAssistantCanvasSnapshot | null;
  liveHost?: AiAssistantToolHost | null;
  onProgress?: (progress: AiAssistantReplyProgress) => void;
  signal?: AbortSignal;
};

export type AiAssistantOrchestratorReply = AiAssistantStructuredReply & {
  plan: AiAssistantExecutionPlan;
  toolResults: AiAssistantToolResult[];
};

type AiAssistantOrchestratorOptions = {
  apiClient: AiAssistantLlmClient;
  instructionRegistry?: AiAssistantInstructionRegistry;
  registry?: AiAssistantToolRegistry;
  executor?: AiAssistantToolExecutor;
  telemetry?: AiAssistantTelemetryCollector;
};

type AiAssistantOrchestrationState = {
  profile: AiAssistantProfile;
  contextMode: AiAssistantContextMode;
  plan: AiAssistantExecutionPlan;
  toolResults: AiAssistantToolResult[];
  instructionPackets: AiAssistantInstructionPacket[];
  loadedInstructionIds: Set<string>;
  telemetry: {
    routerHopCount: number;
    toolExecutionRounds: number;
    repairAttempts: number;
    invalidEnvelopeCount: number;
    tokenUsage?: AiAssistantTokenUsage;
  };
};

const MAX_TOOL_STEPS = 6;
const MAX_DECISION_STEPS = 6;
const MAX_ROUTER_REPAIR_ATTEMPTS = 2;
const MAX_FINAL_REPLY_REPAIR_ATTEMPTS = 1;
const RESPONSE_PACKET_ID = 'response.structured-reply';

export class AiAssistantOrchestrator {
  private readonly instructionRegistry: AiAssistantInstructionRegistry;
  private readonly registry: AiAssistantToolRegistry;
  private readonly executor: AiAssistantToolExecutor;
  private readonly telemetry: AiAssistantTelemetryCollector;

  constructor(private readonly options: AiAssistantOrchestratorOptions) {
    this.instructionRegistry =
      options.instructionRegistry ?? createAiAssistantInstructionRegistry();
    this.registry = options.registry ?? createAiAssistantToolRegistry();
    this.telemetry =
      options.telemetry ?? getSharedAiAssistantTelemetryCollector();
    this.executor =
      options.executor ??
      new AiAssistantToolExecutor({
        registry: this.registry,
        maxSteps: MAX_TOOL_STEPS,
      });
  }

  public async reply(
    request: AiAssistantOrchestratorRequest
  ): Promise<AiAssistantOrchestratorReply> {
    const effectiveIntent = request.intent;
    const state = this.createInitialState(request);

    try {
      this.emitProgress(request, {
        phase: 'routing',
        label:
          effectiveIntent ? 'Preparing workflow' : 'Analyzing request',
        detail:
          effectiveIntent
            ? describeAiAssistantIntentProgressDetail(effectiveIntent)
            : 'Choosing context, instructions, and tools.',
      });

      const commandSpec = effectiveIntent
        ? getAiAssistantCommandSpec(effectiveIntent)
        : null;

      if (effectiveIntent) {
        await this.executeIntentSeed(request, state);
      } else {
        const followupQuestion = await this.runManualDecisionLoop(request, state);
        if (followupQuestion) {
          const reply = {
            replyMarkdown: followupQuestion,
            actions: [],
            plan: state.plan,
            toolResults: state.toolResults,
          };
          this.recordInteractionTelemetry(request, state, {
            outcome: 'followup',
            followupQuestionReturned: true,
          });
          return reply;
        }
      }

      if (commandSpec) {
        const reply = await this.completeCommandReply(request, state, commandSpec);
        this.recordInteractionTelemetry(request, state, {
          outcome: 'reply',
          followupQuestionReturned: false,
        });
        return reply;
      }

      this.loadInstructionPackets([RESPONSE_PACKET_ID], state);
      this.emitProgress(request, {
        phase: 'drafting',
        label: 'Drafting structured reply',
        detail: 'Preparing the final workspace answer.',
      });

      const finalReplyResult = await completeAiAssistantTextWithRepair({
        client: this.options.apiClient,
        messages: buildAiAssistantAnswerMessages({
          prompt: request.prompt,
          intent: effectiveIntent,
          profile: state.plan.profile,
          memory: request.memory,
          instructionPackets: state.instructionPackets,
          toolResults: state.toolResults,
          allowActions: request.allowActions,
        }),
        validate: (content) => {
          if (!tryParseAiAssistantStructuredReplyEnvelope(content)) {
            throw new Error('Final answer is not a valid structured reply envelope.');
          }
          return content;
        },
        buildRepairMessages: ({ invalidResponse, validationError }) =>
          buildAiAssistantStructuredReplyRepairMessages({
            invalidResponse,
            validationError,
            allowActions: request.allowActions,
            intent: effectiveIntent,
          }),
        signal: request.signal,
        maxRepairAttempts: MAX_FINAL_REPLY_REPAIR_ATTEMPTS,
        onRepairAttempt: ({ attempt, validationError }) => {
          this.recordRepairTelemetry(request, state, 'answer', attempt, validationError);
          this.emitProgress(request, {
            phase: 'repairing',
            label: 'Repairing output',
            detail:
              attempt === 1
                ? 'Fixing the structured reply envelope.'
                : `Fixing the structured reply envelope (attempt ${attempt}).`,
          });
        },
      });
      state.telemetry.tokenUsage = mergeTelemetryUsage(
        state.telemetry.tokenUsage,
        finalReplyResult.usage
      );
      const rawContent = finalReplyResult.rawContent;
      const structured = parseAiAssistantStructuredReply(rawContent, {
        allowActions: request.allowActions,
        validationSnapshot: request.validationSnapshot ?? request.snapshot,
        intent: effectiveIntent,
      });
      const reply = {
        ...structured,
        plan: state.plan,
        toolResults: state.toolResults,
      };

      this.recordInteractionTelemetry(request, state, {
        outcome: 'reply',
        followupQuestionReturned: false,
      });
      return reply;
    } catch (error) {
      this.recordInteractionTelemetry(request, state, {
        outcome: 'error',
        followupQuestionReturned: false,
      });
      throw error;
    }
  }

  public buildIntentPlan(
    request: AiAssistantOrchestratorRequest
  ): AiAssistantExecutionPlan {
    return buildAiAssistantIntentPlan(request);
  }

  public async buildManualPlan(
    request: AiAssistantOrchestratorRequest
  ): Promise<AiAssistantExecutionPlan> {
    const state = this.createInitialState(request);
    let decision = await this.requestInitialRouterDecision(request, state);

    for (let step = 0; step < MAX_DECISION_STEPS; step += 1) {
      if (decision.kind === 'load_instructions') {
        this.emitInstructionProgress(request, decision.instructionIds);
        this.loadInstructionPackets(decision.instructionIds, state);
        decision = await this.requestFollowupDecision(request, state);
        continue;
      }

      if (decision.kind === 'execute_tools') {
        return sanitizeToolPlan(decision, this.registry, MAX_TOOL_STEPS);
      }

      return {
        profile: decision.profile,
        contextMode: decision.contextMode,
        calls: [],
      };
    }

    throw new Error('Workspace chat manual planning exceeded max decision steps.');
  }

  private async executeIntentSeed(
    request: AiAssistantOrchestratorRequest,
    state: AiAssistantOrchestrationState
  ): Promise<void> {
    const intentPlan = this.buildIntentPlan(request);
    state.profile = intentPlan.profile;
    state.contextMode = intentPlan.contextMode;
    state.plan = {
      profile: intentPlan.profile,
      contextMode: intentPlan.contextMode,
      calls: intentPlan.calls.map((call) => ({
        tool: call.tool,
        input: { ...call.input },
      })),
    };

    this.emitInstructionProgress(
      request,
      resolveAiAssistantIntentInstructionIds(request.intent)
    );
    this.loadInstructionPackets(
      resolveAiAssistantIntentInstructionIds(request.intent),
      state
    );
    state.toolResults.push(...(await this.executePlan(intentPlan, request, state)));
  }

  private async runManualDecisionLoop(
    request: AiAssistantOrchestratorRequest,
    state: AiAssistantOrchestrationState
  ): Promise<string | null> {
    let decision = await this.requestInitialRouterDecision(request, state);

    for (let step = 0; step < MAX_DECISION_STEPS; step += 1) {
      state.profile = decision.profile;
      state.contextMode = decision.contextMode;
      state.plan.profile = decision.profile;
      state.plan.contextMode = decision.contextMode;

      if (decision.kind === 'load_instructions') {
        this.emitInstructionProgress(request, decision.instructionIds);
        this.loadInstructionPackets(decision.instructionIds, state);
        decision = await this.requestFollowupDecision(request, state);
        continue;
      }

      if (decision.kind === 'execute_tools') {
        const nextPlan = sanitizeToolPlan(
          decision,
          this.registry,
          MAX_TOOL_STEPS - state.plan.calls.length
        );
        state.plan.calls.push(
          ...nextPlan.calls.map((call) => ({
            tool: call.tool,
            input: { ...call.input },
          }))
        );
        state.toolResults.push(...(await this.executePlan(nextPlan, request, state)));
        decision = await this.requestFollowupDecision(request, state);
        continue;
      }

      if (decision.kind === 'ask_followup') {
        return decision.question.trim();
      }

      return null;
    }

    throw new Error('Workspace chat orchestrator exceeded max decision steps.');
  }

  private async completeCommandReply(
    request: AiAssistantOrchestratorRequest,
    state: AiAssistantOrchestrationState,
    commandSpec: NonNullable<ReturnType<typeof getAiAssistantCommandSpec>>
  ): Promise<AiAssistantOrchestratorReply> {
    const compiledContext = commandSpec.buildCompiledContext({
      prompt: request.prompt,
      memory: request.memory,
      toolResults: state.toolResults,
      snapshot: request.validationSnapshot ?? request.snapshot,
      intentContext: request.intentContext,
    });

    this.emitProgress(request, {
      phase: 'drafting',
      label: 'Drafting proposal',
      detail: 'Preparing the final workspace proposal.',
    });

    const finalReplyResult = await completeAiAssistantTextWithRepair({
      client: this.options.apiClient,
      messages: commandSpec.buildMessages({
        prompt: request.prompt,
        instructionPackets: state.instructionPackets,
        compiledContext,
      }),
      validate: (content) => {
        const envelope = tryParseAiAssistantStructuredReplyEnvelope(content);
        if (!envelope) {
          throw new Error('Final answer is not a valid structured reply envelope.');
        }
        const validationError = commandSpec.validateEnvelope({
          envelope,
          compiledContext,
        });
        if (validationError) {
          throw new Error(validationError);
        }
        return content;
      },
      buildRepairMessages: ({ invalidResponse, validationError }) =>
        commandSpec.buildRepairMessages({
          invalidResponse,
          validationError,
          instructionPackets: state.instructionPackets,
          compiledContext,
        }),
      signal: request.signal,
      maxRepairAttempts: MAX_FINAL_REPLY_REPAIR_ATTEMPTS,
      onRepairAttempt: ({ attempt, validationError }) => {
        this.recordRepairTelemetry(
          request,
          state,
          'command',
          attempt,
          validationError
        );
        this.emitProgress(request, {
          phase: 'repairing',
          label: 'Repairing output',
          detail:
            attempt === 1
              ? 'Fixing the structured proposal envelope.'
              : `Fixing the structured proposal envelope (attempt ${attempt}).`,
        });
      },
    });
    state.telemetry.tokenUsage = mergeTelemetryUsage(
      state.telemetry.tokenUsage,
      finalReplyResult.usage
    );
    const rawContent = finalReplyResult.rawContent;
    const structured = parseAiAssistantStructuredReply(rawContent, {
      allowActions: request.allowActions,
      validationSnapshot: request.validationSnapshot ?? request.snapshot,
      intent: request.intent,
    });

    return {
      ...structured,
      plan: state.plan,
      toolResults: state.toolResults,
    };
  }

  private async requestInitialRouterDecision(
    request: AiAssistantOrchestratorRequest,
    state: AiAssistantOrchestrationState
  ): Promise<AiAssistantRouterDecision> {
    this.emitProgress(request, {
      phase: 'routing',
      label: 'Analyzing request',
      detail: 'Choosing context, instructions, and tools.',
    });
    return this.requestRouterDecision(
      buildAiAssistantRouterMessages({
        prompt: request.prompt,
        contextMode: state.contextMode,
        memory: request.memory,
        instructions: this.instructionRegistry.listIndex(),
        tools: this.registry.listForPlanner(),
      }),
      request,
      request.signal,
      MAX_TOOL_STEPS - state.plan.calls.length,
      state
    );
  }

  private async requestFollowupDecision(
    request: AiAssistantOrchestratorRequest,
    state: AiAssistantOrchestrationState
  ): Promise<AiAssistantRouterDecision> {
    const allowedToolNames = this.resolveAllowedToolNames(state.instructionPackets);
    this.emitProgress(request, {
      phase: 'routing',
      label: 'Reviewing findings',
      detail: 'Deciding whether more workspace checks are needed.',
    });
    return this.requestRouterDecision(
      buildAiAssistantDecisionMessages({
        prompt: request.prompt,
        profile: state.plan.profile,
        contextMode: state.contextMode,
        memory: request.memory,
        loadedInstructions: state.instructionPackets,
        availableInstructions: this.instructionRegistry
          .listIndex()
          .filter((instruction) => !state.loadedInstructionIds.has(instruction.id)),
        tools: allowedToolNames
          ? this.registry.listForPlanner(allowedToolNames)
          : this.registry.listForPlanner(),
        toolResults: state.toolResults,
      }),
      request,
      request.signal,
      MAX_TOOL_STEPS - state.plan.calls.length,
      state
    );
  }

  private async executePlan(
    plan: AiAssistantExecutionPlan,
    request: AiAssistantOrchestratorRequest,
    state: AiAssistantOrchestrationState
  ): Promise<AiAssistantToolResult[]> {
    if (plan.calls.length === 0) {
      return [];
    }

    const results = await this.executor.executePlan(
      this.limitPlanCalls(plan),
      this.buildRuntimeContext(request, state),
      {
      onToolStart: ({ definition, step, totalSteps }) => {
        this.emitProgress(request, {
          phase: 'tools',
          label: 'Checking workspace context',
          detail: describeAiAssistantToolProgress(definition.name),
          currentStep: step,
          totalSteps,
        });
      },
      }
    );
    state.telemetry.toolExecutionRounds += 1;
    return results;
  }

  private buildRuntimeContext(
    request: AiAssistantOrchestratorRequest,
    state: AiAssistantOrchestrationState
  ): AiAssistantToolRuntimeContext {
    return {
      snapshot: request.snapshot,
      liveHost: request.liveHost ?? null,
      memory: request.memory,
      prompt: request.prompt,
      contextMode: state.contextMode,
    };
  }

  private createInitialState(
    request: AiAssistantOrchestratorRequest
  ): AiAssistantOrchestrationState {
    const profile =
      request.profile && isAiAssistantProfile(request.profile)
        ? request.profile
        : resolveAiAssistantIntentProfile(request.intent, undefined);

    return {
      profile,
      contextMode: request.contextMode,
      plan: {
        profile,
        contextMode: request.contextMode,
        calls: [],
      },
      toolResults: [],
      instructionPackets: [],
      loadedInstructionIds: new Set<string>(),
      telemetry: {
        routerHopCount: 0,
        toolExecutionRounds: 0,
        repairAttempts: 0,
        invalidEnvelopeCount: 0,
      },
    };
  }

  private emitInstructionProgress(
    request: AiAssistantOrchestratorRequest,
    instructionIds: readonly string[]
  ): void {
    if (instructionIds.length === 0) {
      return;
    }

    const titles = instructionIds
      .map((id) => this.instructionRegistry.getPacket(id)?.title)
      .filter((title): title is string => Boolean(title));
    const detail =
      titles.length === 1
        ? titles[0]
        : titles.length > 1
          ? `${titles.length} instruction packets`
          : `${instructionIds.length} instruction packets`;

    this.emitProgress(request, {
      phase: 'instructions',
      label: 'Loading instructions',
      detail,
    });
  }

  private emitProgress(
    request: AiAssistantOrchestratorRequest,
    progress: AiAssistantReplyProgress
  ): void {
    request.onProgress?.(progress);
  }

  private limitPlanCalls(
    plan: AiAssistantExecutionPlan
  ): AiAssistantExecutionPlan {
    return {
      profile: plan.profile,
      contextMode: plan.contextMode,
      calls: plan.calls.slice(0, MAX_TOOL_STEPS),
    };
  }

  private loadInstructionPackets(
    ids: readonly string[],
    state: AiAssistantOrchestrationState
  ): void {
    ids.forEach((id) => {
      if (state.loadedInstructionIds.has(id)) {
        return;
      }
      const packet = this.instructionRegistry.getPacket(id);
      if (!packet) {
        throw new Error(`Unknown instruction packet "${id}".`);
      }
      state.loadedInstructionIds.add(id);
      state.instructionPackets.push(packet);
    });
  }

  private resolveAllowedToolNames(
    packets: readonly AiAssistantInstructionPacket[]
  ): string[] | null {
    const allowed = new Set<string>();
    let hasExplicitToolScope = false;

    packets.forEach((packet) => {
      if (!packet.allowedToolNames || packet.allowedToolNames.length === 0) {
        return;
      }
      hasExplicitToolScope = true;
      packet.allowedToolNames.forEach((toolName) => {
        if (this.registry.has(toolName)) {
          allowed.add(toolName);
        }
      });
    });

    if (!hasExplicitToolScope) {
      return null;
    }

    return Array.from(allowed);
  }

  private async requestRouterDecision(
    messages: AiAssistantApiMessage[],
    request: AiAssistantOrchestratorRequest,
    signal: AbortSignal | undefined,
    remainingToolBudget: number,
    state: AiAssistantOrchestrationState
  ): Promise<AiAssistantRouterDecision> {
    const result = await completeAiAssistantTextWithRepair({
      client: this.options.apiClient,
      messages,
      validate: (content) => {
        const parsed = tryParseAiAssistantJsonCandidate<unknown>(content);
        if (parsed === null) {
          throw new Error('Router returned invalid JSON.');
        }
        return sanitizeRouterDecision(parsed, {
          instructionRegistry: this.instructionRegistry,
          registry: this.registry,
          remainingToolBudget,
        });
      },
      buildRepairMessages: ({ invalidResponse, validationError }) =>
        buildAiAssistantRouterRepairMessages({
          invalidResponse,
          validationError,
          originalMessages: messages,
        }),
      signal,
      maxRepairAttempts: MAX_ROUTER_REPAIR_ATTEMPTS,
      onRepairAttempt: ({ attempt, validationError }) => {
        this.recordRepairTelemetry(
          request,
          state,
          'router',
          attempt,
          validationError
        );
        this.emitProgress(request, {
          phase: 'repairing',
          label: 'Repairing planner output',
          detail:
            attempt === 1
              ? 'Fixing the router decision format.'
              : `Fixing the router decision format (attempt ${attempt}).`,
        });
      },
    });

    state.telemetry.routerHopCount += 1;
    state.telemetry.tokenUsage = mergeTelemetryUsage(
      state.telemetry.tokenUsage,
      result.usage
    );

    if (result.ok) {
      return result.value;
    }

    return {
      kind: 'ask_followup',
      profile: state.plan.profile,
      contextMode: state.contextMode,
      question:
        'I could not validate the next planning step. Please restate the request a bit more specifically.',
    };
  }

  private recordInteractionTelemetry(
    request: AiAssistantOrchestratorRequest,
    state: AiAssistantOrchestrationState,
    params: {
      outcome: 'reply' | 'followup' | 'error' | 'aborted';
      followupQuestionReturned: boolean;
    }
  ): void {
    this.telemetry.record({
      kind: 'interaction',
      timestamp: Date.now(),
      context: this.resolveTelemetryContext(request),
      routeType: request.source,
      intent: request.intent,
      profile: state.plan.profile,
      contextMode: state.contextMode,
      commandSpecUsed: Boolean(request.intent && getAiAssistantCommandSpec(request.intent)),
      routerHopCount: state.telemetry.routerHopCount,
      toolExecutionRounds: state.telemetry.toolExecutionRounds,
      toolCallCount: state.toolResults.length,
      instructionPacketCount: state.instructionPackets.length,
      repairAttempts: state.telemetry.repairAttempts,
      invalidEnvelopeCount: state.telemetry.invalidEnvelopeCount,
      followupQuestionReturned: params.followupQuestionReturned,
      tokenUsage: state.telemetry.tokenUsage,
      outcome: params.outcome,
    });
  }

  private recordRepairTelemetry(
    request: AiAssistantOrchestratorRequest,
    state: AiAssistantOrchestrationState,
    stage: 'router' | 'command' | 'answer',
    attempt: number,
    validationError: string
  ): void {
    this.telemetry.record({
      kind: 'repair',
      timestamp: Date.now(),
      context: this.resolveTelemetryContext(request),
      stage,
      attempt,
      validationError,
    });
    state.telemetry.repairAttempts += 1;
    state.telemetry.invalidEnvelopeCount += 1;
  }

  private resolveTelemetryContext(
    request: AiAssistantOrchestratorRequest
  ): AiAssistantTelemetryContext {
    return (
      request.telemetryContext ?? {
        conversationKey: 'unknown',
        requestId: 'unknown',
      }
    );
  }
}

function mergeTelemetryUsage(
  first: AiAssistantTokenUsage | undefined,
  second: AiAssistantTokenUsage | undefined
): AiAssistantTokenUsage | undefined {
  if (!first && !second) {
    return undefined;
  }

  return {
    promptTokens: sumTelemetryUsageField(first?.promptTokens, second?.promptTokens),
    completionTokens: sumTelemetryUsageField(
      first?.completionTokens,
      second?.completionTokens
    ),
    totalTokens: sumTelemetryUsageField(first?.totalTokens, second?.totalTokens),
    cost: sumTelemetryUsageField(first?.cost, second?.cost),
  };
}

function sumTelemetryUsageField(
  first: number | undefined,
  second: number | undefined
): number | undefined {
  if (typeof first !== 'number' && typeof second !== 'number') {
    return undefined;
  }

  return (
    (typeof first === 'number' ? first : 0) +
    (typeof second === 'number' ? second : 0)
  );
}

function sanitizeRouterDecision(
  value: unknown,
  options: {
    instructionRegistry: AiAssistantInstructionRegistry;
    registry: AiAssistantToolRegistry;
    remainingToolBudget: number;
  }
): AiAssistantRouterDecision {
  const normalized = normalizeAiAssistantRouterDecision(value);
  if (!normalized) {
    throw new Error('Router returned an invalid decision.');
  }

  if (normalized.kind === 'load_instructions') {
    if (normalized.instructionIds.some((id) => !options.instructionRegistry.has(id))) {
      throw new Error('Router referenced an unknown instruction packet.');
    }
    return {
      kind: 'load_instructions',
      profile: normalized.profile,
      contextMode: normalized.contextMode,
      instructionIds: normalized.instructionIds.slice(),
    };
  }

  if (normalized.kind === 'execute_tools') {
    return sanitizeToolPlan(
      normalized,
      options.registry,
      options.remainingToolBudget,
      true
    );
  }

  if (normalized.kind === 'ask_followup') {
    return {
      kind: 'ask_followup',
      profile: normalized.profile,
      contextMode: normalized.contextMode,
      question: normalized.question.trim(),
    };
  }

  return {
    kind: 'finalize',
    profile: normalized.profile,
    contextMode: normalized.contextMode,
  };
}

function sanitizeToolPlan(
  value: Extract<AiAssistantRouterDecision, { kind: 'execute_tools' }>,
  registry: AiAssistantToolRegistry,
  remainingToolBudget: number,
  preserveKind: true
): Extract<AiAssistantRouterDecision, { kind: 'execute_tools' }>;
function sanitizeToolPlan(
  value: Extract<AiAssistantRouterDecision, { kind: 'execute_tools' }>,
  registry: AiAssistantToolRegistry,
  remainingToolBudget: number,
  preserveKind?: false
): AiAssistantExecutionPlan;
function sanitizeToolPlan(
  value: AiAssistantRouterDecision,
  registry: AiAssistantToolRegistry,
  remainingToolBudget: number,
  preserveKind = false
):
  | AiAssistantExecutionPlan
  | Extract<AiAssistantRouterDecision, { kind: 'execute_tools' }> {
  if (value.kind !== 'execute_tools') {
    throw new Error('Expected a tool execution decision.');
  }
  if (value.calls.length > remainingToolBudget) {
    throw new Error(
      `Router requested too many tool calls (${value.calls.length}); remaining budget is ${remainingToolBudget}.`
    );
  }
  if (value.calls.some((call) => !registry.has(call.tool))) {
    throw new Error('Router referenced an unknown tool.');
  }

  const calls = value.calls.map((call) => ({
    tool: call.tool,
    input: { ...call.input },
  }));

  if (preserveKind) {
    return {
      kind: 'execute_tools',
      profile: value.profile,
      contextMode: value.contextMode,
      calls,
    };
  }

  return {
    profile: value.profile,
    contextMode: value.contextMode,
    calls,
  };
}

function describeAiAssistantIntentProgressDetail(
  intent: AiAssistantIntentKind | undefined
): string {
  switch (intent) {
    case 'review':
      return 'Preparing the review workflow for this request.';
    case 'breakdown':
      return 'Preparing a breakdown workflow for the selected work.';
    case 'dependencies':
      return 'Preparing a dependency review workflow.';
    case 'strategic_plan':
      return 'Preparing a strategic planning workflow.';
    case 'missing':
      return 'Preparing a readiness check workflow.';
    case 'clarify':
      return 'Preparing a clarification workflow.';
    case 'fill_details':
      return 'Preparing a fill-details workflow.';
    default:
      return 'Preparing the workspace workflow for this request.';
  }
}

function describeAiAssistantToolProgress(toolName: string): string {
  switch (toolName) {
    case 'get_focus_bundle':
      return 'Inspecting the focus item and nearby structure.';
    case 'get_selection_cluster':
      return 'Inspecting the selected cluster.';
    case 'get_related_relations':
      return 'Checking related relations.';
    case 'get_chat_capabilities':
      return 'Checking current chat capabilities.';
    case 'get_recent_activity':
      return 'Reviewing recent activity.';
    case 'find_structure_gaps':
      return 'Checking for structure gaps.';
    case 'find_dependency_gaps':
      return 'Checking for dependency gaps.';
    case 'find_missing_descriptions':
      return 'Checking for missing details.';
    case 'find_duplicate_titles':
      return 'Checking for duplicate work.';
    default:
      return humanizeAiAssistantToolName(toolName);
  }
}

function humanizeAiAssistantToolName(toolName: string): string {
  const normalized = toolName.trim().replace(/_/g, ' ');
  if (normalized.length === 0) {
    return 'Checking workspace context.';
  }
  return `${normalized[0]?.toUpperCase() ?? ''}${normalized.slice(1)}.`;
}
