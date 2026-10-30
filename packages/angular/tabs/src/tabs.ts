import { createRemovalFocus, createRovingTabindex } from '@slotted/core/focus';
import type { RemovalFocusHandle, RovingTabindexHandle } from '@slotted/core/focus';
import { createIndicator } from '@slotted/core/measure';
import { createScrollAffordance, NOT_OVERFLOWING } from '@slotted/core/overflow';
import type { OverflowState, ScrollAffordanceHandle } from '@slotted/core/overflow';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { injectTabsDefaults, SlTabsIdFactory } from './tabs-defaults';
import type {
  TabsActivation,
  TabsActivationDirection,
  TabsFit,
  TabsMount,
  TabsOrientation,
  TabsSize,
  TabsTrack,
  TabsVariant,
} from './tabs-defaults';

export type {
  TabsActivation,
  TabsActivationDirection,
  TabsDefaults,
  TabsFit,
  TabsMount,
  TabsOrientation,
  TabsSize,
  TabsTrack,
  TabsVariant,
} from './tabs-defaults';

/** Every tab in the list, in the order the DOM holds them. */
export const TAB_SELECTOR = '[data-part="tab"]';

/** Why the selection moved. */
export type TabsSelectionReason = 'pointer' | 'keyboard' | 'remove' | 'programmatic';

/** Why a tab was dismissed. */
export type TabsDismissReason = 'pointer' | 'keyboard';

/**
 * The request a dismissal carries. It holds no value pair, because nothing is
 * replacing anything: the value being dismissed is `value`, and the shape is
 * `tag`'s, which set the convention for a removal in this library.
 */
export interface TabsDismissRequest {
  readonly value: string;
  readonly reason: TabsDismissReason;
  readonly source: Event;
  readonly cancelled: boolean;
  cancel(): void;
}

/**
 * An identifier from a value, injectively.
 *
 * A value is the consumer's own string and may hold a space, which no
 * identifier may. Escaping the characters an identifier refuses — rather than
 * replacing them — is what keeps two values from wiring one panel.
 */
export function escapeTabValue(value: string): string {
  return value.replace(/[^\w-]/g, (character) => `-${character.charCodeAt(0).toString(16)}-`);
}

/**
 * One view out of several, and the panels under it.
 *
 * **The keyboard is the APG's, and it is implemented once.** The list is a
 * roving tab stop from `@slotted/core/focus`: `Tab` enters on the selected tab,
 * the arrows of the flow axis move and wrap, `Home` and `End` reach the ends,
 * and the cross axis is left alone so the page still scrolls with focus inside
 * a horizontal list. `Delete` dismisses a dismissible tab, and focus lands
 * where the pattern says.
 *
 * **The marker moves without a measurement.** The root records which way the
 * selection travelled and the stylesheet turns that into a transform origin, so
 * the family is right in a server response and during the first paint.
 *
 * **The paging controls belong to the root**, because the root owns the observer
 * that knows whether they are needed. They are out of the tab sequence and out
 * of the accessibility tree: the arrows already reach every tab and bring it
 * into view.
 */
@Component({
  selector: '[slTabs]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  exportAs: 'slTabs',
  template: `<ng-content />
    @if (paging()) {
      <button
        aria-hidden="true"
        data-part="scroll"
        data-part-scroll=""
        data-direction="start"
        type="button"
        tabindex="-1"
        [disabled]="overflow().atStart"
        (click)="page(-1)"
      >
        <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
      </button>
      <button
        aria-hidden="true"
        data-part="scroll"
        data-part-scroll=""
        data-direction="end"
        type="button"
        tabindex="-1"
        [disabled]="overflow().atEnd"
        (click)="page(1)"
      >
        <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
      </button>
    }`,
  styleUrl: '../../../styles/src/tabs/tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'tabs',
    'data-ui-tabs': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-track]': 'resolvedTrack()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-fit]': 'resolvedFit()',
    '[attr.data-activation-direction]': 'direction()',
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-overflowing]': "overflow().overflowing ? '' : null",
  },
})
export class SlTabs implements OnInit {
  /** Present means the consumer owns the selection. */
  readonly value = input<string | undefined>(undefined);
  /** The value an uncontrolled family starts from, read once. */
  readonly defaultValue = input<string | undefined>(undefined);
  readonly activation = input<TabsActivation | undefined>(undefined);
  readonly orientation = input<TabsOrientation | undefined>(undefined);
  readonly size = input<TabsSize | undefined>(undefined);
  readonly variant = input<TabsVariant | undefined>(undefined);
  /** `none` draws no line at all, for a list standing on one the page drew. */
  readonly track = input<TabsTrack | undefined>(undefined);
  readonly fit = input<TabsFit | undefined>(undefined);
  readonly mount = input<TabsMount | undefined>(undefined);
  readonly loop = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /** Reaches every tab as the native attribute, which is also what makes the
      browser skip it with the arrow keys. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** One output for one transition, carrying the reason and the event. */
  readonly valueChange = output<ChangeRequest<string | undefined>>();
  /**
   * Asked before a tab is dismissed. The family removes nothing: the consumer
   * owns the collection, and a component that removed itself would render
   * nothing while the consumer's array still held the item.
   */
  readonly tabDismiss = output<TabsDismissRequest>();

