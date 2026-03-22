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
