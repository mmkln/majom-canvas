# UI Style Guidelines & Audit (Non-Canvas UI)

## Purpose

This document defines the practical styling standard for non-canvas UI and records the current consistency audit.
Use it for:
- implementing new UI features,
- reviewing pull requests,
- and prioritizing migration of legacy UI styling.

Scope in this document:
- `src/ui-lib/src/**`
- non-canvas feature UI (`src/features/shell`, `src/features/kanban`, `src/features/ai-assistant`, `src/features/time-clustering`)

Excluded:
- canvas-rendered UI internals and scene-layer visuals.

---

## 1) Non-negotiable style principles

These principles must not be violated in new non-canvas UI work.

1. **Mobile input readability invariant:** on mobile/touch, text-entry controls must keep computed `font-size >= 16px` to prevent browser auto-zoom on focus.
2. **Primitive-first styling:** do not build new bespoke visual primitives when `ui-lib/hud` already covers the behavior.
3. **Hierarchy-based corner radius:** larger, higher-level containers use larger radius; compact/low-level controls use smaller radius.
4. **Border-minimal policy:** borders are opt-in, not default decoration. Use borders only when they improve structure, affordance, or contrast.
5. **Semantic text system:** use defined text roles (primary/secondary/muted/error/inverse) and avoid ad-hoc color choices in feature code.
6. **Scale-bound typography and spacing:** font sizes, line heights, and text spacing follow a finite ladder; avoid random one-off values.
7. **Major-island full-bleed default:** top-level workspace islands (canvas, kanban, time-clustering, AI chat) should use full-size layout without card-like outer wrappers unless explicit functional separation is needed.

---

## 2) Source of truth hierarchy

### 2.1 Mandatory order

1. **Shared HUD/UI-lib primitives and class maps** (`src/ui-lib/src/hud/**`, `src/ui-lib/src/components/modalLayout.ts`).
2. **Tailwind theme tokens** (`tailwind.config.js`) when introducing reusable semantic values.
3. **Feature-local composition** only when primitives cannot cover the use-case.

### 2.2 Forbidden by default

- Introducing a feature-local visual dialect for common controls (button/input/select/dropdown/menu/modal) when `ui-lib` already provides equivalents.
- Repeating large inline style blocks for shared interaction patterns (hover/focus/disabled/error/loading).

---

## 3) Baseline visual language (current standard)

These values reflect the strongest existing conventions in `ui-lib/hud` and modal layout.

### 3.1 Surfaces, borders, and depth

- **Default surface:** white, subtle border, low elevation.
  - `rounded-2xl`, `border-slate-200/85`, shadow `0 4px 14px rgba(15,23,42,0.08)`.
- **Elevated surface:** same geometry, stronger elevation.
  - `rounded-2xl`, `border-slate-200/90`, shadow `0 14px 32px rgba(15,23,42,0.14)`.
- **Modal container elevation:** stronger overlay depth.
  - shadow `0 24px 56px rgba(15,23,42,0.18)`.

**Rule:** Use only documented depth levels (`surface`, `surface-elevated`, `overlay`) for reusable UI.

### 3.2 Radius system (hierarchy-based)

- **Level A (page/panel/shell):** `rounded-2xl`.
- **Level B (card/modal body/grouped surface):** `rounded-xl` to `rounded-2xl` (prefer `rounded-2xl` for major containers).
- **Level C (controls like input/select/button):** `rounded-lg`.
- **Level D (dense segmented/compact internals):** `rounded-md`.
- **Pill entities (chips/tags/status pills):** `rounded-full`.

**Rule:** Larger visual hierarchy = larger corner radius. Smaller control density = smaller radius.

### 3.3 Border policy (minimal-by-default)

- Prefer separation by spacing, background contrast, and elevation first.
- Border usage should be deliberately rare in new UI work.
- Add borders only when at least one condition is true:
  1. control affordance requires edge definition (input/select),
  2. contrast needs reinforcement on low-elevation surfaces,
  3. semantic grouping requires explicit division.
- If spacing + contrast already communicate structure, do not add a border.
- Avoid nested/double borders (e.g., bordered card + bordered internal wrappers) unless needed for interaction semantics.

