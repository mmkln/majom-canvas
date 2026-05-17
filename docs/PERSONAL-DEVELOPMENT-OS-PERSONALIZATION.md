# Personal Development OS Personalization

## Status

- State: proposal
- Started: 2026-03-26
- Scope: product + architecture plan for phased personalization

## Why This Document Exists

This document defines how Majom can evolve from an AI planning assistant into a personalized Personal Development OS while keeping scope controlled.

The target product value is:

1. help users plan and execute meaningful work,
2. help users learn continuously,
3. help users sustain personal rhythm (energy + life-balance),
4. adapt assistant guidance to user communication and decision style.

## Product Guardrails

### In Scope

- Planning personalization (goal/story/task strategy and execution guidance).
- Learning personalization (adaptive learning cadence and next-step guidance).
- Energy and rhythm personalization (when and how to work sustainably).
- Life-balance signals across user-selected life domains.
- Assistant communication adaptation through explicit preferences + observed behavior.

### Explicit Non-Goals (for this roadmap)

- Clinical or medical diagnosis.
- Hard deterministic "personality typing" claims presented as truth.
- Fully autonomous life management without user confirmation.
- Hidden personalization that cannot be inspected or controlled.

## Strategic Fit

This roadmap aligns with the product's Personal Development direction:

- planning and learning are treated as one connected system,
- adaptation should improve user sustainability and long-term growth,
- broad ambition must still be delivered through staged increments.

## Delivery Model

Personalization is delivered in three stages:

- **MVP Foundation (0-3 months):** useful personalization with low complexity.
- **Growth Layer (3-6 months):** stronger behavioral adaptation and anti-burnout support.
- **OS Layer (6-12+ months):** integrated personal operating loop across planning, learning, and rhythm.

---

## Stage 1 — MVP Foundation (0-3 months)

### User Outcomes

- Users receive planning suggestions adapted to their declared goals and available time.
- Users get lightweight weekly reflection and adjustment prompts.
- Users see basic energy-aware planning hints.

### Required Functional Blocks

1. **Personal Baseline Setup**
   - Collect: focus domains, weekly time budget, preferred planning depth, preferred assistant style.
2. **Weekly Reflection Loop**
   - Structured weekly summary: what worked, what stalled, what to adjust next week.
3. **Energy Journal Lite**
   - Daily 1-click energy check-in with optional note.
4. **Adaptive Assistant Style**
   - Response style preset: concise / structured / supportive.

### Data Needed (Stage 1)

- Explicit profile fields: ~15-20.
- Behavioral aggregates: ~10-15 metrics from planning + AI interaction.
- Energy aggregates: daily level + 7/30 day trends.

### Success Metrics

- Increase in accepted AI suggestions.
- Lower plan rollover rate.
- Higher weekly active planning consistency.
- Improved self-reported usefulness.

---

## Stage 2 — Growth Layer (3-6 months)

### User Outcomes

- Users can observe energy drains vs energy gains by task type and context.
- Users receive anti-burnout guidance before overload compounds.
- Users get balanced life-domain nudges based on their own priorities.

### Required Functional Blocks

1. **Plan-vs-Reality Diff**
   - Compare planned workload and completed workload per week.
2. **Task Energy Impact Labeling**
   - After task completion users can mark: drains / neutral / energizes.
3. **Life Balance Wheel**
   - Weekly check-in across user-selected domains (e.g. health, learning, relationships, career).
4. **Burnout Risk Signals**
   - Rule-based early warnings from energy trend + rollover + habit drop.

### Data Needed (Stage 2)

- Task-type energy mapping.
- Weekly balance-domain allocation and satisfaction scores.
- Pattern metrics: overload streaks, recovery delay, repeated deferrals.

### Success Metrics

- Lower high-overload week frequency.
- Reduced repeated deferral loops.
- Improved energy stability trend.
- Higher completion rate in priority domains.

---

## Stage 3 — OS Layer (6-12+ months)

### User Outcomes

- Users receive integrated planning + learning + rhythm guidance as one coherent loop.
- Assistant adapts coaching style over time and explains why.
- Users can intentionally optimize for narrow specialization or balanced growth.

### Required Functional Blocks

1. **Integrated Personal Loop**
   - Weekly cycle: plan -> execute -> reflect -> rebalance -> learn.
2. **Learning Sprint Personalization**
   - Adaptive study cadence tied to user energy and workload.
3. **Adaptive Coaching Policy Engine**
   - Policy-level adaptation for tone, granularity, challenge level, and intervention frequency.
