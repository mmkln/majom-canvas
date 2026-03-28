# Learning Studio Course Map Integration Spec

## Status

- State: implementation spec
- Updated: 2026-03-28
- Scope: how the course map integrates into Learning Studio without becoming a second authoring surface
- Canonical parent doc: `docs/LEARNING-STUDIO.md`
- Related docs:
  - `docs/LEARNING-STUDIO-COURSE-MAP-DECISION-RECORD.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`
  - `docs/LEARNING-STUDIO-STRATEGY-RESET.md`

## Why this spec exists

The strategy reset answered the product question:

- the map belongs to `Preview` and learner runtime, not to `Build`

But that still leaves an implementation question:

- where map data comes from
- what map data is allowed to own
- how map generation fits into the current codebase
- how future manual map tuning should be introduced without corrupting course truth

This spec resolves that implementation boundary.

## Core Integration Rule

The course map must integrate as a derived layer.

That means:

- `Build` creates canonical course structure and content
- `Preview` receives a map model derived from that structure
- learner runtime later receives a map model derived from a published version of that structure

The map must not write structure back into the course model.

## Source of Truth Split

### Canonical course truth

Canonical course truth includes:

- modules
- lessons
- exercises
- checkpoints
- unit hierarchy
- order
- prerequisite rules
- lesson blocks
- course metadata

In code, this remains the `LearningCourseContent` model.

### Map layer

The map layer may own only:

- node visibility policy
- grouping and layout mode
- optional promoted child units
- optional hidden nodes
- optional manual positions in a later phase
- transient map UI state such as selection or viewport

The map layer must not own:

- module membership
- unit order
- prerequisite truth
- lesson content
- progression rules

## Recommended Code Structure

### 1. Keep course structure in the learning domain

The learning domain remains responsible for:

- `LearningCourseContent`
- `LearningCourseDraft`
- `LearningCoursePublishedVersion`
- preview sandbox progress
- learner progress

### 2. Introduce a separate `map` layer

The map layer should live beside, not inside, the authoring domain.

Recommended folder:

- `src/features/learning-studio/map/`

This layer owns:

- course-map presentation contract
- derived course-map model
- pure mapping logic from course content to map nodes and edges

### 3. Feed `Preview` with a derived map model

`Preview` should not reconstruct map logic ad hoc inside the view.

Recommended flow:

1. `LearningStudioApp` builds the preview read model
2. `LearningStudioApp` calls a pure map builder
3. `Preview` receives both:
   - focused lesson data
   - derived map data

This keeps map generation centralized and testable.

## Initial Data Contract

### `LearningCourseMapPresentation`

The integration should introduce a presentation contract with fields such as:

- `layoutMode`
- `showModules`
- `childUnitVisibility`
- `promotedUnitIds`
- `hiddenNodeIds`
- `manualNodePositions`

Important:

- this presentation contract is not course structure
- it is a renderer-facing interpretation layer

### `LearningCourseMapModel`

The derived map model should expose:

- `nodes`
- `edges`
- `focusedNodeId`
- `recommendedNodeId`
- effective `presentation`

This model is what `Preview` and learner runtime consume.

## v1 Visibility Rules

Recommended initial defaults:

- `Module`: visible as orientation/grouping
- `Lesson`: always visible
- `Exercise`: hidden by default unless explicitly promoted
- `Checkpoint`: may be promoted via a stronger visibility mode

This keeps the default map lesson-first and low-noise.

## v1 Integration Path

### Phase 1: derived map only

Implement:

- pure course-map builder
- map model in `Preview`
- simple map summary or placeholder surface

Do not implement:

- drag editing
- scene-to-domain persistence
- manual node placement UI

### Phase 2: real preview map renderer

Implement:

- visual map shell inside `Preview`
- selection and quick preview
- lesson-first default rendering
- prerequisite and branching emphasis

Still do not allow map-driven structure editing.

### Phase 3: optional presentation tuning

Only after the above is stable:

- allow limited tuning of visibility/layout policy
- optionally persist presentation metadata
- keep that metadata versioned separately from structural course truth

## What `Build` should know about the map

`Build` should know only that:

- the course will later be rendered as a map
- certain authoring choices affect map clarity

Examples:

- prerequisites affect prerequisite edges
- lesson vs child-unit structure affects node promotion options
- missing descriptions reduce quick-preview quality

But `Build` should not contain:

- canvas gestures
- map editing chrome
- scene persistence
- map-host APIs

## What `Preview` should know about the map

`Preview` should receive:

- the derived map model
- sandbox progress state
- focused lesson data
- next recommended unit

`Preview` may then:

- render the map
- open node quick preview
- route into focused lesson or unit surfaces later

## Future Persistence Rule

If manual map tuning is added later, persist it as map presentation metadata.

Do not persist it by mutating:

- `module.order`
- `unit.order`
- `unit.moduleId`
- `unit.parentLessonId`
- `prerequisiteLessonIds`

Those remain canonical authoring truth.

## Non-Goals

This integration is not trying to:

- bring canvas authoring back into `Build`
- make the map a second editor
- treat map position as progression truth
- let map rendering rewrite course structure

## Immediate Repository Direction

Recommended immediate code direction:

1. keep `Build` structured and form-driven
2. introduce `src/features/learning-studio/map/`
3. move map derivation there
4. let `Preview` consume the derived map model
5. keep future learner runtime on the same map contract, but fed from published versions