### 3.4 Spacing and control sizing

- Primary text input height: `h-11`.
- Inline compact input height: `h-[34px]`.
- Common button heights: `h-8`, `h-9`, `h-11`.
- Menu item row: `px-4 py-3`.
- **Mobile input font-size guard:** on mobile/touch viewports, all text-entry controls (`input`, `textarea`, editable select/search fields) must use computed `font-size >= 16px` to prevent browser auto-zoom on focus.
  - If desktop design requires visually smaller typography, scale it down only from `md`/desktop breakpoints and keep mobile at `16px`.
  - This applies to shared primitives and feature-local compositions.

**Rule:** Use the shared size ladder and avoid one-off heights for reusable controls.

### 3.5 Typography family and size scale

- **Primary UI font family:** `Poppins, sans-serif`.
- **Fallback chain:** system sans stack (`Inter`, `Segoe UI`, `Roboto`, `Arial`, sans-serif) where platform fallback is needed.
- **Recommended size ladder by role:**
  - `12px`: helper/micro labels,
  - `13px`: compact meta and contextual captions,
  - `14px`: default body/action text,
  - `16px`: mobile text-entry controls and prominent body inputs,
  - `18–30px`: headings by hierarchy.
- **Line-height guidance:**
  - dense meta: `1.35–1.45`,
  - body/action: `1.45–1.6`,
  - headings: `1.1–1.3`.

### 3.6 Text color semantics

Use semantic tone families:
- neutral (`slate-*`) for default text/surfaces/borders,
- accent (`indigo`/`primary`) for interactive emphasis,
- danger (`rose`/`destructive`) for destructive actions,
- success/info variants for notifications.

**Rule:** For recurring values, promote to Tailwind semantic token instead of feature-local hex/rgba duplication.

Suggested text color roles:
- **Primary text:** high-contrast neutral (`slate-900` / near equivalent).
- **Secondary text:** medium neutral (`slate-600/700`).
- **Muted/meta text:** low-emphasis neutral (`slate-400/500`).
- **Interactive accent text:** `indigo`/`primary` semantic colors.
- **Error text:** `rose`/`destructive` semantic colors.
- **Inverse text on dark/accent surfaces:** white/high-contrast foreground token.

### 3.6.1 Element color hierarchy (for all UI layers)

Use this hierarchy from strongest visual weight to weakest:

1. **Critical/action states** (error/destructive, success, warning) — only where semantic meaning exists.
2. **Interactive emphasis** (accent/primary) — CTA, active/selected controls, focused affordances.
3. **Primary content text** — highest legibility role for core information.
4. **Secondary content text** — supporting labels and context.
5. **Muted/support text** — metadata, helper labels, low-priority hints.
6. **Structural colors** (surface, subtle border/divider) — background organization, not content emphasis.

Rules:
- Do not use high-emphasis semantic colors for neutral informational text.
- Do not use danger/success palettes as decoration.
- One component should normally use one dominant semantic tone + neutral companions.

### 3.7 Text spacing rules

- Keep paragraph spacing semantic, not random:
  - heading → supporting text: `4–8px`,
  - form label → control: `4–6px`,
  - helper/error text under control: `4px`,
  - section blocks: `12–16px`.
- Do not rely on empty wrappers for vertical rhythm; use explicit spacing tokens/classes.

### 3.8 Focus, hover, disabled, invalid states

Every interactive control must define:
- `hover` and `active` states,
- visible keyboard `focus-visible` ring,
- disabled visuals and cursor policy,
- invalid/error state where applicable.

**Rule:** state behavior should be encoded in variant/class maps, not scattered event-driven inline style mutations.

### 3.9 Minimalist beauty principle

The visual default is calm and minimal:
- Favor whitespace, clear grouping, and typography hierarchy over decorative effects.
- Keep ornamentation low: avoid unnecessary shadows, gradients, borders, and color noise.
- Prefer one clear accent per component; avoid multi-accent competition inside one block.
- Use borders as a functional tool, not a default visual pattern.
- If removing a visual detail does not reduce usability or meaning, remove it.

