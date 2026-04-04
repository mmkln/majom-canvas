# Canvas-Core UI Rules

## Scope

- This file covers UI work under `src/features/canvas-core/ui`.
- `canvas-core/ui` owns engine-level canvas UI mechanics and reusable runtime chrome, not product-specific planning semantics.

## Boundary

- Keep `canvas-core/ui` focused on generic canvas runtime behavior:
  - engine-level overlays and controls
  - generic selection/viewport/runtime interaction mechanics
  - reusable HUD integration that does not depend on business meaning
- Do not add new product/domain-specific entity UI here.
- If a UI change needs to know what a `goal`, `story`, `task`, or other product entity means, the owning implementation should live in `src/features/canvas/ui` or in a feature adapter outside `canvas-core`.

## Working Rule

- Before editing `canvas-core/ui`, ask: `Would this still make sense for a generic canvas engine with different entity types?`
- If the answer is no, the change belongs outside `canvas-core/ui`.
