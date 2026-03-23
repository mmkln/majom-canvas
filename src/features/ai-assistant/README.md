# AI Assistant Module

This document is the primary architecture reference for `src/features/ai-assistant`.
It covers only AI assistant behavior in this project.

## Purpose

The AI assistant is a confirm-first planning copilot for the canvas.
It resolves user input into a scenario, compiles the minimum useful context, proposes an action plan, and executes approved actions on the canvas.

## Current Architecture Map

```text
AI Assistant

├─ 1. Ingress
│  ├─ quick actions / explicit intent
│  ├─ manual prompt
│  ├─ follow-up reply
│  └─ confirm / cancel / undo
│
├─ 2. Resolution Layer
│  ├─ intent submission resolver
│  ├─ manual scenario classifier
│  ├─ scenario resolver
│  └─ resolved scenario
│     ├─ id
│     ├─ kind
│     ├─ variant: typed | fallback
│     ├─ intent
│     ├─ mode
│     ├─ target
│     ├─ scope
│     ├─ allowedActions
│     └─ confirmationMode
│
├─ 3. Scenario Layer
│  ├─ typed scenarios
│  │  ├─ strategic_plan
│  │  │  ├─ canvas_bootstrap
│  │  │  ├─ goal_subgoals
│  │  │  └─ goal_replan
│  │  ├─ breakdown
│  │  │  ├─ goal_stories
│  │  │  ├─ story_tasks
│  │  │  ├─ task_refine
│  │  │  └─ unspecified_goal_decomposition
│  │  ├─ dependencies
│  │  └─ fill_details
│  │
│  └─ fallback scenarios
│     ├─ review
│     ├─ missing
│     ├─ clarify
│     ├─ next_steps
│     ├─ recent_changes
│     ├─ duplicates
│     ├─ general_question
│     ├─ capability_help
│     └─ conversation
│
├─ 4. Context Layer
│  ├─ snapshot lens
│  ├─ focus bundle
│  ├─ selection cluster
│  ├─ context planner
│  ├─ context shaping
│  └─ evidence compiler
│     ├─ summary
│     ├─ bullets
│     ├─ supportedBy
│     ├─ evidenceIds
│     ├─ sourceContext
│     └─ contextExpansionRequest
│
├─ 5. Command Layer
│  ├─ scenario-aware command specs
│  ├─ strict compiled context
│  ├─ typed prompt builders
│  ├─ structured envelope validation
│  └─ repair path for invalid model output
│
├─ 6. Proposal Layer
│  ├─ plain reply
│  ├─ follow-up question
│  ├─ review findings
│  └─ action plan
│     ├─ scenarioId
│     ├─ scenarioKind
│     ├─ scenarioMode
│     ├─ confirmationMode
│     ├─ allowedStructuredReplyKinds
│     └─ allowedRuntimeActionKinds
│
├─ 7. Structured Action Layer
│  ├─ create_goal
│  ├─ create_goals
│  ├─ create_goal_blueprint
│  ├─ create_batch_stories
│  ├─ create_batch_tasks
│  ├─ suggest_update
│  ├─ suggest_relation
│  ├─ remove_relation
│  └─ update_relation
│
├─ 8. Parsing And Confirmation
│  ├─ structured reply parser
│  ├─ action normalization
│  ├─ action filtering by scenario/action-plan
│  ├─ pending confirmation state
│  ├─ single confirm
│  ├─ batch confirm
│  └─ apply all
│
├─ 9. Execution Layer
│  ├─ session controller
│  ├─ service runtime
│  ├─ canvas action executor
│  ├─ batch execution
│  ├─ placement / layout
│  └─ applied summary back to chat
│
└─ 10. Persistent State
   ├─ memory store
   │  ├─ conversation summary
   │  ├─ agreed facts
   │  ├─ recommendations
   │  ├─ activeScenario
   │  ├─ follow-up state
   │  └─ applied actions
   │
   ├─ persistence
   └─ telemetry
      ├─ routeType
      ├─ intent
      ├─ scenarioId
      ├─ scenarioMode
      ├─ scenarioKind
      ├─ routeLength
      ├─ proposalStyle
      ├─ token usage
      ├─ repair attempts
      └─ invalid envelope count
```

## Operational Model

- `intent` answers what the user wants.
- `scenario` answers how the assistant will handle the request.
- `action plan` is the proposed change set for that scenario.
- `action` is a concrete confirm-first change.
- `execution` is the actual canvas mutation after confirmation.

Manual prompts and explicit intent submissions should converge on the same scenario layer.
Generic routing remains only as a fallback for conversational or low-confidence cases.

## Key Module Files

When changing AI assistant behavior, start here:

- `AGENTS.md`
- `services/AiAssistantSessionController.ts`
- `services/AiAssistantOrchestrator.ts`
- `services/AiAssistantCommandSpecs.ts`
- `services/AiAssistantStructuredReplyParser.ts`
- `services/AiAssistantContextShaping.ts`
- `services/AiAssistantEvidenceCompiler.ts`
- `services/AiAssistantMemoryStore.ts`
- `services/AiAssistantTelemetryStore.ts`
- `aiAssistantActions.ts`

## File Inventory

The module currently contains 88 files.
31 of them are tests.

### Top-Level Files

- `AGENTS.md`: contributor rules for how agents should change this module.
- `README.md`: the module architecture reference and maintenance guide.
- `aiAssistantActions.ts`: runtime action contracts used by chat replies and canvas execution.
- `aiAssistantActions.test.ts`: tests action contracts and action helpers.
- `aiAssistantEvents.ts`: event types, snapshot shapes, and DOM event guards for the module boundary.
- `aiAssistantEvents.test.ts`: tests event validators and event-shape guards.
- `aiAssistantHints.ts`: short capability and UX hint copy for the assistant.
- `aiAssistantPrompts.ts`: high-level prompt builders for explicit quick-action style intents.
- `index.ts`: public entry surface for the module.

### Components

- `components/AiAssistantPanel.ts`: the chat panel UI, composer, message list, progress state, and action buttons.
- `components/AiAssistantPanel.test.ts`: tests panel rendering, progress UI, copy actions, and scroll behavior.

### Rendering

- `rendering/AiAssistantMarkdownRenderer.ts`: renders assistant markdown into DOM-safe chat output.
- `rendering/AiAssistantMarkdownRenderer.test.ts`: tests markdown rendering behavior.
- `rendering/AiAssistantStructuredResultModel.ts`: turns actions and findings into render-ready UI models.
- `rendering/AiAssistantStructuredResultModel.test.ts`: tests structured result rendering rules and labels.

### Services: Core Runtime

- `services/AiAssistantRuntime.ts`: lightweight runtime holder for wiring the assistant into the host app.
- `services/AiAssistantConfig.ts`: config surface for models, limits, and feature toggles.
- `services/AiAssistantApiClient.ts`: low-level LLM client used by orchestration.
- `services/AiAssistantApiTypes.ts`: message and API response types for model calls.
- `services/AiAssistantService.ts`: service facade used by the session controller and panel.
- `services/AiAssistantService.test.ts`: tests service-level behavior.
- `services/AiAssistantSessionController.ts`: main stateful controller for chat sessions, pending actions, confirmations, and progress.
- `services/AiAssistantSessionController.test.ts`: tests controller behavior across replies, progress, confirmation, and apply flows.
- `services/AiAssistantOrchestrator.ts`: central orchestration engine that resolves scenarios, loads instructions, runs tools, and drafts replies.
- `services/AiAssistantOrchestrator.test.ts`: tests orchestration, typed flows, repair, and progress updates.
- `services/AiAssistantWelcomeMessage.ts`: builds the initial assistant welcome message from current context.
- `services/AiAssistantContent.ts`: small content helpers used when building reply or UI content.
- `services/AiAssistantTypes.ts`: chat message, progress, and quick-action UI types.

### Services: Scenario And Intent Resolution

- `services/AiAssistantIntentResolver.ts`: converts quick actions and explicit intent requests into prepared submissions.
- `services/AiAssistantIntentResolver.test.ts`: tests explicit intent submission resolution.
- `services/AiAssistantPreparedSubmission.ts`: typed submission payload shared between UI and controller.
- `services/AiAssistantIntentContext.ts`: extra mode/scope metadata attached to explicit intents.
- `services/AiAssistantScenarioTypes.ts`: canonical scenario type system used across routing and action planning.
- `services/AiAssistantScenarioRegistry.ts`: scenario catalog with ids, modes, scopes, allowed actions, and confirmation rules.
- `services/AiAssistantScenarioResolver.ts`: resolves request input into a canonical scenario.
- `services/AiAssistantScenarioClassifier.ts`: classifier prompt/parse layer for mapping manual prompts into scenarios.
- `services/AiAssistantQuickActions.ts`: quick-action definitions shown by the UI.
- `services/AiAssistantQuickActions.test.ts`: tests quick-action generation.
- `services/AiAssistantIntentPlanFactory.ts`: maps intent-driven flows to instruction packets, profiles, and tool seeds.
- `services/AiAssistantIntentPlanFactory.test.ts`: tests intent plan construction and profile mapping.

### Services: Context, Snapshot, And Evidence

