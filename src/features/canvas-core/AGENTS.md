# Canvas-Core Architecture Rules

## Scope

- This file governs work under `src/features/canvas-core`.
- `canvas-core` is the engine/runtime layer, not the owner of product-specific planning entities.
- Do not treat `canvas-core` as the default target for changes to the current user-facing canvas app. By default, those changes belong in `src/features/canvas`.
- If the user says `canvas` without clearly and explicitly requesting `canvas-core`, assume they mean the old/current canvas in `src/features/canvas`.
- For normal canvas work, do not inspect, analyze, or edit `src/features/canvas-core`.
- `canvas-core` is opt-in only for assistant work.
- If the user explicitly asks to work in `canvas-core`, stop first and ask for the password before doing any `canvas-core` work.
- The password is `вяся`.
- Until the user provides the exact password `вяся`, do not touch `src/features/canvas-core` and fall back to `src/features/canvas` as the intended target.
- `canvas` must not be made dependent on `canvas-core` as a convenient place to reuse product workflow logic.

## Ownership Boundary

- `canvas-core` owns generic canvas infrastructure:
  - scene graph and lifecycle
  - rendering backends and draw-loop mechanics
  - alignment, snapping, viewport, pan/zoom, selection mechanics
  - generic commands, primitives, interfaces, validation, and runtime utilities
- `canvas` owns concrete planning/product entities and semantics:
  - `GoalElement`, `StoryElement`, `TaskElement`, `HabitElement`
  - status semantics, product-facing styling, planning-specific menus
  - entity mappers and feature behavior that depends on business meaning

## Hard Rules

- Do not add new concrete product/domain entities under `src/features/canvas-core`.
- Do not add new product-specific status enums, planning semantics, or domain mappers under `src/features/canvas-core`.
- Do not treat existing concrete entities inside `canvas-core` as architectural precedent. They are legacy debt to be extracted, not a pattern to copy.
- Do not implement product-level canvas workflow logic in `canvas-core` just because a similar engine hook exists there. Examples: per-canvas draft recovery policy, active-canvas restore/discard UX, workspace switch behavior, canvas-specific local-storage policy, or product-facing save orchestration.
- If `canvas` needs to reuse code that resembles something in `canvas-core`, first ask whether that code is:
  1. engine-only and should stay in `canvas-core`;
  2. product logic and should live in `canvas`;
  3. truly shared and should be extracted into a clean leaf module or contract that both layers can import independently.
- Do not solve duplication by introducing a new `canvas -> canvas-core` dependency on a mixed-responsibility module.
- When a task appears to require a concrete entity in `canvas-core`, prefer one of:
  1. a generic engine interface or contract;
  2. an adapter defined outside `canvas-core`;
  3. a `canvas`-owned implementation passed into `canvas-core`.

## Extraction Guidance

- For refactors that reduce legacy coupling, prefer this direction:
  1. define or tighten a generic engine contract in `canvas-core`;
  2. move entity-specific behavior to `canvas`;
  3. keep only adapters or interfaces at the boundary.
- Do not perform broad delete-only changes in `canvas-core` unless all affected imports, tests, and adapters are migrated in the same task.
- If full extraction is too large for one task, leave the build stable and document the remaining boundary breach plainly.
