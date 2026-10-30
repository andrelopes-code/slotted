import { nextOpenValues, sameOpenValues } from '@slotted/core/disclosure';
import { createWidthGate } from '@slotted/core/measure';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { SlAppShellNav } from '@slotted/angular/app-shell';
import { injectMessages } from '@slotted/angular/i18n';
import {
  sideNavigationMessages,
  type PartialMessages,
  type SideNavigationMessages,
} from '@slotted/core/i18n';
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
  model,
  numberAttribute,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { injectSideNavigationDefaults } from './side-navigation-defaults';
import type {
  SideNavigationExpandedReason,
  SideNavigationFlyoutReason,
  SideNavigationMode,
  SideNavigationSize,
  SideNavigationTruncate,
  SideNavigationValueReason,
} from './side-navigation-defaults';

export type {
  SideNavigationDefaults,
  SideNavigationExpandedReason,
  SideNavigationFlyoutReason,
  SideNavigationMode,
  SideNavigationSize,
  SideNavigationTruncate,
  SideNavigationValueReason,
} from './side-navigation-defaults';

/** Every row a reader can land on, in the order the DOM holds them. */
export const SIDE_NAVIGATION_ROW_SELECTOR = '[data-part="link"], [data-part="trigger"]';

/**
 * A row the keyboard may land on: not inside a closed group. Read from the
 * structure rather than from the layout, so the answer is the same before the
 * stylesheet has loaded and in an environment with no layout at all.
 */
function visible(element: HTMLElement, root: HTMLElement): boolean {
  for (
    let group = element.closest<HTMLElement>('[data-part="group"]');
    group !== null && root.contains(group);
    group = group.parentElement?.closest<HTMLElement>('[data-part="group"]') ?? null
  ) {
    if (!group.parentElement?.hasAttribute('data-expanded')) return false;
  }
  return true;
}

/**
 * A column of destinations: nested groups, a current destination, and a rail
 * when the room it has is under `compactAt` pixels.
 *
 * The directive goes on the consumer's own element — `<nav slSideNavigation>`
 * standing alone, `<div slSideNavigation>` inside `app-shell`'s nav region,
 * which is already the navigation landmark. `landmark` decides whether the
 * name is written; the element is the consumer's, as it is everywhere in this
 * ecosystem.
 *
 * **Three values, three models.** `value` is the current destination and
 * `expanded` the set of open groups; `flyout` is the one group shown beside the
 * rail, transient by design, and it never writes into `expanded`.
 *
 * **The rail is a width.** The stylesheet decides the picture from the root's
 * own inline size, before any script; the width gate here writes
 * `data-compact` afterwards, and that is what turns on the tooltip and the
 * flyout.
 */
@Component({
  selector: '[slSideNavigation]',
  standalone: true,
  exportAs: 'slSideNavigation',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/side-navigation/side-navigation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'side-navigation',
    'data-ui-side-navigation': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-mode]': 'resolvedMode()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-truncate]': 'resolvedTruncate()',
    '[attr.data-guides]': "resolvedGuides() ? '' : null",
    '[attr.data-compact]': "compact() ? '' : null",
    '(keydown)': 'onKeyDown($event)',
  },
})
export class SlSideNavigation {
  /** The current destination's value. Two-way, so a template may bind it directly. */
  readonly value = model<string | null>(null);
  /** The set of open groups. */
  readonly expanded = model<readonly string[]>([]);
  /** The one group presented beside the rail, or null. */
  readonly flyout = model<string | null>(null);

