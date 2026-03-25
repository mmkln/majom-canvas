# Time Clustering

## Status

- State: discovery → implementation-ready (Stage 1 frontend)
- Started: 2026-03-25
- Last updated: 2026-03-25
- Document type: living product + architecture spec

## Working Name

- Product-facing name: `Time Clustering`
- Technical module id (proposed): `time-clustering`

## Why This Feature Exists

`Time Clustering` addresses a day-planning gap: users can have prioritized work but still overload one category and neglect others when time boundaries are implicit.

The feature introduces explicit day-level time clusters (focused time zones) so users can protect capacity for meaningful categories and keep a balanced daily rhythm.

## Stage 1 Scope (Confirmed)

Stage 1 is intentionally narrow and frontend-only:

- No backend APIs, no server persistence.
- Local persistence only, primary key: `time_clusters_v1`.
- User can create/edit/delete clusters and duplicate a full day as a one-off action.
- Day + week visualization is in scope.
- AI suggestions are **action-based** (structured suggestion actions + explicit Apply), not text-only advice.
- **No assignment of `Task`/`Habit` into clusters in Stage 1.**
- Resource Planner integration is conceptual only in Stage 1 (contract-aligned boundaries, no planner execution).

### Stage 1 Duplication Policy (Confirmed)

- Supported: one-off “copy full day” duplication.
- Collision policy: keep-both + warning (no destructive overwrite).
- Recurrence rules (e.g., weekday templates) are deferred.

## Product Intent

- Split each day into meaningful time clusters.
- Keep balance visible across work, health, recovery, social, learning, and similar categories.
- Provide clear day/week structure first, before item routing and planner-level optimization.
- Establish an architecture-compatible base for future Resource Planner integration.

## Architectural Alignment (UI + Reactivity)

This section aligns Time Clustering with `docs/UI-ARCHITECTURE.md` and module boundary rules.

### 1) Domain Layer

Owns core business meaning (framework-agnostic types/rules):

- `TimeCluster` (id, day, start/end, category label, optional metadata).
- `DayClusterPlan` (clusters for a day + warnings/metadata).
- `WeekClusterPlan` (projection/aggregation for week view).
- `ClusterDuplicationResult` (created entries + collision warnings).
- Validation rules:
  - cluster time ranges are valid,
  - collisions are detected and preserved (keep-both in Stage 1),
  - overlap semantics are recorded but not auto-resolved by backend logic in Stage 1.

Domain layer does **not** know about DOM, localStorage APIs, or global window events.

### 2) Data Layer

Owns persistence adapters and serialization:

- `TimeClusteringRepository` interface (load/save/snapshot).
- Stage 1 adapter: localStorage-backed repository using `time_clusters_v1`.
- Versioned serialization contract for future migration (`v1` payload).

Data layer responsibilities:

- read/write whole module snapshot,
- return parse/validation failures as typed errors,
- remain replaceable by future API-backed adapter without changing domain contracts.

### 3) State-Application Layer (Module state streams)

Owns authoritative module state transitions via typed module-local streams (RxJS store/subjects):

- `timeClusteringState$` is the **single source of truth** for module domain/view-model state.
- Commands/actions reduce into next snapshot (immutable update style).
- Derived selectors/streams provide day view model, week view model, warnings, and pending AI actions.

Examples of typed actions (Stage 1):

- `initializeFromStorage`
- `createCluster`
- `updateCluster`
- `deleteCluster`
- `duplicateDayOneOff`
- `applyAiSuggestionAction`
- `setActiveDay`
- `setWeekAnchor`

No parallel “same meaning” channel should duplicate these transitions.

### 4) UI Layer

Owns rendering, interaction controls, and local control state:

- Compose from existing UI-lib/HUD primitives where possible.
- Keep long/repeated class composition in typed style maps (not business logic branches).
- Use local imperative control state only for purely presentational toggles (loading/disabled/focus/ARIA sync) where full re-render is unnecessary.
- Day/Week surfaces are feature composites; lifecycle-heavy parts use controller-style mount/unmount cleanup.

UI must dispatch typed module actions rather than mutating persistence directly.

### 5) Module Wiring Layer

Owns runtime integration boundaries:

- Bootstraps repository + state application services + controllers.
- Subscribes UI controllers to module state streams.
- Emits/consumes **global integration events only when crossing module/app-shell boundaries**.
- Avoids global `window` custom events for internal Time Clustering state flow.

This keeps Time Clustering compliant with the hybrid channel model:

- Channel A (module streams): primary for Time Clustering state.
- Channel C (global integration events): boundary-only.
- Channel D (local UI control state): local visual controls.
- Canvas runtime channel stays isolated and is not reused for Time Clustering state.

## Reactive Model (Explicit)

### Source of truth

