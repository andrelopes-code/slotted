import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostAttributeToken,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { injectListDefaults } from './list-defaults';
import type { ListMarker, ListSize, ListVariant } from './list-defaults';

export type { ListMarker, ListSize, ListVariant } from './list-defaults';

/**
 * A vertical run of related rows. The rows are `slListItem`, a family of its
 * own; this one decides how they are told apart, how much room each gets, what
 * is painted in the marker column and whether they keep their inline padding,
 * and hands those four down through the injector.
 *
 * The directive goes on the element the page wrote — `<ul slList>` or
 * `<ol slList>` — because the element carries the reading order and that is the
 * page's decision, not the family's.
 *
 * **`role="list"` is written, and it is not redundant.** The family draws its
 * own marker, because a row is a content box beside its independent targets and
 * CSS has no `display` that is both `list-item` and a grid. Safari and
 * VoiceOver drop list semantics the moment CSS removes the marker, so the role
 * restores what the layout costs. A `role` the consumer wrote themselves — a
 * `menu`, a `listbox` they are wiring — survives.
 *
 * The set holds no state a consumer can own. Selection with roving focus is
 * `listbox`'s and `table`'s: ARIA 1.2 does not allow `aria-selected` on
 * `listitem`, so a selection model here would announce nothing.
 */
@Component({
  selector: 'ul[slList], ol[slList]',
  standalone: true,
  exportAs: 'slList',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/list/list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'list',
    'data-ui-list': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'role()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-marker]': 'resolvedMarker()',
    '[attr.data-inset]': "resolvedInset() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.aria-busy]': "loading() ? 'true' : null",
  },
})
export class SlList {
  /** How the rows are told apart. Falls back to the injected default. */
  readonly variant = input<ListVariant>();
  /** The room a row gets. Falls back to the injected default. */
  readonly size = input<ListSize>();
  /** What is painted in the marker column. Falls back to the injected default. */
  readonly marker = input<ListMarker>();
  /**
   * Takes the rows' inline padding away, for a list inside a box that already
   * pads its own content. The rule and the fill still run edge to edge.
   */
  readonly inset = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * `aria-busy` on the set, which ARIA 1.2 §5.2.6 asks of a container whose
   * rows have not arrived. The family draws no placeholder: `skeleton` owns
   * that geometry and goes inside the rows.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  private readonly defaults = injectListDefaults();

  /** A role the consumer wrote is never replaced by the family's. */
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  protected readonly role = computed(() => this.writtenRole ?? 'list');
  /* Public, because a row reads them: the set is what a row asks when it has
     not been told itself. `role` stays protected — it is the host's alone. */
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedMarker = computed(() => this.marker() ?? this.defaults.marker);

  /**
   * Read by every row under this set, and by the row's own input first. The
   * input stays `undefined` until it is written, so a list that states
   * `inset="false"` under a provider that states `true` keeps its own answer —
   * `booleanAttribute` alone would fold the two together.
   */
  readonly resolvedInset = computed(() => (this.inset() ?? this.defaults.inset) === true);
}
