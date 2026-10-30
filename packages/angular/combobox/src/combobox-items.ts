import { matchRanges } from '@slotted/core/highlight';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
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

import { SlCombobox } from './combobox';
import type { ComboboxOptionValue } from './combobox-defaults';

/**
 * The first column, holding an element of the consumer's own — an avatar, a
 * logo — where the `icon` input names only a glyph. React's `icon` prop takes
 * any element, and this is the same column in the same part.
 */
@Directive({
  selector: '[slComboboxItemIcon]',
  standalone: true,
  host: { 'data-part': 'icon', 'data-part-icon': '' },
})
export class SlComboboxItemIcon {}

/**
 * One option, and the one that decides whether it belongs in the results.
 *
 * **Each option filters itself.** The family holds the query and the
 * comparison; the option holds its own label. An option that does not match
 * renders nothing at all, so the popup's DOM *is* the result set — which is
 * what makes the count, the keyboard model and the empty row read one answer.
 *
 * `label` is an input rather than projected content here, and that is the one
 * place this binding differs from its React counterpart: a comparison and a
 * split both need the text before the view exists, and Angular has no way to
 * read projected content that has not been created.
 */
@Component({
  selector: 'sl-combobox-item',
  standalone: true,
  exportAs: 'slComboboxItem',
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
    '[attr.aria-disabled]': 'disabled() ? true : null',
    '[attr.aria-posinset]': 'position() ?? null',
    '[attr.aria-setsize]': 'position() === undefined ? null : (combobox.total() ?? null)',
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-current]': "current() ? '' : null",
    '(click)': 'onClick($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerenter)': 'onPointerEnter($event)',
  },
  template: `
    <ng-content select="[slComboboxItemIcon]" />
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
export class SlComboboxItem {
  readonly value = input.required<ComboboxOptionValue>();
  /** What the reader sees, what the filter compares, and what the mark splits. */
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly description = input<string | undefined>(undefined);
  /**
   * The glyph drawn in the first column, as a `Glyph` inside an `Icon` box. An
   * element of the consumer's own goes there through `slComboboxItemIcon`.
   */
  readonly icon = input<GlyphName | undefined>(undefined);
  readonly position = input(undefined, {
    transform: (given: number | string | undefined) =>
      given === undefined ? undefined : numberAttribute(given),
  });

  readonly combobox = inject(SlCombobox);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly optionId = computed(() => this.combobox.optionId(this.value()));
  readonly selected = computed(() => this.combobox.value() === this.value());
  readonly current = computed(() => this.combobox.highlightedValue() === this.value());
  readonly visible = computed(() => this.combobox.matches(this.label()));

  /**
   * The spans the query matched, from the same collator the filter used, drawn
   * by the `highlight` family inside this family's label. An `indexOf` beside
   * a locale-sensitive filter marks nothing on the row it has just matched.
   */
  readonly ranges = computed(() => {
    const query = this.combobox.query();
    if (!this.combobox.resolvedHighlightMatch() || query === '') return [];
    return matchRanges(this.label(), query, { locale: this.combobox.resolvedLocale() });
  });

  constructor() {
    /**
     * A hidden option is out of the result set, so the count and the label
     * registry both have to see the change. `hidden` rather than an `@if`,
     * because an option that is destroyed and rebuilt on every keystroke loses
     * its element identity — and with it whatever the reader's pointer was on.
     */
    afterRenderEffect(() => {
      this.visible();
      const value = this.value();
      const label = this.label();
      /* Untracked: what the parent reads while registering is its state, not
         this option's, and tracking it re-ran every option's effect on every
         open and every highlight move. */
      untracked(() => {
        this.combobox.registerLabel(value, label);
        this.combobox.collectionChanged();
      });
    });

    inject(DestroyRef).onDestroy(() => this.combobox.collectionChanged());
  }

  protected onPointerEnter(event: PointerEvent) {
    if (this.disabled()) return;
    this.combobox.setHighlighted(this.value(), 'pointer', event);
  }

  /**
   * Only to stop the browser moving focus off the input: an option cannot hold
   * focus, so a press on it would take focus to the body — and the settling of
   * CB7 would run on the query the reader was in the middle of choosing from,
   * before the click arrived (CB11).
   */
  protected onPointerDown(event: PointerEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();
  }

  protected onClick(event: MouseEvent) {
    if (this.disabled()) return;
    this.combobox.commitOption(this.value(), 'pointer', event);
    this.combobox.focus();
  }
}

/**
 * A set of options under a heading, named by `aria-labelledby` pointing at its
 * own label. A group whose every option was filtered away is hidden: a heading
 * with no options under it says a category matched when none did.
 */
@Component({
  selector: 'sl-combobox-group',
  standalone: true,
  exportAs: 'slComboboxGroup',
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
export class SlComboboxGroup {
  readonly label = input.required<string>();
  readonly labelId = `sl-combobox-group-${Math.random().toString(36).slice(2, 8)}`;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly combobox = inject(SlCombobox);
  readonly empty = signal(false);

  constructor() {
    /**
     * Measured after render rather than computed from the query: whether a
     * group still holds an option is a fact about the DOM its own children
     * produced, and a computed that read the DOM would be right once and stale
     * from then on.
     */
    afterRenderEffect(() => {
      this.combobox.query();
      const element = this.host.nativeElement as HTMLElement;
      this.empty.set(element.querySelector("[data-part='item']:not([hidden])") === null);
    });
  }
}

/** A line between two sets of options. */
@Component({
  selector: 'sl-combobox-separator',
  standalone: true,
  exportAs: 'slComboboxSeparator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'separator', 'data-part-separator': '', role: 'separator' },
  template: '',
})
export class SlComboboxSeparator {}
