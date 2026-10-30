import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  numberAttribute,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';

import { matchRanges } from '@slotted/core/highlight';

import { SlHighlight } from '@slotted/angular/highlight';

import { SlSelect } from './select';
import type { SelectOptionValue } from './select-defaults';

/**
 * One option.
 *
 * `role="option"` on the host, and not a button: the listbox pattern's option
 * is not separately focusable — DOM focus stays on the trigger for the whole
 * interaction — and a button here would put a widget inside a widget and add a
 * tab stop the pattern excludes by name.
 *
 * The highlight is set by the pointer as well as by the keyboard, so exactly
 * one option is highlighted whichever device is driving and the state a screen
 * reader announces is the state the eye sees.
 */
@Component({
  selector: 'sl-select-item',
  standalone: true,
  exportAs: 'slSelectItem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [SlGlyph, SlHighlight, SlIcon],
  host: {
    'data-part': 'item',
    'data-part-item': '',
    role: 'option',
    '[id]': 'optionId()',
    '[hidden]': '!visible()',
    '[attr.data-value]': 'value()',
    '[attr.data-text-value]': 'searchText() || null',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'disabled() ? true : null',
    '[attr.aria-posinset]': 'position() ?? null',
    '[attr.aria-setsize]': 'position() === undefined ? null : (select.total() ?? null)',
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-current]': "current() ? '' : null",
    '(click)': 'onClick($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerenter)': 'onPointerEnter($event)',
  },
  template: `
    @if (icon(); as glyph) {
      <span data-part="icon" data-part-icon=""
        ><span slIcon><svg slGlyph [name]="glyph"></svg></span
      ></span>
    }
    <span data-part="label" data-part-label="">
      @if (label(); as text) {
        @if (ranges(text).length > 0) {
          <span slHighlight [text]="text" [ranges]="ranges(text)"></span>
        } @else {
          {{ text }}
        }
      } @else {
        <ng-content />
      }
    </span>
    @if (description()) {
      <span data-part="description" data-part-description="">{{ description() }}</span>
    }
    <span data-part="indicator" data-part-indicator=""
      ><span slIcon><svg slGlyph name="check"></svg></span
    ></span>
  `,
})
export class SlSelectItem {
  readonly value = input.required<SelectOptionValue>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly description = input<string | undefined>(undefined);
  /** The glyph drawn in the first column, as a `Glyph` inside an `Icon` box. */
  readonly icon = input<GlyphName | undefined>(undefined);
  /**
   * What typeahead matches on, what the search filters on, and what the mark
   * splits, when the label is not plain text.
   */
  readonly textValue = input<string | undefined>(undefined);
  /**
   * The label as text, given rather than projected.
   *
   * It is the one place this binding differs from its React counterpart, and it
   * is the difference `combobox` already records: a split needs the text before
   * the view exists, and Angular cannot read projected content that has not
   * been created. An option that projects its content instead is filtered on
   * `textValue` or on what it rendered, and its matched span is not marked —
   * there is nothing to split.
   */
  readonly label = input<string | undefined>(undefined);
  readonly position = input(undefined, {
    transform: (given: number | string | undefined) =>
      given === undefined ? undefined : numberAttribute(given),
  });

  readonly select = inject(SlSelect);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly optionId = computed(() => this.select.optionId(this.value()));
  readonly selected = computed(() => this.select.selection().includes(this.value()));
  readonly current = computed(() => this.select.highlightedValue() === this.value());

  /** What was rendered, for an option that projected its content. */
  private readonly rendered = signal('');

  /**
   * The text the filter judges: what the consumer said this option reads as,
   * then what it actually rendered. An option the filter cannot judge — one
   * whose content has not been created yet — is shown, which is what keeps a
   * list whole on its first render.
   */
  readonly searchText = computed(() => this.label() ?? this.textValue() ?? this.rendered());

  /**
   * Each option decides whether it belongs in the results: the family holds the
   * query and the comparison, and the option holds its own text. It hides
   * rather than leaving, because Angular cannot decline to render a host
   * component from inside it — and every reader of the collection takes the
   * visible ones.
   */
  readonly visible = computed(() => {
    const text = this.searchText();
    return text === '' || this.select.matches(text);
  });