### 3.10 Workspace islands (major functional blocks)

For page-level islands such as canvas, kanban, time-clustering, and AI chat:

- Default to **full-size/full-bleed occupancy** inside the workspace region.
- Do **not** wrap each island in a decorative card shell (outer border + shadow + extra outer padding) by default.
- Prefer separation via:
  - page layout structure,
  - spacing between primary regions,
  - clear headings/navigation context,
  - lightweight internal dividers only where interaction clarity requires them.
- Allow card-like shells only when a functional reason exists (example: detachable floating panel, modal-like sub-surface, strong contrast repair).

Why this aligns with the current style system:
- supports the minimalist principle (less decorative noise),
- preserves available working area for functional tools,
- avoids duplicate “card-inside-workspace” framing.

---

## 4) Component usage rules

### 4.1 Buttons

Use HUD button primitives:
- `createTextButton` for textual CTA and action bars,
- `createIconButton` for icon-only actions,
- `MenuButton` for trigger + anchored action list.

Avoid creating bespoke `<button>` implementations for common control patterns.

### 4.2 Inputs, textareas, selects

Preferred path:
- HUD inputs (`createInput`, `createInputBase`) + field/form message primitives.

Legacy components under `src/ui-lib/src/components` are still usable, but new work should converge toward one shared style dialect.

### 4.3 Dropdown and menu patterns

Use:
- `AnchoredMenu` or `MenuButton` for lifecycle and positioning,
- `createDropdownItem` and related HUD menu primitives for row rendering and variants.

### 4.4 Modal patterns

Always compose with:
- `createModalShell`,
- `createModalActionRow`,
- `getModalActionButtonClass`.

No bespoke modal focus trap/backdrop logic unless the use-case cannot be expressed with shared modal APIs.

### 4.5 Notifications

Use the shared notification/toast pipeline and keep visual variants semantic (`success`, `error`, `info`).

### 4.6 Tables and data grids

Use table-style UI only when comparison across rows/columns is the primary task.

- Prefer semantic `<table>` structure (or equivalent accessible grid semantics) for tabular data.
- Keep top-level table surfaces minimal: avoid heavy outer card chrome by default.
- Header cells:
  - stronger text role than body (`text/primary` or strong secondary),
  - stable height across the table,
  - clear sort affordance where sorting exists.
- Body cells:
  - default body text role,
  - consistent vertical rhythm and density per selected mode (`comfortable/default/compact`),
  - predictable truncation/wrapping policy per column.
- Alignment:
  - text columns left-aligned,
  - numeric/amount columns right-aligned,
  - status/icon columns centered or consistently aligned by column contract.
- Borders/dividers:
  - use subtle row dividers when scanability needs it,
  - avoid full cell boxing unless required for interaction semantics.
- Interaction:
  - row hover/focus-visible states must be perceivable,
  - selected rows use semantic selection tone, not arbitrary custom colors,
  - row actions should use shared icon/button primitives.
- Responsive behavior:
  - avoid horizontal collapse that destroys column meaning,
  - for narrow screens, prefer horizontal scroll container or a documented alternate presentation pattern.
- Accessibility:
  - maintain header-cell association,
  - keyboard focus order must be logical for interactive cells,
  - do not encode critical meaning only through color.

#### 4.6.1 Concrete table style contract (default mode)

Use these concrete values for new table/grid UI unless a documented exception is approved:

- **Table container**
  - full-width in its region (`w-full`),
  - radius `rounded-xl` for local table surfaces, `rounded-2xl` only for page-level table modules,
  - border usage: one subtle outer boundary max (`border/subtle`) if needed for contrast.
- **Header row**
  - height: `44px` (`h-11`),
  - horizontal cell padding: `12px` (`px-3`), can use `16px` (`px-4`) in comfortable mode,
  - typography: `label/md` (12px, 600),
  - text color: `text/secondary`,
  - background: neutral subtle (`surface/elevated`-like, low contrast step above body).
- **Body rows**
  - default row height: `44px` (`h-11`),
  - compact row height: `36px` (`h-9`) only in compact density contexts,
  - cell typography: `body/md` (14px) default, `body/sm` (13px) for dense meta columns,
  - text color: `text/primary` for core columns, `text/secondary` for support columns.
