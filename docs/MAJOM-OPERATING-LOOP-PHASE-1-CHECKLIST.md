# Majom Operating Loop Phase 1 Checklist

## Status

- State: active planning
- Started: 2026-04-15
- Scope: detailed execution checklist for Phase 1 of the Majom operating-loop rollout

## Why This Document Exists

The broader implementation matrix already defines:

- the rollout phases,
- touched modules,
- required tests,
- and exit criteria.

This file narrows that down to one concrete implementation slice:

- `Phase 1: Tactical core`

This is the first real build phase.
Its job is not to deliver a polished user-facing feature.
Its job is to create the tactical source of truth that every later phase depends on.

## Phase 1 Goal

Build the smallest valid `operating-loop` tactical core with:

- typed domain contracts,
- one authoritative store,
- one repository boundary,
- hard invariants,
- diagnostics,
- and tests.

At the end of this phase, the codebase should be able to answer:

- what is `Main`,
- what is `Support`,
- what is `Admin`,
- what is `Parked`,
- whether WIP is valid,
- and whether the tactical state is structurally sound.

## Phase 1 Must Not Do

Do not do any of the following in this phase:

- redesign `kanban`
- redesign `time-clustering`
- add tactical AI tools
- change backend DTOs for `Task`, `Goal`, or `Story`
- add polished operating-loop UX flows
- move tactical meaning into `priority`, `status`, or tags

If one of those becomes necessary to continue, Phase 1 has drifted out of scope.

## Recommended File Set

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

## Execution Checklist

### A. Create Feature Skeleton

- [ ] Create `src/features/operating-loop/`
  Detail:
  Create a dedicated feature root instead of placing tactical logic into `canvas`, `kanban`, or `time-clustering`.

- [ ] Create subfolders `domain/`, `state/`, and `data/`
  Detail:
  Match the repository's existing feature-layer pattern so the operating loop has a clean internal architecture from the start.

- [ ] Add `src/features/operating-loop/index.ts`
  Detail:
  Re-export only the public surface needed for later integration. Keep internal file churn hidden.

### B. Define Domain Types

- [ ] Create `src/features/operating-loop/domain/types.ts`
  Detail:
  This file becomes the typed contract for tactical state. It must not import UI code or persistence code.

- [ ] Add `OperatingRole`
  Detail:
  Define the allowed role values:
  `main`, `support`, `admin`, `parked`.

- [ ] Add `ContourSourceRef`
  Detail:
  Provide a typed reference from tactical contours to strategic planning entities.
  It should support at least:
  `goal`, `story`, `task`, `mixed`.

- [ ] Add `ContourRecord`
  Detail:
  This should represent one tactical contour.
  Include at minimum:
  `id`, `title`, `role`, `source`, `summary`, `active`, `archived`.

- [ ] Add `RealityContactRecord`
  Detail:
  Even if full reality-contact behavior is a later phase, the snapshot shape should already have a place for it so the model does not need a disruptive redesign later.

- [ ] Add `AccessRuleRecord`
  Detail:
  Same principle as reality contact: define the type now even if UI comes later.

- [ ] Add `RecoveryRecord`
  Detail:
  Define the tactical recovery object now so future recovery work extends the existing snapshot instead of reshaping it.

- [ ] Add `DayPlanBlockRecord` and `DayPlanRecord`
  Detail:
  The day planner will be a later phase, but its type surface should already be compatible with the operating-loop snapshot.

- [ ] Add `OperatingLoopSnapshot`
  Detail:
  This is the main tactical snapshot. Include:
  `version`, `canvasId`, `cycle`, `contours`, `realityContacts`, `accessRules`, `dayPlan`, `recovery`, `diagnostics`, `updatedAtIso`.

### C. Define Domain Rules And Invariants

- [ ] Create `src/features/operating-loop/domain/rules.ts`
  Detail:
  Keep this file pure. No storage, no DOM, no side effects.

- [ ] Add helper to create a default snapshot
  Detail:
  Must return a valid empty tactical state for a given `canvasId`.

- [ ] Add helper to collect role groups from `contours`
  Detail:
  Normalize role lookups so later store logic does not reimplement the same scans repeatedly.

