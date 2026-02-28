# Module Architecture (Preparation)

## Scope
- `canvas` keeps all current domain logic and UI behavior.
- `kanban` is isolated and uses only API/auth infrastructure.
- `shared` contains only infrastructure (`auth`, HTTP client, boot/shell wiring).

## Boundaries
- Canvas-only:
  - `Task/Story/Goal/Relation` models.
  - `history/commands`, scene, canvas interaction/rendering.
  - Canvas UI events and lifecycle events.
- Kanban-only:
  - Kanban board state, columns/cards flow, Kanban UI components.
  - No imports from canvas module.
- Shared:
  - Session/auth flow.
  - API services (`tasks/stories/goals/...`).
  - Workspace shell that selects active view.

## Target Layout
- `src/features/canvas/*` for current canvas app internals.
- `src/features/kanban/*` for new kanban module.
- `src/features/shell/*` for module contract and runtime switching.

## Runtime Rule
- Shell mounts one active module at a time (`canvas`, `kanban`, later `calendar`).
- Cross-module communication is not allowed except through shared API/auth/shell state.