  private readonly defaults = injectTabsDefaults();
  private readonly baseId = inject(SlTabsIdFactory).next();
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly own = signal<string | undefined>(undefined);
  private readonly listElement = signal<HTMLElement | null>(null);
  private readonly seen = new Set<string>();
  private roving: RovingTabindexHandle | null = null;
  private affordance: ScrollAffordanceHandle | null = null;

  protected readonly direction = signal<TabsActivationDirection>('none');
  protected readonly overflow = signal<OverflowState>(NOT_OVERFLOWING);

  readonly selection = computed(() => this.value() ?? this.own());
  readonly resolvedActivation = computed(() => this.activation() ?? this.defaults.activation);
  readonly resolvedOrientation = computed(() => this.orientation() ?? this.defaults.orientation);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedTrack = computed(() => this.track() ?? this.defaults.track);
  readonly resolvedFit = computed(() => this.fit() ?? this.defaults.fit);
  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);

  protected readonly paging = computed(
    () => this.overflow().overflowing && this.resolvedOrientation() === 'horizontal',
  );

  constructor() {
    /**
     * The list constructs before this runs and hands over its element; the
     * handles are created once, after the first render, because two of them
     * measure and all three read the DOM the tabs are in.
     */
    afterNextRender(() => {
      const list = this.listElement();
      if (list !== null) this.observe(list);
    });
  }

  ngOnInit() {
    if (this.value() === undefined) this.own.set(this.defaultValue());
    const start = this.selection();
    if (start !== undefined) this.seen.add(start);
  }

  /** The identifiers a tab and its panel are wired together with. */
  identify(value: string) {
    const escaped = escapeTabValue(value);
    return { panelId: `${this.baseId}-panel-${escaped}`, tabId: `${this.baseId}-tab-${escaped}` };
  }

  /** Whether this value is the selected one. Read by every tab and panel. */
  holds(value: string): boolean {
    return this.selection() === value;
  }

  /** Whether this value has ever been selected, which is what `lazy` reads. */
  hasSeen(value: string): boolean {
    return this.seen.has(value);
  }

  /**
   * The list hands the root its element. The root owns the roving tab stop, the
   * removal focus and the overflow observer — all three are about that element,
   * and the root is what holds the value they act on.
   */
  attachList(element: HTMLElement) {
    this.listElement.set(element);
  }

  private tabElements(): HTMLElement[] {
    const list = this.listElement();
    return list === null ? [] : [...list.querySelectorAll<HTMLElement>(TAB_SELECTOR)];
  }

  private indexOf(value: string | undefined): number {
    if (value === undefined) return -1;
    return this.tabElements().findIndex((item) => item.getAttribute('data-value') === value);
  }

  /**
   * Asks the family to select one value. The direction is set in the same turn,
   * so the marker's origin and the selection reach the DOM in one paint.
   */
  select(next: string, reason: TabsSelectionReason, source?: Event) {
    if (next === this.selection()) return;

    let cancelled = false;
    const state = createControllable<string | undefined>({
      controlled: this.value(),
      initial: this.selection(),
      onRequest: (request) => {
        this.valueChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;

    const from = this.indexOf(this.selection());
    const to = this.indexOf(next);
    if (from !== -1 && to !== -1) this.direction.set(to > from ? 'forward' : 'backward');

    this.seen.add(next);
    if (moved) this.own.set(next);

    /* The tab stop follows the selection, which is where `Tab` from outside the
       list lands. The DOM order does not change here, so the index is read
       straight away rather than waiting for a render. */
    if (to !== -1) this.roving?.setActive(to);
    this.revealSelected();
  }

  /**
   * The neighbour a dismissal leaves the selection to: the tab that followed
   * the dismissed one, or the one before it when the dismissed tab was last.
   * It is the APG's own focus rule for `Delete`, applied to the value.
   */
  private neighbourOf(dismissed: string): string | undefined {
    const values = this.tabElements()
      .map((item) => item.getAttribute('data-value'))
      .filter((candidate): candidate is string => candidate !== null);
    const index = values.indexOf(dismissed);
    if (index === -1) return undefined;
    return values[index + 1] ?? values[index - 1];
  }

  dismiss(value: string, reason: TabsDismissReason, source: Event) {
    let cancelled = false;
    const request: TabsDismissRequest = {
      value,
      reason,
      source,
      get cancelled() {
        return cancelled;
      },
      cancel() {
        cancelled = true;
      },
    };
    this.tabDismiss.emit(request);
    if (cancelled) return;

    if (!this.holds(value)) return;
    const next = this.neighbourOf(value);
    if (next !== undefined) this.select(next, 'remove', source);
  }

  /** Puts the tab stop on the selected tab and brings it into view. */
  syncSelection() {
    const index = this.indexOf(this.selection());
    if (index === -1) return;
    this.roving?.setActive(index);
    this.revealSelected();
  }

  private revealSelected() {
    const item = this.tabElements()[this.indexOf(this.selection())];
    if (item !== undefined) this.affordance?.reveal(item);
  }

  protected page(direction: -1 | 1) {
    this.affordance?.page(direction);
  }

  private observe(list: HTMLElement) {
    const tabindex = createRovingTabindex(list, {
      crossAxis: false,
      itemSelector: TAB_SELECTOR,
      loop: this.resolvedLoop(),
      onMove: (_index, item) => {
        this.affordance?.reveal(item);
        if (this.resolvedActivation() !== 'automatic') return;
        const next = item.getAttribute('data-value');
        if (next !== null) this.select(next, 'keyboard');
      },
      orientation: () => this.resolvedOrientation(),
    });
    this.roving = tabindex;

    /**
     * Where the keyboard goes when the tab it was on is dismissed. The list
     * is the last resort, which is why it holds `tabindex="-1"`: a list
     * emptied by its final dismissal keeps focus rather than returning it
     * to the top of the page.
     */
    const removal: RemovalFocusHandle = createRemovalFocus(list, {
      itemSelector: TAB_SELECTOR,
    });
    /**
     * A list that starts to overflow — on its first render, or later when its
     * stylesheet arrives, a drawer opens or a hidden panel is shown — draws its
     * paging controls, and they narrow it: a tab revealed against the wider list
     * ended behind the end control. The selected tab is revealed again once the
     * controls are in the layout, on that transition and on no other, so a
     * reader scrolling the list keeps control.
     */
    let overflowing = false;
    const affordance = createScrollAffordance(list, {
      onChange: (state) => {
        this.overflow.set(state);
        if (state.overflowing && !overflowing) {
          afterNextRender(() => this.revealSelected(), { injector: this.injector });
        }
        overflowing = state.overflowing;
      },
    });
    this.affordance = affordance;
    this.overflow.set(affordance.state());

    /** The marker the list draws under the selected tab, measured by `createIndicator`. */
    const indicator = createIndicator(list, {
      orientation: () => this.resolvedOrientation(),
      part: 'marker',
      target: () =>
        list.querySelector<HTMLElement>(
          ':scope > [data-part="item"][data-selected] > [data-part="tab"]',
        ),
    });

    /**
     * A tab arriving or leaving has to reach both handles, and neither
     * binding can be told by the other's change detection. The DOM is the
     * one thing they agree on.
     */
    const observer = new MutationObserver(() => {
      tabindex.refresh();
      affordance.refresh();
      this.syncSelection();
    });
    observer.observe(list, { childList: true, subtree: true });
    this.syncSelection();

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      indicator.destroy();
      removal.destroy();
      affordance.destroy();
      tabindex.destroy();
      this.roving = null;
      this.affordance = null;
    });
  }
}
