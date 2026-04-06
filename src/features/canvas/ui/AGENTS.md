# Canvas UI Rules

## Scope

- This file stores detailed work scenarios for shared canvas UI behavior under `src/features/canvas/ui`.
- `src/features/canvas` is the active product canvas runtime by default. When the task affects current user-visible canvas behavior, start here unless the user explicitly redirects you elsewhere.
- If the user says `canvas` without explicitly naming `canvas-core`, interpret that as `src/features/canvas` only.
- Do not edit `src/features/canvas-core` for a `canvas` request unless the user explicitly says the changes belong in `canvas-core`.
- If the task touches app-level locale/runtime reactivity in mounted canvas UI roots, read `src/app-runtime/AGENTS.md` first.
- `src/features/canvas` is the product-facing layer that owns concrete planning entities and their UI semantics.
- Do not move product canvas workflow logic into `canvas-core` for reuse. If code should be shared with `canvas-core`, extract a clean leaf module instead of creating a `canvas -> canvas-core` dependency on mixed-responsibility code.
- If the task starts drifting into generic engine/runtime concerns, stop and check `src/features/canvas-core/AGENTS.md`.

## Scenario: Extend Context Menu

- Use this scenario when the task adds, removes, or restructures `ContextMenu` sections, item types, or item rendering behavior.

### Canonical Files

- `src/features/canvas/ui/ContextMenu.ts` owns the context-menu item model, section building, and rendering flow.
- `src/features/canvas/ui/primitives/index.ts` is the canvas re-export layer for HUD primitives.
- `src/ui-lib/src/hud` owns shared visual primitives that are reusable beyond one feature.

### Workflow

1. Start in `src/features/canvas/ui/ContextMenu.ts` and identify whether the change is a new item type, a new section, or a change to an existing item renderer.
2. Keep `ContextMenu` visually independent from `SelectionActionMenu`; do not reuse its feature-level buttons or menu row UI.
3. Reuse commands, services, state, and other non-visual logic across menus when appropriate.
4. If the new behavior needs a reusable visual primitive for context menus, add it in `src/ui-lib/src/hud` and re-export it through `src/features/canvas/ui/primitives/index.ts`.
5. Extend the `ContextMenuItem` union and add a dedicated renderer/helper in `ContextMenu.ts` instead of inlining ad-hoc DOM branches in section builders.
6. Keep destructive or confirm-heavy actions explicit; compact icon rows are best for familiar, low-ambiguity actions.
7. For selection-scoped actions, treat the right-clicked target as the anchor and exclude it from the selected peer set instead of disabling the whole selection flow when the target is already selected.

### Testing

- Do not add tests for purely presentational menu layout changes.
- Verify with focused linting and, when possible, type-check the changed files. If the repo has unrelated global type errors, say so explicitly.
