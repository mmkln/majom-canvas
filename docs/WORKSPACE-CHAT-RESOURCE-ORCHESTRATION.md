# Workspace Chat Resource Orchestration

This document describes the current AI assistant orchestration runtime.
The file name still uses the older "workspace chat" wording, but the implemented system now lives under the `AiAssistant*` modules.

## Scope

This is the current workspace-scoped AI assistant runtime. `AiAssistantService.reply(...)` routes through `AiAssistantOrchestrator`, and the old one-shot prompt assembly path has been removed. The orchestration flow is intended to scale better when:

- instruction sets grow,
- helper tools become more numerous,
- canvas context becomes expensive to send eagerly.

## Core Idea

The model should not receive one large system prompt plus one large canvas dump.

Instead, the chat runtime treats four things as separate context planes:

1. User intent: the raw user prompt or an explicit AI action intent.
2. Instruction context: detailed case-specific guidance loaded from instruction packets.
3. Data context: canvas evidence retrieved through tools.
4. Capability context: the list of tools the model is allowed to request.

The model never asks for a raw "system prompt". It returns a structured routing or tool-execution decision instead.

## Current Flow

### Manual chat

1. The runtime resolves the current scenario and router context from:
   - the user prompt,
   - short conversation memory,
   - the current context mode,
   - the instruction index summaries,
   - the tool catalog summaries.
2. The router returns one structured decision:
   - `load_instructions`
   - `execute_tools`
   - `ask_followup`
   - `finalize`
3. The orchestrator loads instruction packets or executes tools.
4. The decision model runs again with:
   - loaded instruction packets,
   - current tool results,
   - remaining instruction index entries,
   - the allowed tool catalog.
5. When the model returns `finalize`, the final answer model produces one structured assistant reply.

Capability questions such as "what can you help with here?" stay inside the same manual chat path. The router should load capability-specific instructions, call the frontend-backed `get_chat_capabilities` tool, and then answer from that retrieved capability context. This is still workspace-scoped chat, not an open-domain conversation mode.

### Action commands

Button-driven AI actions are not treated like generic chat questions.

1. The runtime maps the intent to a deterministic tool plan.
2. The runtime preloads the matching instruction packet.
3. Tools execute immediately.
4. The raw tool results are compiled into a lean action-specific command context.
5. A command-specific prompt builder sends:
   - the exact action contract,
   - the loaded instruction packets,
   - the compiled command context.
6. A command-specific validator checks the structured reply before it reaches the generic parser.
7. If the reply is structurally wrong for that command, a command-specific repair prompt runs once.

This keeps AI actions fast, predictable, and much stricter than free-form chat.

The dedicated action-command spec path is already used by multiple typed intents:

- `dependencies`
- `fill_details`
- `clarify`
- `strategic_plan`
- `breakdown`

These command specs compile lean action-specific context and validate the structured envelope before the generic reply parser handles it.

## Main Files

- `src/features/ai-assistant/services/AiAssistantOrchestrator.ts`
  Orchestration state machine for both manual chat and typed intent execution.
- `src/features/ai-assistant/services/AiAssistantInstructionRegistry.ts`
  Instruction packet store and minimal instruction index.
- `src/features/ai-assistant/services/AiAssistantCapabilities.ts`
  Frontend-derived capability context builder used by the capability tool path.
- `src/features/ai-assistant/services/AiAssistantInstructionTypes.ts`
  Public instruction and router decision contracts.
- `src/features/ai-assistant/services/AiAssistantPlannerPromptBuilder.ts`
  Router and decision-step prompts.
- `src/features/ai-assistant/services/AiAssistantAnswerPromptBuilder.ts`
  Final answer prompt that receives instruction packets and tool results.
- `src/features/ai-assistant/services/AiAssistantCommandSpecs.ts`
  Command-spec registry for strict button-driven AI actions, including lean context compilation, validation, and repair guidance.
- `src/features/ai-assistant/services/AiAssistantToolRegistry.ts`
  Tool catalog for router and reasoning steps.
- `src/features/ai-assistant/services/AiAssistantToolExecutor.ts`
  Bounded linear tool execution.
- `src/features/ai-assistant/services/AiAssistantRuntime.ts`
  Composition helper that wires the API client, orchestrator, service, and session controller.