- [ ] Add invariant check: at most one `main`
  Detail:
  If more than one contour is `main`, the tactical state must be treated as invalid.

- [ ] Add invariant check: `cycle.mainContourId` matches exactly one contour
  Detail:
  Prevent split-brain state where cycle metadata and contour role assignments disagree.

- [ ] Add invariant check: parked contours do not count as active fronts
  Detail:
  Parked must remain intentionally deactivated.

- [ ] Add invariant check: support count does not exceed MVP limit
  Detail:
  Use the current MVP rule:
  maximum `2` active support contours.

- [ ] Add diagnostic builder for `activeFrontCount`
  Detail:
  This should be derived, not manually stored in multiple places.

- [ ] Add diagnostic builder for `wipViolation`
  Detail:
  WIP should become a machine-checkable fact, not just a feeling.

- [ ] Add diagnostic builder for `missingRealityContactContourIds`
  Detail:
  Even if enforcement is soft at first, the snapshot should already identify structurally weak `Main` contours.

- [ ] Add one normalization function or validation entrypoint
  Detail:
  Choose one clear pattern:
  either `validateSnapshot(snapshot)` returning issues,
  or `normalizeSnapshot(snapshot)` returning a corrected result plus diagnostics.
  Do not mix two competing patterns in Phase 1.

### D. Define Persistence Boundary

- [ ] Create `src/features/operating-loop/data/OperatingLoopRepository.ts`
  Detail:
  Define the repository interface with:
  `load(canvasId)`, `save(snapshot)`, `clear(canvasId)`.

- [ ] Choose a repository result pattern
  Detail:
  Match existing feature style if practical:
  support sync or async results only if there is a reason.
  Prefer a simple async boundary if no strong reason exists to support both.

- [ ] Keep repository contract tactical-only
  Detail:
  The repository should persist operating-loop state, not strategic entities, not projections, and not UI-only settings.

### E. Implement Local-First Repository

- [ ] Create `src/features/operating-loop/data/LocalStorageOperatingLoopRepository.ts`
  Detail:
  This is the Phase 1 concrete repository. It should be scoped by `canvasId`.

- [ ] Define one storage key strategy
  Detail:
  Use a predictable namespaced key, for example something equivalent to:
  `operating-loop:<canvasId>`
  or a user-scoped variant if a shared helper exists.

- [ ] Add safe `load()` behavior
  Detail:
  Invalid payloads must not crash the app.
  Return `null` or default state on parse failure according to the chosen contract.

- [ ] Add safe `save()` behavior
  Detail:
  Save only tactical snapshot content, not UI projections or derived runtime-only objects.

- [ ] Add `clear()` behavior
  Detail:
  Clearing should remove only operating-loop state for the specific canvas.

- [ ] Decide whether to include storage envelope metadata
  Detail:
  If envelope metadata is used, keep it minimal:
  `updatedAt`, optional `expiresAt`, optional `version`.

### F. Implement Tactical Store

- [ ] Create `src/features/operating-loop/state/OperatingLoopStore.ts`
  Detail:
  This store becomes the one tactical owner.
  Do not let later modules reconstruct tactical meaning outside of it.

- [ ] Load initial snapshot from repository
  Detail:
  On boot, hydrate from repository or fall back to default snapshot.

- [ ] Expose `state$`
  Detail:
  Follow the reactive pattern already used in feature-level stores such as `kanban` and `time-clustering`.

- [ ] Expose `getSnapshot()`
  Detail:
  This makes store state readable synchronously by projections and later tool adapters.

- [ ] Add typed transition: `setMainContour`
  Detail:
  It should update contour roles and cycle metadata in one place.

- [ ] Add typed transition: `setContourRole`
  Detail:
  Needed for `support`, `admin`, and `parked` handling.

- [ ] Add typed transition: `parkContour`
  Detail:
  Parking should be explicit, not a side effect hidden inside another transition.

- [ ] Add typed transition: `activateContour`
  Detail:
  This should re-enter a contour into active tactical space deliberately.

- [ ] Recompute diagnostics after every state-changing transition
  Detail:
  Diagnostics must be derived centrally and consistently.

