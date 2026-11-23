import type { ProgressType } from "../types";
import { nextDueDeadline } from "../services/countdown";

const TICK_MS = 1000;

/** When a book's current next-due countdown started, and what it was counting. */
interface Anchor {
  key: string;
  startedAt: Date;
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
   * When the book's next unit is due. A new countdown starts when what's left
   * (or the end of day, or the unit) changes, and when the last one ran out
   * without progress. Null once today's goal is met.
   */
  deadlineFor({
    bookId,
    remaining,
    endHour,
    progressType,
  }: {
    bookId: string;
    remaining: number;
    endHour: number;
    progressType: ProgressType;
  }): Date | null {
    const now = this.now;
    const key = `${remaining}|${endHour}|${progressType}`;
    let anchor = this.#anchors.get(bookId);
    if (!anchor || anchor.key !== key) {
      anchor = { key, startedAt: now };
      this.#anchors.set(bookId, anchor);
    }
    const deadline = nextDueDeadline({ now: anchor.startedAt, endHour, remaining, progressType });
    if (deadline && now >= deadline) {
      anchor.startedAt = now;
      return nextDueDeadline({ now, endHour, remaining, progressType });
    }
    return deadline;
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
