/** How long the tile must be held before it starts repeating. */
export const HOLD_DELAY_MS = 400;

/** One stage of a held press: from `afterMs` into repeating, add `step` every `intervalMs`. */
export interface RepeatStage {
  afterMs: number;
  intervalMs: number;
  step: number;
}

/**
 * How a held press speeds up: about 5 a second at first, so short holds stay
 * controllable, then 10, 50 and 100 a second, so a few hundred locations take
 * a few seconds. Tune the feel here.
 */
export const REPEAT_STAGES: readonly RepeatStage[] = [
  { afterMs: 0, intervalMs: 200, step: 1 },
  { afterMs: 1000, intervalMs: 100, step: 1 },
  { afterMs: 2000, intervalMs: 100, step: 5 },
  { afterMs: 3500, intervalMs: 100, step: 10 },
];

/** The stage in force `elapsedMs` after repeating began. */
export function repeatStageAt(elapsedMs: number): RepeatStage {
  return REPEAT_STAGES.findLast((stage) => elapsedMs >= stage.afterMs) ?? REPEAT_STAGES[0];
}
