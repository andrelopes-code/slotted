import { SlList } from '@slotted/angular/list';
import type { ListMarker, ListVariant } from '@slotted/angular/list';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { injectListItemDefaults } from './list-item-defaults';
import type {
  ListItemAlign,
  ListItemCurrent,
  ListItemSize,
  ListItemTone,
} from './list-item-defaults';

export type {
  ListItemAlign,
  ListItemCurrent,
  ListItemSize,
  ListItemTone,
} from './list-item-defaults';

/**
 * One entry of a `slList`: the `li`, and every state the row paints. The box
 * that is read, hovered, focused and sometimes activated is `slListItemContent`
 * on the element the page chose, and `slListItemActions` is that box's sibling
 * — interactive content may not nest inside `a` or `button`.
 *
 * Four values come from the list when the row does not state them: `variant`,
 * `size`, `marker` and `inset`. Everything else is a fact about this row.
 *
 * **No state attribute the roles model forbids reaches the `li`.** ARIA 1.2
 * deprecates `aria-disabled` on `listitem`, so `disabled` is painted from
 * `data-disabled` and the attribute that means it is written on the box.
 * `aria-current` is inherited by the role and is not deprecated, so `current`
 * is announced here.
 */
@Component({
  selector: 'li[slListItem]',
  standalone: true,
  exportAs: 'slListItem',
  imports: [SlGlyph, SlIcon],
  /* The bullet is the dot glyph in a part of its own before the row's content;
     the number is a counter the stylesheet writes, because it is text rather
     than an icon. */
  template: `@if (resolvedMarker() === 'bullet') {
      <span data-part="marker" data-part-marker="" aria-hidden="true"
        ><span slIcon><svg slGlyph name="dot"></svg></span
      ></span>
    }
    <ng-content></ng-content>`,
  styleUrl: '../../../styles/src/list-item/list-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'list-item',
    'data-ui-list-item': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-marker]': 'resolvedMarker()',
    '[attr.data-align]': 'resolvedAlign()',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-inset]': "resolvedInset() ? '' : null",
    '[attr.data-truncate]': "resolvedTruncate() ? '' : null",
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-current]': "current() === false ? null : ''",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.aria-current]': 'ariaCurrent()',
    '[attr.aria-posinset]': 'position() ?? null',
    '[attr.aria-setsize]': 'setSize() ?? null',
  },
})
export class SlListItem {
  /** How the rows are told apart. Falls back to the list, then to `plain`. */
  readonly variant = input<ListVariant | undefined>(undefined);
  /** The room the row gets. Falls back to the list, then the token, then `md`. */
  readonly size = input<ListItemSize | undefined>(undefined);
  /** What is painted in the marker column. Falls back to the list, then `none`. */
  readonly marker = input<ListMarker | undefined>(undefined);
  /** Where the leading visual sits against a row of more than one line. */
  readonly align = input<ListItemAlign | undefined>(undefined);
  /** The row's ink and the wash under the pointer. Falls back to `secondary`. */
  readonly tone = input<ListItemTone | undefined>(undefined);
  /** Takes the row's inline padding away. Falls back to the list, then the token. */
  readonly inset = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /** Clips the title and the lines under it to one line each. The string stays. */
  readonly truncate = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * Mirrors a selection the page owns. `aria-selected` is not valid on
   * `listitem`, so the row paints it and the control the page puts in
   * `slListItemStart` — a `slCheckbox` — is what announces it.
   */
  readonly selected = input(false, { transform: booleanAttribute });
  /**
   * The row the reader is on. `true` writes `aria-current="true"`; a token
   * writes that token, and `page` is what a navigation list wants.
   */
  readonly current = input<ListItemCurrent>(false);
  /**
   * The row dims and stops answering the pointer. The attribute that means it
   * goes on the box inside and never on this `li`, which ARIA 1.2 forbids.
   */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * `aria-busy` on the box, and the activation withdrawn so the command cannot
   * run twice. The row keeps its width and its accessible name; what stands in
   * for the content is `slSkeleton`, composed by the page.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * The row's place in a set only part of which is in the document — a page of
   * results, a filtered list. ARIA 1.2 is explicit that it is unnecessary while
   * every row is present, so it is written only when stated.
   */
  readonly position = input<number | undefined>(undefined);
  /** How many rows the set holds, when only part of it is in the document. */
  readonly setSize = input<number | undefined>(undefined);

  private readonly defaults = injectListItemDefaults();
  private readonly list = inject(SlList, { optional: true });
  /** An `aria-current` the consumer wrote is never replaced by the family's. */
  private readonly writtenCurrent = inject(new HostAttributeToken('aria-current'), {
    optional: true,
  });

  readonly resolvedVariant = computed(
    () => this.variant() ?? this.list?.resolvedVariant() ?? 'plain',
  );
  readonly resolvedSize = computed(
    () => this.size() ?? this.list?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedMarker = computed(() => this.marker() ?? this.list?.resolvedMarker() ?? 'none');
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  readonly resolvedTone = computed(() => this.tone() ?? this.defaults.tone);
  readonly resolvedInset = computed(
    () => (this.inset() ?? this.list?.resolvedInset() ?? this.defaults.inset) === true,
  );
  readonly resolvedTruncate = computed(() => (this.truncate() ?? this.defaults.truncate) === true);

  /** The two states the box inside has to answer, and the only pair it reads. */
  readonly blocked = computed(() => this.disabled() || this.loading());

  constructor() {
    /**
     * The refusal, and it lives here rather than on the box because this is the
     * only place the DOM guarantees it runs first.
     *
     * A directive's host listener and a `(click)` the page wrote on the same
     * element are both listeners on the event's target, and at the target the
     * DOM invokes listeners in registration order — the capture flag decides
     * nothing there. The page's binding was registered first, so a refusal on
     * the box arrived after the handler it was meant to stop. A capture
     * listener on an *ancestor* has no such tie: it always runs before any
     * listener on a descendant.
     *
     * It refuses only what is inside `content`. A control the page put in
     * `slListItemActions` is the page's own to disable, which is the rule
     * `card` states for the same shape.
     */
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const refuse = (event: Event) => {
      if (!this.blocked()) return;
      const target = event.target as Element | null;
      if (target?.closest('[data-part="content"]') == null) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    host.addEventListener('click', refuse, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      host.removeEventListener('click', refuse, { capture: true }),
    );
  }

  protected readonly ariaCurrent = computed(() => {
    if (this.writtenCurrent !== null) return this.writtenCurrent;
    const current = this.current();
    if (current === false) return null;
    return current === true ? 'true' : current;
  });
}
