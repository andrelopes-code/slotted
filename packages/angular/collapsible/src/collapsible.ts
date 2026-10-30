import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { SlAccordion } from '@slotted/angular/accordion';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';

import { injectCollapsibleDefaults, SlCollapsibleIdFactory } from './collapsible-defaults';
import type {
  CollapsibleIndicator,
  CollapsibleLevel,
  CollapsibleMount,
  CollapsibleOpenReason,
  CollapsibleSize,
  CollapsibleTogglePlacement,
  CollapsibleVariant,
} from './collapsible-defaults';

export type {
  CollapsibleDefaults,
  CollapsibleIndicator,
  CollapsibleLevel,
  CollapsibleMount,
  CollapsibleOpenReason,
  CollapsibleSize,
  CollapsibleTogglePlacement,
  CollapsibleVariant,
} from './collapsible-defaults';

/** The trigger of one disclosure, in the order the DOM holds them. */
export const COLLAPSIBLE_TRIGGER_SELECTOR = '[data-part="trigger"]';

/**
 * One disclosure: a header the reader operates and a panel it controls.
 *
 * **The keyboard is the platform's.** The trigger is a `button`, so `Enter` and
 * `Space` toggle without the family binding a key, and every trigger stays in
 * the page tab sequence — which is what the APG's accordion pattern requires
 * and what `w3c/aria-practices#3434` removed the roving alternative for.
 *
 * **The panel opens without being measured.** The stylesheet transitions a grid
 * track between `0fr` and `1fr`, so the height is the content's own at every
 * frame. Radix, Base UI, Ark and Angular Material each read the layout and
 * write a custom property, which is wrong for one frame on the server and stale
 * until a resize observer fires.
 *
 * **Inside an `slAccordion` the value belongs to the set.** The disclosure then
 * reports its own request as well, so a consumer may watch one panel without
 * unpacking the set's array.
 */
@Component({
  selector: '[slCollapsible]',
  standalone: true,
  exportAs: 'slCollapsible',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/collapsible/collapsible.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'collapsible',
    'data-ui-collapsible': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-value]': 'identity()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-indicator]': 'resolvedIndicator()',
    '[attr.data-toggle-placement]': 'resolvedTogglePlacement()',
    '[attr.data-mount]': 'resolvedMount()',
    '[attr.data-truncate]': "resolvedTruncate() ? '' : null",
    '[attr.data-open]': "isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
  },
})
export class SlCollapsible implements OnInit {
  /** Whether the panel is open. Two-way, so a template may bind it directly. */
  readonly open = model<boolean>(false);
  /**
   * What this disclosure is called inside an accordion. It is identity rather
   * than state — the state model is `open` — and the set's array holds it. One
   * that states none is given one from the id factory.
   */
  readonly value = input<string | undefined>(undefined);
  /** Unstated rather than false, so the disclosure defers to the set around it. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * Whether the panel's content is still on its way. The panel keeps a line's
   * height and carries `aria-busy`; what stands in for the content is
   * `slSkeleton`, composed by the consumer.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Whether the panel is a `region` landmark. Off by default: the APG's own
   * example warns that a landmark per panel fills the landmark list.
   */
  readonly region = input(false, { transform: booleanAttribute });
  readonly size = input<CollapsibleSize | undefined>(undefined);
  readonly variant = input<CollapsibleVariant | undefined>(undefined);
  readonly indicator = input<CollapsibleIndicator | undefined>(undefined);
  readonly togglePlacement = input<CollapsibleTogglePlacement | undefined>(undefined);
  readonly level = input<CollapsibleLevel | undefined>(undefined);
  readonly mount = input<CollapsibleMount | undefined>(undefined);
  readonly truncate = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });

  /** One output for one transition, carrying the reason and the event. */
  readonly openChangeRequest = output<ChangeRequest<boolean>>();

  private readonly defaults = injectCollapsibleDefaults();
  /** The set this disclosure is in, or nothing: a standalone one is complete. */
  private readonly group = inject(SlAccordion, { optional: true });
  private readonly generated = inject(SlCollapsibleIdFactory).next();

  readonly identity = computed(() => this.value() ?? this.generated);

  /**
   * Three owners, in one order. The set's value wins over the disclosure's own
   * `open` because the set is what a consumer wrote when they wrote an
   * accordion; a disclosure standing alone owns the value outright.
   */
  readonly isOpen = computed(() =>
    this.group === null ? this.open() : this.group.holds(this.identity()),
  );

  /** Whether the set refuses to let this one close, which the APG marks. */
  readonly held = computed(() => this.group?.isHeld(this.identity()) ?? false);

  readonly resolvedDisabled = computed(
    () => (this.disabled() ?? this.group?.disabled() ?? false) === true,
  );
  readonly resolvedSize = computed(
    () => this.size() ?? this.group?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedVariant = computed(
    () => this.variant() ?? this.group?.itemVariant() ?? this.defaults.variant,
  );
  readonly resolvedIndicator = computed(
    () => this.indicator() ?? this.group?.resolvedIndicator() ?? this.defaults.indicator,
  );
  readonly resolvedTogglePlacement = computed(
    () =>
      this.togglePlacement() ??
      this.group?.resolvedTogglePlacement() ??
      this.defaults.togglePlacement,
  );
  readonly resolvedLevel = computed(
    () => this.level() ?? this.group?.resolvedHeadingLevel() ?? this.defaults.level,
  );
  readonly resolvedMount = computed(
    () => this.mount() ?? this.group?.resolvedMount() ?? this.defaults.mount,
  );
  readonly resolvedTruncate = computed(
    () => (this.truncate() ?? this.group?.resolvedTruncate() ?? this.defaults.truncate) === true,
  );

  /** Whether this panel has ever been open, which is what `lazy` reads. */
  private readonly everOpened = signal(false);
  readonly seen = computed(() => this.everOpened() || this.isOpen());

  ngOnInit() {
    if (this.isOpen()) this.everOpened.set(true);
  }

  /** The identifiers that wire the trigger to its panel. */
  ids() {
    return {
      panelId: `${this.generated}-panel`,
      triggerId: `${this.generated}-trigger`,
    };
  }

  /**
   * Asks to open or close. The set is asked after this disclosure's own
   * consumer has had the chance to refuse; it owns the array, so it decides
   * what `multiple` and `requireOpen` make of the request.
   */
  toggle(next: boolean, reason: CollapsibleOpenReason, source?: Event) {
    if (next === this.isOpen()) return;

    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.isOpen(),
      onRequest: (request) => {
        this.openChangeRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;

    if (next) this.everOpened.set(true);
    if (this.group !== null) {
      this.group.toggle(this.identity(), reason, source);
      return;
    }
    if (moved) this.open.set(next);
  }
}