- [ ] Persist snapshot after valid state transitions
  Detail:
  Repository writes should happen as side effects of successful tactical transitions.

- [ ] Keep store phase-limited
  Detail:
  Do not add Phase 3-7 logic prematurely.
  The store may contain the state slots for later phases, but not the behavioral complexity yet.

### G. Add Tests For Repository

- [ ] Create `src/features/operating-loop/data/LocalStorageOperatingLoopRepository.test.ts`
  Detail:
  Cover storage behavior only. Do not mix repository and store behavior in the same tests.

- [ ] Test roundtrip save/load
  Detail:
  Saving a valid snapshot and loading it back should preserve tactical state.

- [ ] Test invalid payload handling
  Detail:
  Malformed local storage content must fail safely.

- [ ] Test `clear()` behavior
  Detail:
  Clearing one canvas should not imply clearing unrelated state.

### H. Add Tests For Store And Rules

- [ ] Create `src/features/operating-loop/state/OperatingLoopStore.test.ts`
  Detail:
  Focus on tactical behavior, not markup or future UI.

- [ ] Test default snapshot creation
  Detail:
  The store must boot into a valid empty tactical state.

- [ ] Test single-main enforcement
  Detail:
  Promoting one contour to `main` must leave the store with only one `main`.

- [ ] Test support overflow detection
  Detail:
  Exceeding the MVP support limit should surface `wipViolation` or the corresponding validation result.

- [ ] Test parked contour exclusion from active fronts
  Detail:
  Parking must actually reduce active-front pressure.

- [ ] Test diagnostics recomputation after transitions
  Detail:
  The store should not retain stale WIP or role diagnostics after state changes.

- [ ] Test repository persistence path through store
  Detail:
  Confirm that valid transitions trigger persistence and invalid states do not silently pass.

### I. Minimal Integration Preparation

- [ ] Confirm no current module becomes tactical owner accidentally
  Detail:
  `canvas`, `kanban`, `time-clustering`, and AI should remain untouched as tactical owners in Phase 1.

- [ ] Add only minimal public exports in `src/features/operating-loop/index.ts`
  Detail:
  Export the store, repository interfaces, and core types needed for later phases.

- [ ] Leave integration hooks optional
  Detail:
  If `RuntimeHost` needs a placeholder import or future seam, keep it minimal and non-user-facing.

## Phase 1 Deliverable Matrix

| Area | Must exist by the end of Phase 1 |
|---|---|
| Feature boundary | Dedicated `src/features/operating-loop/` root |
| Domain | Typed tactical snapshot and contour model |
| Rules | One-main, support-limit, parked-exclusion, WIP diagnostics |
| Store | One authoritative tactical store with typed transitions |
| Persistence | Local-first repository scoped by canvas |
| Tests | Repository tests and store/invariant tests |
| UI | No required polished UI yet |
| Integrations | No mandatory kanban/time-clustering/AI integration yet |

## Phase 1 Exit Criteria

- [ ] The feature root exists and compiles cleanly
- [ ] `OperatingLoopSnapshot` is typed and stable enough for later phases
- [ ] One tactical store owns the operating-loop state
- [ ] One local repository can persist tactical state by canvas
- [ ] One-main invariant is enforced
- [ ] Support overflow is machine-detectable
- [ ] Parked contours do not count as active fronts
- [ ] Diagnostics are recomputed consistently
- [ ] Store and repository tests cover the critical tactical rules
- [ ] No tactical meaning was pushed into task DTOs, kanban buckets, or time-clustering blocks

## Red Flags

If any of the following happens during implementation, stop and redesign before continuing:

- `kanban` becomes the hidden owner of active-front logic
- `time-clustering` starts inventing tactical meaning
- `Task.priority` begins carrying operating role semantics
- `Task.status` begins carrying contour state semantics
- multiple stores start owning the same tactical truth
- repository format becomes UI-driven instead of tactical-state-driven

## Recommended Order Inside Phase 1

Use this implementation sequence:

1. define domain types
2. define pure rules and diagnostics
3. define repository interface
4. implement local repository
5. implement store
6. add tests
7. add only minimal exports

This keeps the core machine coherent before any user-facing layer starts depending on it.