  /**
   * The spans the query matched, from the same collator the filter used, drawn
   * by the `highlight` family inside this family's label. An `indexOf` beside
   * a locale-sensitive filter marks nothing on the row it has just matched.
   */
  ranges(text: string) {
    const query = this.select.query();
    if (!this.select.resolvedHighlightMatch() || query === '') return [];
    return matchRanges(text, query, { locale: this.select.resolvedLocale() });
  }

  constructor() {
    /**
     * The label reaches the closed control from here, and the count from the
     * same place. Both are read after render rather than from the input,
     * because the children may be elements and what a reader sees is the honest
     * answer either way.
     */
    afterRenderEffect(() => {
      /* Read so that hiding or showing this option re-runs the count: the
         popup's own answer to "how many are there" is what draws the empty row
         and what the live region announces. */
      this.visible();
      const element = this.host.nativeElement as HTMLElement;
      const text = element.querySelector("[data-part='label']")?.textContent?.trim() ?? '';
      if (text !== '') this.rendered.set(text);
      const label = this.label() ?? this.textValue() ?? text;
      if (label !== '') this.select.registerLabel(this.value(), label);
      this.select.recount();
    });

    inject(DestroyRef).onDestroy(() => this.select.recount());
  }

  protected onPointerEnter(event: PointerEvent) {
    if (this.disabled()) return;
    this.select.setHighlighted(this.value(), 'pointer', event);
  }

  /**
   * Only to stop the browser moving focus off the trigger. Under
   * `aria-activedescendant` the trigger is the focused element, and a press that
   * took focus to the body would leave the property pointing at something that
   * is no longer the active element (CB11).
   */
  protected onPointerDown(event: PointerEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();
  }

  protected onClick(event: MouseEvent) {
    if (this.disabled()) return;
    this.select.toggle(this.value(), 'pointer', event);
    /* Multiple selection keeps the popup open, so a reader can take three
       options without reopening it twice. */
    if (this.select.resolvedCloseOnSelect() && !this.select.resolvedMultiple()) {
      this.select.setOpen(false, 'select', event);
      this.select.focus();
      return;
    }
    /* The popup stayed open, so the query is emptied here rather than by the
       close: a list still filtered to the row the reader has just taken is a
       list that looks broken. */
    this.select.setQuery('', 'select', event);
    this.select.focusSearch();
  }
}

/**
 * A set of options under a heading, named by `aria-labelledby` pointing at its
 * own label — which the listbox pattern requires of every option group. The
 * label is an input rather than a projected part, because a group with no
 * accessible name is a pattern violation the type system can refuse.
 */
@Component({
  selector: 'sl-select-group',
  standalone: true,
  exportAs: 'slSelectGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'group',
    'data-part-group': '',
    role: 'group',
    '[hidden]': 'empty()',
    '[attr.aria-labelledby]': 'labelId',
  },
  template: `
    <div data-part="group-label" data-part-group-label="" [id]="labelId">{{ label() }}</div>
    <ng-content />
  `,
})
export class SlSelectGroup {
  readonly label = input.required<string>();
  readonly labelId = `sl-select-group-${Math.random().toString(36).slice(2, 8)}`;

  private readonly select = inject(SlSelect);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly empty = signal(false);

  constructor() {
    /* A group whose every option was filtered away renders nothing at all: a
       heading with no options under it says a category matched when none did.
       The query is read so that a moving query re-measures the group. */
    afterRenderEffect(() => {
      this.select.query();
      const element = this.host.nativeElement as HTMLElement;
      this.empty.set(element.querySelector("[data-part='item']:not([hidden])") === null);
    });
  }
}

/**
 * A line between two sets of options. `role="separator"` inside a listbox is a
 * structural element and takes no orientation: the line is horizontal because
 * the list is vertical, and saying so twice is how two families came to
 * disagree about which axis the word names.
 */
@Component({
  selector: 'sl-select-separator',
  standalone: true,
  exportAs: 'slSelectSeparator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'separator', 'data-part-separator': '', role: 'separator' },
  template: '',
})
export class SlSelectSeparator {}
