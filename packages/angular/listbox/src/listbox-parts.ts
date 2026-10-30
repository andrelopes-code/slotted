import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlListboxContext } from './listbox-context';
import { SlListboxIdFactory } from './listbox-defaults';

/** The selector the listbox reads its collection through, in DOM order. */
export const OPTION_SELECTOR = "[data-part='option']";

/**
 * One option, and the four facts the listbox reads back off it.
 *
 * The collection is read from the DOM rather than from a registry, which is
 * what `menu` already does for its typeahead: DOM order is the reading order,
 * it survives arbitrary nesting inside groups, and it cannot disagree with what
 * the reader sees. The facts travel as data attributes, so nothing has to be
 * registered, unregistered or ordered by the time it was created.
 *
 * `aria-disabled` and never the native attribute: the pattern needs a disabled
 * option to keep its place in the set, and `navigateDisabled` is what decides
 * whether the arrows land on it.
 */
@Component({
  selector: '[slListboxOption]',
  standalone: true,
  exportAs: 'slListboxOption',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'option',
    'data-part-option': '',
    role: 'option',
    '[attr.id]': 'id()',
    '[attr.data-key]': 'value()',
    '[attr.data-text-value]': 'textValue() ?? null',
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-current]': "current() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
    '[attr.data-pinned]': "pinned() ? '' : null",
    '[attr.aria-selected]': 'ariaSelected()',
    '[attr.aria-disabled]': "resolvedDisabled() ? 'true' : null",
    '[attr.aria-setsize]': 'setSize()',
    '[attr.aria-posinset]': 'posInSet()',
    '[attr.tabindex]': 'tabIndex()',
    '(click)': 'onClick($event)',
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class SlListboxOption {
  /** The key this option chooses. It is what the listbox value holds. */
  readonly value = input.required<string>();
  /**
   * What typeahead matches and what a reader hears. Defaults to the option's
   * own text, which is wrong exactly when the option holds a mark, a badge or
   * a number the reader would not type.
   */
  readonly textValue = input<string | undefined>(undefined);
  /** Unstated rather than `false`, so the option defers to the listbox. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * Rendered outside the window that covers it, at its own place on the canvas.
   * The listbox pins the active option and the range anchor; nothing else sets
   * it, because an `aria-activedescendant` whose target has been recycled names
   * an id that is not in the document.
   */
  readonly pinned = input(false, { transform: booleanAttribute });

  private readonly listbox = inject(SlListboxContext);

  protected readonly id = computed(() => this.listbox.optionId(this.value()));
  protected readonly selected = computed(() => this.listbox.isSelected(this.value()));
  protected readonly current = computed(() => this.listbox.isActive(this.value()));
  protected readonly resolvedDisabled = computed(
    () => (this.disabled() ?? false) === true || this.listbox.listboxDisabled() === true,
  );
  protected readonly ariaSelected = computed(() =>
    this.listbox.selection() === 'none' ? null : this.selected() ? 'true' : 'false',
  );
  protected readonly setSize = computed(() => this.listbox.setSize());
  protected readonly posInSet = computed(() => this.listbox.posInSet(this.value()));
  protected readonly tabIndex = computed(() => this.listbox.optionTabIndex(this.value()));

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.listbox.press(this.value(), event);
  }

  /**
   * Only to stop the browser moving focus off the root. Under
   * `aria-activedescendant` the root is the focused element, and a press that
   * took focus to the option would leave the property pointing at something
   * that is no longer the active element.
   */
  protected onPointerDown(event: PointerEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();
  }
}

/**
 * A group of options, named by its own label. The pattern requires the name —
 * "each option group has an accessible name provided via aria-label or
 * aria-labelledby" — and requires the group to hold at least one option, which
 * is the consumer's to honour.
 */
@Component({
  selector: '[slListboxGroup]',
  standalone: true,
  exportAs: 'slListboxGroup',
  template: `@if (label()) {
      <div data-part="group-label" data-part-group-label="" [attr.id]="labelId">{{ label() }}</div>
    }
    <ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'group',
    'data-part-group': '',
    role: 'group',
    '[attr.aria-labelledby]': 'label() ? labelId : null',
    '[attr.aria-label]': 'label() ? null : ariaLabel()',
  },
})
export class SlListboxGroup {
  /** The group's accessible name, rendered as its own label row. */
  readonly label = input<string | undefined>(undefined);
  /**
   * The name without the row, which is what a windowed group takes when its
   * label has scrolled out of the slice: the run of options is still a group
   * and still has to be named.
   */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'groupLabel' });

  protected readonly labelId = inject(SlListboxIdFactory).next();
}

/**
 * The mark that says an option is chosen. The listbox reserves its column
 * whether or not the mark is painted, so a list does not shift sideways as one
 * option is chosen; `indicator="none"` removes the element and the column with
 * it. The tick is a `Glyph` sized by the column, and content the consumer
 * wrote replaces it.
 */
@Component({
  selector: '[slListboxIndicator]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon><svg slGlyph name="check"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'indicator', 'data-part-indicator': '', 'aria-hidden': 'true' },
})
export class SlListboxIndicator {}

/**
 * The option's own artwork, in the same column the mark uses and never beside
 * it: a `span[slIcon]` holding an `svg[slGlyph]`, or an element of the page's
 * own. The column sizes and centres it; no stylesheet fills it.
 */
@Directive({
  selector: '[slListboxIcon]',
  standalone: true,
  host: { 'data-part': 'icon', 'data-part-icon': '', 'aria-hidden': 'true' },
})
export class SlListboxIcon {}

/** The option's primary text, and the only one of the three columns that gives way. */
@Directive({
  selector: '[slListboxLabel]',
  standalone: true,
  host: { 'data-part': 'label', 'data-part-label': '' },
})
export class SlListboxLabel {}

/** A second line under the label, for what the label cannot say on its own. */
@Directive({
  selector: '[slListboxDescription]',
  standalone: true,
  host: { 'data-part': 'description', 'data-part-description': '' },
})
export class SlListboxDescription {}

/**
 * The value beside the name — a count, a price, a status word. `menu` calls the
 * same column `shortcut`, because a menu's third column holds a key binding.
 */
@Directive({
  selector: '[slListboxMeta]',
  standalone: true,
  host: { 'data-part': 'meta', 'data-part-meta': '' },
})
export class SlListboxMeta {}

/**
 * What the listbox says when it holds nothing. It lives inside the listbox for
 * the reason `list` records: outside it a reader hears "listbox, zero items"
 * and then nothing, and the words fall outside the box a framed listbox paints.
 *
 * It carries no role: `listbox` owns `option` and `group` and nothing else, so
 * a message with a role of its own would be an owned element ARIA does not
 * permit.
 */
@Directive({
  selector: '[slListboxEmpty]',
  standalone: true,
  host: { 'data-part': 'empty', 'data-part-empty': '' },
})
export class SlListboxEmpty {}

/**
 * The row at the end of a page that has not arrived. It is an `option` by role
 * and disabled, because a listbox owns nothing else and the row is not a
 * choice — which is also why it is not counted in `aria-setsize`.
 */
@Directive({
  selector: '[slListboxLoader]',
  standalone: true,
  host: { 'data-part': 'loader', 'data-part-loader': '', role: 'option', 'aria-disabled': 'true' },
})
export class SlListboxLoader {}

/**
 * The content of one option of a collection the listbox was handed. The family
 * renders the option element around it, so the template says what an option
 * holds and never how it is wired.
 */
@Directive({ selector: '[slListboxOptionContent]', standalone: true })
export class SlListboxOptionContent {}
