# Majom Operating Loop Fit Matrix

## Status

- State: analysis
- Started: 2026-04-15
- Scope: compare the current `majom-canvas` implementation with the required operating-loop model from the new Majom planning documentation

## Why This Document Exists

This document maps the new product requirement against the current repository state.

This file is part of the `MAJOM-OPERATING-LOOP-` documentation set.
For the full package index, see [MAJOM-OPERATING-LOOP-DOCUMENTATION-INDEX.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-DOCUMENTATION-INDEX.md:1).

The target requirement is not:

- a broader planner,
- more planning tools,
- or another generic task manager.

The target requirement is:

- one connected operating system for planning,
- one dominant active contour,
- explicit downgrading of everything else,
- day design around the dominant contour,
- protection from reactive capture,
- confrontation with reality through tests or external signals,
- fast recovery after breakdown.

This matrix exists to answer three practical questions:

1. what is already present in the codebase,
2. what exists only as a partial building block,
3. what is still missing and should become a dedicated implementation track.

## Reading Guide

Use the statuses consistently:

- `Present`: real capability already exists in code and materially supports the target model.
- `Partial`: a relevant building block exists, but the product behavior required by the target model is still not there.
- `Missing`: there is no meaningful implementation support yet.

## High-Level Assessment

The current repository already has:

- a strong strategic planning surface through canvas,
- a real planning hierarchy through `goal -> story -> task`,
- a separate execution surface through kanban,
- a separate day-structure surface through time clustering,
- an AI planning copilot with bounded tooling,
- a place to store canvas-scoped metadata and snapshots.

The current repository does not yet have:

- one tactical owner that compresses planning into one main contour,
- explicit role hierarchy such as `Main / Support / Admin / Parked`,
- WIP enforcement across fronts,
- a day engine that is derived from the main contour rather than free-form time blocks,
- access rules as a first-class planning object,
- a reality-contact object,
- a behavior-level recovery engine.

So the current product direction is compatible with the new documentation, but the implementation is still modular and plural.
It is not yet a single operating loop.

## Detailed Matrix

