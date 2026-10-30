/**
 * A bar with more controls than it has room for, and the two questions it has
 * to answer: which of them give way, and is the control that holds them drawn.
 *
 * It is the second half of this module. `overflowState` answers a row that
 * *scrolls* past what does not fit; this answers a row that *hides* it. Both
 * halves keep the arithmetic apart from the DOM, so the decision is tested
 * without a layout engine and the two bindings of a family cannot disagree
 * about what fits.
 *
 * The order is the bar's own, reversed: the last unit that can give way is the
 * first that does. What must never be hidden has nowhere to go, which is what
 * `collapsible: false` says.
 *
 * `rank` is the exception, and it exists because one kind of bar reads the
 * other way round. In a bar of tools, reading order and importance run the same
 * way — the first tool is the most used — so giving way from the end gives up
 * the least used, and `toolbar` records the refusal of a priority in its own
 * contract for exactly that reason. In a bar of actions they run in opposite
 * directions: every surveyed implementation puts the action that confirms at
 * the end of the line, so giving way from the end gives up Save first.
 *
 * So a unit may state where it stands in the order of giving way, and the
 * position still decides between two units that stand in the same place. A
 * caller that states nothing gets the original rule back untouched, because
 * every unit is then rank nought.
 */

import type { ScrollOrientation } from './overflow';

export interface CollapseUnitInput {
  /** The room the unit takes along the flow axis, its own margins included. */
  size: number;
  /**
   * Whether the unit has somewhere to go. A control with nothing to become in
   * the surface stays in the bar however little room is left.
   */
  collapsible: boolean;
  /**
   * Whether the unit only means something between two others. A rule that
   * divides nothing is a stray line, so it goes once nothing is left after it —
   * which the order alone almost does, and does not do when the collapse stops
   * as soon as the bar fits.
   */
  divides?: boolean;
  /**
   * Where the unit stands in the order of giving way: the lowest rank goes
   * first, and position decides inside one rank. Nought by default, which is
   * the bar that has no opinion at all.
   */
  rank?: number;
}

export interface CollapseInput {
  /** The units, in the order the bar lays them out. */
  units: readonly CollapseUnitInput[];
  /** The room the bar has for them, its own padding already taken off. */
  available: number;
  /** The distance the bar puts between two boxes. */
  gap: number;
  /** The room the trigger takes once it is drawn, its own gap excluded. */
  triggerSize: number;
  /**
   * How far over its own width still counts as fitting. Sub-pixel layout
   * leaves a row a fraction over, and a bar that hid a control because of a
   * rounding error is a bar that hides a control for no reason.
   */
  tolerance?: number;
}

export interface CollapseResult {
  /** The units that give way, by index, ascending. */
  collapsed: readonly number[];
  /** Whether the control that holds them is drawn. */
  triggerVisible: boolean;
}

const DEFAULT_TOLERANCE = 1;

const NOTHING_COLLAPSED: CollapseResult = Object.freeze({
  collapsed: Object.freeze([]),
  triggerVisible: false,
});

/**
 * The room a set of boxes takes: their own sizes, plus one gap between each
 * pair. The trigger is a box like any other and is counted the same way, which
 * is why it is passed as a size rather than as a size and a gap.
 */
function roomTaken(sizes: number, boxes: number, gap: number) {
  return boxes === 0 ? 0 : sizes + gap * (boxes - 1);
}