- **Cell padding and rhythm**
  - horizontal padding: `12px` baseline,
  - vertical padding: `8px` when variable-height row content is required,
  - keep one consistent padding contract per table.
- **Dividers and borders**
  - row separators: subtle divider (`border/subtle`) between body rows,
  - avoid boxing every cell with full borders,
  - do not combine heavy zebra + heavy borders simultaneously.
- **Hover / selection / focus**
  - row hover: low-emphasis neutral highlight,
  - selected row: single semantic selection tone (accent-tinted neutral, not saturated solid fill),
  - keyboard focus-visible: explicit focus ring on active row/cell control.
- **Numeric/status/action columns**
  - numeric values right-aligned and tabular-friendly where available,
  - status chip/icon column width stable across rows,
  - action column uses shared icon buttons at consistent size (`16px` icon baseline).
- **Text overflow**
  - primary identifiers: prefer single-line truncate with tooltip/title on overflow,
  - descriptive columns: allow 2-line clamp only if row height contract explicitly supports it,
  - do not mix truncate and wrap behavior arbitrarily in the same column.
- **Mobile/narrow viewport fallback**
  - keep semantic columns and enable horizontal scroll first,
  - switch to alternate stacked/card representation only when column meaning cannot be preserved.

---

## 5) Tactical application patterns (with examples)

1. **Form field in modal**
   - Use `rounded-lg` input, subtle border, clear focus ring, and `>=16px` on mobile.
   - Label uses secondary text role; error uses error text role under control with tight vertical spacing.

2. **Action menu row**
   - Use shared dropdown item primitive with semantic variants (`default`, `selected`, `danger`).
   - Avoid adding borders around every row; use hover/selected background and spacing instead.

3. **Card composition**
   - Top-level card: larger radius (`rounded-xl/2xl`) + minimal border or elevation.
   - Inner controls: `rounded-lg`; tags/chips `rounded-full`.
   - Avoid extra nested bordered wrappers unless they communicate state or affordance.

4. **Dense compact controls**
   - Use smaller radius (`rounded-md`) only for dense sub-controls inside already rounded parents.
   - Keep clickable area and state visibility accessible.

5. **Top-level workspace island**
   - Use full-bleed container (`w-full h-full`) with no decorative outer card.
   - Keep visual hierarchy through internal structure (header/toolbar/content zones), not through heavy perimeter border/shadow.


## 6) Current audit: strengths

1. **Strong shared style core in HUD:** centralized class maps for surface/button/menu/input/segmented controls.
2. **Modal system quality:** reusable layout + responsive presentations + accessibility/focus behavior.
3. **Composable anchored menus:** robust positioning + reusable item variants.
4. **Feature reuse exists:** shell routines modal reuses shared modal/menu/button primitives effectively.

---

## 7) Current audit: inconsistencies and risks

### High priority

1. **Multiple parallel styling dialects for primitives**
   - `src/ui-lib/src/components/*` and `src/ui-lib/src/hud/*` overlap for button/input/select concerns.
   - Risk: drift in radius, colors, focus states, and future maintenance cost.

2. **Inline-style-heavy feature controllers**
   - `AiAssistantPanel` and `WorkspaceControlsBar` define many visual decisions as direct DOM style assignments.
   - Risk: hard to enforce global spacing/color/radius/depth policy and harder to audit.

### Medium priority

3. **Feature-local styling systems not mapped to shared token ladder**
   - Kanban CSS (`kanbanStyles.ts`) uses its own visual grammar and micro-sizes.
   - Risk: visual mismatch with shared HUD/modals over time.

4. **Legacy component pockets**
   - `SearchSelect` uses local dropdown styles (`gray-*`, custom z/depth choices) instead of HUD dropdown/surface primitives.

### Low priority

5. **Compatibility export duplication in HUD public index**
   - Useful for migration, but increases API surface and can blur “recommended” entry points.

---

## 8) Mandatory PR checklist for new UI

Before merging any non-canvas UI change:

1. Reused existing `ui-lib/hud` primitive where possible.
2. Avoided bespoke control implementation for common UI controls.
3. Used shared radius/depth/size ladder.
4. Implemented hover/focus/disabled (and invalid where needed).
5. Avoided repeated inline styles for reusable patterns.
6. Added/used semantic tokens for new recurring design values.
7. Verified menu/modal behavior uses shared lifecycle primitives.
8. Confirmed mobile text-entry controls keep computed `font-size >= 16px`.
9. Confirmed corner radius follows hierarchy (larger container => larger radius; compact control => smaller radius).
10. Confirmed borders are used only where needed for affordance/contrast/semantic grouping.
11. For table/grid UI, verified column alignment, truncation policy, and accessible header associations.

If any item is "no", PR must include a brief exception rationale.

---

## 9) Migration plan

### Phase 1 (quick wins)

- Converge new work to HUD-first primitives.
- Replace feature-local action/menu rows with HUD menu/button variants where behavior is equivalent.
- Stop adding new bespoke primitive styling in feature modules.

### Phase 2 (targeted refactors)

- Consolidate base `components` and HUD overlap (especially input/select/button conventions).
- Migrate `SearchSelect` visual layer to shared dropdown/surface style contracts.
- Normalize shell control bars to shared button primitives and class maps.

### Phase 3 (consistency hardening)

- Map kanban visual system to shared token policy (without forcing full visual redesign).
- Reduce inline style footprint in AI assistant and shell UI surfaces.
- Keep compatibility exports but document recommended import paths clearly.

---

## 10) Decision rules for AI-assisted component generation

When generating or updating UI:

1. Check for matching primitive in `src/ui-lib/src/hud` first.
2. If not found, check `src/ui-lib/src/components` and prefer convergence to HUD style language.
3. If still missing, create a reusable primitive in `ui-lib` (not feature-local) unless the use-case is truly feature-specific.
4. Keep repeated styles in typed class/variant maps.
5. Keep feature modules focused on composition, state, and domain behavior.

---

## 11) Concrete specification extensions (v2 baseline)

### 11.1 Canonical semantic token map

Use canonical token names below for non-canvas UI. These names are the only allowed names for new shared tokens.

| Group | Canonical token | Use | Allowed range / notes |
|---|---|---|---|
| Surface | `surface/base` | default panels/cards | neutral light, no tint drift across modules |
| Surface | `surface/elevated` | dropdown/popover/floating panels | slightly stronger contrast than `surface/base` |
| Surface | `surface/overlay` | modal/scrim containers | may use alpha backdrop, content remains legible |
| Text | `text/primary` | core readable content | highest contrast text role |
| Text | `text/secondary` | support labels/body secondary | medium contrast, still readable |
| Text | `text/muted` | metadata/hints | lower emphasis, never for critical info |
| Text | `text/inverse` | text on dark/accent surfaces | contrast-safe inverse foreground |
| Border | `border/subtle` | optional structural boundary | low-emphasis border only |
| Border | `border/strong` | required affordance/contrast edge | use rarely and intentionally |
| State | `state/focus` | focus ring and keyboard visibility | must be visible on all interactive controls |
| State | `state/error` | invalid/error states | reserved for error semantics only |
| State | `state/success` | success state feedback | reserved for success semantics only |
| State | `state/warning` | caution/warning states | reserved for warning semantics only |

Rules:
- New shared tokens must map to one canonical name from this table.
- No feature-local synonym names for shared semantics.
- `error/success/warning` state colors are semantic-only and cannot be used as decoration.

### 11.2 Typography matrix

Use this matrix for all new non-canvas UI text roles.

| Role | Size | Weight | Line-height | Letter-spacing | Typical usage |
|---|---:|---:|---:|---:|---|
| `display/lg` | 30px | 600 | 1.1 | -0.01em | large page/title headers |
| `heading/md` | 24px | 600 | 1.15 | -0.01em | section titles |
| `heading/sm` | 18px | 600 | 1.25 | -0.005em | card/module headings |
| `body/md` | 14px | 400-500 | 1.5 | 0 | default body text |
| `body/sm` | 13px | 400-500 | 1.45 | 0 | compact body/meta |
| `label/md` | 12px | 500-600 | 1.4 | 0.005em | field labels/control captions |
| `meta/xs` | 11-12px | 500 | 1.35 | 0.01em | low-priority metadata |
| `input/mobile` | 16px | 400-500 | 1.45 | 0 | text-entry on mobile/touch |

