import { matchRanges } from '@slotted/core/highlight';
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
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';

import { SlHighlight } from '@slotted/angular/highlight';

import { SlMultiSelect } from './multi-select';
import type { MultiSelectOptionValue } from './multi-select-defaults';

/**
 * One option, and the one that decides whether it belongs in the results.
 *
 * **Each option filters itself**, as `sl-combobox-item` does: the family holds
 * the query and the comparison, the option holds its own label, and the popup's
 * DOM is therefore the result set.
 *
 * **An option the set already holds is still an option.** It carries
 * `aria-selected="true"` and the check, and pressing it takes the value back
 * out; `chosenOptions="hide"` is the other answer, for a list long enough that
 * a reader would rather see only what is left.
 *
 * `label` is an input rather than projected content, which is the one place
 * this binding differs from its React counterpart: a comparison and a split
 * both need the text before the view exists.
 */
@Component({
  selector: 'sl-multi-select-item',
  standalone: true,
  exportAs: 'slMultiSelectItem',
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
    '[attr.data-text-value]': 'label()',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'inert() ? true : null',
    '[attr.aria-posinset]': 'position() ?? null',
    '[attr.aria-setsize]': 'position() === undefined ? null : (multiSelect.total() ?? null)',
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
      @if (ranges().length > 0) {
        <span slHighlight [text]="label()" [ranges]="ranges()"></span>
      } @else {
        {{ label() }}
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
export class SlMultiSelectItem {
  readonly value = input.required<MultiSelectOptionValue>();
  /** What the reader sees, what the filter compares, and what the mark splits. */
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly description = input<string | undefined>(undefined);
  /** The glyph drawn in the first column, as a `Glyph` inside an `Icon` box. */
  readonly icon = input<GlyphName | undefined>(undefined);
  readonly position = input(undefined, {
    transform: (given: number | string | undefined) =>
      given === undefined ? undefined : numberAttribute(given),
  });

  readonly multiSelect = inject(SlMultiSelect);

  readonly optionId = computed(() => this.multiSelect.optionId(this.value()));
  readonly selected = computed(() => this.multiSelect.value().includes(this.value()));
  readonly current = computed(() => this.multiSelect.highlightedValue() === this.value());
  /**
   * A full control refuses every value it does not already hold, and says so
   * where a reader can hear it. A control that silently ignores a press is a
   * control the reader presses again.
   */
  readonly inert = computed(() => this.disabled() || this.multiSelect.refuses(this.value()));
  readonly visible = computed(
    () =>
      this.multiSelect.matches(this.label()) &&
      !(this.selected() && this.multiSelect.resolvedChosenOptions() === 'hide'),
  );

  /**
   * The spans the query matched, from the same collator the filter used, drawn
   * by the `highlight` family inside this family's label. An `indexOf` beside
   * a locale-sensitive filter marks nothing on the row it has just matched.
   */
  readonly ranges = computed(() => {
    const query = this.multiSelect.query();
    if (!this.multiSelect.resolvedHighlightMatch() || query === '') return [];
    return matchRanges(this.label(), query, { locale: this.multiSelect.resolvedLocale() });
  });

  constructor() {
    /**
     * A hidden option is out of the result set, so the count and the label
     * registry both have to see the change. `hidden` rather than an `@if`,
     * because an option destroyed and rebuilt on every keystroke loses its
     * element identity — and with it whatever the reader's pointer was on.
     */
    afterRenderEffect(() => {
      this.visible();
      const value = this.value();
      const label = this.label();
      /* Untracked: what the parent reads while registering is its state, not
         this option's, and tracking it re-ran every option's effect on every
         open and every highlight move. */
      untracked(() => {
        this.multiSelect.registerLabel(value, label);
        this.multiSelect.collectionChanged();
      });
    });

    inject(DestroyRef).onDestroy(() => this.multiSelect.collectionChanged());
  }

  protected onPointerEnter(event: PointerEvent) {
    if (this.inert()) return;
    this.multiSelect.setHighlighted(this.value(), 'pointer', event);
  }

  /**
   * Only to stop the browser moving focus off the field: an option cannot hold
   * focus, so a press on it would take focus to the body and the blur path
   * would run in the middle of a choice.
   */
  protected onPointerDown(event: PointerEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();
  }

  protected onClick(event: MouseEvent) {
    if (this.inert()) return;
    this.multiSelect.toggle(this.value(), 'select', event);
    this.multiSelect.setInputValue('', 'select', event);
    if (this.multiSelect.resolvedCloseOnSelect()) this.multiSelect.setOpen(false, 'select', event);
    this.multiSelect.focus();
  }
}

/**
 * A set of options under a heading, named by `aria-labelledby` pointing at its
 * own label. A group whose every option was filtered away is hidden: a heading
 * with no options under it says a category matched when none did.
 */
@Component({
  selector: 'sl-multi-select-group',
  standalone: true,
  exportAs: 'slMultiSelectGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'group',
    'data-part-group': '',
    role: 'group',
    '[attr.aria-labelledby]': 'labelId',
    '[hidden]': 'empty()',
  },
  template: `
    <div data-part="group-label" data-part-group-label="" [id]="labelId">{{ label() }}</div>
    <ng-content />
  `,
})
export class SlMultiSelectGroup {
  readonly label = input.required<string>();
  readonly labelId = `sl-multi-select-group-${Math.random().toString(36).slice(2, 8)}`;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly multiSelect = inject(SlMultiSelect);
  readonly empty = signal(false);

  constructor() {
    /**
     * Measured after render rather than computed from the query: whether a
     * group still holds an option is a fact about the DOM its own children
     * produced, and a computed that read the DOM would be right once and stale
     * from then on. The set is read as well, because hiding a chosen option can
     * empty a group without the query moving at all.
     */
    afterRenderEffect(() => {
      this.multiSelect.query();
      this.multiSelect.value();
      const element = this.host.nativeElement as HTMLElement;
      this.empty.set(element.querySelector("[data-part='item']:not([hidden])") === null);
    });
  }
}

/** A line between two sets of options. */
@Component({
  selector: 'sl-multi-select-separator',
  standalone: true,
  exportAs: 'slMultiSelectSeparator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'separator', 'data-part-separator': '', role: 'separator' },
  template: '',
})
export class SlMultiSelectSeparator {}