- `services/AiAssistantContextMode.ts`: context mode definitions such as selection vs canvas.
- `services/AiAssistantContextMode.test.ts`: tests context mode rules.
- `services/AiAssistantContextTypes.ts`: memory, persisted chat state, and scenario-aware context types.
- `services/AiAssistantContextTypes.test.ts`: tests context type helpers and normalization.
- `services/AiAssistantContextPlanner.ts`: compiles scenario-aware context payloads from snapshots, tools, and memory.
- `services/AiAssistantContextPlanner.test.ts`: tests scenario context compilation.
- `services/AiAssistantContextShaping.ts`: shapes context breadth and evidence budget for prompts.
- `services/AiAssistantContextShaping.test.ts`: tests context shaping rules.
- `services/AiAssistantSnapshotLens.ts`: reads focused subgraphs from raw canvas snapshots.
- `services/AiAssistantSnapshotLens.test.ts`: tests snapshot lens behavior.
- `services/AiAssistantSnapshotTools.ts`: tool implementations that expose focused snapshot slices.
- `services/AiAssistantSnapshotTools.test.ts`: tests snapshot tools.
- `services/AiAssistantAnalysisTools.ts`: analysis tools such as missing descriptions, dependency gaps, and duplicates.
- `services/AiAssistantAnalysisTools.test.ts`: tests analysis tools.
- `services/AiAssistantTelemetryTypes.ts`: shared scenario telemetry context builder/formatter used by memory, repair, and telemetry.
- `services/AiAssistantEvidenceCompiler.ts`: compiles tool results and context into concise evidence packets for prompting.
- `services/AiAssistantEvidenceCompiler.test.ts`: tests evidence packet generation.
- `services/AiAssistantTestUtils.ts`: reusable snapshot and memory fixtures for tests.

### Services: Prompts, Instructions, And Command Contracts

- `services/AiAssistantInstructionTypes.ts`: instruction packet and planner decision types.
- `services/AiAssistantInstructionRegistry.ts`: registry of instruction packets used by routing and typed scenarios.
- `services/AiAssistantInstructionRegistry.test.ts`: tests instruction lookup and packet content assumptions.
- `services/AiAssistantPlannerPromptBuilder.ts`: builds router and planner prompts for non-command orchestration.
- `services/AiAssistantPlannerPromptBuilder.test.ts`: tests planner prompt construction.
- `services/AiAssistantAnswerPromptBuilder.ts`: builds final answer prompts for fallback conversational flows.
- `services/AiAssistantAnswerPromptBuilder.test.ts`: tests answer prompt construction.
- `services/AiAssistantCommandSpecs.ts`: strict typed command specs, compiled contexts, validators, and repair prompts.
- `services/AiAssistantCommandSpecs.test.ts`: tests command-spec context building and validation.
- `services/AiAssistantCapabilities.ts`: human-readable capability metadata for the assistant.

### Services: Actions, Structured Replies, And Repair

- `services/AiAssistantActionPlanTypes.ts`: types for scenario-derived action plans.
- `services/AiAssistantActionPlan.ts`: derives an action plan from a scenario or intent.
- `services/AiAssistantActionPlan.test.ts`: tests action-plan derivation.
- `services/AiAssistantActionPolicy.ts`: maps scenarios/intents to allowed structured reply kinds and runtime action kinds.
- `services/AiAssistantStructuredTransport.ts`: canonical JSON envelope and structured reply transport shapes.
- `services/AiAssistantStructuredTransport.test.ts`: tests transport schema helpers.
- `services/AiAssistantStructuredReplyParser.ts`: parses model JSON into runtime actions and review findings.
- `services/AiAssistantStructuredReplyParser.test.ts`: tests parser normalization and validation behavior.
- `services/AiAssistantRepair.ts`: repair helpers for invalid model outputs.
- `services/AiAssistantRepair.test.ts`: tests repair prompt and retry behavior.

### Services: Tools And Execution Planning

- `services/AiAssistantToolTypes.ts`: tool, plan, and runtime context type definitions.
- `services/AiAssistantToolRegistry.ts`: tool registry exposed to planner and executor layers.
- `services/AiAssistantToolExecutor.ts`: executes tool plans against the current runtime context.
- `services/AiAssistantToolExecutor.test.ts`: tests tool-plan execution behavior.

### Services: Memory, Persistence, And Telemetry

- `services/AiAssistantMemoryStore.ts`: scenario-aware memory store for summaries, facts, follow-up state, and applied actions.
- `services/AiAssistantMemoryStore.test.ts`: tests memory updates and persistence-facing behavior.
- `services/AiAssistantPersistence.ts`: save/load and normalization for persisted assistant conversations.
- `services/AiAssistantPersistence.test.ts`: tests persistence normalization and recovery.
- `services/AiAssistantTelemetryTypes.ts`: telemetry event shapes and scenario-aware metrics.
- `services/AiAssistantTelemetryStore.ts`: shared telemetry collector and in-memory telemetry store.
- `services/AiAssistantTelemetryStore.test.ts`: tests telemetry recording and aggregation.

## Maintenance Rules

- Keep this document aligned with real runtime behavior.
- Update it together with changes to architecture, routing, scenarios, actions, parser, execution, memory, or telemetry.
- Keep the scope limited to the AI assistant module.
