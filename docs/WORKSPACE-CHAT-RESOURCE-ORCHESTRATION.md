# Workspace Chat Resource Orchestration

## Scope

This is the current workspace chat runtime. `WorkspaceChatService.reply(...)` now routes through the orchestrator and the old one-shot prompt assembly path has been removed. The orchestration flow is intended to scale better when:

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

The model never asks for a raw "system prompt". It returns a structured resource request.

## Current Flow

### Manual chat

1. The router model sees:
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
3. The frontend/orchestrator loads instruction packets or executes tools.
4. The decision model runs again with:
   - loaded instruction packets,
   - current tool results,
   - remaining instruction index entries,
   - the allowed tool catalog.
5. When the model returns `finalize`, the final answer model produces one structured assistant reply.

### AI intent buttons

Intent buttons stay cheaper:

1. The runtime maps the intent to a deterministic tool plan.
2. The runtime also preloads the matching instruction packet.
3. Tools execute immediately.
4. The final answer model receives:
   - the original prompt,
   - the loaded instruction packets,
   - the compact tool results,
   - short memory.

This keeps AI actions fast and predictable while still using the same instruction system.

## Main Files

- `src/features/shell/services/WorkspaceChatOrchestrator.ts`
  Orchestration state machine for the default chat path.
- `src/features/shell/services/WorkspaceChatInstructionRegistry.ts`
  Instruction packet store and minimal instruction index.
- `src/features/shell/services/WorkspaceChatInstructionTypes.ts`
  Public instruction and router decision contracts.
- `src/features/shell/services/WorkspaceChatPlannerPromptBuilder.ts`
  Router and follow-up decision prompts.
- `src/features/shell/services/WorkspaceChatAnswerPromptBuilder.ts`
  Final answer prompt that receives instruction packets and tool results.
- `src/features/shell/services/WorkspaceChatToolRegistry.ts`
  Tool catalog for router/reasoning steps.
- `src/features/shell/services/WorkspaceChatToolExecutor.ts`
  Bounded linear tool execution.
- `src/features/shell/services/WorkspaceChatRuntime.ts`
  Composition helper that wires the API client, orchestrator, service, and session controller.
- `src/features/shell/services/WorkspaceChatService.ts`
  Thin service entrypoint that converts the orchestrator result into a chat message.
- `src/features/shell/services/WorkspaceChatSessionController.ts`
  UI-facing session layer that prepares request state, memory, context mode, and live tool host access.
- `src/features/shell/services/WorkspaceChatIntentPlanFactory.ts`
  Deterministic plan and instruction mapping for button-driven AI intents.
- `src/bootstrap/RuntimeHost.ts`
  Composition root that creates the chat runtime and injects the controller into the panel.

## Router Contract

The router and decision steps return JSON only.

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

1. Add a new packet to `WorkspaceChatInstructionRegistry.ts`.
   Include:
   - `id`
   - optional `category`
   - `summary`
   - `whenToUse`
   - `body`
   - optional `allowedToolNames`
2. If the case needs new retrieval or analysis behavior, add tools to the tool registry.
3. For button-based AI intents, map the intent to:
   - one or more instruction packet ids
   - a deterministic tool plan
4. For manual chat, make sure the new packet summary is descriptive enough for the router to select it.

## Design Rules

- Do not let the model emit free-form frontend commands.
- Do not let the model request arbitrary system prompts.
- Keep router outputs strict and machine-readable.
- Keep tool execution bounded.
- Keep final user-facing answers on the existing structured reply contract.
- Keep mutations behind explicit chat actions, not direct tool execution.
- Keep UI components dumb: `GlobalChatPanel` renders and delegates, while `RuntimeHost` owns construction and dependency wiring.

## Current Limitations

- There is no recursive planner loop beyond the bounded decision cycle.
- There are no mutation tools yet.
- Instruction categories exist as optional metadata only; there is no category-level loader yet.
