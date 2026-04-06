# Canvas Changes History Implementation Blueprint

## Status

- Classification: `redesign-required`
- Scope: `majom-canvas` + `platform-django`
- Goal: durable canvas version history with safe restore and protection against partial-load overwrite

## Problem

The current canvas persistence model is split across:

- canvas metadata
- canvas element positions
- canvas relations
- element domain updates

Frontend save currently derives deletions from the active scene. That is unsafe when the scene is only partially hydrated or hydration failed. In that case, missing elements in memory can be interpreted as intentional deletions and persisted as such.

This makes the following user-visible failures possible:

1. User accidentally clears the canvas and reloads, losing prior work.
2. Canvas loads only partially, user edits the visible subset, saves, and unintentionally overwrites the full canvas with an incomplete state.
3. Restore after crash/reload depends only on a single local recovery draft instead of a durable version history.

## Existing State

### Frontend

- In-session undo/redo exists via `HistoryService`.
- Local unsaved recovery exists via `CanvasDraftRepository`.
- Canvas loading is progressive: `layout-ready -> elements-partial-ready -> elements-ready`.
- Save persists positions and relations separately.

### Backend

- Canvas state is stored as `Canvas`, `CanvasElementPosition`, and `Relation`.
- No atomic canvas snapshot endpoint exists.
- No canvas revision field exists.
- No version history table exists.
- No restore-to-version endpoint exists.

## Decision

Adopt a snapshot-first architecture for canvas persistence and versioning.

The canonical persisted representation of a canvas becomes a normalized `CanvasSnapshot`. Version history stores immutable copies of that snapshot. Save and restore operate at the snapshot level, not through ad hoc frontend replay of position and relation mutations.

## Architecture

### State Layers

Keep these three concerns separate:

1. `Undo/redo`
   - Session-scoped.
   - In-memory only.
   - Fast local interaction primitive.

2. `Local recovery draft`
   - Client-scoped.
   - Used for unsaved edits after reload/crash/navigation.
   - Not a substitute for durable history.

3. `Changes history`
   - Server-backed.
   - Durable.
   - Used for restore to earlier versions and protection against destructive save flows.

### Source of Truth

The server owns:

- current canvas snapshot
- current canvas revision
- version history

The client owns:

- current editing session state
- local draft until it is either saved or discarded

## Canonical Snapshot Shape

```json
{
  "canvas": {
    "id": "uuid",
    "name": "Main canvas",
    "status": "active",
    "meta": {}
  },
  "revision": 12,
  "nodes": [
    {
      "kind": "task",
      "id": "task-local-id",
      "uuid": "task-uuid",
      "backendId": 123,
      "x": 120,
      "y": 80,
      "title": "Task",
      "description": "",
      "status": "draft",
      "priority": "medium",
      "dueDate": null
    }
  ],
  "connections": [
    {
      "id": "connection-id",
      "fromId": "from-node-id-or-uuid",
      "toId": "to-node-id-or-uuid",
      "lineType": "solid",
      "relationType": "parent_child"
    }
  ],
  "focusedElementId": null,
  "highlightedElementIds": []
}
```

## Backend Design

### Model Changes

Extend `Canvas`:

```python
class Canvas(models.Model):
    revision = models.PositiveBigIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)
```

Add durable history:

```python
class CanvasSnapshotVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    canvas = models.ForeignKey(Canvas, on_delete=models.CASCADE, related_name='versions')
    revision = models.PositiveBigIntegerField()
    source = models.CharField(max_length=32)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    snapshot = models.JSONField()
    summary = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
```

Recommended indexes:

- `(canvas, -created_at)`
- `(canvas, -revision)`
- optional `(canvas, source, -created_at)`

### Service Layer

Create a dedicated service module, for example:

- `canvas/services/snapshot_service.py`

Primary responsibilities:

1. `serialize_canvas_snapshot(canvas, user) -> dict`
2. `replace_canvas_snapshot(canvas, user, snapshot, base_revision, source) -> dict`
3. `create_canvas_snapshot_version(canvas, user, snapshot, source, revision) -> CanvasSnapshotVersion`
4. `list_canvas_versions(canvas) -> queryset`
5. `restore_canvas_version(canvas, version, user) -> dict`

### Replace Semantics

`replace_canvas_snapshot` must run in `transaction.atomic()`.

Flow:

1. Lock the canvas row with `select_for_update()`.
2. Compare `base_revision` against `canvas.revision`.
3. If mismatch, return `409 Conflict`.
4. Validate every referenced node and relation target.
5. Replace persisted canvas positions.
6. Replace persisted canvas relations.
7. Update canvas metadata/name if present.
8. Increment revision.
9. Serialize normalized current snapshot.
10. Create history entry.
11. Return normalized snapshot.

### Restore Semantics

Restore is not a pointer rollback. Restore is a new write operation.

Flow:

1. Load selected historical snapshot.
2. Create a safety version for the current canvas state with source `pre-restore`.
3. Replace current state with selected historical snapshot.
4. Increment revision.
5. Create a new version with source `restore`.
6. Return the restored current snapshot.

This preserves full auditability and allows the restore itself to be undone via history.

### API Contract

Add new endpoints:

- `GET /canvas/{id}/snapshot/`
- `PUT /canvas/{id}/snapshot/`
- `GET /canvas/{id}/history/`
- `GET /canvas/{id}/history/{version_id}/`
- `POST /canvas/{id}/history/{version_id}/restore/`

Recommended responses:

`GET /snapshot/`

```json
{
  "snapshot": { "...": "..." }
}
```

`PUT /snapshot/`

Request:

```json
{
  "baseRevision": 12,
  "source": "manual-save",
  "snapshot": { "...": "..." }
}
```

Conflict response:

```json
{
  "detail": "Canvas revision conflict.",
  "currentRevision": 13
}
```

`GET /history/`

```json
{
  "items": [
    {
      "id": "version-uuid",
      "revision": 12,
      "source": "autosave",
      "createdAt": "2026-04-06T12:32:10.000Z",
      "summary": {
        "nodeCount": 128,
        "connectionCount": 41,
        "taskCount": 80,
        "storyCount": 18,
        "goalCount": 12,
        "habitCount": 18
      }
    }
  ]
}
```

`POST /history/{version_id}/restore/`

Request:

```json
{
  "source": "restore"
}
```

Response:

```json
{
  "snapshot": { "...": "..." },
  "restoredFromVersionId": "version-uuid"
}
```

### Transitional Compatibility

Keep existing endpoints during rollout:

- `GET /canvas/{id}/positions/`
- `PATCH /canvas/{id}/positions/bulk/`
- `GET /canvas/{id}/relations/`
- batch relation endpoints

They remain compatibility endpoints until frontend migration finishes.

After migration they should be treated as implementation detail or deprecated.

## Frontend Design

### New Frontend Boundaries

Add:

- `CanvasSnapshotApiService`
- `CanvasHistoryApiService`
- `CanvasSnapshotSerializer`

Responsibilities:

`CanvasSnapshotSerializer`

- capture current scene into normalized snapshot
- materialize snapshot into scene state

`CanvasSnapshotApiService`

- load snapshot
- save snapshot with `baseRevision`
- restore snapshot result

`CanvasHistoryApiService`

- list versions
- fetch version details
- restore selected version

### CanvasApp Changes

Replace split save/load flow with snapshot flow.

Current weak flow:

- load positions
- progressively hydrate elements
- load relations separately
- save positions and relations separately

Target flow:

- load one current snapshot
- materialize snapshot into scene
- save one full snapshot

### Load Safety

Until snapshot migration is complete, add a hard frontend guard:

- disable manual save when `loadPhase !== 'elements-ready'`
- skip autosave when hydration is still active
- block destructive actions when hydration failed or is incomplete

This guard is mandatory even before the full backend redesign lands.

### History UI

Add `Version history` entry to canvas menu.

Suggested user-facing behavior:

- list historical versions
- show `Autosaved`, `Manual save`, `Restored version`, `Before restore`, `Before clear`
- show timestamp and short summary
- allow `Restore`

Optional later enhancements:

- preview selected version
- diff summary against current version
- pin/manual checkpoint creation

### Local Recovery Integration

Keep existing local draft recovery.

Add one integration point:

- if a local draft exists on load, show recovery modal first
- allow:
  - `Restore local changes`
  - `Keep server version`
  - `Open version history`

Local recovery stays client-scoped. History stays server-scoped.

## Summary Generation

Each history version should include a lightweight summary:

- `nodeCount`
- `connectionCount`
- `taskCount`
- `storyCount`
- `goalCount`
- `habitCount`
- `hasFocus`
- `highlightedCount`

This enables a useful history list without loading full snapshots for every row.

## Rollout Plan

### Phase 1: Immediate Safety

Frontend only:

1. Block manual save until `elements-ready`.
2. Block autosave during hydration.
3. Block destructive actions when hydration is incomplete or failed.
4. Surface loading failure as recoverable state.

### Phase 2: Backend Snapshot Foundation

Backend:

1. Add `Canvas.revision`.
2. Add `Canvas.updated_at`.
3. Implement `GET /canvas/{id}/snapshot/`.
4. Implement `PUT /canvas/{id}/snapshot/` with transactional replace and conflict check.

Frontend:

5. Add `CanvasSnapshotApiService`.
6. Add `CanvasSnapshotSerializer`.
7. Switch canvas save/load to snapshot endpoints.

### Phase 3: Durable History

Backend:

1. Add `CanvasSnapshotVersion`.
2. Implement list/detail/restore history endpoints.
3. Create history entry on every successful snapshot save.

Frontend:

4. Add `Version history` UI.
5. Add restore flow.

### Phase 4: Cleanup

1. Review need for old split endpoints.
2. Deprecate direct frontend dependence on split save/load.
3. Add retention policy and cleanup command.
4. Add diff/preview if still needed.

## Implementation Workstreams

### Workstream A: Immediate Safety Guard

Goal:

- Prevent partial hydration from being persisted as intentional deletion.

Frontend changes:

- extend save enablement with load-state awareness
- skip autosave during any hydration phase
- block destructive actions while hydration is incomplete

Likely files:

- `src/features/canvas/CanvasApp.ts`
- `src/features/canvas/ui/components/SaveButton.ts`
- `src/features/canvas/ui/components/CanvasMenu.ts`
- optional modal/loading components if a blocked state needs user messaging

Expected result:

- no manual or automatic save is possible until canvas reaches `elements-ready`

### Workstream B: Backend Snapshot Foundation

Goal:

- Introduce a canonical server representation for current canvas state.

Backend changes:

- add `revision` and `updated_at` to `Canvas`
- add snapshot serializers
- add snapshot service
- add `GET /canvas/{id}/snapshot/`
- add `PUT /canvas/{id}/snapshot/`

Likely files:

- `platform-django/canvas/models.py`
- `platform-django/canvas/views.py`
- new `platform-django/canvas/services/snapshot_service.py`
- new `platform-django/canvas/snapshot_serializers.py`
- `platform-django/canvas/urls.py`
- `platform-django/canvas/tests.py`

Expected result:

- frontend can read and write the current canvas through one atomic snapshot contract

### Workstream C: Frontend Snapshot Migration

Goal:

- Make frontend current-state persistence use the snapshot contract.

Frontend changes:

- add API adapters for snapshot endpoints
- add serializer/materializer for snapshot payloads
- replace split load path with snapshot load
- replace split save path with snapshot save

Likely files:

- `src/features/canvas/CanvasApp.ts`
- `src/features/canvas/drafts/CanvasDraftSerializer.ts`
- new `src/features/canvas/core/services/CanvasSnapshotSerializer.ts`
- new `src/features/canvas/core/services/CanvasHistoryApiService.ts`
- new `src/features/canvas/core/services/CanvasSnapshotApiService.ts`
- `src/majom-wrapper/data-access/canvas-api-service.ts`
- relevant tests under `src/features/canvas/`

Expected result:

- current canvas load/save no longer depends on frontend diffing positions and relations as separate persistence contracts

### Workstream D: Durable History

Goal:

- Persist immutable canvas versions and expose restore semantics.

Backend changes:

- add `CanvasSnapshotVersion`
- add history list/detail/restore endpoints
- create version rows on successful save and restore

Frontend changes:

- add history UI
- list versions
- trigger restore
- refresh current snapshot after restore

Likely frontend files:

- `src/features/canvas/ui/components/CanvasMenu.ts`
- new `src/features/canvas/ui/components/CanvasVersionHistoryModal.ts`
- `src/features/canvas/CanvasApp.ts`

Likely backend files:

- `platform-django/canvas/models.py`
- `platform-django/canvas/views.py`
- `platform-django/canvas/tests.py`
- `platform-django/canvas/services/snapshot_service.py`
- history serializers

Expected result:

- user can restore the canvas to any stored version without losing current state auditability

## Execution Order

Recommended implementation order:

1. Workstream A
2. Workstream B
3. Workstream C
4. Workstream D

Reasoning:

- Workstream A removes the most dangerous failure mode immediately.
- Workstream B establishes the backend contract needed for the real architectural shift.
- Workstream C migrates the active app onto the new contract.
- Workstream D adds user-facing history on top of the stabilized snapshot model.

## Frontend File Map

### Primary application flow

- `src/features/canvas/CanvasApp.ts`
  - load orchestration
  - save orchestration
  - autosave guards
  - restore refresh flow

### Existing reusable serialization boundary

- `src/features/canvas/drafts/CanvasDraftSerializer.ts`
  - useful reference for snapshot shape
  - should not remain the only serializer boundary once server snapshots exist

### Existing client recovery boundary

- `src/features/canvas/drafts/CanvasDraftRepository.ts`
- `src/features/canvas/drafts/LocalStorageCanvasDraftRepository.ts`
- `src/features/canvas/core/services/CanvasDraftRecoveryCoordinator.ts`

### Existing save UI boundary

- `src/features/canvas/ui/components/SaveButton.ts`
- `src/features/canvas/ui/components/CanvasMenu.ts`

### Existing backend adapter boundary

- `src/majom-wrapper/data-access/canvas-api-service.ts`
- `src/majom-wrapper/services/CanvasDataService.ts`

## Backend File Map

### Current persistence models

- `platform-django/canvas/models.py`

### Current endpoints

- `platform-django/canvas/views.py`
- `platform-django/canvas/urls.py`

### Existing serializer boundaries

- `platform-django/canvas/serializers.py`
- `platform-django/canvas/relation_serializers.py`

### Existing tests

- `platform-django/canvas/tests.py`

## Suggested PR Split

If implemented as separate PRs, use this order:

1. `canvas-frontend-save-guard`
2. `canvas-backend-snapshot-foundation`
3. `canvas-frontend-snapshot-migration`
4. `canvas-backend-history-and-restore`
5. `canvas-frontend-history-ui`

This keeps dangerous behavior addressed first while still converging toward the target architecture.

## Implementation-Ready Questions

These should be decided before coding begins, not during the middle of a patch:

1. Whether snapshot payload `id` references should use local scene ids, uuids, or both.
2. Whether canvas title/meta updates are included in `PUT snapshot` or remain separate patch endpoints during migration.
3. Whether every autosave creates a version row, or whether autosave history is throttled/coalesced.
4. Whether restore should always create `pre-restore` and `restore` versions, or only one restore result version.
5. Whether current history UI needs preview in v1, or restore-only is enough.

## Testing Strategy

### Backend

Add tests for:

- snapshot serialization for current canvas state
- transactional replace
- revision conflict on stale `baseRevision`
- restore from historical version
- history version creation on save
- history version creation on restore
- permission checks for snapshot/history endpoints

### Frontend

Add tests for:

- save disabled while load phase is not `elements-ready`
- autosave skipped during hydration
- snapshot materialization into scene
- history list rendering
- restore action refreshes current canvas
- local draft recovery + history coexistence

## Open Design Constraints

These must be resolved cleanly during implementation:

1. Task-story and story-goal relationships
   - Decide which snapshot fields are canonical.
   - Keep backend replace flow consistent with domain relations.

2. Relation normalization
   - Ensure snapshot relation direction matches persisted normalization rules.

3. Snapshot size
   - Accept JSON payload size for canvas scale targets.
   - Consider compression later only if needed.

4. History retention
   - Keep enough versions for recovery without unbounded growth.

## Non-Goals

This blueprint does not require:

- replacing in-session undo/redo
- introducing operational transforms or CRDT collaboration
- storing fine-grained patch history
- deprecating local draft recovery

## Implementation Entry Points

### Frontend likely touch points

- `src/features/canvas/CanvasApp.ts`
- `src/features/canvas/drafts/CanvasDraftSerializer.ts`
- `src/features/canvas/ui/components/CanvasMenu.ts`
- `src/features/canvas/ui/components/SaveButton.ts`
- new snapshot/history services under `src/features/canvas/core/services/`
- `src/majom-wrapper/data-access/`

### Backend likely touch points

- `canvas/models.py`
- `canvas/views.py`
- new `canvas/services/`
- new snapshot serializers
- `canvas/tests.py`

## Done Criteria

The feature is complete when all of the following are true:

1. User can open version history and restore a previous version.
2. Restore creates a new current version instead of destroying audit trail.
3. Save cannot overwrite the server with a partially loaded scene.
4. Stale clients get a revision conflict instead of silently overwriting newer state.
5. Existing local recovery still works for unsaved client-only edits.