- Authoritative state: `timeClusteringState$` snapshot stream (module-local typed store).
- Persisted state: repository snapshot (`time_clusters_v1`) as storage mirror, not direct UI source.

### Event/Action model

- UI interactions and AI apply clicks emit typed module actions.
- Actions are validated in domain/application services and reduced to next state.
- Storage writes happen as side effects after successful state transition.

### Snapshot/update flow

1. Module boot loads snapshot from repository.
2. `initializeFromStorage` action hydrates `timeClusteringState$`.
3. UI subscribes to derived selectors (`dayVm$`, `weekVm$`, `warningsVm$`).
4. User or AI-apply triggers typed action.
5. Reducer/service computes next snapshot.
6. UI updates from stream emission.
7. Persistence side effect writes new snapshot.
8. Non-blocking warning/notification channel reports collisions or recoverable issues.

### Side effects boundaries

Pure/stateful split:

- Pure: domain validation, collision detection, snapshot derivation.
- Side effects: localStorage I/O, telemetry/logging, notifications, boundary integration events.

Side effects must not become alternative state-transition channels.

## AI Integration Boundaries (Stage 1)

AI integration in Stage 1 is action-oriented and constrained.

### AI output contract

AI returns structured suggestion actions (not only prose), for example:

- `suggest_create_cluster`
- `suggest_update_cluster`
- `suggest_duplicate_day`
- `suggest_rebalance_day`

Each suggestion action includes:

- intent/type,
- required payload,
- human-readable explanation,
- confidence/priority metadata (optional),
- deterministic apply preview input.

### Apply flow

- Suggestions are displayed with explicit Apply controls.
- Apply dispatches the corresponding typed module action.
- Resulting warnings (e.g., keep-both collisions) are surfaced in UI.
- No autonomous silent write by AI.

### Context access limits (Stage 1)

AI may access:

- current day/week cluster snapshots,
- recent cluster history from `time_clusters_v1`,
- module-level settings relevant to cluster planning.

AI must not assume in Stage 1:

- task/habit assignment data inside clusters,
- Resource Planner sequencing constraints,
- backend-only availability or cross-user shared state.

## Relationship to Resource Planner

Time Clustering and Resource Planner are complementary, not overlapping:

- Resource Planner (future): prioritization, sequencing, feasibility across actionable items.
- Time Clustering: temporal structure and protected day/week boundaries.

Stage 1 preserves this boundary by excluding task assignment and planner execution while still shaping contracts to be integration-ready.

## Views (Stage 1)

### Day View (compact)

- Default focus on current day with quick previous/next day navigation.
- Informational-first structure visibility.
- Editing is available for cluster CRUD, with lightweight interaction surface.

### Fullscreen Week View

- Required planning surface for near-term distribution.
- Supports week-level review and one-off duplication workflows.
- Month mode is explicitly out of Stage 1 scope unless re-approved.

## Non-Goals (Stage 1)

- Backend persistence/sync.
- Task/habit assignment into clusters.
- Planner-grade ordering/optimization.
- Recurrence-driven duplication automation.
- Fully autonomous AI scheduler.

## Minimum Viable Outcome (Stage 1)

A user can:

1. create, edit, and delete daily time clusters,
2. view clusters in day and week contexts,
3. duplicate one day template to another day (one-off),
4. handle collisions with keep-both + warning behavior,
5. receive AI suggestion actions and apply them via explicit controls,
6. restore state from local storage key `time_clusters_v1`.

## Alignment Notes

Updated to align with current UI architecture/reactivity standards:

1. Replaced ambiguous “AI text suggestions” framing with explicit structured suggestion actions + apply flow.
2. Clarified Stage 1 boundary: no backend and no task/habit assignment despite future-domain discussion.
3. Introduced explicit layered architecture: Domain / Data / State-Application / UI / Module wiring.
4. Defined a single authoritative module state stream (`timeClusteringState$`) and removed implicit multi-channel ambiguity.
5. Restricted global events to cross-module boundaries; internal flow uses module-local typed streams.
6. Separated pure state transitions from side effects (storage, notifications, integration events).
7. Kept Resource Planner relationship conceptual and non-duplicative for Stage 1.

## Open Decisions (for implementation)

1. **Overlap assistance policy**: only validate + warn in Stage 1, or add rule-assisted “impossible overlap” hints now?
2. **Suggestion schema versioning**: define `ai_suggestion_action_v1` JSON contract now or in tandem with AI adapter implementation?
3. **Hydration failure UX**: on invalid local payload, choose between auto-reset, user recovery prompt, or read-only fallback.
4. **Warning presentation**: inline day/week markers vs notification feed vs both (without duplicating the same signal path).
5. **Week anchor semantics**: rolling 7-day window vs locale week boundaries as default in fullscreen week mode.