4. **User-Visible Personalization Controls**
   - Inspect profile assumptions, edit or reset personalization.

### Data Needed (Stage 3)

- Cross-domain trend coherence (planning, habits, energy, learning).
- Longitudinal behavior changes (30/90 day windows).
- Confidence scoring per inferred profile attribute.

### Success Metrics

- Higher long-horizon consistency (8-12 week continuity).
- Better retention and repeated weekly reflection participation.
- Increased user trust in guidance relevance.

---

## Personalization Architecture

## 1) Core Components

1. **Personalization Profile Service**
   - Stores explicit preferences and inferred behavior model.
2. **Signal Ingestion Layer**
   - Converts domain events into normalized personalization events.
3. **Aggregation Pipeline**
   - Maintains rolling 7/30/90 day derived metrics.
4. **Policy Engine**
   - Translates profile and aggregates into adaptation decisions.
5. **AI Context Adapter**
   - Injects personalization context into assistant orchestration.
6. **Transparency & Controls UI**
   - Lets users inspect, correct, and reset personalization inputs.

## 2) Data Flow

1. Feature modules emit typed events.
2. Ingestion normalizes events to `PersonalizationEvent`.
3. Aggregator updates profile metrics.
4. Policy engine computes guidance profile.
5. Assistant consumes profile snapshot when building scenario context.
6. User receives suggestion + "why this guidance" explanation.

## 3) Repository-Local Integration Points

- AI orchestration and memory/telemetry: `src/features/ai-assistant/*`.
- App-level runtime integration boundary: `src/app-runtime/AppRuntime.ts`.
- Energy signals and history service: `src/features/shell/services/ShellEnergyService.ts`.
- Habit/routine behavior signals: `src/features/shell/components/HabitsQuickModal.ts`, `src/features/kanban/state/KanbanStore.ts`.
- Time-structure signals and AI apply flow: `src/features/time-clustering/*`.

---

## Data Model (v1 Draft)

```ts
export type PersonalizationProfileV1 = {
  userId: string;
  version: 1;
  updatedAt: string;

  explicit: {
    focusDomains: string[];            // user-selected domains
    preferredGrowthMode: 'balanced' | 'specialized';
    weeklyTimeBudgetHours: number;
    planningDepth: 'light' | 'standard' | 'deep';
    assistantStyle: 'concise' | 'structured' | 'supportive';
    changeTolerance: 'low' | 'medium' | 'high';
  };

  inferred: {
    executionReliabilityScore: number; // 0..100
    overloadRiskScore: number;         // 0..100
    recoverySpeedScore: number;        // 0..100
    learningConsistencyScore: number;  // 0..100
    communicationAdaptation: {
      detailLevel: 'low' | 'medium' | 'high';
      interventionFrequency: 'low' | 'medium' | 'high';
      framing: 'directive' | 'collaborative' | 'reflective';
    };
  };

  energy: {
    baseline: 1 | 2 | 3 | 4 | 5 | null;
    trend7d: number;
    trend30d: number;
    topEnergyWindows: Array<{ weekday: number; hour: number }>;
    drainTaskTypes: string[];
    gainTaskTypes: string[];
  };

  balance: {
    domains: Array<{
      key: string;
      importance: number;      // 1..5 explicit
      allocationScore: number; // 0..100 inferred from behavior
      satisfaction: number;    // 1..5 optional weekly self-check
    }>;
  };

  confidence: Record<string, number>; // path -> 0..1
};
```

---

## Event Taxonomy (v1)

The first version should track a constrained set of events with strong product meaning.

### A. Assistant Interaction Events

- `ai_request_submitted`
- `ai_suggestion_shown`
- `ai_suggestion_accepted`
- `ai_suggestion_rejected`
- `ai_action_applied`
- `ai_action_edited_after_apply`
- `ai_followup_requested`

### B. Planning Execution Events

- `plan_item_created`
- `plan_item_updated`
- `plan_item_completed`
- `plan_item_deferred`
- `plan_item_deleted`
- `weekly_plan_started`
- `weekly_plan_closed`

### C. Habit and Routine Events

- `routine_created`
- `routine_checked`
- `routine_missed`
- `routine_archived`

### D. Energy and Rhythm Events

- `energy_logged`
- `energy_note_logged`
- `focus_window_started`
- `focus_window_completed`
- `burnout_warning_shown`
- `burnout_warning_acknowledged`

### E. Learning Events

- `learning_sprint_created`
- `learning_session_completed`
- `learning_session_skipped`
- `learning_reflection_logged`

