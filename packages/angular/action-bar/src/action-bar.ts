import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { BUTTON_DEFAULTS_TOKEN } from '@slotted/angular/button';
import type { ButtonDefaults } from '@slotted/angular/button';

import { injectActionBarDefaults } from './action-bar-defaults';
import type {
  ActionBarAlign,
  ActionBarPriority,
  ActionBarSize,
  ActionBarVariant,
} from './action-bar-defaults';

export type {
  ActionBarAlign,
  ActionBarDefaults,
  ActionBarPriority,
  ActionBarSize,
  ActionBarVariant,
} from './action-bar-defaults';

/**
 * The accessible name of the control that holds what did not fit. A string is
 * used verbatim; a function is given the number of actions behind the control,
 * because three dots say nothing about how much is behind them.
 */
export type ActionBarOverflowLabel = string | ((hidden: number) => string);

/** One action the surface holds, in the order the bar holds it. */
export interface ActionBarSurfaceUnit {
  readonly id: string;
  readonly separatorBefore: boolean;
}

/** The attribute that says an action has somewhere to go. */
export const ACTION_BAR_UNIT_ATTRIBUTE = 'data-unit';

/** The attribute the measurement reads a rank from. */
export const ACTION_BAR_PRIORITY_ATTRIBUTE = 'data-priority';

/**
 * The custom property the stacking query raises, read back by the measurement.
 *
 * The breakpoint is literal because `@container (width < var(--x))` is invalid,
 * and it is written once — in the stylesheet. The binding asks CSS what it
 * decided rather than comparing widths of its own, so the layout and the
 * measurement cannot disagree about where the bar becomes a column.
 */
export const ACTION_BAR_STACK_PROPERTY = '--_stacked';

/**
 * Where each rank stands in the order of giving way: the lowest goes first, and
 * position decides inside one rank.
 */
export const ACTION_BAR_RANK: Readonly<Record<ActionBarPriority, number>> = Object.freeze({
  always: 0,
  hide: 0,
  high: 2,
  low: 1,
  pinned: 0,
});

function priorityOf(unit: HTMLElement): ActionBarPriority {
  return (unit.getAttribute(ACTION_BAR_PRIORITY_ATTRIBUTE) as ActionBarPriority | null) ?? 'pinned';
}

/**
 * Everything the run lays out.
 *
 * The trigger is not one of them — a control that took part in its own
 * measurement would be counted twice, and the Angular trigger sits inside a
 * `display: contents` host of its own — and neither is an `always` action, which
 * is never in the bar to give way.
 */
function unitsOf(container: HTMLElement) {
  return [...container.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child.getAttribute('data-part') !== 'overflow' &&
      child.querySelector('[data-part="overflow"]') === null &&
      child.getAttribute(ACTION_BAR_PRIORITY_ATTRIBUTE) !== 'always',
  );
}

/**
 * Whether one of the bar's own rules sits between two units that are both in the
 * surface. It is read from the DOM because a separator is a sibling of the units
 * it divides and nothing in the component tree relates them.
 */
function ruleBetween(from: Element, to: Element) {
  for (
    let node = from.nextElementSibling;
    node !== null && node !== to;
    node = node.nextElementSibling
  ) {
    if (node.getAttribute('data-part') === 'separator') return true;
  }
  return false;
}

/**
 * The one axis the bar hands down to the buttons inside it, through the button
 * family's own defaults token rather than through a second channel of this
 * family's invention. That is what keeps an explicit `size` on a button winning
 * over the bar, because it is the rule `button` already implements.
 *
 * The value is read through a getter so that a button's `computed` tracks the
 * bar's signal: a plain snapshot would fix the step at the moment the first
 * button was created and never move again.
 */
function provideBarStep() {
  return {
    provide: BUTTON_DEFAULTS_TOKEN,
    useFactory: (): ButtonDefaults => {
      const bar = inject(SlActionBar);
      const inherited = inject(BUTTON_DEFAULTS_TOKEN, { skipSelf: true });

      return {
        ...inherited,
        get size() {
          return bar.resolvedSize();
        },
      };
    },
  };
}

