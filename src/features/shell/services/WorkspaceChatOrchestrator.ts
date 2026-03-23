import type {
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatIntentKind,
} from '../workspaceChatEvents.ts';
import type { WorkspaceChatStructuredReply } from '../workspaceChatActions.ts';
import {
  parseWorkspaceChatStructuredReply,
  tryParseWorkspaceChatStructuredReplyEnvelope,
} from './WorkspaceChatStructuredReplyParser.ts';
import { WorkspaceChatToolExecutor } from './WorkspaceChatToolExecutor.ts';
import {
  createWorkspaceChatInstructionRegistry,
  WorkspaceChatInstructionRegistry,
} from './WorkspaceChatInstructionRegistry.ts';
import {
  createWorkspaceChatToolRegistry,
  WorkspaceChatToolRegistry,
} from './WorkspaceChatToolRegistry.ts';
import type { WorkspaceChatContextMode } from './WorkspaceChatContextMode.ts';
import type {
  WorkspaceChatMemoryState,
  WorkspaceChatProfile,
} from './WorkspaceChatContextTypes.ts';
import { isWorkspaceChatProfile } from './WorkspaceChatContextTypes.ts';
import {
  buildWorkspaceChatDecisionMessages,
  buildWorkspaceChatRouterMessages,
} from './WorkspaceChatPlannerPromptBuilder.ts';
import { buildWorkspaceChatAnswerMessages } from './WorkspaceChatAnswerPromptBuilder.ts';
import {
  buildWorkspaceChatIntentPlan,
  resolveWorkspaceChatIntentInstructionIds,
  resolveWorkspaceChatIntentProfile,
} from './WorkspaceChatIntentPlanFactory.ts';
import { getWorkspaceChatCommandSpec } from './WorkspaceChatCommandSpecs.ts';
import type { WorkspaceChatApiMessage } from './WorkspaceChatApiTypes.ts';
import type { WorkspaceChatReplyProgress } from './WorkspaceChatTypes.ts';
import {
  buildWorkspaceChatRouterRepairMessages,
  buildWorkspaceChatStructuredReplyRepairMessages,
  completeWorkspaceChatTextWithRepair,
  tryParseWorkspaceChatJsonCandidate,
} from './WorkspaceChatRepair.ts';
import type {
  WorkspaceChatInstructionPacket,
  WorkspaceChatRouterDecision,
} from './WorkspaceChatInstructionTypes.ts';
import {
  normalizeWorkspaceChatRouterDecision,
} from './WorkspaceChatInstructionTypes.ts';
import type {
  WorkspaceChatExecutionPlan,
  WorkspaceChatToolHost,
  WorkspaceChatToolResult,
  WorkspaceChatToolRuntimeContext,
} from './WorkspaceChatToolTypes.ts';