### F. Balance Events

- `balance_checkin_submitted`
- `domain_priority_changed`
- `weekly_rebalance_applied`

---

## Feature Backlog: User Value + Signal Value

## 1) Personal Baseline Setup

- **User value:** fast personalization startup and less generic guidance.
- **Signal value:** explicit goals, constraints, style preferences.

## 2) Weekly Reflection

- **User value:** clear progress + practical corrections.
- **Signal value:** completed vs deferred ratios, recurring blockers.

## 3) Life Balance Wheel

- **User value:** visibility into neglected domains.
- **Signal value:** domain allocation + satisfaction trends.

## 4) Energy Journal Lite

- **User value:** self-awareness of daily rhythm.
- **Signal value:** energy baseline and volatility.

## 5) Task Energy Tagging

- **User value:** discover energizing and draining work patterns.
- **Signal value:** task-type to energy impact mapping.

## 6) Adaptive Coach Mode

- **User value:** assistant communication that matches user preference.
- **Signal value:** response-style effectiveness by interaction outcome.

## 7) Learning Sprint Planner

- **User value:** realistic growth pacing under real workload.
- **Signal value:** consistency and drop-off patterns in learning behavior.

---

## Privacy, Consent, and Trust Requirements

1. Personalization must be opt-in with clear controls.
2. Users can inspect and correct inferred attributes.
3. Users can reset profile history.
4. Sensitive labels must never be presented as medical facts.
5. Inferred "psychotype" should be represented as editable communication preferences and behavioral tendencies.
6. Store only data needed for product improvement and user value.

---

## Technical Infrastructure Required

## Backend

- Profile API: read/update personalization profile.
- Event ingestion API: accept typed personalization events.
- Aggregation jobs: compute 7/30/90 day summaries.
- Policy endpoint (optional initial): return adaptation policy snapshot.
- Audit metadata for personalization decisions.

## Frontend

- Personalization SDK module:
  - typed event emitter,
  - local queue + retry,
  - profile cache with stale-while-revalidate semantics.
- `AppRuntime` extension for personalization snapshot subscription.
- AI orchestration adapter for profile-aware context shaping.
- User settings UI for personalization controls and transparency.

---

## Implementation Sequence (Suggested)

1. Define schema and event contracts (`v1`).
2. Implement minimal profile service and ingestion pipeline.
3. Wire Stage 1 features (baseline setup, weekly reflection, energy journal).
4. Add policy engine v1 for assistant style and planning depth.
5. Add Stage 2 energy-impact and life-balance features.
6. Add profile transparency and reset controls before Stage 3 depth.

---

## Acceptance Criteria for Stage 1 Completion

- Personalization profile can be created, updated, and read reliably.
- At least 20 high-value events are ingested and aggregated.
- Assistant output adapts to explicit style + planning depth settings.
- Weekly reflection generates actionable plan adjustments.
- Energy check-ins feed visible user-facing insights.
- Users can disable or reset personalization.

---

## What You Might Not Know Yet (Critical Hidden Complexity)

These points often become visible only after teams begin implementation.

### 1) Personalization Quality Fails Quietly

Most personalization systems fail silently:

- recommendations look plausible but do not change outcomes,
- users stop noticing suggestions,
- product metrics look stable while long-term trust declines.

**Countermeasure:** treat personalization as an experiment system, not a one-time feature delivery.

### 2) Feedback Loops Can Lock Users Into Narrow Behavior

If the system over-optimizes for short-term completion, it can reduce healthy exploration:

- fewer challenging learning tasks,
- too much repetition of "safe" task types,
- reduced broad personal development.

**Countermeasure:** include explicit exploration and novelty quotas in policy logic.

### 3) Burnout Detection Is Primarily Product Design, Not Model Intelligence

The hardest part is not model inference quality;
it is product behavior once risk is detected:

- when to interrupt,
- how strongly to warn,
- what concrete alternative to propose,
- how to avoid alarm fatigue.

### 4) Psychotype Framing Is a Product-Risk Area

Users may interpret labels as fixed truth.
Even non-clinical labels can harm trust if they feel deterministic.

**Countermeasure:** use editable "current coaching preferences" and "observed tendencies" instead of fixed personality labels.

### 5) Most Value Comes From Operational Discipline

Personalization outcomes depend on:

- event quality,
- profile freshness,
- policy versioning,
- explainability,
- rollback safety.

Without these operational controls, model quality alone will not save the system.

---

## Additional Functional Blocks (Beyond the Initial Backlog)

## 8) Decision Hygiene Coach

