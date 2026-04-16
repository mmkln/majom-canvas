# Majom Operating Loop Implementation Matrix

## Status

- State: proposal
- Started: 2026-04-15
- Scope: phased implementation matrix for the Majom operating loop in `majom-canvas`

## Why This Document Exists

The existing `MAJOM-OPERATING-LOOP-*` documents already define:

- the current fit and gaps,
- the domain model,
- the tactical state and invariants,
- the UX contract,
- the persistence and integration direction.

What was still missing is the implementation bridge:

- in what order to build things,
- what modules and files to create,
- what existing modules to touch,
- what must be true before moving to the next phase.

This document is that bridge.

## Planning Assumption

This matrix assumes one explicit rollout choice:

- **Phase 1 uses a local-first operating-loop repository**
- **Later phases add a dedicated backend endpoint**

This is the recommended path because it:

- validates the tactical model before backend lock-in,
- keeps scope controlled,
- matches the repository pattern already used in feature-local state modules,
- avoids forcing early backend changes before the tactical invariants are proven.

## Main Architectural Rule

The implementation should preserve this shape:

- `canvas` = strategic structure
- `operating-loop` = tactical owner
- `kanban` = execution projection
- `time-clustering` = day-architecture projection
- AI = assistant over tactical state

If any phase starts pushing tactical meaning into:

- `Task.status`,
- `Task.priority`,
- kanban bucket logic,
- or free-form time clusters,

the implementation is drifting off course.

## Phase Overview

| Phase | Goal | Primary outcome |
|---|---|---|
| `0` | Foundation decision lock | One chosen rollout path and one new tactical feature boundary |
| `1` | Tactical core | New `operating-loop` domain, store, repository, invariants |
| `2` | Contour selection UX | User can assign roles and choose one `Main` |
| `3` | Day architecture projection | Time structure becomes tactical-day projection rather than free-form only |
| `4` | Execution projection | Kanban becomes tactical execution intake instead of date/status bucketing |
| `5` | Access + reality layer | Main contour gets protection and external truth contact |
| `6` | Recovery engine | The system can return the user to a minimal valid operating state |
| `7` | AI tactical integration | AI can inspect and reason over the full operating loop |

## Detailed Matrix

| Phase | Capability area | Missing gaps closed | New files/modules | Existing files to touch | Main implementation tasks | Tests required | Exit criteria | Defer from this phase |
|---|---|---|---|---|---|---|---|---|
| `0` | Rollout lock | removes ambiguity about owner and persistence path | none required, docs only | [MAJOM-OPERATING-LOOP-PERSISTENCE-AND-INTEGRATION.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-PERSISTENCE-AND-INTEGRATION.md:1), [MAJOM-OPERATING-LOOP-DOCUMENTATION-INDEX.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-DOCUMENTATION-INDEX.md:1) | lock the first implementation path as `local-first tactical repository`, lock new feature root as `src/features/operating-loop/`, explicitly forbid tactical meaning in task DTO fields | none beyond doc consistency | one clear implementation path exists and file boundary is no longer ambiguous | backend endpoint work |
| `1` | Tactical core domain and store | `Role Hierarchy`, `One Main Contour`, `WIP diagnostics` foundation | `src/features/operating-loop/domain/types.ts`, `src/features/operating-loop/domain/rules.ts`, `src/features/operating-loop/state/OperatingLoopStore.ts`, `src/features/operating-loop/data/OperatingLoopRepository.ts`, `src/features/operating-loop/data/LocalStorageOperatingLoopRepository.ts`, `src/features/operating-loop/index.ts` | [RuntimeHost.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/bootstrap/RuntimeHost.ts:1) only if a tactical runtime hook is needed; otherwise keep integration minimal | define snapshot types, create typed actions, implement hard invariants, implement diagnostics such as `wipViolation`, add local repository, support loading and saving tactical state keyed by canvas | unit/store tests for one-main invariant, support overflow, parked exclusion, diagnostics recomputation, repository roundtrip | store can load/save a tactical snapshot and reject invalid role states | any polished UI, AI, kanban replacement, day projection |
| `2` | Contour selection UX | closes visible gap around `Main / Support / Admin / Parked` and role compression | `src/features/operating-loop/ui/OperatingLoopPanel.ts`, `src/features/operating-loop/ui/ContourRoleBoard.ts`, optional `src/features/operating-loop/OperatingLoopModule.ts` | [RuntimeHost.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/bootstrap/RuntimeHost.ts:1), [WorkspaceControlsBar.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/shell/WorkspaceControlsBar.ts:1) if a launcher/toggle is added, possibly `src/features/canvas/CanvasModule.ts` if tactical panel needs canvas context | create minimal UI to list contours, assign roles, promote one contour to `Main`, park and unpark contours, surface WIP diagnostics | integration tests for role assignment flow, promotion/demotion flow, WIP warning visibility; no visual-only assertions | user can deliberately compress many lines into one active hierarchy and the store remains valid | day-plan editing, access rules, reality-contact UI |
| `3` | Day architecture projection | closes `Day Architect` gap and `main-before-reactive` gap | `src/features/operating-loop/services/DayPlanProjection.ts`, optional `src/features/operating-loop/domain/dayPlan.ts` | [TimeClusteringStore.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/time-clustering/state/TimeClusteringStore.ts:1), [TimeClusteringApp.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/time-clustering/TimeClusteringApp.ts:1), relevant `TimeClusteringRootView` files | add a projection path from tactical state to day blocks, distinguish `main`, `support`, `reactive_admin`, `buffer_recovery`, add validation that surfaces reactive-first days | domain tests for projection rules, integration tests for derived block rendering and validation messaging | time clustering can render a tactical day shape from operating-loop state without inventing extra active fronts | full calendar redesign, recurrence complexity, backend sync |
| `4` | Execution projection | closes `Now / Next / Queue` gap and tactical intake gap | `src/features/operating-loop/services/KanbanProjection.ts` or similar tactical adapter | [KanbanStore.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/kanban/state/KanbanStore.ts:1), [buildBoard.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/kanban/domain/buildBoard.ts:1), [constants.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/kanban/domain/constants.ts:1), [rules.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/kanban/domain/rules.ts:1) | replace date/status-first intake with tactical execution queues, keep due date as secondary signal rather than primary queue owner, preserve fast inline task edits | projection tests for `now/next/queue`, regression tests for completion and refresh behavior, tests proving WIP-safe intake | kanban columns are execution-first and derived from tactical state, not just due-date categories | explainable auto-refill sophistication, flow analytics |
| `5` | Access rules and reality contact | closes `Access Rules` and `Reality Contact` gaps | `src/features/operating-loop/domain/access.ts`, `src/features/operating-loop/domain/realityContact.ts`, `src/features/operating-loop/ui/AccessRulesPanel.ts`, `src/features/operating-loop/ui/RealityContactPanel.ts` | tactical UI files from Phase `2`, [TimeClusteringRootView.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/time-clustering/ui/components/TimeClusteringRootView.ts:1) if day UI surfaces protection state | add access-rule records, add reality-contact records, require non-cancelled reality contact on active `Main`, show missing protection and missing reality-contact warnings in tactical/day views | domain tests for access-rule validation and reality-contact requirement, UI-flow tests for attaching and updating contact status | main contour can no longer exist as a purely internal line without explicit reality contact | external integrations, auto-detection of external signals |
| `6` | Recovery engine | closes recovery gap at behavior level | `src/features/operating-loop/domain/recovery.ts`, `src/features/operating-loop/services/RecoveryPlanner.ts`, `src/features/operating-loop/ui/RecoveryPanel.ts` | tactical store and tactical panel files, day projection if recovery block is surfaced there | classify breakdown severity, store breakpoint, compute minimal restart set, present recovery mode to the user without rebuilding the whole system | domain tests for severity classification and restart-set generation, UI-flow tests for entering and resolving recovery | user can enter recovery mode and see a minimal valid return path | advanced burnout heuristics, longitudinal personalization |
| `7` | AI tactical integration | closes AI blind spot around tactical state | `src/features/ai-assistant/services` additions for tactical tools and instructions | [AiAssistantToolRegistry.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/ai-assistant/services/AiAssistantToolRegistry.ts:1), [AiAssistantSnapshotTools.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/ai-assistant/services/AiAssistantSnapshotTools.ts:1), [AiAssistantInstructionRegistry.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/ai-assistant/services/AiAssistantInstructionRegistry.ts:1), [KanbanModule.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/kanban/KanbanModule.ts:1), [TimeClusteringModule.ts](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/src/features/time-clustering/TimeClusteringModule.ts:1) | expose tactical snapshot tools, add instructions for WIP review, missing reality-contact review, recovery guidance, optionally make kanban and time-clustering contribute AI context where justified | tool tests, instruction selection tests, orchestration tests for tactical help flows | AI can inspect and discuss the operating loop without pretending to own state | autonomous mutation tools, open-ended planner automation |

