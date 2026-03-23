# AI Assistant Module

This document describes only the AI assistant functionality in this project.
It is the local architecture reference for the `src/features/ai-assistant` module.

## Purpose

The AI assistant is a confirm-first planning copilot for the canvas.
It can:

- interpret user requests through explicit intents or a generic manual flow
- gather workspace context and evidence
- produce structured replies with optional actions
- ask follow-up questions when action is not yet safe
- execute approved actions on the canvas

## Core Layers

1. Ingress
   - explicit prepared submissions from quick actions or UI buttons
   - manual prompts from the chat composer
   - follow-up replies inside an already active assistant flow

2. Intent and routing
   - explicit submissions already carry an intent and optional intent context
   - manual prompts go through the generic orchestration path unless they are a continuation of an existing typed flow
   - follow-up messages can stay inside the prior typed scenario when the assistant explicitly awaits user input

3. Context and evidence
   - the assistant gathers only the workspace context needed for the current flow
   - typed command specs compile narrow action-ready context
   - generic flows may load instructions, tools, or ask follow-up questions

4. Proposal
   - the model returns a structured reply envelope
   - replies may include markdown, review findings, and confirm-first actions

5. Confirmation and execution
   - actions are shown in the chat UI with confirmation buttons
   - pending confirmation state can be resumed through buttons or text follow-up
   - approved actions are executed through the canvas action executor

## Current Interaction Scenario Tree

```text
Chat

|- 1. Entry through explicit action / quick action
|  |
|  |- 1.1 Intent already known
|  |  |
|  |  |- strategic_plan
|  |  |  |- collect minimal context
|  |  |  |- strict command spec
|  |  |  |- structured reply
|  |  |  `- actions:
|  |  |     |- create_goals
|  |  |     `- create_goal_blueprint
|  |  |
|  |  |- breakdown
|  |  |  |- collect minimal context
|  |  |  |- strict command spec
|  |  |  |- structured reply
|  |  |  `- actions:
|  |  |     |- create_batch_stories
|  |  |     |- create_batch_tasks
|  |  |     `- suggest_updates
|  |  |
|  |  |- dependencies
|  |  |  |- strict command spec
|  |  |  `- actions:
|  |  |     |- suggest_relations
|  |  |     |- remove_relations
|  |  |     `- update_relations
|  |  |
|  |  |- fill_details
|  |  |  |- strict command spec
|  |  |  `- actions:
|  |  |     `- suggest_updates
|  |  |
|  |  `- other explicit intents
|  |     `- may use a less strict flow depending on the intent
|  |
|  `- 1.2 Result
|     |- assistant reply
|     |- confirmation buttons
|     |- pending confirmation bar
|     `- apply / apply all
|
|- 2. Entry through manual prompt in the composer
|  |
|  |- 2.1 Is it a follow-up to an already open typed flow?
|  |  |
|  |  |- Yes
|  |  |  `- return to the same intent / scenario
|  |  |     |- strategic_plan follow-up
|  |  |     |- breakdown follow-up
|  |  |     |- dependencies follow-up
|  |  |     `- fill_details follow-up
|  |  |
|  |  `- No
|  |     `- go to the generic manual router
|  |        |- load instructions
|  |        |- execute tools
|  |        |- ask follow-up
|  |        `- finalize structured reply
|  |
|  `- 2.2 Result of the generic flow
|     |- plain explanation or guidance
|     |- review findings
|     |- confirm-first actions
|     `- or a follow-up question
|
|- 3. After an assistant reply
|  |
|  |- 3.1 Reply contains actions
|  |  |- click Apply / Create / Apply all
|  |  |- text confirmation as a fallback
|  |  `- execute through the canvas executor
|  |
|  |- 3.2 Reply expects a follow-up
|  |  `- next user message continues the same flow
|  |
|  `- 3.3 Reply has no actions
|     `- continue as normal conversation
|
`- 4. Execution layer
   |- parse structured reply
   |- normalize actions
   |- validate actions
   |- execute on canvas
   `- write applied summary back to chat
```

## Current Important Constraint

The current implementation is not fully typed-first for all manual prompts.

- Explicit quick actions and prepared submissions can enter strict typed scenarios directly.
- Manual prompts do not automatically enter typed scenarios just because they look similar to a known action request.
- A manual prompt can continue a typed scenario only when the assistant is explicitly waiting for user input from that same flow.

This is intentional in the current implementation to avoid hidden local lexical routing logic.

## Target Architecture After Planned Improvements

The target state is a typed-first architecture where manual prompts and explicit UI actions converge into the same scenario layer.

1. Ingress
   - quick actions and buttons
   - manual prompts
   - follow-up replies
   - confirm, cancel, and undo commands

2. Intent resolution
   - explicit actions provide intent directly
   - manual prompts go through a classifier or resolver
   - the resolver returns structured intent data such as:
     - `intent`
     - `mode`
     - `scope`
     - `confidence`
     - missing slots or constraints

3. Scenario layer
   - recognized requests enter typed scenarios first
   - generic conversational routing becomes a fallback, not the default path
   - manual and explicit inputs can reach the same typed scenario when they mean the same thing

4. Context and evidence layer
   - minimal tools for the chosen scenario
   - structured memory
   - confirmed facts
   - user constraints
   - evidence compiler
   - action payloads that can carry evidence metadata

5. Proposal layer
   - structured reply envelope
   - confirm-first actions
   - follow-up question when slots are missing
   - free-form conversational answer when the request is not an action request

6. Confirmation layer
   - apply
   - apply all
   - cancel
   - text confirmation fallback
   - undo last apply

7. Execution layer
   - transactional batch execution
   - atomic apply
   - placement service
   - collision-aware layout
   - applied summary written back to the chat

8. Memory and telemetry layer
   - confirmed facts
   - open slots
   - applied action history
   - route accuracy
   - repair rate
   - invalid envelope rate
   - tool hops and token cost

## Target Interaction Scenario Tree

```text
Chat

