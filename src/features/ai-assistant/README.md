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

## Target Architecture

The desired architecture is typed-first and scenario-centric.

The core model is:

- `intent` = what the user wants
- `scenario` = how the system will handle it
- `action plan` = which changes should be proposed
- `action` = a concrete confirm-first change
- `execution` = the real canvas mutation

The target runtime flow is:

`input -> intent resolution -> scenario resolution -> context and evidence -> action plan -> confirmation -> execution -> memory and telemetry`

### Design Principles

- Manual prompts and explicit UI actions should converge into the same scenario layer.
- The system should choose the shortest sufficient scenario, not the most elaborate one.
- Simple requests should use short typed scenarios.
- Ambiguous or high-impact requests may use longer scenarios with clarify or evidence-gathering steps.
- Generic conversational routing should remain available, but only as a fallback for low-confidence or discussion-first cases.

### Target Layers

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

3. Scenario resolution
   - builds a first-class `ResolvedScenario`
   - chooses the minimal sufficient path
   - defines:
     - scenario kind
     - mode
     - scope
     - target
     - confirmation behavior
     - allowed actions

4. Context and evidence
   - minimal tools for the chosen scenario
   - structured memory
   - confirmed facts
   - user constraints
   - evidence compiler
   - compact evidence packets instead of raw broad dumps

5. Action planning and proposal
   - structured reply envelope
   - plain answer when the request is conversational
   - follow-up question when required slots are missing
   - review findings when the scenario is analytical
   - an action plan when the scenario is actionable

6. Confirmation
   - single confirm
   - batch confirm
   - apply all
   - cancel
   - text confirmation fallback
   - undo last apply

7. Execution
   - action validation
   - transactional batch execution
   - placement service
   - collision-aware layout
   - applied summary written back to the chat

8. Memory and telemetry
   - confirmed facts
   - open slots
   - active scenario
   - applied action history
   - route accuracy
   - repair rate
   - invalid envelope rate
   - tool hops and token cost

## Final Target Architecture Tree

```text
AI Assistant

|- 1. Ingress
|  |- quick action / button
|  |- manual prompt
|  |- follow-up reply
|  `- confirm / cancel / undo
|
|- 2. Intent Resolution
|  |- explicit intent
|  `- classifier / resolver
|     |- intent
|     |- mode
|     |- scope
|     |- confidence
|     `- missing slots
|
|- 3. Scenario Resolution
|  |- typed scenario
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
|  `- conversational fallback
|     |- review
|     |- next_steps
|     |- capability_help
|     |- recent_changes
|     |- duplicates
|     |- brainstorming
|     `- low-confidence fallback
|
|- 4. Context + Evidence
|  |- context planner
|  |- minimal tool calls
|  |- structured memory
|  |- confirmed facts
|  |- user constraints
|  `- evidence compiler
|
|- 5. Proposal
|  |- plain answer
|  |- follow-up question
|  |- review findings
|  `- action plan
|     |- single action
|     |- multiple actions
|     |- batch action
|     `- compound action
|
|- 6. Confirmation
|  |- single confirm
|  |- batch confirm
|  |- apply all
|  |- cancel
|  `- undo last apply
|
|- 7. Execution
|  |- action validation
|  |- transactional batch execution
|  |- placement service
|  |- collision-aware layout
|  `- applied summary
|
`- 8. Persistent System State
   |- memory update
   |- active scenario update
   |- applied action history
   `- telemetry recording
```

## Main Difference Between Current And Target State

- Current state:
  - explicit actions can enter typed scenarios directly
  - manual prompts often go through the generic router
  - `intent`, `intentContext`, and command specs carry most of the runtime structure

- Target state:
  - manual and explicit inputs can both enter the same typed scenario
  - `scenario` becomes the main runtime abstraction
  - generic routing is reserved for conversational or low-confidence cases
  - action planning becomes explicit between scenario resolution and execution
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

## Terminology: Action Plan vs Action

- `action plan`
  - the set of changes proposed by the assistant for the current scenario
  - may contain:
    - a single action
    - multiple separate actions
    - a batch action
    - a compound action

- `action`
  - one concrete confirm-first runtime change
  - examples:
    - `create_goal`
    - `create_goals`
    - `create_goal_blueprint`
    - `suggest_update`
    - `suggest_relation`

In short:

- `scenario` decides the handling path
- `action plan` describes the proposed change set
- `action` is the concrete executable unit

## Target Scenario Abstraction

The desired architecture should treat `scenario` as a first-class concept.

That does not require a large inheritance tree, but it should exist as an explicit resolved object such as `ResolvedScenario` or `ScenarioDescriptor`.

Conceptually, the flow should be:

`input -> intent resolution -> scenario resolution -> context and evidence -> action plan and proposal -> confirmation -> execution`

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

The target architecture should also make room for an explicit action-plan layer between scenario resolution and execution.

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