export function collapseState({
  available,
  gap,
  tolerance = DEFAULT_TOLERANCE,
  triggerSize,
  units,
}: CollapseInput): CollapseResult {
  const limit = available + tolerance;
  const total = units.reduce((sum, item) => sum + item.size, 0);

  if (roomTaken(total, units.length, gap) <= limit) return NOTHING_COLLAPSED;

  /* The end gives way first, which is what "the overflow takes what is left
     over" means when the bar is read in its own order — and the rank comes
     before the position, so a bar whose most important control is its last one
     can say so. The sort is stable, so the reversal is what orders one rank. */
  const candidates = units
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.collapsible)
    .reverse()
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

  if (candidates.length === 0) return NOTHING_COLLAPSED;

  const collapsed = new Set<number>();
  let sizes = total;
  let boxes = units.length;

  for (const candidate of candidates) {
    collapsed.add(candidate.index);
    sizes -= candidate.size;
    boxes -= 1;
    /* The trigger is drawn from the first unit that gives way, so it is part of
       the room from the same moment. */
    if (roomTaken(sizes + triggerSize, boxes + 1, gap) <= limit) break;
  }

  /* Whatever is now last and only means something between two others goes as
     well. It can only free room, so nothing has to be measured again. */
  for (let index = units.length - 1; index >= 0; index -= 1) {
    if (collapsed.has(index)) continue;
    if (units[index]?.divides !== true) break;
    collapsed.add(index);
  }

  return { collapsed: [...collapsed].sort((a, b) => a - b), triggerVisible: true };
}

export interface CollapseOptions {
  /**
   * The units, in DOM order, read at the time of each measurement. A unit is a
   * box the bar lays out; the items the keyboard moves between are found by
   * being focusable and are a different question at a different depth.
   */
  units: () => readonly HTMLElement[];
  /** Whether a unit has somewhere to go. */
  collapsible: (unit: HTMLElement) => boolean;
  /** Whether a unit only means something between two others. */
  divides?: (unit: HTMLElement) => boolean;
  /**
   * Where a unit stands in the order of giving way. Nought for every unit
   * unless the caller says otherwise, which is the bar that gives way from its
   * own end.
   */
  rank?: (unit: HTMLElement) => number;
  /**
   * The room a unit takes, when the caller knows it cannot be measured. A
   * spacer grows into whatever is left, so its size is nought and it is still
   * counted among the boxes the gaps run between.
   */
  fixedSize?: (unit: HTMLElement) => number | undefined;
  /** The control that opens what did not fit, or `null` while the bar has none. */
  trigger: () => HTMLElement | null;
  /**
   * Whether the control is needed whatever the measurement says.
   *
   * The measurement alone assumes the surface is empty exactly when nothing gave
   * way, which is true for a bar whose surface holds only what did not fit. A
   * family that puts something in the surface permanently — `action-bar`'s
   * `always` rank, Fluent's `overflowItems`, SAP's `AlwaysOverflow` — has a
   * surface with rows in it while every unit still fits, and a control that
   * hides itself then is a menu nobody can open.
   */
  triggerAlways?: () => boolean;
  orientation?: () => ScrollOrientation;
  /** Reports the collapsed units, in DOM order, and only when the set changes. */
  onChange?: (collapsed: readonly HTMLElement[]) => void;
}

export interface CollapseHandle {
  /** Releases every observer and leaves every unit visible. */
  destroy: () => void;
  /** Measures again, after a unit arrives, leaves or changes size. */
  refresh: () => void;
  /** The units currently hidden, in DOM order. */
  collapsed: () => readonly HTMLElement[];
}