- **User value:** detects chronic overcommitment, vague tasks, and unrealistic scope before week planning is finalized.
- **Signal value:** captures recurring planning hygiene errors and user response to correction.

## 9) Recovery Planner

- **User value:** when overload is detected, provides concrete recovery micro-plan (reduce scope, protect sleep window, downgrade non-critical tasks).
- **Signal value:** measures adherence to recovery actions and recovery latency.

## 10) Motivation Source Mapping

- **User value:** identifies conditions that increase motivation (task type, time window, social context, progress visibility).
- **Signal value:** builds personalized motivation drivers and anti-patterns.

## 11) Friction Capture Prompts

- **User value:** short in-flow prompts explain why tasks were skipped (too hard, unclear, low energy, not meaningful).
- **Signal value:** converts hidden failure causes into structured coaching features.

## 12) Controlled Challenge System

- **User value:** maintains growth by mixing stretch tasks with stability tasks.
- **Signal value:** learns tolerance envelope for challenge intensity.

## 13) Monthly Trajectory Review

- **User value:** sees long-horizon growth, not only weekly oscillation.
- **Signal value:** validates whether short-term optimization aligns with long-term goals.

---

## Measurement System (What to Track for Real Efficacy)

### Product Outcome Metrics

- **Sustainable Execution Rate (SER):** completed important tasks without subsequent energy collapse.
- **Recovery Time To Baseline (RTB):** how quickly users return to baseline energy after overload.
- **Balanced Development Index (BDI):** weighted domain balance vs declared priorities.
- **Learning Continuity Score (LCS):** streak-adjusted learning consistency over 30/90 days.
- **Recommendation Realization Rate (RRR):** suggested actions that were completed, not only accepted.

### Personalization System Metrics

- Profile freshness (% users with profile updated in last 7 days).
- Inference confidence coverage (% profile fields above confidence threshold).
- Policy drift (performance delta between policy versions).
- Explainability interaction rate (how often users inspect "why this" details).
- Personalization rollback frequency.

### Safety and Trust Metrics

- User-perceived pressure score.
- Burnout warning false-positive ratio.
- Opt-out and reset rates.
- "Felt understood" self-report trend.

---

## Operational Infrastructure You Will Eventually Need

## 1) Policy Versioning and Rollback

Every recommendation should be traceable to:

- policy version,
- profile snapshot hash,
- event window used,
- confidence level.

## 2) Evaluation Harness

Run replay-based evaluation on historical anonymized sessions before policy rollout.

## 3) Segment-Level Experimentation

Support controlled rollout by segment (new users, recovery-risk users, high-learning-focus users).

## 4) Data Contracts and Schema Governance

- event contract versioning,
- deprecation windows,
- migration rules,
- strict server validation.

## 5) Explainability Surface

Assistant UI should expose:

- top factors influencing guidance,
- confidence indicator,
- edit controls for wrong assumptions.

---

## Explicit Risks and Mitigations

1. **Risk:** Over-personalization narrows growth path.
   - **Mitigation:** enforce novelty budget and periodic re-exploration prompts.
2. **Risk:** User feels judged or controlled.
   - **Mitigation:** tone constraints + user-controlled intervention intensity.
3. **Risk:** Low-quality inferred profile attributes.
   - **Mitigation:** confidence gating + explicit user confirmation prompts.
4. **Risk:** Event noise overwhelms signal quality.
   - **Mitigation:** prioritize 20-30 high-value events before adding more.
5. **Risk:** Roadmap scope collapse.
   - **Mitigation:** stage gates tied to measurable outcome thresholds.

---

## Stage Gates (Go/No-Go Criteria)

### Stage 1 -> Stage 2

Proceed only if:

- weekly reflection adoption reaches target,
- recommendation realization improves versus control,
- no significant trust regression.

### Stage 2 -> Stage 3

Proceed only if:

- energy stability trend improves in target cohorts,
- life-balance interventions show measurable effect,
- burnout warnings maintain acceptable precision.

---

## Open Questions

1. Which balance domains should be default vs fully user-defined?
2. Should burnout risk be displayed as score, state, or narrative only?
3. Which profile fields should be editable vs inferred-only in v1?
4. What level of detail should be shown in "why this recommendation" explanations?
5. Should policy engine v1 run fully on client, backend, or hybrid?
6. What minimum confidence threshold is required before inferred coaching adaptation is allowed?
7. Which interventions are allowed automatically, and which always require explicit user approval?
8. How should exploration quota be tuned to preserve broad growth without reducing motivation?
