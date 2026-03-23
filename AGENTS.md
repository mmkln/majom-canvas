# AGENTS

## UI First

This project already has a local UI library under `src/ui-lib/src`.

- Check existing UI primitives before building any new component.
- Prefer reusing or composing existing components from `src/ui-lib/src/components`, `src/ui-lib/src/hud`, and feature-level re-exports such as `src/features/canvas/ui/primitives/index.ts`.
- Do not generate a new button, input, textarea, checkbox, select, modal, dropdown, toggle, notification, or similar UI primitive if an existing one can be reused with small adaptation.
- Prefer extending styling, variants, tones, sizes, and behaviors of existing UI-lib components instead of creating bespoke DOM and inline-styled controls from scratch.
- Only create a new reusable UI component after confirming by search that the existing UI library does not already cover the use case.
- If a new primitive is needed and it is reusable across features, add it to `src/ui-lib/src` instead of duplicating it inside a feature module.

## Existing UI Library Areas

- Base components: `Button`, `Input`, `Textarea`, `Checkbox`, `Select`, `SearchSelect`, `Modal`, `ToastProvider`, `Notification`.
- Factory/services: `ComponentFactory`, modal and notification services.
- HUD primitives: text/icon buttons, dropdowns, anchored menus, fields, form messages, inputs, segmented controls, toggle switches, surfaces, and related helpers.

## Expected Workflow For UI Changes

1. Search `src/ui-lib/src` and existing feature re-exports for a matching primitive.
2. Reuse the existing component directly, or wrap/compose it if the screen needs a thin specialization.
3. Add a new component only if no suitable primitive exists after that search.

## Testing Discipline

- Do not add tests that exist only to increase coverage or to confirm static implementation details.
- Avoid low-value UI tests that only verify markup shape, CSS classes, spacing, icon presence, visual composition, or other presentation details with no user-facing behavior behind them.
- Do not add tests for the visual appearance of UI components unless the task explicitly asks for it or the visual state encodes important behavior that cannot be protected better at another level.
- Prefer tests that protect meaningful regressions: user interactions, state transitions, data flow, command execution, accessibility-critical behavior, conditional rendering with product meaning, and bug fixes that could realistically recur.
- When a change is purely presentational and does not alter behavior, do not create a new test just to prove the component still renders.
- Before adding a test, ask whether it would catch a costly regression or document important behavior. If not, skip it.

## Learning From Corrections

- When the user corrects the assistant and that correction reveals a stable project rule, a recurring mistake, a contradiction, or an important edge case, update `AGENTS.md` in the same task unless the user explicitly says not to.
- Only promote corrections into `AGENTS.md` when they are durable guidance for future work, not one-off preferences or temporary task details.
- Keep new rules concrete and actionable so they improve future decisions instead of adding vague process noise.
