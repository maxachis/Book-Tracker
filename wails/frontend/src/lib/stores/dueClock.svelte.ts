import type { DailyGoal } from "../types";
import { nextCheckpoint, nextDueDeadline, type StepUnit } from "../services/countdown";

const TICK_MS = 1000;

/** A book's current next-due countdown, and what it is counting toward. */
interface Anchor {
  key: string;
  deadline: Date | null;
}

/**
 * One ticking clock and one next-due deadline per book, shared by everything
 * that shows them, so the sidebar and the open card always agree.
 */
class DueClock {
  #tick = $state(0);
  #anchors = new Map<string, Anchor>();
  #subscribers = 0;
  #timer: ReturnType<typeof setInterval> | undefined;

  /** The current time; reading it re-runs the reader on every tick. */
  get now(): Date {
    void this.#tick;
    return new Date();
  }

  /** Keeps the clock ticking while the caller is on screen. Returns the stop function. */
  subscribe(): () => void {
    this.#subscribers += 1;
    if (this.#subscribers === 1) {
      this.#timer = setInterval(() => (this.#tick += 1), TICK_MS);
    }
    return () => {
      this.#subscribers -= 1;
      if (this.#subscribers === 0) clearInterval(this.#timer);
    };
  }

  /**
   * When the book's next checkpoint is due. A new countdown starts when the
   * checkpoint moves (a page read, a location step passed), when the goal,
   * end of day, unit or location step changes, and when the last one ran out. Progress short of
   * the checkpoint keeps the deadline. Null once today's goal is met.
   */
  deadlineFor({
    bookId,
    current,
    goal,
    endHour,
    ...unit
  }: StepUnit & {
    bookId: string;
    current: number;
    goal: DailyGoal;
    endHour: number;
  }): Date | null {
    const now = this.now;
    const checkpoint = nextCheckpoint({ current, goal, ...unit });
    const key = `${checkpoint}|${goal.start}|${goal.end}|${endHour}|${unit.progressType}|${unit.locationStep}`;
    let anchor = this.#anchors.get(bookId);
    const expired = anchor?.deadline != null && now >= anchor.deadline;
    if (!anchor || anchor.key !== key || expired) {
      anchor = { key, deadline: nextDueDeadline({ now, endHour, current, goal, ...unit }) };
      this.#anchors.set(bookId, anchor);
    }
    return anchor.deadline;
  }

  /** Forget every countdown (tests start each case fresh). */
  reset() {
    this.#anchors.clear();
  }
}

export const dueClock = new DueClock();

export function resetDueClock() {
  dueClock.reset();
}