/**
 * The actions that finish a task on a page or in a panel.
 *
 * **It is not a composite.** `Tab` reaches every action, in the order the author
 * wrote them, and the arrows are not bound. The controls here are the page's own
 * form actions, and a reader walking a form expects to arrive at Cancel and then
 * at Save; roving focus would make the whole bar one tab stop and put Save
 * behind an arrow key that announces nothing. A strip of ten icon buttons is a
 * `toolbar`, and that family binds the arrows against the APG.
 *
 * **What gives way is decided by rank, not by position**, which is the whole of
 * why this family stands beside `toolbar` rather than configuring it.
 *
 * **The action that confirms does not move.** The run carries an `auto` margin
 * against the bar's end edge, so a message appearing in the status, a button
 * going busy and a permission filter removing a control all move what is
 * *before* the last action and never the last action itself.
 */
@Component({
  selector: '[slActionBar]',
  standalone: true,
  exportAs: 'slActionBar',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/action-bar/action-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [provideBarStep()],
  host: {
    'data-ui': 'action-bar',
    'data-ui-action-bar': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'role()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-align]': 'resolvedAlign()',
    '[attr.data-sticky]': 'resolvedSticky() ? "" : null',
    '[attr.data-collapsed]': 'collapsedCount()',
    '[attr.data-status]': 'presenceAttribute()',
    '[style.display]': 'mounted() ? null : "none"',
  },
})
export class SlActionBar {
  readonly variant = input<ActionBarVariant | undefined>(undefined);
  readonly size = input<ActionBarSize | undefined>(undefined);
  readonly align = input<ActionBarAlign | undefined>(undefined);
  readonly sticky = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * Whether the bar belongs on screen at all. A bulk bar exists while there is a
   * selection and a contextual save bar while there are unsaved changes.
   *
   * It is an input rather than a two-way value: the bar never asks to appear or
   * to leave, so there is nothing to cancel.
   */
  readonly present = input<boolean, boolean | string | undefined>(true, {
    transform: (state) => (state === undefined ? true : booleanAttribute(state)),
  });

  /**
   * Reports how many actions gave way, once per change. The collapsed set is a
   * measurement rather than a value, so there is no two-way binding over it.
   */
  readonly overflowChange = output<number>();

  private readonly defaults = injectActionBarDefaults();
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  /**
   * A consumer who has ten icon-only actions and wants the composite may write
   * `role="toolbar"` themselves, and what they wrote survives the host binding.
   * The arrows are still not bound, so that consumer wants `toolbar`.
   */
  private readonly statedRole = inject(new HostAttributeToken('role'), { optional: true });

  private readonly counterparts = signal(new Map<string, TemplateRef<unknown>>());
  private readonly trigger = signal<HTMLElement | null>(null);
  private readonly actions = signal<HTMLElement | null>(null);
  private readonly stacked = signal(false);
  private readonly ready = signal(false);
  private collapse: CollapseHandle | null = null;

  /** What the surface holds: the collapsed actions and every `always` one. */
  readonly surfaceUnits = signal<readonly ActionBarSurfaceUnit[]>([]);

  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  readonly resolvedSticky = computed(() => this.sticky() ?? this.defaults.sticky);

  protected readonly role = computed(() => this.statedRole ?? 'group');

  private readonly status = signal<PresenceStatus>('open');
  protected readonly mounted = computed(() => this.status() !== 'unmounted');
  protected readonly presenceAttribute = computed(() => {
    const status = this.status();
    return status === 'open' || status === 'unmounted' ? null : status;
  });

  protected readonly collapsedCount = computed(() =>
    this.trigger() === null ? null : String(this.surfaceUnits().length),
  );

  /** Records what an action becomes in the surface. */
  registerUnit(id: string, template: TemplateRef<unknown>) {
    this.counterparts.update((held) => new Map(held).set(id, template));
  }

  releaseUnit(id: string) {
    this.counterparts.update((held) => {
      const next = new Map(held);
      next.delete(id);
      return next;
    });
  }

  counterpart(id: string) {
    return this.counterparts().get(id) ?? null;
  }

  /** The control that opens what did not fit. The bar measures it. */
  registerTrigger(element: HTMLElement | null) {
    this.trigger.set(element);
  }

  /** The run, which is the box the collapse measures rather than the root. */
  registerActions(element: HTMLElement | null) {
    this.actions.set(element);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);

