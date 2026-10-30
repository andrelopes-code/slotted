import { isHeldOpen, nextOpenValues, sameOpenValues } from '@slotted/core/disclosure';
import { createArrowNavigation } from '@slotted/core/focus';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';

import { ACCORDION_DEFAULTS, injectAccordionDefaults } from './accordion-defaults';
import type {
  AccordionHeadingLevel,
  AccordionIndicator,
  AccordionMount,
  AccordionSelectionReason,
  AccordionSize,
  AccordionTogglePlacement,
  AccordionVariant,
} from './accordion-defaults';

export type {
  AccordionDefaults,
  AccordionHeadingLevel,
  AccordionIndicator,
  AccordionMount,
  AccordionSelectionReason,
  AccordionSize,
  AccordionTogglePlacement,
  AccordionVariant,
} from './accordion-defaults';

/**
 * The header of every item this set owns, and of no set nested inside it.
 * `:scope` is what keeps a nested accordion's headers out of the outer one's
 * arrow ring: root, item, header, trigger is exactly four levels.
 */
export const ACCORDION_TRIGGER_SELECTOR =
  ':scope > * > [data-part="header"] > [data-part="trigger"]';

/** The variant the set hands its items, per variant the set is drawn in. */
const ITEM_VARIANT: Record<AccordionVariant, 'plain' | 'ruled' | 'framed'> = {
  plain: 'plain',
  ruled: 'ruled',
  framed: 'ruled',
  separated: 'framed',
};

/**
 * A set of disclosures that share a value.
 *
 * **The keyboard is the pattern's, plus four keys that are not.** `Enter`,
 * `Space`, `Tab` and `Shift + Tab` are the platform's, and every header stays
 * in the page tab sequence — `w3c/aria-practices#3434` removed the roving
 * alternative from the pattern, and Base UI deprecated its own `loopFocus` and
 * `orientation` in the same change. `ArrowDown`, `ArrowUp`, `Home` and `End`
 * are shipped on top of that sequence, because Radix and Ark both ship them and
 * readers have learned them; they move focus and write no `tabindex`.
 *
 * **`requireOpen` marks the header it holds.** The pattern asks an accordion
 * that does not permit a panel to be collapsed to write `aria-disabled="true"`
 * on that header, and the APG's own example is the only surveyed source that
 * ships it.
 *
 * **The items are `collapsible`s, and nothing here selects into them.** The set
 * hands each one its appearance as a value, which is the rule `checkbox-group`
 * set for every group family in the library.
 */
@Component({
  selector: '[slAccordion]',
  standalone: true,
  exportAs: 'slAccordion',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/accordion/accordion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'accordion',
    'data-ui-accordion': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-disabled]': "disabled() ? '' : null",
  },
})
export class SlAccordion {
  /** The set of open values. Two-way, so a template may bind it directly. */
  readonly value = model<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  /**
   * Whether the set refuses to empty. The one open header then carries
   * `aria-disabled="true"`, which is what the pattern asks of an accordion that
   * does not permit its panel to be collapsed.
   */
  readonly requireOpen = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly size = input<AccordionSize | undefined>(undefined);
  readonly variant = input<AccordionVariant | undefined>(undefined);
  readonly indicator = input<AccordionIndicator | undefined>(undefined);
  readonly togglePlacement = input<AccordionTogglePlacement | undefined>(undefined);
  readonly headingLevel = input<AccordionHeadingLevel | undefined>(undefined);
  readonly mount = input<AccordionMount | undefined>(undefined);
  readonly truncate = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly loop = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });

  /**
   * One output for one transition, carrying the reason and the event. `value`
   * is the two-way half the ecosystem expects; this is the half a boolean
   * cannot say.
   */
  readonly valueChangeRequest = output<ChangeRequest<readonly string[]>>();

  private readonly defaults = injectAccordionDefaults();
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedIndicator = computed(() => this.indicator() ?? this.defaults.indicator);
  readonly resolvedTogglePlacement = computed(
    () => this.togglePlacement() ?? this.defaults.togglePlacement,
  );
  readonly resolvedHeadingLevel = computed(() => this.headingLevel() ?? this.defaults.headingLevel);
  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);
  readonly resolvedTruncate = computed(() => this.truncate() ?? this.defaults.truncate);
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);
  readonly resolvedMultiple = computed(() => this.multiple() ?? this.defaults.multiple);
  readonly resolvedRequireOpen = computed(() => this.requireOpen() ?? this.defaults.requireOpen);

  /** The variant this set hands each of its items, which is not always its own. */
  readonly itemVariant = computed(() => ITEM_VARIANT[this.resolvedVariant()]);

  constructor() {
    /**
     * The arrows move focus and nothing else. The engine writes no `tabindex`,
     * which is the whole difference between it and the roving stop `tabs` uses.
     */
    afterNextRender(() => {
      const navigation = createArrowNavigation(this.host, {
        itemSelector: ACCORDION_TRIGGER_SELECTOR,
        loop: () => this.resolvedLoop(),
        orientation: () => 'vertical',
      });
      const observer = new MutationObserver(() => navigation.refresh());
      observer.observe(this.host, { childList: true, subtree: true });

      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        navigation.destroy();
      });
    });
  }

  private options() {
    return { multiple: this.resolvedMultiple(), requireOpen: this.resolvedRequireOpen() };
  }

  /** Whether this value is one of the open ones. */
  holds(value: string): boolean {
    return this.value().includes(value);
  }

  /** Whether this value is open and the set refuses to let it close. */
  isHeld(value: string): boolean {
    return isHeldOpen(this.value(), value, this.options());
  }

  /** Asks the set to open or close one value. */
  toggle(value: string, reason: AccordionSelectionReason, source?: Event) {
    const next = nextOpenValues(this.value(), value, this.options());
    if (next === this.value()) return;
    this.commit(next, reason, source);
  }

  /**
   * Opens every item that is not disabled. It is Angular Material's `openAll`,
   * and it is reached through `exportAs` rather than through a handle.
   */
  openAll() {
    const values = this.items()
      .filter((item) => !item.hasAttribute('data-disabled'))
      .map((item) => item.getAttribute('data-value') ?? '');
    this.commit(this.resolvedMultiple() ? values : values.slice(0, 1), 'programmatic');
  }

  /** Closes every item, unless `requireOpen` holds the last one. */
  closeAll() {
    const current = this.value();
    if (this.resolvedRequireOpen() && current.length > 0) {
      this.commit(current.slice(0, 1), 'programmatic');
      return;
    }
    this.commit([], 'programmatic');
  }

  /**
   * The items, read from the DOM rather than from a registry. It is the one
   * order that is never stale, and it is how `tabs` reads its own collection.
   */
  private items(): HTMLElement[] {
    return [...this.host.querySelectorAll<HTMLElement>(':scope > [data-value]')];
  }

  private commit(next: readonly string[], reason: AccordionSelectionReason, source?: Event) {
    let cancelled = false;
    const state = createControllable<readonly string[]>({
      /* A `model` writes the change back itself, so the state is owned here and
         the request is what a consumer inspects and may refuse. */
      initial: this.value(),
      /* Two arrays are never `Object.is`, so a set states its own equality or
         emits a request on every change detection. */
      equals: sameOpenValues,
      onRequest: (request) => {
        this.valueChangeRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled || !moved) return;
    this.value.set(next);
  }
}

export { ACCORDION_DEFAULTS, injectAccordionDefaults };
