## Context

The current Overall Progress update flow requires users to input an absolute progress value, even for small incremental updates. This adds friction for routine progress logging and is inconsistent with the quick-action feel users already have in nearby controls like Daily Goal reset.

The change introduces a quick-add action directly below the Overall Progress UPDATE section, right-justified in the same visual area pattern as the Daily Goal reset control. The action must work for all supported progress types (`page`, `percentage`, `location`) and preserve existing update guarantees (bounds validation and completion-state transitions).

## Goals / Non-Goals

**Goals:**
- Add a single-tap/click quick-add control in the Overall Progress View for incremental progress updates.
- Reuse existing progress update pathways so validation and completion behavior remain consistent.
- Ensure the control behaves correctly across progress types and at boundary conditions (near or at total progress).
- Keep UI placement and interaction pattern consistent with surrounding controls.

**Non-Goals:**
- Redesigning the Overall Progress or Daily Goal layouts beyond adding this control.
- Introducing custom increment sizes in this change.
- Changing persistence model, API contracts, or progress type semantics.

## Decisions

1. **Use an incremental action that delegates to existing update logic**  
   The quick-add action will compute `nextProgress = min(current + 1, total)` and then call the same progress update handler used by manual updates.  
   Rationale: This avoids splitting validation/completion rules across multiple code paths and reduces regression risk.

2. **Place the control in the Overall Progress section, right-justified under UPDATE**  
   The new control will be positioned to mirror the discoverability and visual rhythm of the Daily Goal reset action without sharing destructive styling semantics.  
   Rationale: Users requested location parity, and this placement supports quick repeated updates while preserving section ownership.

3. **Clamp instead of error on upper bound for quick-add**  
   When current progress is already at total, quick-add remains a no-op; when one increment would exceed total, value is clamped to total.  
   Rationale: Quick-add is an acceleration affordance; silent clamping yields predictable UX and keeps validation outcomes aligned with existing bounds requirements.

4. **Respect progress-type display context but keep increment unit fixed at one underlying unit**  
   The button label/context can indicate the active unit (page/percent/location), while behavior consistently increments by one unit of the stored type.  
   Rationale: Matches user intent for "additional page/percent/location" and avoids introducing conversion or rounding complexity.

Alternatives considered:
- Create a separate dedicated mutation/action for quick-add. Rejected due to duplicated validation/completion logic and added maintenance cost.
- Support configurable increment sizes now. Rejected as scope expansion; can be layered later if needed.

## Risks / Trade-offs

- **[Risk] Rapid repeated taps may trigger overlapping updates in async UI flows** → Mitigation: disable control while an update request is in flight or serialize updates through existing mutation state.
- **[Risk] Ambiguous labeling could imply destructive/reset behavior due to nearby reset control** → Mitigation: use distinct wording and non-destructive visual treatment.
- **[Risk] Boundary behavior may be unclear at completion** → Mitigation: define and test explicit clamp/no-op behavior when at or near total progress.
- **[Trade-off] Minimal-scope placement may defer broader UX cleanup** → Mitigation: keep layout changes isolated and revisit as a separate UX refinement change.
