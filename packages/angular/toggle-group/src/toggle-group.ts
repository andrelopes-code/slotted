import { createRovingTabindex } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';

import { SlField } from '@slotted/angular/field';

import { injectToggleGroupDefaults } from './toggle-group-defaults';
import type {
  ToggleGroupOrientation,
  ToggleGroupSize,
  ToggleGroupVariant,
} from './toggle-group-defaults';

export type {
  ToggleGroupDefaults,
  ToggleGroupOrientation,
  ToggleGroupSize,
  ToggleGroupVariant,
} from './toggle-group-defaults';

/** Why the value moved. A toggle group can produce exactly these two. */
export type ToggleGroupSelectionReason = 'pointer' | 'keyboard';

/** The items the arrows move between. */
const ITEM_SELECTOR = '[data-part="item"]';

/**
 * A set of two-state buttons that share one value.
 *
 * **The arrows move focus and never toggle.** Each item is the APG Button
 * pattern's toggle button, activated by `Space` and `Enter` alone; the
 * movement between them is the Toolbar pattern's roving tabindex. The family
 * whose arrows move the value is `segmented-control`, and it is a radio group
 * because that is the pattern describing that interaction.
 *
 * **Inside a `toolbar` the group stands down.** A bar is one tab stop with
 * arrow navigation across every control it holds, so a group running a second
 * ring inside it would put two tab stops where the APG asks for one. The bar is
 * found in the DOM by its public identifier rather than by injecting the other
 * family, so neither depends on the other; `rovingFocus` states it outright
 * for a bar this library did not write.
 *
 * **The value is always an array.** `multiple` caps it at one entry rather
 * than changing its type, so both bindings hold one shape and a `model()` can
 * hold it. A single-select consumer writes an array of one, which is the price.
 */
@Component({
  selector: '[slToggleGroup]',
  standalone: true,
  exportAs: 'slToggleGroup',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/toggle-group/toggle-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'toggle-group',
    'data-ui-toggle-group': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'resolvedRole',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-attached]': "resolvedAttached() ? '' : null",
    '[attr.data-full-width]': "fullWidth() ? '' : null",
    '[attr.aria-orientation]': 'ariaOrientation()',
    '[attr.aria-labelledby]': 'labelledBy()',
  },
})
export class SlToggleGroup implements OnInit {
  /** Present means the consumer owns the set. */
  readonly value = input<readonly string[] | undefined>(undefined);
  /** The value an uncontrolled group starts from, read once. */
  readonly defaultValue = input<readonly string[] | undefined>(undefined);
  /** Whether more than one item may be on at a time. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /**
   * Whether the last item on may be turned off. Ignored while `multiple` is
   * true, where a set may always empty.
   */
  readonly deselectable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly size = input<ToggleGroupSize | undefined>(undefined);
  readonly variant = input<ToggleGroupVariant | undefined>(undefined);
  readonly orientation = input<ToggleGroupOrientation | undefined>(undefined);
  readonly attached = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly loop = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Unstated rather than `false`, so an item may state its own. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Whether the group holds one tab stop of its own. Unstated, it is inferred
   * from the bar it is in.
   */
  readonly rovingFocus = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /** One output for one transition, carrying the reason and the event. */
  readonly valueChange = output<ChangeRequest<readonly string[]>>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly defaults = injectToggleGroupDefaults();
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });
  private readonly field = inject(SlField, { optional: true });
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  /* A group has no element a label's for can reach, so inside a field the
     field's label names it, unless the consumer named it themselves. */
  protected readonly labelledBy = computed(
    () =>
      this.writtenLabelledBy ??
      (this.writtenLabel === null ? (this.field?.ids().label ?? null) : null),
  );
  private readonly writtenOrientation = inject(new HostAttributeToken('aria-orientation'), {
    optional: true,
  });

  private readonly own = signal<readonly string[]>([]);
  private readonly insideToolbar = signal(false);
  private handle: RovingTabindexHandle | undefined;

  readonly selection = computed(() => this.value() ?? this.own());
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedOrientation = computed(() => this.orientation() ?? this.defaults.orientation);
  /* Chips stand apart by definition: a joined row of them is a bar. */
  readonly resolvedAttached = computed(
    () => this.resolvedVariant() !== 'chips' && (this.attached() ?? this.defaults.attached),
  );
  readonly resolvedDeselectable = computed(() => this.deselectable() ?? this.defaults.deselectable);
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);
  readonly resolvedDisabled = computed(() => this.disabled());
  readonly resolvedRovingFocus = computed(() => this.rovingFocus() ?? !this.insideToolbar());

  /** A consumer's own wins. The family writes `group` and never `toolbar`. */
  protected readonly resolvedRole = this.writtenRole ?? 'group';
  /**
   * Written only when the group flows the other way: `group` carries no
   * implied orientation, so the attribute says something exactly when the
   * arrows have moved to the block axis.
   */
  protected readonly ariaOrientation = computed(
    () =>
      this.writtenOrientation ?? (this.resolvedOrientation() === 'vertical' ? 'vertical' : null),
  );

  constructor() {
    /**
     * The bar is found in the DOM rather than injected, so neither family
     * depends on the other and `data-ui` — which is public contract — is what
     * answers. It runs after the first render, so a server-rendered group
     * carries its own tab stop for one frame and the bar takes it over on
     * hydration, before a reader can reach it with `Tab`.
     */
    afterNextRender(() => {
      this.insideToolbar.set(
        (this.host.nativeElement as HTMLElement).closest('[data-ui="toolbar"]') !== null,
      );
    });

    effect((onCleanup) => {
      if (!this.resolvedRovingFocus()) return;
      const loop = this.resolvedLoop();
      const orientation = this.resolvedOrientation();

      this.handle = createRovingTabindex(this.host.nativeElement as HTMLElement, {
        itemSelector: ITEM_SELECTOR,
        loop: () => loop,
        orientation: () => orientation,
      });
      onCleanup(() => {
        this.handle?.destroy();
        this.handle = undefined;
      });
    });

    inject(DestroyRef).onDestroy(() => this.handle?.destroy());
  }

  ngOnInit() {
    if (this.value() === undefined) this.own.set(this.defaultValue() ?? []);
  }

  /** An item joined or left the set, so the ring re-reads what it moves between. */
  refresh() {
    this.handle?.refresh();
  }

  /** Whether one value is on. Read by every item in the set. */
  holds(value: string): boolean {
    return this.selection().includes(value);
  }

  /** Asks the group to turn one value on or off. */
  toggle(value: string, reason: ToggleGroupSelectionReason, source: Event) {
    const current = this.selection();
    const on = current.includes(value);
    let next: readonly string[];

    if (this.multiple()) {
      next = on ? current.filter((entry) => entry !== value) : [...current, value];
    } else if (on) {
      /* The last one on stays on unless the group was told it may empty. */
      if (!this.resolvedDeselectable()) return;
      next = [];
    } else {
      next = [value];
    }

    let cancelled = false;
    const state = createControllable<readonly string[]>({
      controlled: this.value(),
      equals: (a, b) => a.length === b.length && a.every((entry, at) => entry === b[at]),
      initial: current,
      onRequest: (request) => {
        this.valueChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (!cancelled && moved) this.own.set(next);
  }
}