|- 1. User input
|  |- quick action / button
|  |- manual prompt
|  |- follow-up reply
|  `- confirm / cancel / undo
|
|- 2. Intent resolution
|  |- explicit intent already known
|  `- classifier / resolver returns:
|     |- intent
|     |- mode
|     |- scope
|     |- confidence
|     `- missing slots
|
|- 3. Route into scenario
|  |
|  |- 3.1 Typed action scenario
|  |  |
|  |  |- strategic_plan
|  |  |  |- canvas_bootstrap
|  |  |  |- goal_subgoals
|  |  |  `- goal_replan
|  |  |
|  |  |- breakdown
|  |  |  |- goal_stories
|  |  |  |- story_tasks
|  |  |  |- task_refine
|  |  |  `- need_clarification
|  |  |
|  |  |- dependencies
|  |  |  |- add relations
|  |  |  |- remove relations
|  |  |  `- update relation types
|  |  |
|  |  |- fill_details
|  |  |  `- suggest_updates
|  |  |
|  |  `- future typed scenarios
|  |     |- merge
|  |     |- archive
|  |     `- reparent
|  |
|  `- 3.2 Conversational scenario
|     |- review
|     |- next steps
|     |- capability help
|     |- recent changes
|     |- duplicates
|     |- open question / brainstorming
|     `- low-confidence fallback
|
|- 4. Context assembly
|  |- minimal tools
|  |- structured memory
|  |- confirmed facts
|  |- user constraints
|  `- evidence compilation
|
|- 5. Assistant reply
|  |- plain conversational answer
|  |- follow-up question
|  |- structured review
|  `- structured actions
|     |- create_goal
|     |- create_goals
|     |- create_goal_blueprint
|     |- create_batch_stories
|     |- create_batch_tasks
|     |- suggest_updates
|     |- suggest_relations
|     |- remove_relations
|     `- update_relations
|
|- 6. Confirmation flow
|  |- single action confirm
|  |- batch confirm
|  |- apply all
|  |- cancel
|  `- undo last apply
|
|- 7. Execution
|  |- validate actions
|  |- transactional batch apply
|  |- placement service
|  |- collision-aware layout
|  `- applied summary
|
`- 8. Persistent state
   |- memory updated
   |- applied action history updated
   |- open follow-up slots updated
   `- telemetry recorded
```

## Main Difference Between Current And Target State

- Current state:
  - explicit actions can enter typed scenarios directly
  - manual prompts often go through the generic router

- Target state:
  - manual and explicit inputs can both enter the same typed scenario
  - generic routing is reserved for conversational or low-confidence cases
  - execution is more atomic, explainable, and measurable

## Terminology: Intent vs Scenario

These terms are related, but they do not mean the same thing.

- `intent`
  - the high-level user goal
  - answers: what does the user want to do
  - examples:
    - `strategic_plan`
    - `breakdown`
    - `dependencies`
    - `fill_details`

- `scenario`
  - the concrete workflow the assistant will run for that request
  - answers: how should the system handle this request
  - includes more than intent, for example:
    - `mode`
    - `scope`
    - `target`
    - `confidence`
    - `missingSlots`
    - `allowedActions`
    - `contextPlan`
    - `confirmationMode`

One intent can map to several scenarios.

Examples:

- `intent = breakdown`
  - scenario `goal_stories`
  - scenario `story_tasks`
  - scenario `task_refine`
  - scenario `need_clarification`

- `intent = strategic_plan`
  - scenario `canvas_bootstrap`
  - scenario `goal_subgoals`
  - scenario `goal_replan`

In short:

- `intent` = what
- `scenario` = how

## Target Scenario Abstraction

The desired architecture should treat `scenario` as a first-class concept.

That does not require a large inheritance tree, but it should exist as an explicit resolved object such as `ResolvedScenario` or `ScenarioDescriptor`.

Conceptually, the flow should be:

`input -> intent resolution -> scenario resolution -> context and evidence -> proposal -> confirmation -> execution`

A target `scenario` object should contain at least:

- `intent`
- `mode`
- `scope`
- `target`
- `confidence`
- `missingSlots`
- `allowedActions`
- `contextPlan`
- `confirmationMode`

The current implementation is already close through:

- `intent`
- `intentContext`
- command specs

But it does not yet have a full first-class `scenario` abstraction.

## Main Typed Scenarios

- `strategic_plan`
  - goal-level strategic planning
  - may propose `create_goals` or `create_goal_blueprint`

- `breakdown`
  - decomposition into stories, tasks, or focused updates depending on context

- `dependencies`
  - relation suggestions, removals, and type changes

- `fill_details`
  - refinement of existing item fields through update suggestions

## Main Fallback Scenarios

These are more conversational and may use the generic router path:

- review
- next steps
- recent changes
- duplicates
- general questions
- capability help

## Files To Read First

When changing AI assistant behavior, start here and then inspect the implementation:

- `AGENTS.md`
- `services/AiAssistantSessionController.ts`
- `services/AiAssistantOrchestrator.ts`
- `services/AiAssistantCommandSpecs.ts`
- `services/AiAssistantStructuredReplyParser.ts`
- `aiAssistantActions.ts`

## Notes For Future Changes

- Keep semantic interpretation out of local regex, keyword bags, token lists, or phrase tables.
- Prefer explicit intent, structured state, model classification, and typed command context.
- If the architecture changes materially, update this document together with the implementation.