Localization and long-text edge cases:
- CJK scripts: allow `+1px` for `body/sm` and below when readability drops.
- Long German/Finnish-like compounds: prefer wrapping over shrinking text.
- Do not reduce interactive text below accessible readability thresholds to “fit” layout.

### 11.3 Icon contract

Icon sizing/stroke rules:

| Context | Size | Stroke width | Notes |
|---|---:|---:|---|
| Dense inline/icon chip | 12px | 1.8 | use sparingly, ensure optical clarity |
| Compact control icon | 14px | 1.8 | compact buttons and field adornments |
| Standard button/menu icon | 16px | 1.8-1.9 | default interactive icon size |
| Emphasis/large action icon | 18px | 1.9-2.0 | larger CTAs or key affordances |
| Non-interactive status icon | 12-14px | 1.8 | align baseline with adjacent text |

Alignment rules:
- Icons align to text optical center, not just geometric center.
- Keep one icon size per control family in the same row.
- Do not mix stroke widths in one icon group unless semantically required.

### 11.4 Motion policy

Durations:
- `micro`: 80-120ms (hover/focus affordance transitions),
- `standard`: 140-200ms (dropdowns, subtle panel transitions),
- `complex`: 220-300ms (larger overlays; avoid longer unless justified).

Easing:
- `standard`: `ease-out` for entry, `ease-in` for exit.
- Avoid spring/bounce easing for productivity UI primitives by default.

Reduced motion:
- Respect `prefers-reduced-motion`: reduce or disable non-essential transform/opacity animation.

Forbidden by default:
- Infinite decorative motion loops in core UI surfaces.
- Parallax-like movement for standard controls.
- Long or attention-grabbing animation for routine interactions.

### 11.5 Density modes

Three density modes are allowed:

| Mode | Use case | Control height guidance | Spacing guidance |
|---|---|---|---|
| `comfortable` | touch-heavy / mobile-first screens | `h-11` controls baseline | larger section spacing (`12-16px`) |
| `default` | primary desktop workflows | `h-9` to `h-11` | standard spacing ladder |
| `compact` | high-density data views | `h-8` to `h-9` | tighter local spacing; preserve readability |

Rules:
- Density is selected per screen/context, not per random component.
- Do not mix comfortable and compact controls in one local cluster unless required by semantic priority.

### 11.6 Contrast matrix (role-level minimums)

Use role-level minimum contrast targets:

| Role | Minimum contrast target |
|---|---:|
| Primary text | 7:1 preferred, never below 4.5:1 |
| Secondary text | 4.5:1 minimum |
| Muted/meta text | 3:1 minimum, never for critical content |
| Interactive text/icons | 4.5:1 minimum in default state |
| Focus indicators | clearly perceivable against adjacent surfaces (target 3:1+) |
| Error/success/warning text | 4.5:1 minimum against background |

---

## 12) Remaining open specification gaps

The following items remain to be finalized:

1. **Dark mode / theme variants:** still not formalized in this document.
2. **State layering precedence:** conflict rules for simultaneous states (`focused + invalid + disabled-like` transitions).
3. **Internationalization behavior:** formal truncation/wrapping/RTL priority rules beyond baseline guidance.
4. **Visual regression criteria:** exact pass/fail thresholds for UI diffs in review.

---

## 13) Chat interface and message styling contract

This section defines how non-canvas chat UIs (including AI assistant thread surfaces) should look and behave.

### 13.1 Chat shell composition

- Chat is a **top-level workspace island** and follows full-bleed default behavior.
- Use a three-zone structure:
  1. header/context strip,
  2. message thread region,
  3. composer/action region.
- Separate zones with spacing and subtle dividers only when needed for readability.
- Avoid decorative outer card shells around the full chat island.

### 13.2 Message variants

Use three semantic message classes:

1. **Assistant message**
   - Neutral surface tone (`surface/base` family).
   - Primary text role for message content, secondary/muted for metadata.
2. **User message**
   - Accent-tinted surface with high-contrast text.
   - Keep accent controlled; avoid highly saturated “notification-like” blocks.
3. **System/status/error message**
   - System: neutral/secondary tone.
   - Error: `state/error` semantic only.
   - Success/info: use corresponding semantic state tones only when meaning is explicit.
4. **Action/command message**
   - Keep the bubble surface aligned with assistant-neutral surface (no special tinted bubble).
   - Distinguish by a leading in-message icon and semantic command label.

### 13.2.1 Leading-icon pattern by message type

Use leading in-message icons only where they add semantic disambiguation:

| Message type | Leading icon | Why |
|---|---|---|
| User | No | Author identity is already explicit by alignment and label. |
| Assistant (default) | No | Keep high-frequency assistant replies visually calm. |
| System | Yes (`shield-exclamation`) | Marks platform/system notice semantics. |
| Action/Command | Yes (`bolt`) | Signals executable/command-style intent. |
| Typing/progress bubble | No (default) | Progress state already represented by phase label and dots; avoid extra noise. |

Rule:
- Add a leading icon only when the message semantic could otherwise be confused with a regular assistant reply.
- Do not add decorative icons to all messages by default.

### 13.3 Message geometry and spacing

- Message bubble radius: `rounded-xl` or `rounded-2xl` (content block level).
- Chat message bubbles must not use border outlines.
- Internal controls inside a message (action icons, tiny chips) use smaller radii (`rounded-md`/`rounded-lg`) per hierarchy rule.
- Keep a stable vertical rhythm:
  - same author consecutive messages: tighter gap,
  - author change or semantic block change: larger gap.
- Message internal padding must remain consistent across variants to avoid layout jitter.

### 13.4 Typography inside chat

- Message content: `body/md` by default (`14px`, role-based line height).
- Metadata (timestamps/status labels): `body/sm` or `label/md` depending on emphasis.
- Composer/input on mobile/touch must preserve computed `font-size >= 16px`.
- For long content, wrap text before reducing type size.

### 13.5 Chat actions and interaction states

- Message-level actions (copy/retry/edit/regenerate) must use shared button/icon primitives and keep low visual weight by default.
- Reveal affordances progressively (hover/focus/selection) without persistent visual clutter.
- All interactive elements must expose: hover, focus-visible, active, disabled (and invalid when applicable).
- Do not encode interaction state purely by color; include contrast and focus indicators.
- **System and action/command messages must display a leading icon inside message content**, not only in metadata rows.
  - Current icon semantics:
    - action/command: bolt-like command icon,
    - system: shield/notice icon.
  - Icon treatment should stay subtle (non-dominant neutral tone) and align with message text baseline.

### 13.6 Streaming and loading behavior

- Streaming responses should use subtle, non-distracting motion.
- Avoid aggressive pulsing, bouncing, or long decorative animations.
- Respect reduced-motion preferences for all streaming/loading indicators.
- Preserve message container dimensions as much as possible during streaming to reduce visual jumpiness.

### 13.7 Attachments, code blocks, and rich content

- Embedded sub-surfaces (attachments/code blocks) should appear as nested content regions, not independent competing cards.
- Use border-minimal policy: introduce borders only for readability or affordance boundaries.
- Maintain consistent spacing between rich blocks and surrounding message text.
- Keep horizontal overflow behavior predictable (scroll within content block, not entire thread container).

### 13.8 Minimalism guardrails for chat

- One message should have one dominant visual emphasis at most.
- Prefer hierarchy through spacing and typography before adding color or chrome.
- Do not use borders on chat message bubbles (assistant, user, system, action/command, typing/progress).
- Keep any optional structural borders at container/subsection level only, not on individual bubbles.
- Remove decorative shadows from message bubbles unless they carry a functional purpose.
- If a style detail does not improve comprehension, interaction, or accessibility, omit it.

### 13.9 AI assistant action-card component contract

This subsection defines style and structure rules for action cards rendered inside AI assistant chat messages (single and grouped cards with execution CTA controls).

#### 13.9.1 Structure and composition