  readonly size = input<SideNavigationSize | undefined>(undefined);
  readonly mode = input<SideNavigationMode | undefined>(undefined);
  readonly truncate = input<SideNavigationTruncate | undefined>(undefined);
  readonly multiple = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly autoExpand = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly guides = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * Whether the root is the navigation landmark. Unstated, it is one on its
   * own and not inside `app-shell`'s nav region, which already is.
   */
  readonly landmark = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /** The width, in CSS pixels, under which `mode="auto"` is compact. */
  readonly compactAt = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });
  /**
   * Words laid over the catalog of the language in force: the landmark's name
   * (`navigation`). A static `aria-label` still wins.
   */
  readonly messages = input<PartialMessages<SideNavigationMessages> | undefined>(undefined);

  /** One output for one transition, carrying the reason and the event. */
  readonly valueChangeRequest = output<ChangeRequest<string | null>>();
  readonly expandedChangeRequest = output<ChangeRequest<readonly string[]>>();
  readonly flyoutChangeRequest = output<ChangeRequest<string | null>>();

  private readonly defaults = injectSideNavigationDefaults();
  private readonly shell = inject(SlAppShellNav, { optional: true });
  /** The name the consumer wrote, kept over the family's own. */
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  readonly host: HTMLElement = inject(ElementRef).nativeElement;

  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedMode = computed(() => this.mode() ?? this.defaults.mode);
  readonly resolvedTruncate = computed(() => this.truncate() ?? this.defaults.truncate);
  readonly resolvedMultiple = computed(() => this.multiple() ?? this.defaults.multiple);
  readonly resolvedAutoExpand = computed(() => this.autoExpand() ?? this.defaults.autoExpand);
  readonly resolvedGuides = computed(() => this.guides() ?? this.defaults.guides);
  readonly resolvedCompactAt = computed(() => this.compactAt() ?? this.defaults.compactAt);
  readonly resolvedLandmark = computed(
    () => this.landmark() ?? (this.shell === null ? this.defaults.landmark : false),
  );
  /** The family's words in the language in force, with this column's `messages` laid over them. */
  readonly t = injectMessages(sideNavigationMessages, this.messages);

  protected readonly ariaLabel = computed(() =>
    this.resolvedLandmark() ? (this.writtenLabel ?? this.t('navigation')) : null,
  );

  /** Whether the root is under `compactAt`, measured. */
  private readonly narrow = signal(false);
  readonly compact = computed(
    () => this.resolvedMode() === 'compact' || (this.resolvedMode() === 'auto' && this.narrow()),
  );

  /** Moves when the root was resized or the fonts arrived, so a label measures again. */
  readonly measureTick = signal(0);

  /** The layer the flyout is drawn in, so the keyboard can walk into it. */
  readonly flyoutNode = signal<HTMLElement | null>(null);

  /** Every item's parent, so the ancestors of a destination can be opened. */
  private readonly parents = new Map<string, string | null>();

  constructor() {
    const destroyRef = inject(DestroyRef);

    /* After the first render and not in the constructor: a measure there
       forced a style pass before any binding existed — `compactAt` was still
       its default, and inside app-shell the column resolved at rail width and
       then animated open. */
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const gate = createWidthGate(this.host, {
        at: this.resolvedCompactAt(),
        onChange: (narrow) => this.narrow.set(narrow),
      });
      this.narrow.set(gate.narrow());
      destroyRef.onDestroy(() => gate.destroy());

      const observer = new ResizeObserver(() => this.measureTick.update((tick) => tick + 1));
      observer.observe(this.host);
      destroyRef.onDestroy(() => observer.disconnect());
      void this.host.ownerDocument.fonts?.ready.then(() =>
        this.measureTick.update((tick) => tick + 1),
      );
    });

    /* Compact mode ending takes the flyout with it: there is no rail to stand beside. */
    effect(() => {
      if (!this.compact() && this.flyout() !== null) this.setFlyout(null, 'resize');
    });

    /* The ancestors of the current destination open, with the reason select. */
    effect(() => {
      const current = this.value();
      if (!this.resolvedAutoExpand() || current === null) return;
      const open = this.expanded();
      const missing: string[] = [];
      for (
        let parent = this.parents.get(current) ?? null;
        parent !== null;
        parent = this.parents.get(parent) ?? null
      ) {
        if (!open.includes(parent)) missing.push(parent);
      }
      if (missing.length === 0) return;
      const next = this.resolvedMultiple()
        ? [...open, ...missing]
        : [missing[missing.length - 1] as string];
      this.requestExpanded(next, 'select');
    });
  }

  isExpanded(value: string): boolean {
    return this.expanded().includes(value);
  }

  /** An item says where it stands. */
  registerItem(value: string, parent: string | null): () => void {
    this.parents.set(value, parent);
    return () => {
      this.parents.delete(value);
    };
  }

  private requestExpanded(
    next: readonly string[],
    reason: SideNavigationExpandedReason,
    source?: Event,
  ) {
    const state = createControllable<readonly string[]>({
      equals: sameOpenValues,
      initial: this.expanded(),
      onRequest: (request) => this.expandedChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.expanded.set(next);
  }

  /** Asks the set of open groups to include or drop one value. */
  toggleExpanded(
    value: string,
    next: boolean,
    reason: SideNavigationExpandedReason,
    source?: Event,
  ) {
    const current = this.expanded();
    if (current.includes(value) === next) return;
    this.requestExpanded(
      nextOpenValues(current, value, { multiple: this.resolvedMultiple() }),
      reason,
      source,
    );
  }

  /** Asks the flyout to show one group, or none. */
  setFlyout(next: string | null, reason: SideNavigationFlyoutReason, source?: Event) {
    const state = createControllable<string | null>({
      initial: this.flyout(),
      onRequest: (request) => this.flyoutChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.flyout.set(next);
  }

  /** Asks the current destination to move. */
  select(next: string, reason: SideNavigationValueReason, source?: Event) {
    const state = createControllable<string | null>({
      initial: this.value(),
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.value.set(next);
  }

  /** Opens one group, with the reason `programmatic`. */
  expand(value: string) {
    this.toggleExpanded(value, true, 'programmatic');
  }

  /** Closes one group, with the reason `programmatic`. */
  collapse(value: string) {
    this.toggleExpanded(value, false, 'programmatic');
  }

  /** Focuses the first link or trigger in the column. */
  focus() {
    this.rows()[0]?.focus();
  }

  /** The rows the arrow keys walk, with the flyout's spliced in after its trigger. */
  rows(): HTMLElement[] {
    const inColumn = [
      ...this.host.querySelectorAll<HTMLElement>(SIDE_NAVIGATION_ROW_SELECTOR),
    ].filter((row) => visible(row, this.host));
    const layer = this.flyoutNode();
    const open = this.flyout();
    if (layer === null || open === null) return inColumn;
    const inLayer = [...layer.querySelectorAll<HTMLElement>(SIDE_NAVIGATION_ROW_SELECTOR)];
    const at = inColumn.findIndex(
      (row) => row.closest('[data-part="item"]')?.getAttribute('data-value') === open,
    );
    if (at === -1) return [...inColumn, ...inLayer];
    return [...inColumn.slice(0, at + 1), ...inLayer, ...inColumn.slice(at + 1)];
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (!target.matches(SIDE_NAVIGATION_ROW_SELECTOR)) return;

    if (event.key === 'Escape') {
      /* Inside the layer, the dismissable layer has already answered. */
      if (this.flyoutNode()?.contains(target)) return;
      const group = target.closest<HTMLElement>('[data-part="group"]');
      const item = group?.parentElement;
      const value = item?.getAttribute('data-value');
      if (!group || !item || !value || !item.hasAttribute('data-expanded')) return;
      event.preventDefault();
      this.toggleExpanded(value, false, 'escape', event);
      item.querySelector<HTMLElement>(':scope > [data-part="trigger"]')?.focus();
      return;
    }

    const step =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0;
    if (step === 0 && event.key !== 'Home' && event.key !== 'End') return;

    const all = this.rows();
    if (all.length === 0) return;
    event.preventDefault();
    const index = all.indexOf(target);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? all.length - 1
          : Math.min(all.length - 1, Math.max(0, index + step));
    all[next]?.focus();
  }
}