- `src/features/ai-assistant/services/AiAssistantService.ts`
  Thin service entrypoint that converts the orchestrator result into a chat message.
- `src/features/ai-assistant/services/AiAssistantSessionController.ts`
  UI-facing session layer that prepares request state, memory, context mode, and live tool host access.
- `src/features/ai-assistant/services/AiAssistantIntentPlanFactory.ts`
  Deterministic plan and instruction mapping for button-driven AI intents.
- `src/features/ai-assistant/components/AiAssistantPanel.ts`
  Mounted chat panel UI that renders messages and confirm-first actions.
- `src/bootstrap/RuntimeHost.ts`
  Composition root that creates the AI assistant runtime, injects the controller into the panel, and provides live capability context from the active workspace host.

## Router Contract

The router and decision steps return JSON only.

Allowed `profile` values are exact enum strings:
`"summarize"`, `"review-selection"`, `"next-steps"`, `"breakdown"`, `"strategic-plan"`, `"dependency-review"`, `"readiness-check"`, `"general-question"`.

Supported decision shapes:

```json
{
  "kind": "load_instructions",
  "profile": "review-selection",
  "contextMode": "selection",
  "instructionIds": ["planning.review-selection"]
}
```

```json
{
  "kind": "execute_tools",
  "profile": "review-selection",
  "contextMode": "selection",
  "calls": [
    { "tool": "get_focus_bundle", "input": { "target": "selection" } }
  ]
}
```

```json
{
  "kind": "ask_followup",
  "profile": "general-question",
  "contextMode": "selection",
  "question": "Which story should I inspect?"
}
```

```json
{
  "kind": "finalize",
  "profile": "review-selection",
  "contextMode": "selection"
}
```

## Why Instruction Packets Exist

The instruction index shown to the router is intentionally short. It should be cheap enough to send on every manual request.

Detailed instructions live in packets and are loaded only when needed. This makes it possible to:

- add many specialized behaviors without bloating the default prompt,
- group instructions by category later,
- keep tool permissions close to the relevant guidance,
- evolve one planning behavior without touching unrelated cases.

## How To Add A New Case

1. Add a new packet to `AiAssistantInstructionRegistry.ts`.
   Include:
   - `id`
   - optional `category`
   - `title`
   - `summary`
   - `whenToUse`
   - `body`
   - optional `allowedToolNames`
   - optional `responsePolicy`
2. If the case needs new retrieval or analysis behavior, add tools to the tool registry.
3. For button-based AI intents, map the intent to:
   - one or more instruction packet ids
   - a deterministic tool plan
4. If the intent needs strict structured validation, add or extend a command spec in `AiAssistantCommandSpecs.ts`.
5. For manual chat, make sure the new packet summary is descriptive enough for the router to select it.
6. For manual capability/help prompts, prefer a frontend-backed capability tool path over hardcoded prompt text so the answer stays aligned with the current UI and constraints.

## Design Rules

- Do not let the model emit free-form frontend commands.
- Do not let the model request arbitrary system prompts.
- Keep router outputs strict and machine-readable.
- Keep tool execution bounded.
- Keep final user-facing answers on the existing structured reply contract.
- Keep mutations behind explicit chat actions, not direct tool execution.
- For button-driven AI actions, prefer compiled command contexts over raw tool dumps.
- Validate action-command replies against the command spec before generic reply parsing.
- For capability questions, retrieve frontend capability context through tools instead of relying on static prompt claims.
- Keep UI components dumb: `AiAssistantPanel` renders and delegates, while `RuntimeHost` owns construction and dependency wiring.

## Current Limitations

- There is no recursive planner loop beyond the bounded decision cycle.
- There are no mutation tools yet.
- Instruction categories exist as optional metadata only; there is no category-level loader yet.
- Several typed intents already use the dedicated action-command spec path, but not every AI action has been migrated to it yet.
- Because of these constraints, the current runtime should be treated as a guided planning copilot, not a fully autonomous day optimizer.
- Product messaging should avoid promising perfect full-day optimization or guaranteed long-horizon "flow state" outcomes until orchestration depth, mutation safety, and evaluation infrastructure mature.