- Keep the action-card tree predictable:
  - `action-cards` list container,
  - `action-card` or `grouped-action-card` surface,
  - entry body (`header + family-specific content`) and footer CTA/status area.
- Grouped cards may add one footer row with a batch CTA and subtle divider.
- Keep action cards as nested message content regions, not standalone competing page cards.

#### 13.9.2 Surface and border policy

- Keep default action-card surface borderless and low-chrome.
- Allow borders only for meaningful semantic state (for example failed/error state) or section-level dividers.
- Do not apply generic `HudSurface` default chrome directly to chat action cards when it introduces unnecessary border/shadow.
- Message-bubble border ban remains absolute; action-card separation belongs at internal section/container level only.

#### 13.9.3 Typography and information hierarchy

- Keep at most three text hierarchy levels inside one action card:
  1. primary (title and actionable payload),
  2. secondary (summary/rationale),
  3. tertiary (labels/provenance/supporting metadata).
- Do not introduce extra local font-size/color levels unless they represent a clear new semantic layer.
- Keep action-family layouts consistent so repeated operations remain scannable across messages.

#### 13.9.4 CTA and status behavior

- Action CTA must remain visually lightweight relative to message content while keeping clear affordance.
- Disabled/applied/applying/failed states must be represented consistently between single and grouped cards.
- Prefer one clear CTA location per action row; avoid duplicated competing CTA placements within the same card.

#### 13.9.5 Implementation guidance

- Keep action-card style recipes centralized in shared action tokens/primitives (not repeated inline literals in panel orchestration code).
- If HUD reuse is needed, introduce an explicit chat-action variant/preset first; do not use a generic surface preset that adds decorative chrome.

---

## 14) Visual examples: how elements should look now

Use these as ready-to-apply reference recipes for new non-canvas UI.

### 14.1 Primary action button (default desktop)

- **Shape:** `rounded-lg`
- **Height:** `h-9` (or `h-11` for touch-heavy contexts)
- **Typography:** `body/md` (14px, 500)
- **Color:** accent background + `text/inverse`
- **States:** visible hover darken, `focus-visible` ring, disabled reduced opacity/interaction lock

Example class recipe:

```ts
const primaryButtonClass =
  'inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-medium ' +
  'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50';
```

### 14.2 Text input (mobile-safe)

- **Shape:** `rounded-lg`
- **Height:** `h-11`
- **Typography:** `16px` on mobile/touch, can scale to `14px` from `md` and above
- **Border:** subtle (`border/subtle`) because affordance is required
- **States:** default, hover, focus ring, invalid, disabled

Example class recipe:

```ts
const inputClass =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[16px] text-slate-900 ' +
  'placeholder:text-slate-400 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 md:text-[14px]';
```

### 14.3 Surface card with hierarchy

- **Container:** `rounded-2xl`, low elevation, optional subtle border
- **Title:** `heading/sm` (18px, 600)
- **Body:** `body/md` (14px)
- **Meta:** `body/sm` (13px) in muted tone
- **Rule:** no extra nested borders unless they communicate real state/affordance

Example class recipe:

```ts
const surfaceCardClass =
  'rounded-2xl border border-slate-200/85 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.08)]';
```

### 14.4 Dropdown menu row

- **Row spacing:** `px-4 py-3`
- **Icon:** `16px`, stroke `1.8-1.9`
- **Colors:** neutral by default, accent for selected, danger only for destructive semantics
- **Rule:** do not add border around every row; communicate state with tone and background

Example class recipe:

```ts
const dropdownRowClass =
  'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[14px] text-slate-700 ' +
  'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300';
```

### 14.5 Modal shell

- **Container:** `rounded-2xl`, overlay depth shadow
- **Spacing:** section rhythm 12-16px, label/control gap 4-6px
- **Buttons:** use shared action-row presets (`h-9` default, `h-11` in touch mode)
- **Rule:** always use shared modal shell/focus/backdrop lifecycle

Example class recipe:

```ts
const modalContainerClass =
  'rounded-2xl bg-white p-5 shadow-[0_24px_56px_rgba(15,23,42,0.18)]';
```
