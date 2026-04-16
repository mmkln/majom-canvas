# Majom Operating Loop Persistence And Integration

## Status

- State: proposal
- Started: 2026-04-15
- Scope: define where operating-loop state lives and how it integrates with current modules

## Why This Document Exists

The current app already has strong module boundaries:

- `canvas`
- `kanban`
- `time-clustering`
- `ai-assistant`

The operating loop should fit into that architecture cleanly.

If its state is spread across existing modules ad hoc, the implementation will become fragile.

## Architecture Decision

Add the operating loop as a tactical layer with its own state and persistence boundary.

Recommended shape:

- `canvas` remains strategic structure,
- `operating-loop` becomes tactical owner,
- `kanban` becomes execution projection,
- `time-clustering` becomes day-architecture projection,
- AI consumes tactical context through tools and capability contracts.

## Recommended File Area

Recommended new feature root:

```text
src/features/operating-loop/
```

Recommended subareas:

```text
src/features/operating-loop/domain/
src/features/operating-loop/state/
src/features/operating-loop/data/
src/features/operating-loop/ui/
src/features/operating-loop/services/
```

## Persistence Decision

Do not store operating-loop meaning inside:

- `PlatformTask.status`
- `PlatformTask.priority`
- current task tags
- kanban columns
- time cluster titles/colors

Those are the wrong persistence owners.

## Recommended Persistence Model

Use a canvas-scoped tactical snapshot.

Recommended boundary:

- one operating-loop snapshot per active canvas

This matches the current product shape because:

- canvas already behaves as a strategic workspace anchor,
- canvas-scoped metadata and snapshot patterns already exist,
- the operating loop depends on the current strategic scope.

## Snapshot Contract

Recommended first contract:

```ts
export type OperatingLoopSnapshotDTO = {
  version: 1;
  canvasId: string;
  data: OperatingLoopSnapshot;
};
```

## Backend Options

### Option A: Canvas meta extension

Store a small tactical payload under `canvas.meta`.

Pros:

- fastest short-term path,
- minimal backend surface change.

Cons:

- weak typing,
- hard to evolve,
- risky if payload grows,
- poor boundary clarity.

Use only for very small bootstrap metadata, not for the full long-term tactical model.

### Option B: Dedicated canvas-scoped snapshot endpoint

Example:

- `GET /canvas/{id}/operating-loop/`
- `PUT /canvas/{id}/operating-loop/`

Pros:

- clean ownership,
- versionable,
- easy to evolve,
- easy to validate independently.

Cons:

- needs backend work.

This is the recommended long-term direction.

### Option C: Local-first temporary repository

Store tactical state in local storage first while the model is being validated.

Pros:

- fast validation,
- isolated experimentation.

Cons:

- no server durability,
- no cross-device consistency,
- weaker product truth.

This is acceptable only for narrow early validation, not as the final architecture.

## Integration With Existing Modules

### Canvas integration

Canvas should provide:

- source planning entities,
- hierarchy and relations,
- current strategic scope.

Canvas should not own:

- role assignments,
- main contour state,
- day architecture,
- recovery state.

### Kanban integration

Kanban should consume:

- active contours,
- tactical allocation,
- WIP limits,
- execution intake rules.

Kanban should stop owning:

- implicit priority logic through date/status-only bucketing.

### Time-clustering integration

Time clustering should consume:

- current main contour,
- support contours,
- access rules,
- recovery state.

Time clustering should project:

- `main`,
- `support`,
- `reactive_admin`,
- `buffer_recovery`

blocks from tactical state.

### AI integration

AI should retrieve tactical context via tools, not infer it from canvas structure alone.

Recommended future tools:

- `get_operating_loop_snapshot`
- `get_main_contour`
- `get_wip_diagnostics`
- `get_day_architecture`
- `get_reality_contact_status`
- `get_recovery_state`

## Rollout Strategy

### Phase 1: Tactical core only

Implement:

- contour roles,
- one main contour,
- WIP diagnostics,
- tactical snapshot storage.

No execution or day rewrite yet.

### Phase 2: Kanban projection

Replace current date/status-first logic with tactical execution projection.

### Phase 3: Day architecture projection

Make time clustering consume tactical state and support protected block semantics.

### Phase 4: Access and reality layer

Add:

- interruption rules,
- reality contact objects,
- validation signals.

### Phase 5: Recovery engine

Add:

- breakdown classification,
- restart set generation,
- tactical recovery UI.

### Phase 6: AI tactical tooling

Extend AI with tactical context and review flows.

## Migration Rules

If introduced incrementally:

- do not break current canvas strategic behavior,
- do not let kanban and time clustering invent tactical meanings independently,
- keep one migration owner for tactical persistence,
- prefer additive rollout before replacing current projections.

## Compatibility Guidance

The operating loop should coexist with current planning entities.

That means:

- `Goal`, `Story`, and `Task` remain useful,
- tactical state references them,
- tactical state does not replace them.

This keeps the repository evolvable without a full planning rewrite.

## Practical Recommendation

For implementation planning, the safest first delivery is:

1. create the `operating-loop` feature module,
2. define typed snapshot and store,
3. add temporary local repository if backend is not ready,
4. wire canvas-derived contour sources,
5. project tactical state into kanban and time clustering later.

That gives the app one tactical owner without forcing immediate rewrites of every surface.