    /**
     * The bar is held through its exit, so a bulk bar slides out rather than
     * vanishing. Carbon keeps its batch bar mounted and writes `aria-hidden` on
     * the root instead, which leaves the buttons inside reachable by `Tab`.
     */
    const presence = createPresence({
      present: true,
      skipInitialAnimation: true,
      onStatusChange: (next) => this.status.set(next),
    });
    presence.setNode(this.element);
    destroyRef.onDestroy(() => presence.destroy());

    effect(() => presence.sync(this.present()));

    afterNextRender(() => this.ready.set(true));

    /**
     * Whether the bar is drawn as a column. The number lives in the stylesheet's
     * container query, and this asks CSS what it decided rather than comparing
     * widths against a copy of it.
     */
    effect((onCleanup) => {
      const container = this.actions();
      if (container === null || !this.ready()) return;

      const read = () => {
        const view = container.ownerDocument?.defaultView;
        const raised =
          view?.getComputedStyle(container).getPropertyValue(ACTION_BAR_STACK_PROPERTY).trim() ===
          '1';
        if (this.stacked() !== raised) this.stacked.set(raised);
      };

      read();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(read);
      observer.observe(container);
      onCleanup(() => observer.disconnect());
    });

    /**
     * The collapse. It does not run while the bar is a column: a column has room
     * for every action, and a surface holding what did not fit would be a menu
     * for nothing. Leaving the effect destroys the handle, which reveals every
     * unit it had hidden.
     */
    effect((onCleanup) => {
      const container = this.actions();
      const trigger = this.trigger();
      if (container === null || !this.ready() || this.stacked()) return;

      const sync = (collapsedUnits: readonly HTMLElement[]) => {
        const collapsed = new Set(collapsedUnits);
        const held = [...container.children].filter(
          (child): child is HTMLElement =>
            child instanceof HTMLElement &&
            child.hasAttribute(ACTION_BAR_UNIT_ATTRIBUTE) &&
            (collapsed.has(child) ||
              child.getAttribute(ACTION_BAR_PRIORITY_ATTRIBUTE) === 'always'),
        );

        this.surfaceUnits.set(
          held.map((unit, index) => {
            const previous = held[index - 1];
            return {
              id: unit.getAttribute(ACTION_BAR_UNIT_ATTRIBUTE) ?? '',
              separatorBefore: previous !== undefined && ruleBetween(previous, unit),
            };
          }),
        );
      };

      const handle: CollapseHandle = createCollapse(container, {
        /* A pinned action has nowhere to go. Every other rank does, and `hide`'s
           somewhere is nowhere — it gives way and is not offered in the
           surface. */
        collapsible: (unit) => priorityOf(unit) !== 'pinned',
        divides: (unit) => unit.getAttribute('data-part') === 'separator',
        onChange: (units) => {
          sync(units);
          this.overflowChange.emit(
            units.filter((unit) => unit.hasAttribute(ACTION_BAR_UNIT_ATTRIBUTE)).length,
          );
        },
        rank: (unit) => ACTION_BAR_RANK[priorityOf(unit)],
        trigger: () => trigger,
        /* An `always` action is in the surface while every other one still fits,
           and a control that hid itself then would be a menu nobody can open. */
        triggerAlways: () =>
          container.querySelector(`[${ACTION_BAR_PRIORITY_ATTRIBUTE}='always']`) !== null,
        units: () => unitsOf(container),
      });

      this.collapse = handle;
      sync(handle.collapsed());

      /**
       * An action arriving or leaving invalidates the measurement — a bar that
       * grows a button collapses one — and an `always` action arriving changes
       * what the surface holds without changing what collapsed.
       */
      const observer = new MutationObserver(() => {
        handle.refresh();
        sync(handle.collapsed());
      });
      observer.observe(container, { childList: true, subtree: true });

      onCleanup(() => {
        observer.disconnect();
        handle.destroy();
        this.collapse = null;
        this.surfaceUnits.set([]);
      });
    });
  }

  /** Measures again, after the consumer changed something the DOM cannot report. */
  refresh() {
    this.collapse?.refresh();
  }
}

/**
 * The sentence at the start of the bar: a dirty-state marker, a timestamp, the
 * count of what is selected and the control that selects the rest.
 *
 * It is a slot rather than a component: the library already has
 * `inline-message`, `status-indicator` and `badge`, and `table` already owns the
 * selection and its count.
 */