type WorkspaceChatLlmClient = {
  completeText: (
    messages: WorkspaceChatApiMessage[],
    options?: {
      signal?: AbortSignal;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) => Promise<string>;
};

export type WorkspaceChatOrchestratorRequest = {
  prompt: string;
  source: 'manual' | 'intent';
  intent?: WorkspaceChatIntentKind;
  profile?: WorkspaceChatProfile;
  snapshot: WorkspaceChatCanvasSnapshot | null;
  contextMode: WorkspaceChatContextMode;
  memory: WorkspaceChatMemoryState;
  allowActions: boolean;
  validationSnapshot?: WorkspaceChatCanvasSnapshot | null;
  liveHost?: WorkspaceChatToolHost | null;
  onProgress?: (progress: WorkspaceChatReplyProgress) => void;
  signal?: AbortSignal;
};

export type WorkspaceChatOrchestratorReply = WorkspaceChatStructuredReply & {
  plan: WorkspaceChatExecutionPlan;
  toolResults: WorkspaceChatToolResult[];
};

type WorkspaceChatOrchestratorOptions = {
  apiClient: WorkspaceChatLlmClient;
  instructionRegistry?: WorkspaceChatInstructionRegistry;
  registry?: WorkspaceChatToolRegistry;
  executor?: WorkspaceChatToolExecutor;
};

type WorkspaceChatOrchestrationState = {
  profile: WorkspaceChatProfile;
  contextMode: WorkspaceChatContextMode;
  plan: WorkspaceChatExecutionPlan;
  toolResults: WorkspaceChatToolResult[];
  instructionPackets: WorkspaceChatInstructionPacket[];
  loadedInstructionIds: Set<string>;
};

const MAX_TOOL_STEPS = 6;
const MAX_DECISION_STEPS = 6;
const MAX_ROUTER_REPAIR_ATTEMPTS = 2;
const MAX_FINAL_REPLY_REPAIR_ATTEMPTS = 1;
const RESPONSE_PACKET_ID = 'response.structured-reply';

export class WorkspaceChatOrchestrator {
  private readonly instructionRegistry: WorkspaceChatInstructionRegistry;
  private readonly registry: WorkspaceChatToolRegistry;
  private readonly executor: WorkspaceChatToolExecutor;

  constructor(private readonly options: WorkspaceChatOrchestratorOptions) {
    this.instructionRegistry =
      options.instructionRegistry ?? createWorkspaceChatInstructionRegistry();
    this.registry = options.registry ?? createWorkspaceChatToolRegistry();
    this.executor =
      options.executor ??
      new WorkspaceChatToolExecutor({
        registry: this.registry,
        maxSteps: MAX_TOOL_STEPS,
      });
  }

  public async reply(
    request: WorkspaceChatOrchestratorRequest
  ): Promise<WorkspaceChatOrchestratorReply> {
    const effectiveIntent = request.intent;
    this.emitProgress(request, {
      phase: 'routing',
      label:
        effectiveIntent ? 'Preparing workflow' : 'Analyzing request',
      detail:
        effectiveIntent
          ? describeWorkspaceChatIntentProgressDetail(effectiveIntent)
          : 'Choosing context, instructions, and tools.',
    });

    const state = this.createInitialState(request);
    const commandSpec = effectiveIntent
      ? getWorkspaceChatCommandSpec(effectiveIntent)
      : null;

    if (effectiveIntent) {
      await this.executeIntentSeed(request, state);
    } else {
      const followupQuestion = await this.runManualDecisionLoop(request, state);
      if (followupQuestion) {
        return {
          replyMarkdown: followupQuestion,
          actions: [],
          plan: state.plan,
          toolResults: state.toolResults,
        };
      }
    }

    if (commandSpec) {
      return this.completeCommandReply(request, state, commandSpec);
    }

    this.loadInstructionPackets([RESPONSE_PACKET_ID], state);
    this.emitProgress(request, {
      phase: 'drafting',
      label: 'Drafting structured reply',
      detail: 'Preparing the final workspace answer.',
    });

    const finalReplyResult = await completeWorkspaceChatTextWithRepair({
      client: this.options.apiClient,
      messages: buildWorkspaceChatAnswerMessages({
        prompt: request.prompt,
        intent: effectiveIntent,
        profile: state.plan.profile,
        memory: request.memory,
        instructionPackets: state.instructionPackets,
        toolResults: state.toolResults,
        allowActions: request.allowActions,
      }),
      validate: (content) => {
        if (!tryParseWorkspaceChatStructuredReplyEnvelope(content)) {
          throw new Error('Final answer is not a valid structured reply envelope.');
        }
        return content;
      },
      buildRepairMessages: ({ invalidResponse, validationError }) =>
        buildWorkspaceChatStructuredReplyRepairMessages({
          invalidResponse,
          validationError,
          allowActions: request.allowActions,
          intent: effectiveIntent,
        }),
      signal: request.signal,
      maxRepairAttempts: MAX_FINAL_REPLY_REPAIR_ATTEMPTS,
      onRepairAttempt: ({ attempt }) => {
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
    const rawContent = finalReplyResult.rawContent;
    const structured = parseWorkspaceChatStructuredReply(rawContent, {
      allowActions: request.allowActions,
      validationSnapshot: request.validationSnapshot ?? request.snapshot,
      intent: effectiveIntent,
    });

    return {
      ...structured,
      plan: state.plan,
      toolResults: state.toolResults,
    };
  }

  public buildIntentPlan(
    request: WorkspaceChatOrchestratorRequest
  ): WorkspaceChatExecutionPlan {
    return buildWorkspaceChatIntentPlan(request);
  }

  public async buildManualPlan(
    request: WorkspaceChatOrchestratorRequest
  ): Promise<WorkspaceChatExecutionPlan> {
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
    request: WorkspaceChatOrchestratorRequest,
    state: WorkspaceChatOrchestrationState
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
      resolveWorkspaceChatIntentInstructionIds(request.intent)
    );
    this.loadInstructionPackets(
      resolveWorkspaceChatIntentInstructionIds(request.intent),
      state
    );
    state.toolResults.push(...(await this.executePlan(intentPlan, request, state)));
  }

  private async runManualDecisionLoop(
    request: WorkspaceChatOrchestratorRequest,
    state: WorkspaceChatOrchestrationState
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
    request: WorkspaceChatOrchestratorRequest,
    state: WorkspaceChatOrchestrationState,
    commandSpec: NonNullable<ReturnType<typeof getWorkspaceChatCommandSpec>>
  ): Promise<WorkspaceChatOrchestratorReply> {
    const compiledContext = commandSpec.buildCompiledContext({
      prompt: request.prompt,
      memory: request.memory,
      toolResults: state.toolResults,
      snapshot: request.validationSnapshot ?? request.snapshot,
    });

    this.emitProgress(request, {
      phase: 'drafting',
      label: 'Drafting proposal',
      detail: 'Preparing the final workspace proposal.',
    });

    const finalReplyResult = await completeWorkspaceChatTextWithRepair({
      client: this.options.apiClient,
      messages: commandSpec.buildMessages({
        prompt: request.prompt,
        instructionPackets: state.instructionPackets,
        compiledContext,
      }),
      validate: (content) => {
        const envelope = tryParseWorkspaceChatStructuredReplyEnvelope(content);
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
      onRepairAttempt: ({ attempt }) => {
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
    const rawContent = finalReplyResult.rawContent;
    const structured = parseWorkspaceChatStructuredReply(rawContent, {
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
    request: WorkspaceChatOrchestratorRequest,
    state: WorkspaceChatOrchestrationState
  ): Promise<WorkspaceChatRouterDecision> {
    this.emitProgress(request, {
      phase: 'routing',
      label: 'Analyzing request',
      detail: 'Choosing context, instructions, and tools.',
    });
    return this.requestRouterDecision(
      buildWorkspaceChatRouterMessages({
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
    request: WorkspaceChatOrchestratorRequest,
    state: WorkspaceChatOrchestrationState
  ): Promise<WorkspaceChatRouterDecision> {
    const allowedToolNames = this.resolveAllowedToolNames(state.instructionPackets);
    this.emitProgress(request, {
      phase: 'routing',
      label: 'Reviewing findings',
      detail: 'Deciding whether more workspace checks are needed.',
    });
    return this.requestRouterDecision(
      buildWorkspaceChatDecisionMessages({
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
    plan: WorkspaceChatExecutionPlan,
    request: WorkspaceChatOrchestratorRequest,
    state: WorkspaceChatOrchestrationState
  ): Promise<WorkspaceChatToolResult[]> {
    if (plan.calls.length === 0) {
      return [];
    }

    return this.executor.executePlan(this.limitPlanCalls(plan), this.buildRuntimeContext(request, state), {
      onToolStart: ({ definition, step, totalSteps }) => {
        this.emitProgress(request, {
          phase: 'tools',
          label: 'Checking workspace context',
          detail: describeWorkspaceChatToolProgress(definition.name),
          currentStep: step,
          totalSteps,
        });
      },
    });
  }

  private buildRuntimeContext(
    request: WorkspaceChatOrchestratorRequest,
    state: WorkspaceChatOrchestrationState
  ): WorkspaceChatToolRuntimeContext {
    return {
      snapshot: request.snapshot,
      liveHost: request.liveHost ?? null,
      memory: request.memory,
      prompt: request.prompt,
      contextMode: state.contextMode,
    };
  }

  private createInitialState(
    request: WorkspaceChatOrchestratorRequest
  ): WorkspaceChatOrchestrationState {
    const profile =
      request.profile && isWorkspaceChatProfile(request.profile)
        ? request.profile
        : resolveWorkspaceChatIntentProfile(request.intent, undefined);

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
    };
  }

  private emitInstructionProgress(
    request: WorkspaceChatOrchestratorRequest,
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
    request: WorkspaceChatOrchestratorRequest,
    progress: WorkspaceChatReplyProgress
  ): void {
    request.onProgress?.(progress);
  }

  private limitPlanCalls(
    plan: WorkspaceChatExecutionPlan
  ): WorkspaceChatExecutionPlan {
    return {
      profile: plan.profile,
      contextMode: plan.contextMode,
      calls: plan.calls.slice(0, MAX_TOOL_STEPS),
    };
  }

  private loadInstructionPackets(
    ids: readonly string[],
    state: WorkspaceChatOrchestrationState
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
    packets: readonly WorkspaceChatInstructionPacket[]
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
    messages: WorkspaceChatApiMessage[],
    request: WorkspaceChatOrchestratorRequest,
    signal: AbortSignal | undefined,
    remainingToolBudget: number,
    state: WorkspaceChatOrchestrationState
  ): Promise<WorkspaceChatRouterDecision> {
    const result = await completeWorkspaceChatTextWithRepair({
      client: this.options.apiClient,
      messages,
      validate: (content) => {
        const parsed = tryParseWorkspaceChatJsonCandidate<unknown>(content);
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
        buildWorkspaceChatRouterRepairMessages({
          invalidResponse,
          validationError,
          originalMessages: messages,
        }),
      signal,
      maxRepairAttempts: MAX_ROUTER_REPAIR_ATTEMPTS,
      onRepairAttempt: ({ attempt }) => {
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
}

function sanitizeRouterDecision(
  value: unknown,
  options: {
    instructionRegistry: WorkspaceChatInstructionRegistry;
    registry: WorkspaceChatToolRegistry;
    remainingToolBudget: number;
  }
): WorkspaceChatRouterDecision {
  const normalized = normalizeWorkspaceChatRouterDecision(value);
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
  value: Extract<WorkspaceChatRouterDecision, { kind: 'execute_tools' }>,
  registry: WorkspaceChatToolRegistry,
  remainingToolBudget: number,
  preserveKind: true
): Extract<WorkspaceChatRouterDecision, { kind: 'execute_tools' }>;
function sanitizeToolPlan(
  value: Extract<WorkspaceChatRouterDecision, { kind: 'execute_tools' }>,
  registry: WorkspaceChatToolRegistry,
  remainingToolBudget: number,
  preserveKind?: false
): WorkspaceChatExecutionPlan;
function sanitizeToolPlan(
  value: WorkspaceChatRouterDecision,
  registry: WorkspaceChatToolRegistry,
  remainingToolBudget: number,
  preserveKind = false
):
  | WorkspaceChatExecutionPlan
  | Extract<WorkspaceChatRouterDecision, { kind: 'execute_tools' }> {
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

function describeWorkspaceChatIntentProgressDetail(
  intent: WorkspaceChatIntentKind | undefined
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

function describeWorkspaceChatToolProgress(toolName: string): string {
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
      return humanizeWorkspaceChatToolName(toolName);
  }
}

function humanizeWorkspaceChatToolName(toolName: string): string {
  const normalized = toolName.trim().replace(/_/g, ' ');
  if (normalized.length === 0) {
    return 'Checking workspace context.';
  }
  return `${normalized[0]?.toUpperCase() ?? ''}${normalized.slice(1)}.`;
}
