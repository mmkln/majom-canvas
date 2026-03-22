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

`fill_details` is the first migrated command spec. It no longer receives raw tool dumps such as `viewport` or `recentActivity`, and it must return exact `suggest_update` or `suggest_updates` payloads.

## Main Files

- `src/features/shell/services/WorkspaceChatOrchestrator.ts`
  Orchestration state machine for the default chat path.
- `src/features/shell/services/WorkspaceChatInstructionRegistry.ts`
  Instruction packet store and minimal instruction index.
- `src/features/shell/services/WorkspaceChatCapabilities.ts`
  Frontend-derived capability context builder used by the capability tool.
- `src/features/shell/services/WorkspaceChatInstructionTypes.ts`
  Public instruction and router decision contracts.
- `src/features/shell/services/WorkspaceChatPlannerPromptBuilder.ts`
  Router and follow-up decision prompts.
- `src/features/shell/services/WorkspaceChatAnswerPromptBuilder.ts`
  Final answer prompt that receives instruction packets and tool results.
- `src/features/shell/services/WorkspaceChatCommandSpecs.ts`
  Command-spec registry for strict button-driven AI actions, including lean context compilation, validation, and repair guidance.
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

Allowed `profile` values are exact enum strings:
`"summarize"`, `"review-selection"`, `"next-steps"`, `"breakdown"`, `"dependency-review"`, `"readiness-check"`, `"general-question"`.

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
5. For manual capability/help prompts, prefer a frontend-backed tool over hardcoded prompt text so the answer stays aligned with the current UI and constraints.

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
- Keep UI components dumb: `GlobalChatPanel` renders and delegates, while `RuntimeHost` owns construction and dependency wiring.

## Current Limitations

- There is no recursive planner loop beyond the bounded decision cycle.
- There are no mutation tools yet.
- Instruction categories exist as optional metadata only; there is no category-level loader yet.
- Only `fill_details` currently uses the dedicated action-command spec path. Other AI actions still use the generic final-answer path and should be migrated incrementally.
