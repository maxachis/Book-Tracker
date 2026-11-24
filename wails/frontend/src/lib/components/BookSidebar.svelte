<script lang="ts">
  import { flip } from "svelte/animate";
  import type { Book, DailyGoal } from "../types";
  import ProgressBar from "./ProgressBar.svelte";
  import { getProgressPercentage, dailyGoalPercentage, tomorrowGoalAmount } from "../services/calculations";
  import { amountUnitLabel, dueUnitLabel, formatCountdown } from "../services/countdown";
  import { dueClock } from "../stores/dueClock.svelte";
  import { moveItem } from "../services/ordering";
  import { formatLocalDate } from "../services/dates";

  interface Props {
    books: Book[];
    selectedId: string | null;
    getDailyGoal: (book: Book) => DailyGoal;
    /** Hour (local) the reading day ends; the next-due countdown runs to it. */
    endHour: number;
    /** Locations per "due" step; set in Settings. */
    locationStep: number;
    onSelect: (bookId: string) => void;
    /** Called with the full new order of book IDs after a drag or Alt+Arrow move. */
    onReorder?: (bookIds: string[]) => void;
  }

  let { books, selectedId, getDailyGoal, endHour, locationStep, onSelect, onReorder }: Props = $props();

  const MS_PER_SECOND = 1000;

  $effect(() => dueClock.subscribe());

  function isGoalMet(book: Book): boolean {
    return book.current_progress >= getDailyGoal(book).end;
  }

  function secondsUntilNextDue(book: Book): number | null {
    const deadline = dueClock.deadlineFor({
      bookId: book.id,
      current: book.current_progress,
      goal: getDailyGoal(book),
      endHour,
      progressType: book.progress_type,
      locationStep,
    });
    return deadline ? (deadline.getTime() - dueClock.now.getTime()) / MS_PER_SECOND : null;
  }

  /** Pointer travel before a press becomes a drag, so click jitter still selects. */
  const DRAG_THRESHOLD_PX = 5;
  const REORDER_ANIMATION_MS = 150;

  let listEl = $state<HTMLUListElement | null>(null);
  interface DragState {
    id: string;
    startY: number;
    active: boolean;
    /** Where on the card it was grabbed, so the ghost keeps that point under the pointer. */
    grabOffsetX: number;
    grabOffsetY: number;
    width: number;
  }

  let drag = $state<DragState | null>(null);
  let ghostPosition = $state<{ left: number; top: number } | null>(null);
  let previewIds = $state<string[] | null>(null);
  let suppressNextClick = false;

  const bookIds = $derived(books.map((b) => b.id));
  const displayed = $derived.by(() => {
    if (!previewIds) return books;
    const byId = new Map(books.map((b) => [b.id, b]));
    return previewIds.map((id) => byId.get(id)).filter((b): b is Book => !!b);
  });

  /** Where the dragged book would land: after every other book whose midpoint is above the pointer. */
  function dropIndexAt(pointerY: number, draggedId: string): number {
    const others = [...(listEl?.querySelectorAll<HTMLElement>(".sidebar-item") ?? [])].filter(
      (el) => el.dataset.id !== draggedId
    );
    return others.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2 < pointerY;
    }).length;
  }

  function handlePointerDown(e: PointerEvent, id: string) {
    if (!onReorder || e.button !== 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    drag = {
      id,
      startY: e.clientY,
      active: false,
      grabOffsetX: e.clientX - rect.left,
      grabOffsetY: e.clientY - rect.top,
      width: rect.width,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!drag) return;
    if (!drag.active && Math.abs(e.clientY - drag.startY) < DRAG_THRESHOLD_PX) return;
    drag.active = true;
    ghostPosition = { left: e.clientX - drag.grabOffsetX, top: e.clientY - drag.grabOffsetY };
    const rest = bookIds.filter((id) => id !== drag!.id);
    rest.splice(dropIndexAt(e.clientY, drag.id), 0, drag.id);
    previewIds = rest;
  }

  function handlePointerUp() {
    if (drag?.active) {
      suppressNextClick = true;
      if (previewIds && previewIds.join() !== bookIds.join()) {
        onReorder?.(previewIds);
      }
    }
    drag = null;
    previewIds = null;
    ghostPosition = null;
  }

  function handleClick(id: string) {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    onSelect(id);
  }

  function handleKeyDown(e: KeyboardEvent, index: number) {
    if (!onReorder || !e.altKey) return;
    const step = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    const to = index + step;
    if (step === 0 || to < 0 || to >= bookIds.length) return;
    e.preventDefault();
    onReorder(moveItem(bookIds, { from: index, to }));
  }

  const draggedBook = $derived(drag?.active ? books.find((b) => b.id === drag!.id) : undefined);
</script>

{#snippet itemBody(book: Book)}
  <span class="item-header">
    <span class="item-title">{book.title}</span>
    {#if book.target_date}
      <span class="item-target" title="Target date">{formatLocalDate(book.target_date)}</span>
    {/if}
  </span>
  {#if isGoalMet(book)}
    {@const overall = getProgressPercentage(book)}
    <span class="bar-row">
      <span class="bar-label">Overall</span>
      <span class="bar"><ProgressBar percentage={overall} showLabel={false} /></span>
      <span class="bar-value">{Math.round(overall)}%</span>
    </span>
    <span class="status-row">
      <span class="goal-met-badge"><span aria-hidden="true">&#10003;</span> Today's goal met</span>
      <span class="status-metric" data-metric="tomorrow">
        <span class="label">Tomorrow</span>
        <span class="value">{tomorrowGoalAmount({ book, today: dueClock.now })} {amountUnitLabel(book.progress_type)}</span>
      </span>
    </span>
  {:else}
    {@const daily = dailyGoalPercentage(book.current_progress, getDailyGoal(book))}
    {@const nextDue = secondsUntilNextDue(book)}
    <span class="bar-row">
      <span class="bar-label">Today</span>
      <span class="bar"><ProgressBar percentage={daily} showLabel={false} /></span>
      <span class="bar-value">{Math.round(daily)}%</span>
    </span>
    {#if nextDue !== null}
      <span class="status-row">
        <span class="status-metric" data-metric="next-due">
          <span class="label">Next {dueUnitLabel({ progressType: book.progress_type, locationStep })}</span>
          <span class="value">{formatCountdown(nextDue)}</span>
        </span>
      </span>
    {/if}
  {/if}
{/snippet}

<nav class="book-sidebar" aria-label="Books">
  <ul bind:this={listEl} class:dragging={drag?.active}>
    {#each displayed as book, index (book.id)}
      <li animate:flip={{ duration: REORDER_ANIMATION_MS }}>
        <button
          type="button"
          class="sidebar-item"
          class:selected={book.id === selectedId}
          class:goal-met={isGoalMet(book)}
          class:placeholder={drag?.active && drag.id === book.id}
          class:reorderable={!!onReorder}
          data-id={book.id}
          aria-current={book.id === selectedId ? "true" : undefined}
          title={onReorder ? "Drag to reorder (or Alt+\u2191/\u2193)" : undefined}
          onclick={() => handleClick(book.id)}
          onpointerdown={(e) => handlePointerDown(e, book.id)}
          onpointermove={handlePointerMove}
          onpointerup={handlePointerUp}
          onpointercancel={handlePointerUp}
          onkeydown={(e) => handleKeyDown(e, index)}
        >
          {@render itemBody(book)}
        </button>
      </li>
    {/each}
  </ul>

  {#if draggedBook && drag && ghostPosition}
    <div
      class="drag-ghost"
      aria-hidden="true"
      style:left="{ghostPosition.left}px"
      style:top="{ghostPosition.top}px"
      style:width="{drag.width}px"
    >
      {@render itemBody(draggedBook)}
    </div>
  {/if}
</nav>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .sidebar-item,
  .drag-ghost {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--border-subtle);
    border-left: 3px solid transparent;
    border-radius: var(--radius-md);
    background: var(--bg-card);
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .sidebar-item:hover {
    background: var(--bg-card-hover);
    border-color: var(--border-medium);
  }

  .sidebar-item.reorderable {
    user-select: none;
    touch-action: none;
  }

  ul.dragging .sidebar-item {
    cursor: grabbing;
  }

  /* The dragged book's slot in the list: shows where it will land. */
  .sidebar-item.placeholder {
    opacity: 0.35;
    border-style: dashed;
    border-color: var(--gold-500);
  }

  /* Follows the pointer during a drag. */
  .drag-ghost {
    position: fixed;
    z-index: 100;
    pointer-events: none;
    opacity: 0.85;
    background: var(--bg-surface);
    border-color: var(--gold-500);
    border-left-color: var(--gold-400);
    box-shadow: var(--shadow-lg);
    transform: rotate(-1.5deg);
    cursor: grabbing;
  }

  .sidebar-item:focus-visible {
    border-color: var(--gold-500);
  }

  .sidebar-item.selected {
    background: var(--bg-surface);
    border-color: var(--border-gold);
    border-left-color: var(--gold-400);
  }

  .item-title {
    font-family: var(--font-display);
    font-size: 1.02rem;
    font-weight: 600;
    color: var(--gold-100);
    line-height: 1.25;
  }

  .item-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .item-title {
    min-width: 0;
  }

  .item-target {
    flex-shrink: 0;
    font-size: 0.72rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  /* Today's goal is done: a green edge, kept even when selected. */
  .sidebar-item.goal-met {
    border-left-color: var(--accent-green);
  }

  .status-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.6rem;
    font-size: 0.7rem;
  }

  .goal-met-badge {
    color: var(--accent-green);
    font-weight: 600;
  }

  .status-metric {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin-left: auto;
  }

  .status-metric .label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
  }

  .status-metric .value {
    color: var(--gold-300);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 3.4rem 1fr 2.4rem;
    align-items: center;
    gap: 0.45rem;
  }

  .bar-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
  }

  .bar-value {
    font-size: 0.7rem;
    color: var(--text-secondary);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
