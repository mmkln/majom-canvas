# Canvas Alignment Guides V2 Architecture

## Status

- State: architecture draft
- Updated: 2026-03-28
- Scope: clean refactor target for smart guides / snapping on `canvas-core`
- Audience: AI implementation agents + human reviewers
- Related code:
  - `src/features/canvas-core/core/services/SmartAlignmentService.ts`
  - `src/features/canvas-core/core/managers/InteractionManager.ts`
  - `src/features/canvas-core/core/utils/smartGuideRenderer.ts`
  - `src/features/canvas-core/ui/components/CanvasMenu.ts`

## Why this document exists

The current planning canvas already has working smart guides, but the capability is still implemented as a narrow drag-time feature rather than as a reusable alignment system.

Today the codebase mixes four concerns too closely:

- alignment candidate extraction
- snap matching and lock/release logic
- interaction-specific suppression rules
- guide rendering

That is acceptable for v1 behavior, but it is the wrong base for:

- spacing guides
- container-aware alignment
- resize alignment
- richer visual overlays
- future reuse in learning-canvas work

## Current implementation boundary

Current strengths:

- scale-aware threshold handling
- release / hysteresis behavior
- separate pure matching service
- separate guide renderer
- integration tests for drag behavior

Current limitations:

- only one best match per axis is returned
- only outer-bounds edge/center anchors are modeled
- semantic scope is weak; candidates are mostly viewport-filtered scene elements
- `InteractionManager` owns too much alignment session logic
- guide visuals are too primitive for richer guide kinds
- smart guides are treated as a toggleable canvas option instead of a first-class editing subsystem

## Core decision

`Alignment Guides V2` should be implemented as a dedicated subsystem with four layers:

1. normalized alignment domain types
2. pure alignment engine and rule pipeline
3. stateful alignment session orchestration
4. overlay rendering

Canvas-specific semantics must enter through adapters, not through special cases in the engine.

## Architectural goals

- keep matching logic pure and unit-testable
- keep session lock/release state out of `InteractionManager`
- keep rendering independent from matching logic
- make planning-canvas and future learning-canvas reuse the same engine
- support incremental adoption without breaking existing drag behavior

## Target module structure

Recommended file layout:

- `src/features/canvas-core/core/alignment/types.ts`
- `src/features/canvas-core/core/alignment/AlignmentEngine.ts`
- `src/features/canvas-core/core/alignment/AlignmentSession.ts`
- `src/features/canvas-core/core/alignment/AlignmentSubjectIndex.ts`
- `src/features/canvas-core/core/alignment/AlignmentOverlayRenderer.ts`
- `src/features/canvas-core/core/alignment/rules/EdgeCenterRule.ts`
- `src/features/canvas-core/core/alignment/rules/SpacingRule.ts`
- `src/features/canvas-core/core/alignment/rules/ContainerRule.ts`
- `src/features/canvas-core/core/alignment/rules/ViewportCenterRule.ts`
- `src/features/canvas-core/adapters/CanvasAlignmentAdapter.ts`
- `src/features/canvas-core/adapters/planning/PlanningCanvasAlignmentAdapter.ts`

## Layer responsibilities

### 1. Alignment domain

The domain layer defines normalized geometry and match contracts.

It must not know about:

- `TaskElement`
- `StoryElement`
- HUD/UI components
- `CanvasRenderingContext2D`
- storage/UI settings persistence

It should define:

- alignment subjects
- anchors
- proposals
- visual overlays
- session state
- preferences

### 2. Alignment engine

`AlignmentEngine` should be pure.

Input:

- moving subject
- reference subjects
- enabled rule set
- preferences
- prior session state

Output:

- alignment proposals
- snap delta
- next lock state
- overlay model

The engine should not mutate scene elements directly.

### 3. Alignment session

`AlignmentSession` owns drag/resize-session continuity:

- currently locked match
- release threshold handling
- continuity bias between frames
- mode-specific suppression or relaxation

`InteractionManager` should only:

- begin the session
- update the session on pointer move
- apply returned snap delta
- end the session

### 4. Overlay rendering

`AlignmentOverlayRenderer` draws a renderer-agnostic overlay model.

It should support:

- primary guides
- secondary guides
- anchor markers
- spacing bands
- labels/badges
- locked-state visual emphasis

This layer must not choose which guide wins.

## Rule pipeline

The engine should not be one monolithic matcher.

Recommended rule pipeline:

1. `EdgeCenterRule`
2. `SpacingRule`
3. `ContainerRule`
4. `ViewportCenterRule`

Each rule:

- reads normalized subjects
- emits proposals for one guide family
- stays pure
- can be enabled or disabled by preferences/context

The current `SmartAlignmentService` behavior should be preserved first by wrapping its logic into `EdgeCenterRule`.

## Adapter boundary

`CanvasAlignmentAdapter` is the only place where canvas/runtime semantics should decide:

- which elements contribute alignment subjects
- which anchors exist for each element kind
- which scopes matter (`container`, `viewport`, `global`)
- whether additional virtual guides exist, such as container rails or viewport center
- how planning-canvas semantics differ from future learning-canvas semantics

This keeps planning-specific behavior out of the core engine.

## Interaction boundary

The refactor should remove the following responsibilities from `InteractionManager` over time:

- best-candidate resolution
- lock state ownership
- candidate extraction details
- guide span shaping

`InteractionManager` should retain:

- pointer lifecycle
- element movement
- collaboration with drag/drop previews
- scene mutation

## Rendering boundary

The current line-only renderer is sufficient for v1 but too limited for v2.

V2 overlay rendering should support:

- edge/center guide lines
- spacing overlays
- container-alignment overlays
- explicit primary vs secondary emphasis
- future theme/style tokenization

The overlay renderer should operate on a visual model, not directly on raw rule matches.

## Preferences boundary

The current boolean toggle should evolve into structured preferences.

Recommended future shape:

- `enabled`
- `snapEnabled`
- `showSpacingGuides`
- `showContainerGuides`
- `showViewportCenterGuides`
- `strictness`

Compatibility rule:

- existing boolean storage should migrate forward without breaking current users

## Performance strategy

Do not keep full-scene candidate scans in the hot pointer-move path once richer rules land.

Recommended v2 direction:

- build a cached `AlignmentSubjectIndex`
- invalidate/rebuild on scene changes
- query only relevant visible/scope-local subjects during drag

This becomes important once spacing and container rules multiply candidate counts.

## Rollout plan

### Phase 1: preserve behavior, fix boundaries

- add domain types
- add adapter boundary
- wrap current smart-guide behavior as `EdgeCenterRule`
- move lock state into `AlignmentSession`
- keep current visual output

### Phase 2: richer overlays

- replace line-only renderer with overlay renderer
- add primary/secondary guide states
- add anchor markers and lock emphasis

### Phase 3: richer alignment families

- add spacing guides
- add container-aware guides
- add viewport center guides
- add resize alignment

### Phase 4: performance hardening

- add subject index
- reduce full-scene scans during drag
- measure dense-canvas performance

## Non-goals

This refactor does not require:

- rewriting the rest of the canvas interaction model
- changing the visual identity of planning nodes
- introducing a new rendering backend
- forcing learning-canvas alignment behavior to be identical to planning-canvas behavior

## Definition of done for the architecture pass

The architecture pass is complete when:

- alignment engine logic is pure
- session lock/release state is isolated from `InteractionManager`
- canvas semantics enter through an adapter boundary
- overlay rendering reads a dedicated visual model
- current edge/center guide behavior still passes existing integration tests