| Capability | Target behavior | Status | What exists now | Where it exists | Main gap | Recommended implementation direction |
|---|---|---|---|---|---|---|
| Strategic planning surface | Hold long-horizon structure and major work relationships | `Present` | The app already treats canvas as the strategic layer and keeps it separate from other modules | [PROJECT.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/PROJECT.md:5), [MODULE-ARCHITECTURE.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MODULE-ARCHITECTURE.md:4) | Strategic structure exists, but it does not compress into one current operating contour | Keep canvas strategic; do not overload it with direct day-control logic |
| Planning hierarchy | Support meaningful decomposition from higher-level intent into actionable work | `Present` | `goal -> story -> task` hierarchy is real in canvas semantics and mapping | [PlanningCanvasRelationSemantics.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/canvas-core/adapters/planning/PlanningCanvasRelationSemantics.ts:17) | Hierarchy exists structurally, but not as role hierarchy | Reuse this hierarchy as substrate for contour selection, not as the contour itself |
| Role Hierarchy | Force each active line into `Main`, `Support`, `Admin`, or `Parked` | `Missing` | No dedicated role field exists on planning entities or canvas-scoped tactical state | [interfaces/index.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/majom-wrapper/interfaces/index.ts:143), [EditElementModal.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/canvas-core/ui/components/EditElementModal.ts:87) | `status` and `priority` cannot safely stand in for operating roles | Add a new tactical state model, separate from task status and canvas element status |
| Role Compressor | Reduce many “important” things into a small role system | `Missing` | There is no reducer, workflow, or UI that forces explicit downgrading of other fronts | Same evidence as above | The user can keep many lines equally “important” | Implement role assignment as a required tactical step before execution planning |
| One Main Contour Selector | Allow exactly one dominant 30-day contour and one dominant confrontation line | `Missing` | Docs support narrow active focus as strategy, but code has no single-main invariant | [STRATEGIC-DIRECTIONS.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/STRATEGIC-DIRECTIONS.md:94) | The principle exists only in prose | Add tactical domain invariants: one `mainContourId`, one active confrontation/test chain |
| Tactical planning layer | Own prioritization compression between strategy and execution | `Partial` | Tactical planning is explicitly described as needed between canvas and kanban | [KANBAN-TACTICAL-EXECUTION-DESIGN.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/KANBAN-TACTICAL-EXECUTION-DESIGN.md:13) | It is still a design note, not a real module/store/domain | Introduce a new tactical feature module that becomes the single owner of active fronts |
| Flow concept | Represent active streams of work with capacity and WIP semantics | `Partial` | `Flow` exists in interfaces and docs as a candidate tactical entity | [interfaces/index.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/majom-wrapper/interfaces/index.ts:143), [tasks-api-service.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/majom-wrapper/data-access/tasks-api-service.ts:14), [KANBAN-TACTICAL-EXECUTION-DESIGN.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/KANBAN-TACTICAL-EXECUTION-DESIGN.md:40) | It is not enforced, filtered, or surfaced as the control center of execution | Either evolve `Flow` into the tactical contour object or create a narrower contour entity and keep `Flow` secondary |
| WIP limit on fronts | Limit simultaneous serious movement, not just visualize workload | `Partial` | Docs already call for `wip_limit`, capacity, and refill rules | [KANBAN-TACTICAL-EXECUTION-DESIGN.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/KANBAN-TACTICAL-EXECUTION-DESIGN.md:82) | Current code has no actual WIP gate on active work | Add tactical invariants such as `1 Main`, `1-2 Support`, rest inactive |
| Execution board | Provide an operational work surface | `Present` | Kanban is real, isolated, and backed by a reactive store | [KanbanStore.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/kanban/state/KanbanStore.ts:1) | The board is operational, but not yet tactical-first | Keep kanban as execution surface only; derive its intake from tactical state |
| Execution-first queues | Show `Now / Next / Queue / Done` rather than date/status buckets | `Missing` | Current kanban still uses `today`, `tomorrow`, `soon`, `overdue`, `planned`, `todo`, `done`, `cancelled` | [constants.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/kanban/domain/constants.ts:4), [KANBAN-TACTICAL-EXECUTION-DESIGN.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/KANBAN-TACTICAL-EXECUTION-DESIGN.md:24) | Current board logic still answers date placement, not active-front control | Replace bucket logic with tactical allocation into `now`, `next`, `queue`, `done` |
| Day structure module | Represent day-level structure explicitly | `Present` | `Time Clustering` already has domain types, store, day/week views, and persistence boundary | [TIME-CLUSTERING.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/TIME-CLUSTERING.md:17), [TimeClusteringStore.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/time-clustering/state/TimeClusteringStore.ts:1) | It models time structure, not operating priority | Reuse this module as the base for `Day Architect`, not as an independent planner |
| Day Architect | Build the day around `Main`, `Support`, `Reactive/Admin`, and `Recovery` blocks | `Partial` | Time blocks exist, but they are user-shaped clusters, not contour-derived protected blocks | [TIME-CLUSTERING.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/TIME-CLUSTERING.md:213) | No linkage to task execution, no forced block semantics, no protected first strong block | Add a derived planning mode over time clustering instead of keeping only free-form cluster authoring |
| Main-before-reactive sequencing | Prevent the day from starting in inbox and noise | `Missing` | No rule in code enforces morning protection or pre-reactive main start | [TimeClusteringSuggestionService.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/time-clustering/services/TimeClusteringSuggestionService.ts:1) | Suggestions are generic and not connected to active contour | Add day-planning rules that validate block ordering and flag reactive-first days |
| Access Rules | Define when the user is unavailable and what can interrupt the day | `Missing` | There is no product object, policy model, or UI for interruption rights or channel gating | No dedicated implementation area exists yet | External capture is not modeled as part of the planning system | Add `accessRules` to tactical state and surface them in the day view |
| Test / Reality Contact layer | Force the main contour through explicit external signal | `Missing` | AI can review and clarify structure, but there is no object such as `Test`, `Move`, or `Reality Contact` | [AiAssistantInstructionRegistry.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/ai-assistant/services/AiAssistantInstructionRegistry.ts:61) | Planning remains internal/structural; no truth-contact contract exists | Add a tactical entity for external test points and require one on the main contour |
| Recovery engine | Recover the operating core after failure rather than restoring everything | `Missing` | There is no behavior-level recovery loop in planning state | No tactical recovery model exists | Current planning has no classification of breakdown or controlled return path | Add recovery state with failure classes such as `micro`, `medium`, `repeated` and minimal restart set |
| Data recovery | Preserve canvas state after crash, reload, or partial failure | `Present` | Local draft recovery and history work are already designed or implemented | [CanvasDraftRepository.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/canvas/drafts/CanvasDraftRepository.ts:1), [CANVAS-CHANGES-HISTORY-IMPLEMENTATION-BLUEPRINT.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/CANVAS-CHANGES-HISTORY-IMPLEMENTATION-BLUEPRINT.md:24) | This is technical recovery, not planning recovery | Keep as infrastructure; do not mistake it for behavioral recovery engine |
| AI planning copilot | Review structure, propose confirm-first planning actions, and inspect focus context | `Present` | AI orchestration, tool registry, instruction packets, and focus-bundle tooling already exist | [WORKSPACE-CHAT-RESOURCE-ORCHESTRATION.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/WORKSPACE-CHAT-RESOURCE-ORCHESTRATION.md:4), [AiAssistantSnapshotTools.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/ai-assistant/services/AiAssistantSnapshotTools.ts:1) | AI is still canvas-centric and advisory | Extend it after the tactical domain exists; do not let AI invent the operating model first |
| AI as operating-loop orchestrator | Understand tactical state, day structure, WIP violations, access rules, and recovery | `Missing` | Kanban and time-clustering do not provide AI snapshots, and assistant messaging explicitly avoids autonomous optimizer claims | [KanbanModule.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/kanban/KanbanModule.ts:21), [TimeClusteringModule.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/time-clustering/TimeClusteringModule.ts:63), [WORKSPACE-CHAT-RESOURCE-ORCHESTRATION.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/WORKSPACE-CHAT-RESOURCE-ORCHESTRATION.md:205) | AI cannot see the full operating picture because that picture does not yet exist in code | Add tactical and day-planning tool contexts first; then expand instruction packets and tool host coverage |
| Canvas-scoped tactical metadata | Store operating-loop state without mutating core task lifecycle fields | `Present` | Canvas already supports canvas-level meta and layout meta; docs already note that many planning fields still live on domain entities, which is a limitation for reuse | [canvas-api-service.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/majom-wrapper/data-access/canvas-api-service.ts:14), [canvas-position-dto.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/majom-wrapper/data-access/canvas-position-dto.ts:15), [CANVAS-SHARING-TEMPLATES.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/CANVAS-SHARING-TEMPLATES.md:41), [CANVAS-SHARING-TEMPLATES.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/CANVAS-SHARING-TEMPLATES.md:50) | Tactical semantics should not be overloaded into task status or task priority | Add a separate operating-loop snapshot keyed by canvas, not by task DTO mutation |
| One connected operating machine | Make all planning surfaces answer to one dominant contour | `Missing` | The repo currently has several good but separate surfaces: canvas, kanban, time-clustering, AI copilot | Cross-module evidence above | The product is still a plural planning workspace, not one operating loop | Add a dedicated `operating-loop` module that becomes the tactical source of truth for the other surfaces |

