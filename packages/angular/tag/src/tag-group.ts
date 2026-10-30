import { createRemovalFocus, createRovingTabindex } from '@slotted/core/focus';
import type { RemovalFocusHandle, RovingTabindexHandle } from '@slotted/core/focus';
import {
  afterNextRender,
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
} from '@angular/core';

import type { TagOrientation } from './tag-defaults';

/**
 * Every control the keyboard moves between, in the order the DOM holds them: a
 * chip's own control, then its remove control, then the next chip's. Read
 * literally from the APG Toolbar pattern, which needs no second axis to reach
 * a control inside an item.
 */
const CONTROL_SELECTOR = '[data-part="body"]:is(a, button), [data-part="remove"]';

/**
 * The run of tags, and the keyboard that belongs to it.
 *
 * It is a toolbar: the APG pattern for "a container for grouping a set of
 * controls, such as buttons". One tab stop, arrow keys between the controls
 * inside it, `Home` and `End` at the ends. React Aria and Angular Material
 * reach for the Grid pattern instead, which buys a second axis at the price of
 * two wrapper elements per chip and a `gridcell` role over every button; a
 * single wrapping run does not need the second axis.
 *
 * Writing `role="list"` on the element turns the keyboard off and makes every
 * chip a `listitem`. A list is a structure rather than a widget, its items are
 * not controls to move between, and a screen reader announces its length.
 */
@Directive({
  selector: '[slTagGroup]',
  standalone: true,
  exportAs: 'slTagGroup',
  host: {
    'data-ui': 'tag',
    'data-ui-tag': '',
    'data-part': 'group',
    'data-part-group': '',
    tabindex: '-1',
    '[attr.data-orientation]': 'orientation()',
    '[attr.role]': 'role()',
    '[attr.aria-orientation]': 'ariaOrientation()',
  },
})
export class SlTagGroup {
  /** Which way the run reads. `vertical` also writes `aria-orientation`. */
  readonly orientation = input<TagOrientation>('horizontal');
  /** Whether the arrow keys wrap past the ends of the run. */
  readonly loop = input(true, { transform: booleanAttribute });

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  protected readonly role = computed(() => this.writtenRole ?? 'toolbar');
  private readonly roving = computed(() => this.role() === 'toolbar');
  protected readonly ariaOrientation = computed(() =>
    /* `horizontal` is the toolbar role's own default, so only the other one is
       written; a list has no orientation to state. */
    this.roving() && this.orientation() === 'vertical' ? 'vertical' : null,
  );

  /** What a chip inside this run calls itself. A toolbar's items are its controls. */
  readonly itemRole = computed(() => (this.role() === 'list' ? 'listitem' : undefined));

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (!this.roving()) return;

      const tabindex: RovingTabindexHandle = createRovingTabindex(this.element, {
        itemSelector: CONTROL_SELECTOR,
        loop: this.loop(),
        orientation: () => this.orientation(),
      });
      /**
       * Where the keyboard goes when the chip it was on is taken away. The
       * container is the last resort, which is why it holds `tabindex="-1"`: a
       * group emptied by its final removal keeps focus rather than returning
       * it to the top of the page.
       */
      const removal: RemovalFocusHandle = createRemovalFocus(this.element, {
        itemSelector: CONTROL_SELECTOR,
      });
      /**
       * The tab stop has to survive a chip arriving or leaving, and neither
       * binding can be told by the other's change detection. The DOM is the
       * one thing both of them agree on.
       */
      const observer = new MutationObserver(() => tabindex.refresh());
      observer.observe(this.element, { childList: true, subtree: true });

      destroyRef.onDestroy(() => {
        observer.disconnect();
        removal.destroy();
        tabindex.destroy();
      });
    });
  }
}