@Directive({
  selector: '[slActionBarStatus]',
  standalone: true,
  exportAs: 'slActionBarStatus',
  host: { 'data-part': 'status', 'data-part-status': '' },
})
export class SlActionBarStatus {}

/**
 * The run of actions, and the box the collapse measures.
 *
 * It is the run rather than the root, because the root is the query container
 * and a container is a container for its descendants and not for itself — so the
 * rule that turns the run into a column has to reach a descendant.
 */
@Directive({
  selector: '[slActionBarActions]',
  standalone: true,
  exportAs: 'slActionBarActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlActionBarActions {
  private readonly bar = inject(SlActionBar);

  constructor() {
    const element = inject(ElementRef<HTMLElement>).nativeElement;
    this.bar.registerActions(element);
    inject(DestroyRef).onDestroy(() => this.bar.registerActions(null));
  }
}

/**
 * One action the bar may give up, its rank, and what it becomes when it goes.
 *
 * The rank and the counterpart are one fact seen from two sides. A control with
 * nothing to become in the surface is pinned — it has nowhere to go, which is
 * why the action that confirms stays visible — and a rank that needs somewhere
 * to go and has nowhere behaves as pinned too, so a consumer error leaves the
 * control on the bar rather than hiding it silently.
 */
@Directive({
  selector: '[slActionBarAction]',
  standalone: true,
  exportAs: 'slActionBarAction',
  host: {
    'data-part': 'action',
    'data-part-action': '',
    '[attr.data-unit]': 'unitId()',
    '[attr.data-priority]': 'resolvedPriority()',
    '[attr.hidden]': 'resolvedPriority() === "always" ? "" : null',
  },
})
export class SlActionBarAction {
  /**
   * What the action becomes in the surface when the bar has no room for it.
   *
   * It is deliberately not called `overflow`: that word names what a container
   * does with more content than it has room for, and one term with two meanings
   * is the ambiguity the contract exists to prevent.
   */
  readonly counterpart = input<TemplateRef<unknown> | undefined>(undefined, {
    alias: 'slActionBarActionCounterpart',
  });

  /**
   * Where this action stands in the order of giving way.
   *
   * It is the selector's own value, so the terse form reads as the sentence it
   * is — `slActionBarAction="high"`. A bare `slActionBarAction` hands the
   * directive an empty string, which is the attribute being present rather than
   * a rank, and the transform reads it as unstated.
   */
  readonly priority = input<ActionBarPriority | undefined, ActionBarPriority | '' | undefined>(
    undefined,
    { alias: 'slActionBarAction', transform: (rank) => (rank === '' ? undefined : rank) },
  );

  private readonly bar = inject(SlActionBar, { optional: true });
  private readonly identity = `slotted-action-bar-unit-${(unitCount += 1)}`;

  protected readonly unitId = computed(() =>
    this.counterpart() === undefined ? null : this.identity,
  );

  readonly resolvedPriority = computed<ActionBarPriority>(() => {
    const stated = this.priority();
    const declared = this.counterpart() !== undefined;
    if (stated === undefined) return declared ? 'low' : 'pinned';
    if (stated === 'hide' || stated === 'pinned') return stated;
    return declared ? stated : 'pinned';
  });

  constructor() {
    const bar = this.bar;
    effect(() => {
      const template = this.counterpart();
      if (bar === null) return;
      if (template === undefined) bar.releaseUnit(this.identity);
      else bar.registerUnit(this.identity, template);
    });

    inject(DestroyRef).onDestroy(() => bar?.releaseUnit(this.identity));
  }
}

let unitCount = 0;

/**
 * A hairline between two runs of actions.
 *
 * It is the answer to the one line of `docs/component-features.md` §5 that names
 * no mechanism: a destructive action does not sit flush against a frequent one.
 * It is a part of this family rather than a `divider` because its geometry
 * belongs to the bar.
 */
@Directive({
  selector: '[slActionBarSeparator]',
  standalone: true,
  exportAs: 'slActionBarSeparator',
  host: {
    'data-part': 'separator',
    'data-part-separator': '',
    role: 'separator',
    'aria-orientation': 'vertical',
  },
})
export class SlActionBarSeparator {}
