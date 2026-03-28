# Learning Studio Structured Lesson Format Spec

## Status

- State: decision draft
- Updated: 2026-03-27
- Scope: minimum lesson content structure shared by UI, AI generation, and runtime rendering
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
  - `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-LEARNER-UX-SPEC.md`

## Why this spec exists

The product already has decisions for:

- creator flow
- learner flow
- progress rules
- preview/runtime boundaries

But lesson authoring still lacks one critical contract:

- what a lesson actually contains

Without a minimum structured lesson format:

- AI generation has no stable output target
- Build has no stable editing model
- learner runtime has no stable rendering contract

## Core Decision

Recommended v1 rule:

- a lesson must be more structured than a free-form blob
- but simpler than a full block-editor or LMS authoring schema

The format should be:

- strict enough for AI and UI to share one contract
- small enough to implement without overbuilding

## Lesson as a Domain Unit

A lesson remains a learning unit in the course structure.

It should carry:

- identity
- metadata
- ordered content blocks
- references to child exercises or checkpoints

The lesson itself is not the same thing as an exercise or checkpoint.

## Minimum Lesson Metadata

Recommended v1 lesson metadata:

- `id`
- `title`
- `description`
- `objective`
- `estimatedDurationMinutes`
- `type`
- `prerequisiteIds`

Recommended v1 lesson types:

- `lesson`
- `exercise`
- `checkpoint`

If the product later separates `Lesson`, `Exercise`, and `Checkpoint` into stricter domain objects, this metadata should still remain compatible with that evolution.

## Minimum Lesson Content Model

Recommended v1 structure:

- one lesson contains an ordered array of content blocks

Example conceptual shape:

```ts
type LessonContentBlock =
  | { type: 'intro'; text: string }
  | { type: 'concept'; text: string }
  | { type: 'example'; text: string }
  | { type: 'instruction'; text: string }
  | { type: 'summary'; text: string }
  | { type: 'exercise_ref'; exerciseId: string }
  | { type: 'checkpoint_ref'; checkpointId: string };
```

The exact TypeScript names are not the decision.
The important decision is:

- ordered content blocks
- small allowed set
- explicit references to required child work

## Allowed v1 Block Types

### `intro`

Short framing or entry explanation.

### `concept`

The main teaching block.

### `example`

Concrete illustration of the concept.

### `instruction`

Action-oriented guidance telling the learner what to do.

### `summary`

Short recap or takeaway.

### `exercise_ref`

Reference to required practice work attached to the lesson.

### `checkpoint_ref`

Reference to a required validation checkpoint attached to the lesson.

## Explicitly Out of Scope for v1 Block Types

- rich embeds
- arbitrary layout sections
- nested block trees
- quiz-question block engines
- rubric blocks
- discussion threads
- collaborative notes

These can be layered in later if the product proves the need.

## Ordering Rules

Recommended v1 rule:

- lesson content is strictly ordered

This matters because:

- AI generation needs a stable sequence target
- learner runtime needs a predictable reading flow
- preview must validate the same sequence the learner will consume

## Relationship to Exercises and Checkpoints

Exercises and checkpoints are real progression units, not just decorative text inside the lesson.

Therefore:

- the lesson content should reference them explicitly
- the learner runtime should know when a lesson points to required child work
- lesson completion can depend on those referenced units

This must align with:

- `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`

## Authoring Rules

Recommended v1 authoring behavior:

- block order can be changed
- block content can be edited
- block types come from a small controlled menu

Avoid for v1:

- full rich-text freedom with no structure
- endless formatting controls
- large modal-heavy content authoring for every small text edit

The lesson editor should optimize for clarity and speed, not maximum formatting power.

## AI Generation Rules

Recommended v1 AI behavior:

- AI should generate lesson drafts in the same structured block format
- creators must be able to edit the generated result manually
- AI should not generate a format the runtime cannot render directly

This gives one shared authoring/rendering contract instead of separate AI-only and UI-only shapes.

## Rendering Rules

Recommended v1 learner rendering:

- render blocks in order
- keep typography simple and readable
- surface referenced exercises and checkpoints as clearly distinct required units

Recommended v1 preview rendering:

- same block order
- same required-child references
- lightweight preview affordances only

## Validation Rules

Recommended v1 content validation:

- lesson title required
- at least one instructional block required
- empty referenced child ids not allowed
- block order must be deterministic

Preferred rule:

- a lesson should not be publishable if it has only placeholder structure and no meaningful content blocks

## Minimum Useful Lesson

A lesson should be considered minimally valid when it has:

- title
- objective or description
- at least one `concept`, `instruction`, `example`, or `summary` block

This prevents structurally present but pedagogically empty lessons.

## Relationship to Build UX

This spec complements:

- `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`

Build defines:

- where the creator edits
- how the creator selects and creates units

This document defines:

- what the creator is editing inside a lesson

## Decisions This Spec Resolves

- lessons must have a structured, ordered internal format
- AI and UI must share the same minimum content contract
- child exercises and checkpoints should be explicit references, not informal text mentions
- v1 uses a small controlled set of lesson block types rather than a full document editor

## Recommended Next Documentation Step

After this spec, the next most useful clarification is:

- `Core-Canvas and Migration Strategy`

That document should define:

- how the temporary block-based authoring shell transitions into a dedicated learning canvas
- which interaction contracts must stay stable during that migration