function numberFrom(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Hiding a unit takes it out of the flow, so a measurement taken afterwards
 * reports a bar that fits and reveals the unit again — the oscillation every
 * overflow written against live layout lands in. Each unit's room is therefore
 * recorded while it is visible and read back while it is not.
 */
export function createCollapse(container: HTMLElement, options: CollapseOptions): CollapseHandle {
  const orientation = options.orientation ?? (() => 'horizontal' as const);
  const view = () => container.ownerDocument?.defaultView ?? null;

  const room = new WeakMap<HTMLElement, number>();
  let collapsed: HTMLElement[] = [];
  let observed: HTMLElement[] = [];

  function styleOf(element: HTMLElement) {
    return view()?.getComputedStyle?.(element) ?? undefined;
  }

  function measureRoom(element: HTMLElement) {
    const rect = element.getBoundingClientRect?.();
    const style = styleOf(element);
    return orientation() === 'vertical'
      ? (rect?.height ?? 0) + numberFrom(style?.marginTop) + numberFrom(style?.marginBottom)
      : (rect?.width ?? 0) + numberFrom(style?.marginLeft) + numberFrom(style?.marginRight);
  }

  function availableRoom() {
    const style = styleOf(container);
    return orientation() === 'vertical'
      ? container.clientHeight - numberFrom(style?.paddingTop) - numberFrom(style?.paddingBottom)
      : container.clientWidth - numberFrom(style?.paddingLeft) - numberFrom(style?.paddingRight);
  }

  function gapBetween() {
    const style = styleOf(container);
    return numberFrom(orientation() === 'vertical' ? style?.rowGap : style?.columnGap);
  }

  /**
   * The trigger is hidden until it is needed, which leaves the question of how
   * to measure something that is not laid out. The answer is one synchronous
   * pass: reveal it, read it — which forces layout — and put it back before the
   * browser has painted anything. It happens once, because the room a control
   * takes does not change while it is the same control.
   */
  function triggerRoom(trigger: HTMLElement | null) {
    if (trigger === null) return 0;

    const known = room.get(trigger);
    if (known !== undefined && trigger.hasAttribute('hidden')) return known;

    const wasHidden = trigger.hasAttribute('hidden');
    if (wasHidden) trigger.removeAttribute('hidden');
    const measured = measureRoom(trigger);
    if (wasHidden) trigger.setAttribute('hidden', '');

    if (measured > 0) room.set(trigger, measured);
    return measured > 0 ? measured : (known ?? 0);
  }

  function observe(units: readonly HTMLElement[], trigger: HTMLElement | null) {
    if (sizes === undefined) return;
    const next = trigger === null ? [...units] : [...units, trigger];
    if (next.length === observed.length && next.every((unit, index) => observed[index] === unit)) {
      return;
    }
    for (const unit of observed) sizes.unobserve(unit);
    for (const unit of next) sizes.observe(unit);
    observed = next;
  }

  function refresh() {
    const units = options.units();
    const trigger = options.trigger();
    observe(units, trigger);

    for (const unit of units) {
      if (unit.hasAttribute('hidden')) continue;
      const fixed = options.fixedSize?.(unit);
      room.set(unit, fixed ?? measureRoom(unit));
    }

    const state = collapseState({
      available: availableRoom(),
      gap: gapBetween(),
      triggerSize: triggerRoom(trigger),
      units: units.map((unit) => ({
        collapsible: trigger !== null && options.collapsible(unit),
        divides: options.divides?.(unit) ?? false,
        rank: options.rank?.(unit) ?? 0,
        size: room.get(unit) ?? 0,
      })),
    });

    const next = state.collapsed.map((index) => units[index]!);
    const unchanged =
      next.length === collapsed.length && next.every((unit, index) => collapsed[index] === unit);

    /**
     * Focus is moved before the control under it disappears. A hidden element
     * cannot hold focus, and the browser's answer is to drop it on `body`,
     * which is the loss `@slotted/core/focus` exists to prevent everywhere
     * else: the reader lands on the control that now holds the one they were
     * on.
     */
    const active = container.ownerDocument?.activeElement ?? null;
    if (trigger !== null && active instanceof HTMLElement) {
      if (next.some((unit) => unit.contains(active))) trigger.focus();
    }

    const hidden = new Set(state.collapsed);
    units.forEach((unit, index) => {
      const hide = hidden.has(index);
      if (hide === unit.hasAttribute('hidden')) return;
      if (hide) unit.setAttribute('hidden', '');
      else unit.removeAttribute('hidden');
    });

    const drawTrigger = state.triggerVisible || (options.triggerAlways?.() ?? false);
    if (trigger !== null) {
      if (drawTrigger) trigger.removeAttribute('hidden');
      else if (!trigger.hasAttribute('hidden')) trigger.setAttribute('hidden', '');
    }

    if (unchanged) return;
    collapsed = next;
    options.onChange?.(collapsed);
  }

  const sizes =
    typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => refresh());
  const space =
    typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => refresh());

  space?.observe(container);
  refresh();

  return {
    collapsed: () => collapsed,
    destroy: () => {
      space?.disconnect();
      sizes?.disconnect();
      for (const unit of collapsed) unit.removeAttribute('hidden');
      collapsed = [];
      observed = [];
    },
    refresh,
  };
}
