# Implementation Checklist

## Phase 0: Safety
- [ ] Keep app behavior unchanged during preparation commits.
- [ ] Keep canvas code path as default runtime path.
- [ ] Add import boundary guard for kanban -> canvas.

## Phase 1: Module Contracts
- [ ] Introduce workspace module contract in `features/shell`.
- [ ] Add `CanvasModule` wrapper (no behavior change yet).
- [ ] Add `KanbanModule` placeholder with isolated mount point.

## Phase 2: Canvas Encapsulation
- [ ] Move current canvas app orchestration under `features/canvas`.
- [ ] Keep `history/commands` and current domain models canvas-only.
- [ ] Keep existing canvas events inside canvas module boundary.

## Phase 3: Kanban Implementation
- [ ] Implement kanban state and UI under `features/kanban`.
- [ ] Wire kanban only to shared API/auth.
- [ ] Ensure no kanban imports from canvas internals.

## Phase 4: Shell Switching
- [ ] Add view selector in shell (`canvas`/`kanban`/`calendar`).
- [ ] Mount/unmount modules by active view.
- [ ] Add smoke test for module switching.
