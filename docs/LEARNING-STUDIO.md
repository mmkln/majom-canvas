# Learning Studio

## Status

- State: strategy reset
- Updated: 2026-03-28
- Document type: canonical index and product direction
- Strategy reset: `docs/LEARNING-STUDIO-STRATEGY-RESET.md`
- Author UX spec: `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
- Build interaction spec: `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
- Preview/runtime spec: `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`
- Course map decision record: `docs/LEARNING-STUDIO-COURSE-MAP-DECISION-RECORD.md`
- Course map integration spec: `docs/LEARNING-STUDIO-COURSE-MAP-INTEGRATION-SPEC.md`
- Publication/access/versioning spec: `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`
- Progress/assessment spec: `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`
- Structured lesson format spec: `docs/LEARNING-STUDIO-STRUCTURED-LESSON-FORMAT-SPEC.md`
- Learner UX spec: `docs/LEARNING-STUDIO-LEARNER-UX-SPEC.md`
- Implementation blueprint: `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
- Implementation restart plan: `docs/LEARNING-STUDIO-IMPLEMENTATION-RESTART-PLAN.md`
- Canvas role strategy: `docs/LEARNING-STUDIO-CORE-CANVAS-MIGRATION-STRATEGY.md`

Historical docs kept for reference only:

- `docs/LEARNING-STUDIO-CANVAS-AUTHOR-JOURNEYS.md`
- `docs/LEARNING-STUDIO-CANVAS-UX-FINDINGS.md`
- `docs/LEARNING-STUDIO-CANVAS-DESKTOP-V1-UX-CONTRACT.md`

## Working Name

- Product-facing name: `Learning Studio`
- Technical module id: `learning-studio`
- Planned module class: `LearningStudioModule`

## Core Realization

The project previously assumed that course creation should be canvas-first.
That assumption was wrong for the authoring job.

Course creation is mostly:

- hierarchical
- sequential
- repetitive
- metadata-heavy
- dense in editing

That is a poor match for a freeform spatial canvas as the primary editing surface.

At the same time, the canvas remains a strong fit for:

- learner orientation
- branching visualization
- prerequisite visibility
- progress navigation
- an interactive map of the course

## Decision Summary

- `Learning Studio` is no longer canvas-first for authoring.
- Course authoring should be structured-builder-first.
- The primary authoring surface is `Build`, implemented as an outline/tree/list builder with focused editing surfaces.
- The canvas should be repositioned as a learner-facing or preview-facing interactive course map.
- `Preview` should validate the course through learner-oriented presentation, including the interactive map where that map adds value.
- Real learner runtime may use the same map language as `Preview`, but with different permissions, data, and side effects.
- `Goal`, `Story`, and `Task` remain non-canonical for learning domain modeling.

## Product Vision

`Learning Studio` is a learning product inside Majom that joins:

- creator-driven course authoring
- learner-facing course consumption
- AI-assisted generation and refinement
- interactive visual navigation where it genuinely improves understanding

The key correction is this:

- use structured editing for creating the course
- use the interactive map for understanding and moving through the course

## Product Context

`Learning Studio` is not a disconnected LMS.
It lives inside a broader personal-development system with two pillars:

- planning and execution
- learning and guided growth

That still matters.
Lessons, exercises, and checkpoints can influence a user's broader work system.
But the authoring surface for a course should not be forced into the same spatial model as planning.

## Product Intent

- Let creators create and refine courses efficiently.
- Let learners move through courses with clear orientation and progression.
- Use AI to accelerate structure generation, content refinement, and guidance.
- Use an interactive map where it improves learner understanding, not where it slows authoring down.
- Keep learning connected to the broader growth and execution system.

## High-Level Capability Map

### 1. Course Authoring

- Create a course from topic, audience, goal, and duration.
- Generate modules, lessons, exercises, checkpoints, and outcomes.
- Edit generated structure in a structured builder.
- Refine or regenerate parts of a course without replacing everything.
- Grant learners access to a course for consumption.

### 2. Learning Plan Generation

- Create a personalized learning path for a learner.
- Adapt the plan to skill level, time budget, and target outcomes.
- Recommend sequencing and pacing.

### 3. Preview and Learner Navigation

- Present the course through a learner-oriented flow.
- Use an interactive map where modules, lessons, branches, and prerequisites need visual explanation.
- Support orientation, progression, and next-step understanding.

### 4. AI Learning Support

- Answer questions during learning.
- Explain concepts in the context of the current lesson or map position.
- Recommend next steps, practice, and review.
- Help creators generate and refine content.

## Canonical Surface Split

### Home

- course library
- entry to creation or reopening

### Overview

- course-level orientation
- current state
- next recommended step

### Build

- structured authoring workspace
- outline/tree/list of modules, lessons, exercises, and checkpoints
- modal or focused editing surfaces for dense edits

### Preview

- creator-facing validation mode
- learner-oriented presentation
- may include the interactive map as the main orientation shell

### Learner Runtime

- actual learner-facing course experience
- may share presentation language with `Preview`
- must remain separate in permissions, data source, and progress side effects

## Canvas Role

The canvas is still a first-class capability, but its role changes:

- not the primary authoring editor
- yes as an interactive preview map
- yes as a real learner runtime map when the course benefits from branching or visible progression logic
- optional or minimized for simple linear courses
- yes as a read-only quick preview surface for inspecting map nodes before opening real runtime

Quick preview belongs to the map layer.
Real lesson, exercise, and checkpoint work belongs to focused learner runtime routes.

The right product statement is now:

- `authoring = structured builder`
- `canvas = interactive course map`

## Domain Rule

The most important domain rule remains:

- learning is part of personal development, not a separate island

That means:

- lessons may connect to work
- learning plans may affect execution flow
- progress may matter beside other work

But it does not mean:

- course creation must happen on a planning-style canvas

## Near-Term Product Slice

The most realistic next product slice is:

- create and edit a course in a structured builder
- preview it through learner-oriented presentation
- support an interactive course map in preview/runtime
- grant learner access
- let the learner consume and progress through the course

## Strategic Risks

The main risk is no longer “can the product use a canvas at all?”
The real risk is mixing two different jobs into one surface:

- authoring the course
- navigating the course

That creates friction for both creators and learners.

The reset avoids that by separating the jobs clearly.

## Current Canonical Strategy

Use these rules unless a later document explicitly supersedes them:

1. Do not invest further in canvas-first course authoring.
2. Build the authoring system around structure, order, and dense editing.
3. Use the canvas for learner navigation, branching, prerequisites, and progress understanding.
4. Treat `Preview` as the creator-facing version of the learner experience.
5. Keep learner runtime distinct from creator preview in data and side effects.
