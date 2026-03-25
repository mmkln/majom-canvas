# HUD Module Rules

## Scope

- This file stores detailed work scenarios for the shared HUD layer under `src/ui-lib/src/hud`.

## Scenario: Add Shared HUD Icon

- Use this scenario when the user asks to add a new reusable icon, rename an existing shared icon, or provides raw SVG for HUD icon registration.

### Canonical Files

- `src/ui-lib/src/hud/icons.ts` is the canonical shared icon registry.
- `src/features/canvas/ui/icons.ts` is a re-export layer and usually does not need changes.

### Workflow

1. Open `src/ui-lib/src/hud/icons.ts`.
2. Add the new icon name to the `IconName` union.
3. Add a new `if (name === '...')` block inside `createIcon(...)`.
4. Convert the source SVG into the local helper format:
   - Ignore source-level `xmlns`, `class`, `width`, and `height`. The registry sets these centrally.
   - Keep the source path geometry for the existing `24x24` icon system.
   - For stroked paths, use `makePath(...)`.
   - For filled shapes, use `makeFilledPath(...)`.
   - If the source SVG uses `fill-rule` or `clip-rule`, pass the same rule to `makeFilledPath(...)`.
   - If the source SVG has multiple `<path>` elements, append them in the same order.
5. Keep the new block near semantically similar icons when practical.
6. Do not create a new component, feature-local icon registry, or standalone SVG asset for a reusable HUD icon.
7. If the task is only to register the icon, do not touch consumers. Only update calling UI code when the task explicitly asks to use the icon.
8. Verify by searching for the icon name in `src/ui-lib/src/hud/icons.ts` and make sure it appears once in `IconName` and once in `createIcon(...)`.

### Fast Path For Small Icon Requests

- Treat "add this icon" or "replace this button icon with X" as a narrow static-edit task unless the user asks for broader UI work.
- If the user already names the consumer, do not run broad repo-wide discovery. Open the canonical registry plus the named consumer and patch both directly.
- Prefer this sequence:
  1. patch `src/ui-lib/src/hud/icons.ts`,
  2. patch the named consumer if requested,
  3. run a targeted `rg` check for the new icon name,
  4. stop.
- Do not run full `npm run build`, `npm run lint`, or test suites for registry-only icon additions or one-consumer icon swaps unless:
  - the user explicitly asks for validation,
  - the edit touches behavior beyond static icon wiring,
  - or the file changes reveal uncertainty that a targeted check cannot resolve.
- Do not inspect unrelated docs or feature modules once the canonical registry and direct consumer are known.

### Testing

- Do not add tests for a registry-only icon addition.
- Add tests only when the task changes behavior beyond static icon registration.

### Notes

- Existing callers already inherit `size`, `strokeWidth`, and `currentColor` from the shared registry.
- The normal fast path is: add the union member, add the render block, verify the name appears exactly where expected.
