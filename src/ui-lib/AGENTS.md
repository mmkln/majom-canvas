# UI-Lib Rules

## Scope

These rules apply to the entire `src/ui-lib` tree.

## Read First

- `docs/UI-ARCHITECTURE.md`
- root `AGENTS.md`

## Implementation Rules

1. **Primitive-first reuse**
   - Before adding a new primitive, check existing components under:
     - `src/ui-lib/src/components`
     - `src/ui-lib/src/hud`

2. **Single source of truth**
   - If a primitive behavior already exists in HUD, extend/converge instead of creating a parallel implementation.
   - Prefer compatibility adapters/re-exports over duplicate logic.

3. **TypeScript responsibility**
   - Keep variant maps, state transitions, and interaction behavior in TypeScript modules.
   - Do not move lifecycle-heavy interaction behavior into static HTML template strings.
   - For local control reactivity, prefer explicit typed APIs (`setValue`, `setDisabled`, loading-state setters) over ad-hoc global events.

4. **Styling responsibility**
   - Keep repeated style combinations in typed style maps.
   - Inline utility strings are acceptable for small, one-off composition.
   - Promote reusable visual values to Tailwind tokens when they become cross-component design primitives.

5. **Feature boundary**
   - Keep ui-lib primitives domain-neutral.
   - Canvas-specific behavior belongs in `src/features/canvas/ui` unless it is clearly reusable across features.
   - Do not use ui-lib primitives as a transport layer for feature-module global custom-event wiring.

## Expected Outcome

- Shared primitives remain consistent, typed, and reusable.
- Feature modules compose ui-lib primitives instead of reinventing them.
- Styling strategy remains predictable: Tailwind tokens + TypeScript variant composition.