## File-Level First Pass

The safest first file set for implementation is:

```text
src/features/operating-loop/domain/types.ts
src/features/operating-loop/domain/rules.ts
src/features/operating-loop/state/OperatingLoopStore.ts
src/features/operating-loop/state/OperatingLoopStore.test.ts
src/features/operating-loop/data/OperatingLoopRepository.ts
src/features/operating-loop/data/LocalStorageOperatingLoopRepository.ts
src/features/operating-loop/data/LocalStorageOperatingLoopRepository.test.ts
src/features/operating-loop/index.ts
```

This first pass should intentionally avoid:

- touching `PlatformTask` DTO shape,
- changing `Goal` or `Story` backend contracts,
- replacing kanban,
- replacing time clustering,
- or expanding AI tool scope.

## Cross-Phase Dependencies

The key dependency chain is:

```text
Tactical domain and invariants
    ->
Contour selection UI
    ->
Day projection + execution projection
    ->
Access / reality / recovery
    ->
AI tactical context
```

This order matters.

If `kanban` or `time-clustering` are changed before the tactical owner exists, the implementation will likely duplicate meaning and require another refactor.

## Guardrails Per Phase

### Phase `1` guardrail

Do not add user-visible polish until invariants and diagnostics are stable.

### Phase `2` guardrail

Do not hide role compression in small metadata widgets.
It must be visible enough to actually change user behavior.

### Phase `3` guardrail

Do not let the day UI invent contour meaning independently of the tactical store.

### Phase `4` guardrail

Do not preserve date/status buckets as the silent true owner of execution intake.

### Phase `5` guardrail

Do not model reality contact as just another note field.

### Phase `6` guardrail

Do not turn recovery into a big re-planning wizard.
It must stay minimal.

### Phase `7` guardrail

Do not let AI become a hidden state mutation path.

## What This Matrix Intentionally Does Not Decide

This matrix does not yet lock:

- final visual design language,
- final backend API shape,
- whether the operating loop gets its own top-level workspace view or starts as an island/panel,
- external tool integrations for reality signals.

Those decisions should come after the tactical core is proven.

## Recommended Immediate Next Step

Start with Phase `1`.

Specifically:

1. create the `src/features/operating-loop/` feature root,
2. implement typed tactical snapshot and store,
3. implement invariants and diagnostics,
4. add repository and tests,
5. do not touch kanban or time clustering yet.

That is the smallest structural step that makes all later steps cheaper and safer.