## What Is Already Safe To Reuse

The following areas are strong enough to treat as stable building blocks:

- strategic canvas and planning hierarchy,
- canvas-scoped metadata and snapshot infrastructure,
- reactive store pattern used in `kanban` and `time-clustering`,
- AI tool and instruction architecture,
- isolated workspace module system in `RuntimeHost`.

These should be reused rather than replaced.

## What Should Not Be Reused As-Is

The following areas should not be stretched beyond their current role:

- `Task.status` as a substitute for operating role,
- `Task.priority` as a substitute for contour weight,
- date/status kanban columns as a substitute for WIP control,
- free-form time clusters as a substitute for day architecture,
- canvas data recovery as a substitute for recovery engine,
- AI review instructions as a substitute for tactical state.

## Implementation Consequence

The cleanest path is to add a dedicated tactical module rather than hiding the new product logic inside existing task fields.

The most natural target shape is:

1. `canvas` remains strategic structure,
2. new `operating-loop` module becomes tactical owner,
3. `kanban` becomes execution projection from tactical state,
4. `time-clustering` becomes day-architecture projection from tactical state,
5. AI becomes an assistant over the tactical loop instead of only over canvas structure.

## MVP Cut For This Direction

If the new operating-loop model is implemented incrementally, the safest MVP sequence is:

1. `Role Hierarchy`
2. `One Main Contour Selector`
3. `WIP Limit`
4. `Recovery Engine`
5. `Day Architect`

Then add:

6. `Access Rules`
7. `Test / Reality Contact`

This sequence matters because `time-clustering` and `kanban` should become projections of tactical state, not the place where tactical state is invented ad hoc.

## Practical Recommendation

Do not implement this direction by gradually stuffing more meaning into:

- task priority,
- task status,
- tags,
- kanban buckets,
- or free-form time clusters.

That would preserve the current “many parallel planning surfaces” model.

Implement it by introducing one tactical source of truth that can answer:

- what is `Main`,
- what is merely `Support`,
- what is inactive,
- what the day is protecting,
- what external signal proves movement,
- and what the smallest valid recovery path is after failure.

Only then do the existing modules start behaving like one connected system instead of several adjacent tools.
