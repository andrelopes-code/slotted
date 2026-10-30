import { createFilter, moveIndex, revealWithin } from '@slotted/core/collection';
import type { MoveIntent } from '@slotted/core/collection';
import { tabbables } from '@slotted/core/focus';
import { createWidthGate } from '@slotted/core/measure';
import type { WidthGateHandle } from '@slotted/core/measure';
import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { selectMessages, type PartialMessages, type SelectMessages } from '@slotted/core/i18n';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  TemplateRef,
  viewChild,
  ViewContainerRef,
  ViewEncapsulation,
  type EmbeddedViewRef,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlField } from '@slotted/angular/field';

import { injectSelectDefaults } from './select-defaults';

/** The width, in CSS pixels, under which a chip has no room for a word (SL4). */
export const NARROW_WIDTH = 120;
import type {
  SelectAlign,
  SelectFilter,
  SelectHighlightReason,
  SelectItems,
  SelectMount,
  SelectOpenReason,
  SelectOption,
  SelectOptionGroup,
  SelectOptionValue,
  SelectSearchReason,
  SelectSelection,
  SelectSide,
  SelectSize,
  SelectStrategy,
  SelectValueReason,
  SelectVariant,
  SelectWidth,
} from './select-defaults';
import { SlSelectValue } from './select-value';

export * from './select-defaults';
export { SlSelectValue } from './select-value';

/** Where the highlight lands when the popup opens. */
type Entry = 'selected' | 'first' | 'last' | 'none';

/* A filtered-out option stays in the DOM and hides: Angular cannot decline to
   render a host component from inside it. Every reader of the collection —
   the movement keys, the count, the entry highlight — takes the visible ones,
   which is the selector `combobox` already writes for the same reason. */
const OPTION_SELECTOR = "[data-part='item']:not([hidden])";

const isGroup = (entry: SelectItems[number]): entry is SelectOptionGroup => 'options' in entry;

const flatten = (items: SelectItems | undefined): readonly SelectOption[] =>
  items === undefined ? [] : items.flatMap((entry) => (isGroup(entry) ? entry.options : [entry]));

/**
 * A control that shows the current choice and opens a listbox of the rest.
 *
 * **The host element is the control.** `sl-select` carries `data-ui` and the
 * frame's own `data-part`, and the button, the chevron, the clear button and
 * the hidden native `select` are its template — the same shape `text-field`
 * has, where the frame draws the border and the ring because a ring can only be
 * drawn by an ancestor of whatever took focus.
 *
 * **The popup is an `ng-template` built into the portal when it opens**, which
 * is how `sl-menu` is built and for the same reason: a surface that has to
 * escape its parent's clipping cannot be rendered where it was declared. It
 * also makes `mount` a real axis here — a hundred options are not constructed
 * until the popup is.
 *
 * **Focus never leaves the button.** The highlighted option is named by
 * `aria-activedescendant`, which is what the APG's own select-only combobox
 * example does and what this family's pair, `combobox`, has no choice about.
 */
@Component({
  selector: 'sl-select',
  standalone: true,
  exportAs: 'slSelect',
  imports: [NgTemplateOutlet, SlGlyph, SlIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../../../styles/src/select/select.css', '../../../styles/src/tag/tag.css'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlSelect), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlSelect), multi: true },
  ],
  host: {
    'data-ui': 'select',
    'data-ui-select': '',
    'data-part': 'root',
    'data-part-root': '',
    /* The name a page writes on the element is forwarded to the control, and
       the root keeps none: ARIA 1.2 does not name a generic element. */
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-full-width]': "resolvedFullWidth() ? '' : null",
    '[attr.data-multiple]': "resolvedMultiple() ? '' : null",
    '[attr.data-open]': "isOpen() ? '' : null",
    '(pointerdown)': 'onFramePointerDown()',
    '(focusin)': 'prepare()',
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() ? '' : null",
    '[attr.data-required]': "resolvedRequired() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.data-narrow]': "narrow() ? '' : null",
  },
  template: `
    <button
      #trigger
      type="button"
      role="combobox"
      data-part="trigger"
      data-part-trigger=""
      [id]="triggerId"
      [attr.aria-haspopup]="resolvedSearch() ? 'dialog' : 'listbox'"
      [disabled]="resolvedDisabled()"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-controls]="isOpen() ? contentId : null"
      [attr.aria-activedescendant]="triggerActiveDescendant()"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="labelledBy()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-readonly]="resolvedReadOnly() ? true : null"
      [attr.aria-required]="resolvedRequired() ? true : null"
      [attr.aria-invalid]="resolvedInvalid() ? true : null"
      (click)="onTriggerClick($event)"
      (keydown)="onKeyDown($event)"
      (blur)="onBlur()"
    >
      <span
        data-part="value"
        data-part-value=""
        [attr.data-placeholder]="selection().length === 0 ? '' : null"
        [attr.data-unmatched]="unmatched() ? '' : null"
      >
        @if (summaryTemplate(); as template) {
          <ng-container
            [ngTemplateOutlet]="template"
            [ngTemplateOutletContext]="{ $implicit: selection(), labels: labels() }"
          />
        } @else if (resolvedMultiple() && selection().length > 1) {
          <span data-part="summary" data-part-summary="">{{ summary() }}</span>
        } @else {
          {{ summary() }}
        }
      </span>
    </button>

    <!--
      The chips, over the trigger rather than inside it: the trigger is a
      button, and a remove control inside one is a control inside a control
      (SL4). The stylesheet places the row over the trigger's own content box
      and lets every press it does not want through to the button underneath.
    -->
    @if (resolvedMultiple() && selection().length > 0) {
      <span #tags data-part="tags" data-part-tags="">
        @for (value of selection(); track value) {
          <span
            data-ui="tag"
            data-ui-tag=""
            data-part="root"
            data-part-root=""
            data-size="sm"
            data-variant="soft"
          >
            <span data-part="body" data-part-body="">
              <span data-part="label" data-part-label="">{{ labelFor(value) ?? value }}</span>
            </span>
            <button
              type="button"
              data-part="remove"
              data-part-remove=""
              [disabled]="resolvedDisabled() || resolvedReadOnly()"
              [attr.aria-label]="removeLabelFor(value)"
              (click)="onRemoveChip(value, $event)"
            >
              <span slIcon><svg slGlyph name="x"></svg></span>
            </button>
          </span>
        }
        <span
          #chipOverflow
          data-ui="tag"
          data-ui-tag=""
          data-part="root"
          data-part-root=""
          data-size="sm"
          data-variant="soft"
          data-overflow
          hidden
        >
          <span data-part="body" data-part-body=""
            ><span data-part="label" data-part-label="">+{{ collapsedCount() || 1 }}</span></span
          >
        </span>
      </span>
    }

    @if (showClear()) {
      <button
        type="button"
        data-part="clear"
        data-part-clear=""
        [attr.aria-label]="t('clear')"
        (click)="onClear($event)"
      >
        <span slIcon><svg slGlyph name="x"></svg></span>
      </button>
    }
    @if (loading()) {
      <span
        data-part="busy"
        data-part-busy=""
        data-ui="spinner"
        data-ui-spinner=""
        aria-hidden="true"
        ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.875" />
          <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
      ></span>
    } @else {
      <span data-part="arrow" data-part-arrow=""
        ><span slIcon><svg slGlyph name="chevron-down"></svg></span
      ></span>
    }

    @if (name(); as submissionName) {
      <select
        aria-hidden="true"
        tabindex="-1"
        [name]="submissionName"
        [attr.form]="form() ?? null"
        [multiple]="resolvedMultiple()"
        [disabled]="resolvedDisabled()"
        [required]="resolvedRequired()"
        style="
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          padding: 0;
          border: 0;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        "
      >
        <option value=""></option>
        @for (held of selection(); track $index) {
          <option [value]="held" selected>{{ labelFor(held) ?? held }}</option>
        }
      </select>
    }

    <!--
      The rows the popup holds, stamped into the listbox wherever the listbox
      is: the surface itself without a search field, and the list part one
      element in with one. They are a template rather than markup written twice
      because ng-content may be projected into exactly one place, and the
      options are that one place.
    -->
    <ng-template #rows>
      <!--
            Everything that is chosen, at the top of the popup (SL10). The
            control holds one line, so twelve values are three chips and a
            count; here they are all of them, and the band scrolls at about two
            rows of its own rather than growing the surface.

            It is aria-hidden, and carries no remove control. The reason is
            keyboard reach: without a search field focus never enters this
            layer at all, and with one the layer spends its single Tab on
            commiting and leaving the control — so a widget in the band would
            answer the pointer and nothing else. What it says is already said,
            by the trigger's own name and by each option's aria-selected.
          -->
      @if (resolvedMultiple() && selection().length > 0) {
        <div data-part="chosen" data-part-chosen="" aria-hidden="true">
          @for (value of selection(); track value) {
            <span
              data-ui="tag"
              data-ui-tag=""
              data-part="root"
              data-part-root=""
              data-size="sm"
              data-variant="soft"
            >
              <span data-part="body" data-part-body="">
                <span data-part="label" data-part-label="">{{ labelFor(value) ?? value }}</span>
              </span>
            </span>
          }
        </div>
      }
      <ng-content />
      @if (loading()) {
        <!--
              The wait, as the shape of the list that is coming: three rows the
              height of an option, drawn by the skeleton sheet (SL6/CB5). Hidden
              assistive technology — the status row is the live region.
            -->
        <div data-part="placeholder" data-part-placeholder="" aria-hidden="true">
          @for (row of [0, 1, 2]; track row) {
            <div>
              <span
                data-ui="skeleton"
                data-ui-skeleton=""
                data-part="root"
                data-part-root=""
                data-shape="text"
                data-loading
              ></span>
            </div>
          }
        </div>
      }
      @if (!loading() && empty()) {
        <div data-part="empty" data-part-empty="">{{ t('empty') }}</div>
      }
      @if (loading() || resolvedSearch()) {
        <!--
              The live region. While an answer is travelling it says so; while
              the reader is searching it says how many options survived the
              query, which is what docs/component-features.md §6 asks of a
              filtered collection. An empty row draws nothing.
            -->
        <div
          data-part="status"
          data-part-status=""
          role="status"
          aria-live="polite"
          [attr.data-loading]="loading() ? '' : null"
        >
          {{ statusMessage() }}
        </div>
      }
    </ng-template>

    <ng-template #layer>
      <div
        data-ui="select"
        data-ui-select=""
        data-part="positioner"
        data-part-positioner=""
        [attr.data-align]="resolvedAlign()"
        [attr.data-size]="resolvedSize()"
        [attr.data-width]="resolvedWidth()"
        [attr.data-open]="isOpen() ? '' : null"
        [attr.inert]="isOpen() ? null : ''"
      >
        <div
          #surface
          data-part="content"
          data-part-content=""
          [attr.role]="resolvedSearch() ? 'dialog' : 'listbox'"
          [attr.data-search]="resolvedSearch() ? '' : null"
          [id]="contentId"
          [attr.aria-labelledby]="ariaLabel() === undefined ? triggerId : null"
          [attr.aria-label]="ariaLabel() ?? null"
          [attr.aria-multiselectable]="resolvedSearch() || !resolvedMultiple() ? null : true"
          [attr.aria-busy]="resolvedSearch() || !loading() ? null : true"
          [attr.data-loading]="loading() ? '' : null"
        >
          <!--
            The field the reader filters with, and the listbox one element in.
            The combobox pattern lists the four roles a popup may carry and a
            popup holding a text field is a dialog, so the listbox moves inside
            it: a listbox holds options and groups, and a text field is neither.
          -->
          @if (resolvedSearch()) {
            <div data-part="search" data-part-search="">
              <span data-part="search-icon" data-part-search-icon="" aria-hidden="true"
                ><span slIcon><svg slGlyph name="search"></svg></span
              ></span>
              <input
                #search
                type="text"
                role="combobox"
                data-part="search-input"
                data-part-search-input=""
                autocomplete="off"
                spellcheck="false"
                aria-expanded="true"
                aria-autocomplete="list"
                [id]="searchId"
                [attr.aria-controls]="listId"
                [attr.aria-activedescendant]="activeDescendant()"
                [attr.aria-label]="t('search')"
                [placeholder]="t('searchPlaceholder')"
                [value]="query()"
                (input)="onSearchInput($event)"
                (keydown)="onSearchKeyDown($event)"
              />
            </div>
          }
          @if (resolvedSearch()) {
            <div
              data-part="list"
              data-part-list=""
              role="listbox"
              [id]="listId"
              [attr.aria-labelledby]="triggerId"
              [attr.aria-multiselectable]="resolvedMultiple() ? true : null"
              [attr.aria-busy]="loading() ? true : null"
            >
              <ng-container [ngTemplateOutlet]="rows" />
            </div>
          } @else {
            <ng-container [ngTemplateOutlet]="rows" />
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class SlSelect implements ControlValueAccessor, Validator {
  private static readonly flag = (given: boolean | string | undefined) =>
    given === undefined ? undefined : booleanAttribute(given);
  private static readonly count = (given: number | string | undefined) =>
    given === undefined ? undefined : numberAttribute(given);

  /** The chosen value, or the chosen values when `multiple` is set. */
  readonly value = model<SelectSelection>(null);
  readonly valueChangeRequest = output<ChangeRequest<SelectSelection>>();

  readonly open = model<boolean>(false);
  readonly openChangeRequest = output<ChangeRequest<boolean>>();

  /** The option the highlight is on, which is not the option that is chosen. */
  readonly highlightedValue = model<SelectOptionValue | null>(null);
  readonly highlightedValueChangeRequest = output<ChangeRequest<SelectOptionValue | null>>();

  /**
   * What the reader has typed into the search field. It is a value the consumer
   * can own and it is **not** the selection: no request ever carries both.
   */
  readonly searchValue = model<string>('');
  readonly searchValueChangeRequest = output<ChangeRequest<string>>();

  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly placeholder = input<string>('');
  readonly name = input<string | undefined>(undefined);
  readonly form = input<string | undefined>(undefined);
  /** Labels for values, so a closed control can name one it never rendered. */
  readonly items = input<SelectItems | undefined>(undefined);
  readonly total = input(undefined, { transform: SlSelect.count });

  readonly size = input<SelectSize | undefined>(undefined);
  readonly variant = input<SelectVariant | undefined>(undefined);
  readonly side = input<SelectSide | undefined>(undefined);
  readonly align = input<SelectAlign | undefined>(undefined);
  readonly width = input<SelectWidth | undefined>(undefined);
  readonly mount = input<SelectMount | undefined>(undefined);
  readonly strategy = input<SelectStrategy | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the clear
   * button, the chips, the summary, the search field, and the sentences.
   */
  readonly messages = input<PartialMessages<SelectMessages> | undefined>(undefined);
  /** Whether an option answers the query. `null` turns filtering off. */
  readonly filter = input<SelectFilter | undefined>(undefined);
  /** BCP 47, for the comparison the default filter makes. */
  /** BCP 47, for the comparison the default filter makes. The language in force when absent. */
  readonly locale = input<string | undefined>(undefined);

  readonly sideOffset = input(undefined, { transform: SlSelect.count });
  readonly alignOffset = input(undefined, { transform: SlSelect.count });
  readonly collisionPadding = input(undefined, { transform: SlSelect.count });
  readonly typeaheadTimeout = input(undefined, { transform: SlSelect.count });

  readonly multiple = input(undefined, { transform: SlSelect.flag });
  readonly clearable = input(undefined, { transform: SlSelect.flag });
  readonly loop = input(undefined, { transform: SlSelect.flag });
  readonly search = input(undefined, { transform: SlSelect.flag });
  readonly highlightMatch = input(undefined, { transform: SlSelect.flag });
  readonly typeahead = input(undefined, { transform: SlSelect.flag });
  readonly closeOnSelect = input(undefined, { transform: SlSelect.flag });
  readonly closeOnEscape = input(undefined, { transform: SlSelect.flag });
  readonly closeOnOutsidePress = input(undefined, { transform: SlSelect.flag });
  readonly flip = input(undefined, { transform: SlSelect.flag });
  readonly shift = input(undefined, { transform: SlSelect.flag });
  readonly hideWhenDetached = input(undefined, { transform: SlSelect.flag });
  readonly portal = input(undefined, { transform: SlSelect.flag });
  readonly fullWidth = input(undefined, { transform: SlSelect.flag });
  readonly disabled = input(undefined, { transform: SlSelect.flag });
  readonly readOnly = input(undefined, { transform: SlSelect.flag });
  readonly required = input(undefined, { transform: SlSelect.flag });
  readonly invalid = input(undefined, { transform: SlSelect.flag });
  readonly loading = input(false, { transform: booleanAttribute });

  private readonly defaults = injectSelectDefaults();
  /** The family's words in the language in force, with this select's `messages` laid over them. */
  readonly t = injectMessages(selectMessages, this.messages);
  private readonly inForceLocale = injectLocale();
  /** The locale the default filter compares in: the `locale` input, or the language in force. */
  readonly resolvedLocale = computed(() => this.locale() ?? this.inForceLocale());
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly template = viewChild.required<TemplateRef<unknown>>('layer');
  private readonly triggerRef = viewChild.required<{ nativeElement: HTMLButtonElement }>('trigger');
  /** The summary a consumer writes instead of the family's own. */
  readonly summaryTemplate = contentChild(SlSelectValue, { read: TemplateRef });

  /** The field around the control, whose state a bare input defers to. */
  readonly field = inject(SlField, { optional: true });

  private readonly identifier = Math.random().toString(36).slice(2, 8);
  readonly contentId = `sl-select-${this.identifier}`;
  /**
   * The listbox's own identifier. Without a search field the surface is the
   * listbox and `contentId` names it; with one the surface is a dialog and the
   * listbox is one element in, so the two need separate names.
   */
  readonly listId = `sl-select-list-${this.identifier}`;
  readonly searchId = `sl-select-search-${this.identifier}`;
  /** The field's control identifier inside a field, so its label's `for` reaches the trigger. */
  readonly triggerId = this.field?.ids().control ?? `sl-select-trigger-${this.identifier}`;

  private readonly registry = signal(new Map<SelectOptionValue, string>());
  private readonly optionCount = signal(0);
  private entry: Entry = 'selected';
  private pending: string | null = null;
  private lastQuery = '';
  private disabledByForm = signal<boolean | undefined>(undefined);

  private view: EmbeddedViewRef<unknown> | null = null;
  private layerNode: HTMLElement | null = null;
  private surfaceNode: HTMLElement | null = null;
  private portalRoot: PortalRootHandle | null = null;
  private positioner: PositionerHandle | null = null;
  private layer: DismissableLayerHandle | null = null;
  private presence: PresenceHandle | null = null;
  private typeaheadHandle: TypeaheadHandle | null = null;

  private readonly hostLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });

  private onChange: (value: SelectSelection) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly resolvedSize = computed(() => this.size() ?? this.field?.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  readonly resolvedSide = computed(() => this.side() ?? this.defaults.side);
  readonly resolvedWidth = computed(() => this.width() ?? this.defaults.width);
  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);
  readonly resolvedMultiple = computed(() => this.multiple() ?? this.defaults.multiple);
  readonly resolvedClearable = computed(() => this.clearable() ?? this.defaults.clearable);
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);
  readonly resolvedSearch = computed(() => this.search() ?? this.defaults.search);
  readonly resolvedHighlightMatch = computed(
    () => this.highlightMatch() ?? this.defaults.highlightMatch,
  );
  /* A reader typing into a field cannot also be driving a typeahead on the
     same keys: two searches on one keystroke move the highlight twice. */
  readonly resolvedTypeahead = computed(() =>
    this.resolvedSearch() ? false : (this.typeahead() ?? this.defaults.typeahead),
  );
  readonly resolvedCloseOnSelect = computed(
    () => this.closeOnSelect() ?? this.defaults.closeOnSelect,
  );
  readonly resolvedFullWidth = computed(() => this.fullWidth() ?? this.defaults.fullWidth);

  /** The query, which only exists while there is a field holding it. */
  readonly query = computed(() => (this.resolvedSearch() ? this.searchValue() : ''));

  private readonly fallbackFilter = computed(() => createFilter({ locale: this.resolvedLocale() }));

  /**
   * Three answers, and `undefined` is not one of them. Not giving `filter` asks
   * for the library's own locale-sensitive `contains`; giving `null` turns
   * filtering off, which is what a list a server has already filtered needs;
   * giving a function replaces the comparison.
   */
  matches(label: string): boolean {
    const query = this.query();
    const given = this.filter();
    if (query === '' || given === null) return true;
    if (given !== undefined) return given(label, query);
    return this.fallbackFilter().contains(label, query);
  }

  /** What the live region carries: the wait, or how many options survived. */
  readonly statusMessage = computed(() => {
    if (this.loading()) return this.t('loading');
    if (!this.resolvedSearch() || this.optionCount() === 0) return '';
    return this.t('count', { count: this.optionCount() });
  });

  /** Unset asks the field; a field that says nothing leaves the default. */
  readonly resolvedDisabled = computed(
    () =>
      this.disabled() ?? this.disabledByForm() ?? this.field?.disabled() ?? this.defaults.disabled,
  );
  readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.field?.readOnly() ?? this.defaults.readOnly,
  );
  readonly resolvedRequired = computed(
    () => this.required() ?? this.field?.required() ?? this.defaults.required,
  );
  readonly resolvedInvalid = computed(
    () => this.invalid() ?? this.field?.invalid() ?? this.defaults.invalid,
  );

  readonly isOpen = computed(() => this.open() && !this.resolvedDisabled());

  /** One value, several, or none — always read as a list, whatever was given. */
  readonly selection = computed((): readonly SelectOptionValue[] => {
    const held = this.value();
    if (held === null || held === undefined) return [];
    return typeof held === 'string' ? [held] : held;
  });

  private readonly declared = computed(() => {
    const table = new Map<SelectOptionValue, string>();
    for (const option of flatten(this.items())) table.set(option.value, option.label);
    return table;
  });

  readonly labels = computed(() => this.selection().map((held) => this.labelFor(held) ?? held));

  readonly unmatched = computed(() =>
    this.selection().some((held) => this.labelFor(held) === undefined),
  );

  /** The first label, then how many more. A count alone names none of them. */
  readonly summary = computed(() => {
    const held = this.selection();
    if (held.length === 0) return this.placeholder();
    const first = this.labelFor(held[0] as string) ?? held[0];
    if (!this.resolvedMultiple() || held.length === 1) return first;
    /* Several values are the chips beside this element, not a sentence here
       (SL4). The sentence stays: it names the trigger, and it is what a control
       too narrow for a chip shows instead. */
    return this.t('summary', { count: held.length });
  });

  readonly showClear = computed(
    () =>
      this.resolvedClearable() &&
      this.selection().length > 0 &&
      !this.resolvedDisabled() &&
      !this.resolvedReadOnly(),
  );

  readonly empty = computed(() => this.optionCount() === 0);

  readonly activeDescendant = computed(() => {
    const held = this.highlightedValue();
    return this.isOpen() && held !== null ? this.optionId(held) : null;
  });

  /**
   * The trigger names the highlighted option only while it is the focused
   * element. With a search field the field holds focus and names it instead;
   * two elements naming one option would put the announcement on the element
   * nobody is operating.
   */
  readonly triggerActiveDescendant = computed(() =>
    this.resolvedSearch() ? null : this.activeDescendant(),
  );

  readonly labelledBy = computed(() => {
    if (this.ariaLabel() !== undefined) return null;
    return this.hostLabelledBy ?? this.field?.ids().label ?? null;
  });

  readonly describedBy = computed(() => this.field?.describedBy() ?? null);

  /**
   * The chip row, and the two measurements it needs (SL4).
   *
   * `createCollapse` is the same ResizeObserver arithmetic `toolbar` collapses
   * a bar with: it hides the chips that overrun and reveals the `+N` chip from
   * the first one that does, so the count is what the collapse reports and
   * cannot disagree with what is on screen. `createWidthGate` answers the other
   * question — whether the frame has room for a chip at all — because under a
   * hundred and twenty pixels a chip is a shape with no word in it.
   */
  private readonly tags = viewChild<ElementRef<HTMLElement>>('tags');
  private readonly chipOverflow = viewChild<ElementRef<HTMLElement>>('chipOverflow');
  protected readonly collapsedCount = signal(0);
  protected readonly narrow = signal(false);
  private collapse: CollapseHandle | null = null;
  private widthGate: WidthGateHandle | null = null;

  protected removeLabelFor(value: SelectOptionValue) {
    return this.t('remove', { label: String(this.labelFor(value) ?? value) });
  }

  protected onRemoveChip(value: SelectOptionValue, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.toggle(value, 'select', event);
    /* A control that removes itself as it is pressed would leave focus on the
       document; the reader lands back on the control they were on. */
    this.triggerRef().nativeElement.focus({ preventScroll: true });
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    const host = inject(ElementRef<HTMLElement>);

    /* Every press resets the record in the capture phase; one on the frame sets it after. */
    const doc = (host.nativeElement as HTMLElement).ownerDocument;
    const resetPress = () => (this.pressedFrame = false);
    doc.addEventListener('pointerdown', resetPress, true);
    destroyRef.onDestroy(() => doc.removeEventListener('pointerdown', resetPress, true));

    effect(() => {
      const row = this.tags()?.nativeElement ?? null;
      const trigger = this.chipOverflow()?.nativeElement ?? null;
      untracked(() => {
        this.collapse?.destroy();
        this.collapse = null;
        this.widthGate?.destroy();
        this.widthGate = null;
        this.narrow.set(false);
        if (row === null) {
          this.collapsedCount.set(0);
          return;
        }
        /* The swap is the chips' alone (contract `chips.narrowWidth`): a
           control drawing none has nothing to give way. */
        this.widthGate = createWidthGate(host.nativeElement as HTMLElement, {
          at: NARROW_WIDTH,
          onChange: (narrow) => this.narrow.set(narrow),
        });
        this.collapse = createCollapse(row, {
          collapsible: () => true,
          onChange: (units) => this.collapsedCount.set(units.length),
          trigger: () => trigger,
          units: () => [...row.querySelectorAll<HTMLElement>(':scope > *:not([data-overflow])')],
        });
      });
    });

    /* A value arriving or leaving changes what there is to fit. */
    effect(() => {
      this.selection();
      untracked(() => this.collapse?.refresh());
    });

    effect(() => {
      const open = this.isOpen();
      untracked(() => (open ? this.show() : this.hide()));
    });

    /**
     * The highlight follows the query. A reader who types four characters and
     * presses `Enter` means the first row they can see, and a highlight left on
     * a row the filter has just removed answers with nothing at all. It is read
     * after render because the options decide their own visibility, so the
     * surviving set does not exist until the view has answered.
     */
    afterRenderEffect(() => {
      const query = this.query();
      untracked(() => {
        if (!this.isOpen() || !this.resolvedSearch()) return;
        if (this.lastQuery === query) return;
        this.lastQuery = query;
        this.recount();
        this.move('first', new Event('input'));
      });
    });

    afterNextRender(() => {
      if (this.resolvedMount() === 'eager' && !this.isOpen()) this.build();
    });

    destroyRef.onDestroy(() => {
      this.collapse?.destroy();
      this.widthGate?.destroy();
      this.teardown();
    });
  }

  /** The element `aria-activedescendant` names, and the option carries. */
  optionId(value: SelectOptionValue): string {
    return `${this.contentId}-option-${encodeURIComponent(value)}`;
  }

  labelFor(value: SelectOptionValue): string | undefined {
    return this.declared().get(value) ?? this.registry().get(value);
  }

  /** An option hands over what it reads as, so the closed control can print it. */
  registerLabel(value: SelectOptionValue, label: string) {
    if (this.registry().get(value) === label) return;
    const next = new Map(this.registry());
    next.set(value, label);
    this.registry.set(next);
  }

  /** Options count themselves, so the popup knows whether it holds any. */
  recount() {
    this.optionCount.set(this.options().length);
  }

  options(): HTMLElement[] {
    return [...(this.surfaceNode?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? [])];
  }

  focus() {
    this.triggerRef().nativeElement.focus({ preventScroll: true });
  }

  /**
   * Whether a click landed on the control's frame. A click a `label` elsewhere
   * forwards to the button carries the label's coordinates, which lie outside it.
   */
  /** The last press went down on the frame; see `onTriggerClick`. */
  private pressedFrame = false;

  protected onFramePointerDown() {
    this.pressedFrame = true;
    this.prepare();
  }

  /**
   * The reader is about to open the popup: the control took focus or a press.
   * The portal's layer is made then, because making it reads the trigger's
   * computed style, and a read in the open's own task is a style recalculation
   * the first frame waits for. A press focuses before it clicks, in a task of
   * its own.
   */
  protected prepare() {
    if (this.portalRoot !== null) return;
    this.portalRoot = createPortalRoot({
      origin: this.triggerRef().nativeElement,
      disabled: this.portal() === false,
    });
  }

  scrollToKey(value: SelectOptionValue) {
    const option = this.options().find((candidate) => candidate.dataset['value'] === value);
    if (option !== undefined && this.surfaceNode !== null) revealWithin(option, this.surfaceNode);
  }

  /** Asks to open or close, and reports the reason before anything moves. */
  setOpen(next: boolean, reason: SelectOpenReason, source?: Event) {
    if (next === this.isOpen()) return;

    const state = createControllable<boolean>({
      initial: this.isOpen(),
      onRequest: (request) => this.openChangeRequest.emit(request),
    });
    if (!state.request(next, reason, source)) return;
    this.open.set(next);
    if (!next) {
      this.highlightedValue.set(null);
      this.entry = 'selected';
      /* A popup that closes takes the query with it: the field is built with
         the popup, and a select that reopened onto four characters nobody had
         typed this time would filter a list the reader thought was whole. */
      this.setQuery('', 'clear', source);
    }
  }

  /**
   * The query. The reset the popup performs as it opens and as it closes
   * carries `clear`, which is what happened to the field.
   */
  setQuery(next: string, reason: SelectSearchReason, source?: Event) {
    if (next === this.query()) return;

    const state = createControllable<string>({
      initial: this.query(),
      onRequest: (request) => this.searchValueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.searchValue.set(next);
  }

  /** The field inside the popup, which lives in an embedded view. */
  private searchNode(): HTMLInputElement | null {
    return this.layerNode?.querySelector<HTMLInputElement>("[data-part='search-input']") ?? null;
  }

  /** Focuses the field when there is one, and the control otherwise. */
  focusSearch() {
    (this.searchNode() ?? this.triggerRef().nativeElement).focus({ preventScroll: true });
  }

  setHighlighted(next: SelectOptionValue | null, reason: SelectHighlightReason, source?: Event) {
    if (next === this.highlightedValue()) return;

    const state = createControllable<SelectOptionValue | null>({
      initial: this.highlightedValue(),
      onRequest: (request) => this.highlightedValueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) {
      this.highlightedValue.set(next);
      this.reveal(next);
    }
  }

  /** Takes an option, or takes it back when the select holds several. */
  toggle(value: SelectOptionValue, reason: SelectValueReason, source?: Event) {
    if (!this.resolvedMultiple()) {
      this.commit([value], reason, source);
      return;
    }
    const held = this.selection();
    this.commit(
      held.includes(value) ? held.filter((candidate) => candidate !== value) : [...held, value],
      reason,
      source,
    );
  }

  clear(reason: SelectValueReason, source?: Event) {
    this.commit([], reason, source);
  }

  private commit(next: readonly SelectOptionValue[], reason: SelectValueReason, source?: Event) {
    const held = this.selection();
    const same = next.length === held.length && next.every((value, index) => value === held[index]);
    if (same) return;

    const shaped: SelectSelection = this.resolvedMultiple() ? next : (next[0] ?? null);
    const state = createControllable<SelectSelection>({
      initial: this.resolvedMultiple() ? held : (held[0] ?? null),
      /* Membership was compared above; comparing the shaped values here would
         compare two fresh arrays by identity and call every request a change. */
      equals: () => false,
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (!state.request(shaped, reason, source)) return;
    this.value.set(shaped);
    this.onChange(shaped);
    this.onTouched();
  }

  protected onTriggerClick(event: MouseEvent) {
    /* A press on the field's label arrives here as the click the label
       forwards: a pointer click whose press went down on the label, not on
       the frame. It focuses the control and does not open the list — the
       select-only example's label only focuses, and so does a native
       select's. A keyboard or assistive-technology click carries detail 0 and
       opens. The press is recorded rather than the click's coordinates
       compared with the frame's box: that box is a layout read in the click's
       own task, after the release changed the frame's style. */
    const fromFrame = this.pressedFrame;
    this.pressedFrame = false;
    if (event.detail > 0 && !fromFrame) {
      this.focus();
      return;
    }
    if (this.resolvedDisabled() || this.resolvedReadOnly()) return;
    this.entry = 'selected';
    this.setOpen(!this.isOpen(), 'pointer', event);
  }

  protected onClear(event: MouseEvent) {
    this.clear('clear', event);
    this.focus();
  }

  protected onBlur() {
    this.onTouched();
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (this.resolvedDisabled() || this.resolvedReadOnly()) return;
    const alt = event.altKey;

    if (!this.isOpen()) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          return this.openWith(alt ? 'none' : 'selected', event);
        case 'ArrowUp':
          /* The example opens onto the first option; the last is the mirror of
             ArrowDown, and the contract records the departure. */
          event.preventDefault();
          return this.openWith('last', event);
        case 'Enter':
        case ' ':
          event.preventDefault();
          return this.openWith('selected', event);
        case 'Home':
          event.preventDefault();
          return this.openWith('first', event);
        case 'End':
          event.preventDefault();
          return this.openWith('last', event);
        default:
          break;
      }
      if (!event.ctrlKey && !event.metaKey && !alt && isPrintable(event.key)) {
        /* With a field the character opens the popup and becomes the first
           character of the query; without one it seeds the typeahead. The
           pattern asks the same of both, and only the search it feeds differs. */
        if (this.resolvedSearch()) {
          event.preventDefault();
          this.setQuery(event.key, 'keyboard', event);
          return this.openWith('first', event);
        }
        if (this.resolvedTypeahead()) {
          event.preventDefault();
          this.pending = event.key;
          this.openWith('none', event);
        }
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        return this.move('next', event);
      case 'ArrowUp':
        event.preventDefault();
        return alt ? this.commitHighlighted(event, true) : this.move('previous', event);
      case 'Home':
        event.preventDefault();
        return this.move('first', event);
      case 'End':
        event.preventDefault();
        return this.move('last', event);
      case 'PageDown':
        event.preventDefault();
        return this.move('pageDown', event);
      case 'PageUp':
        event.preventDefault();
        return this.move('pageUp', event);
      case 'Enter':
        event.preventDefault();
        return this.commitHighlighted(event, this.resolvedCloseOnSelect());
      case ' ':
        event.preventDefault();
        /* Multiple selection keeps the popup open on Space, which is the
           listbox pattern's recommended model. */
        return this.commitHighlighted(
          event,
          this.resolvedMultiple() ? false : this.resolvedCloseOnSelect(),
        );
      case 'Escape':
        event.preventDefault();
        return this.setOpen(false, 'escape', event);
      case 'Tab':
        /* Not prevented: the key commits and then does what Tab does, which the
           example states and notes differs from a native select. */
        return this.commitHighlighted(event, true);
      default:
        break;
    }

    const handle = this.typeaheadHandle;
    if (handle === null) return;
    if (event.ctrlKey || event.metaKey || alt) return;
    if (!isPrintable(event.key, handle.query.length > 0)) return;

    event.preventDefault();
    this.typeaheadMatch(event.key, handle);
  }

  protected onSearchInput(event: Event) {
    const field = event.target as HTMLInputElement;
    this.setQuery(field.value, 'keyboard', event);
  }

  /**
   * The keys the field takes, and the three the closed control spends that this
   * one cannot: `Home`, `End` and the space bar all belong to the caret while
   * the reader is typing, and the pattern's editable branch returns them there.
   */
  protected onSearchKeyDown(event: KeyboardEvent) {
    const alt = event.altKey;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        return this.move('next', event);
      case 'ArrowUp':
        event.preventDefault();
        return alt ? this.commitHighlighted(event, true) : this.move('previous', event);
      case 'PageDown':
        event.preventDefault();
        return this.move('pageDown', event);
      case 'PageUp':
        event.preventDefault();
        return this.move('pageUp', event);
      case 'Enter':
        event.preventDefault();
        return this.commitHighlighted(
          event,
          this.resolvedMultiple() ? false : this.resolvedCloseOnSelect(),
        );
      case 'Escape':
        event.preventDefault();
        /* The layer saw this key first, in the capture phase, and its dismiss
           handler holds the two steps. This branch is what answers when the
           layer was told to ignore Escape entirely: the query still empties,
           and the popup a consumer said to keep open stays open. */
        if (this.query() !== '') this.setQuery('', 'clear', event);
        return;
      case 'Tab': {
        event.preventDefault();
        const layer = this.layerNode;
        this.commitHighlighted(event, true);
        return this.moveTabFrom(layer, event.shiftKey);
      }
      default:
        return;
    }
  }

  /**
   * Where `Tab` goes from inside the popup. The layer is portalled to the end
   * of the document, so the browser's own next element is the end of the page
   * rather than the element after the control: the document's tab order is read
   * with the layer taken out of it, the trigger is found in what remains, and
   * focus goes to the entry beside it.
   */
  private moveTabFrom(layer: HTMLElement | null, backwards: boolean) {
    const trigger = this.triggerRef().nativeElement;
    const order = tabbables(document.body).filter(
      (node) => layer === null || !layer.contains(node),
    );
    const index = order.indexOf(trigger);
    const next = index === -1 ? undefined : order[index + (backwards ? -1 : 1)];
    (next ?? trigger).focus({ preventScroll: true });
  }

  private openWith(entry: Entry, event: Event) {
    this.entry = entry;
    this.setOpen(true, 'keyboard', event);
  }

  private move(intent: MoveIntent, event: Event) {
    const list = this.options();
    if (list.length === 0) return;
    const held = this.highlightedValue();
    const index = moveIndex({
      enabled: list.map((option) => option.dataset['disabled'] === undefined),
      from: held === null ? -1 : list.findIndex((option) => option.dataset['value'] === held),
      intent,
      loop: this.resolvedLoop(),
    });
    if (index !== -1) this.setHighlighted(list[index]?.dataset['value'] ?? null, 'keyboard', event);
  }

  private commitHighlighted(event: Event, close: boolean) {
    const held = this.highlightedValue();
    if (held !== null) this.toggle(held, 'keyboard', event);
    if (close) {
      this.setOpen(false, 'select', event);
      /* The trigger takes focus back wherever the popup is closed by a key.
         It does not on an outside press: the reader has just put focus
         somewhere themselves. Without a field focus never left, and the call
         costs nothing. */
      const leaving = event instanceof KeyboardEvent && event.key === 'Tab';
      if (!leaving) this.focus();
      return;
    }
    /* The popup stayed open, so the query is emptied here rather than by the
       close: a list still filtered to the row the reader has just taken is a
       list that looks broken. */
    if (held !== null) this.setQuery('', 'select', event);
  }

  /**
   * Typeahead searches the **enabled** options and only those. The arrows step
   * over a disabled option, so a typeahead that landed on one would let a
   * reader reach by typing a row the family then refuses to commit.
   */
  private typeaheadMatch(character: string, handle: TypeaheadHandle) {
    const list = this.options().filter((option) => option.dataset['disabled'] === undefined);
    const labels = list.map(
      (option) =>
        option.dataset['textValue'] ??
        option.querySelector("[data-part='label']")?.textContent?.trim() ??
        '',
    );
    const held = this.highlightedValue();
    const from = held === null ? -1 : list.findIndex((option) => option.dataset['value'] === held);
    const index = handle.match(character, labels, from);
    if (index !== -1) this.setHighlighted(list[index]?.dataset['value'] ?? null, 'keyboard');
  }

  private reveal(value: SelectOptionValue | null) {
    if (value === null) return;
    this.scrollToKey(value);
  }

  private show() {
    this.build();
    this.position();
    this.bind();
    this.enter();
  }

  private build() {
    if (this.view !== null) {
      this.presence?.sync(this.isOpen());
      this.view.detectChanges();
      return;
    }

    this.prepare();

    this.view = this.viewContainer.createEmbeddedView(this.template());
    this.view.detectChanges();

    this.layerNode = this.view.rootNodes.find(
      (node: unknown): node is HTMLElement => node instanceof HTMLElement,
    ) as HTMLElement | null;
    this.surfaceNode = this.layerNode?.querySelector<HTMLElement>("[data-part='content']") ?? null;
    if (this.layerNode === null) return;

    this.portalRoot?.container?.append(this.layerNode);
    this.presence = createPresence({ present: this.isOpen() });
    this.presence.setNode(this.layerNode);
    this.recount();
  }

  private position() {
    if (this.layerNode === null) return;
    this.positioner?.destroy();
    /* The anchor is the frame rather than the button inside it, so the popup is
       as wide as the control the reader sees: the trigger is the frame less its
       two borders, and `matchWidth` writes whatever it is given (SL10). */
    const trigger = this.triggerRef().nativeElement;
    this.positioner = createPositioner(
      trigger.closest<HTMLElement>("[data-part='root']") ?? trigger,
      this.layerNode,
      {
        align: this.resolvedAlign(),
        alignOffset: this.alignOffset() ?? this.defaults.alignOffset,
        boundaryPadding: this.collisionPadding() ?? this.defaults.collisionPadding,
        flip: this.flip() ?? this.defaults.flip,
        hideWhenDetached: this.hideWhenDetached() ?? this.defaults.hideWhenDetached,
        matchWidth: this.resolvedWidth() === 'anchor',
        shift: this.shift() ?? this.defaults.shift,
        side: this.resolvedSide(),
        sideOffset: this.sideOffset() ?? this.defaults.sideOffset,
        strategy: this.strategy() ?? this.defaults.strategy,
      },
    );
    /* The height that bounds the list arrives with the position, after the
       highlight has landed, so the highlighted row is revealed again — in the
       next frame, whose layout the browser computes anyway, rather than by a
       read here after the position's writes. */
    void this.positioner.update().then(() => {
      const view = this.layerNode?.ownerDocument.defaultView;
      if (view === null || view === undefined) return;
      view.requestAnimationFrame(() => this.reveal(this.highlightedValue()));
    });
  }

  private bind() {
    if (this.layerNode === null) return;

    /* The control is a branch, so pressing the trigger again toggles the popup
       instead of dismissing it and reopening it in one gesture. */
    this.layer = createDismissableLayer(this.layerNode, {
      branches: [this.triggerRef().nativeElement.parentElement].filter(
        (branch): branch is HTMLElement => branch !== null,
      ),
      escape: this.closeOnEscape() ?? this.defaults.closeOnEscape,
      focusOutside: false,
      modal: false,
      outsidePress: this.closeOnOutsidePress() ?? this.defaults.closeOnOutsidePress,
      scrollLock: false,
      onDismiss: (request) => {
        const source = request.source as Event | undefined;
        /**
         * The query first, the popup second — and the decision lives here
         * rather than in the field's own handler because the layer listens in
         * the **capture** phase: it sees Escape before anything inside it does,
         * so a field that tried to spend the key first would already have lost
         * the surface. A reader four characters into a search wants the whole
         * list back more often than they want the popup gone, and the pattern
         * names this branch and makes it optional.
         */
        if (request.reason === 'escape' && this.resolvedSearch() && this.query() !== '') {
          this.setQuery('', 'clear', source);
          return;
        }
        this.setOpen(false, request.reason === 'escape' ? 'escape' : 'outsidePress', source);
        /* Focus goes back to the control on a key and stays where the reader
           put it on a press outside. */
        if (request.reason === 'escape') this.focus();
      },
    });

    if (this.resolvedTypeahead()) {
      this.typeaheadHandle = createTypeahead({
        timeout: this.typeaheadTimeout() ?? this.defaults.typeaheadTimeout,
      });
    }
  }

  /**
   * Where the highlight lands as the popup opens, and where focus goes.
   *
   * Without a search field nothing moves: the trigger keeps focus for the whole
   * interaction. With one, focus enters the layer — the combobox pattern's own
   * note says a dialog popup does not support `aria-activedescendant`, so DOM
   * focus moves into the dialog — and the field takes it however the popup was
   * opened, a press on the trigger included.
   */
  private enter() {
    this.recount();
    if (this.resolvedSearch()) this.searchNode()?.focus({ preventScroll: true });
    const list = this.options();
    if (list.length === 0) return;

    const character = this.pending;
    this.pending = null;
    if (character !== null && this.typeaheadHandle !== null) {
      this.typeaheadMatch(character, this.typeaheadHandle);
      return;
    }

    if (this.entry === 'none') return;
    if (this.entry === 'selected') {
      const held = this.selection();
      const chosen = list.find(
        (option) =>
          held.includes(option.dataset['value'] ?? '') && option.dataset['disabled'] === undefined,
      );
      if (chosen !== undefined) {
        this.setHighlighted(chosen.dataset['value'] ?? null, 'keyboard');
        return;
      }
      this.move('first', new Event('keydown'));
      return;
    }
    this.move(this.entry, new Event('keydown'));
  }

  private hide() {
    this.unbind();
    if (this.resolvedMount() === 'active') this.teardown();
  }

  private unbind() {
    this.layer?.destroy();
    this.positioner?.destroy();
    this.typeaheadHandle?.destroy();
    this.layer = null;
    this.positioner = null;
    this.typeaheadHandle = null;
  }

  private teardown() {
    this.unbind();
    this.presence?.destroy();
    this.portalRoot?.release();
    this.layerNode?.remove();
    this.view?.destroy();

    this.presence = null;
    this.portalRoot = null;
    this.layerNode = null;
    this.surfaceNode = null;
    this.view = null;
  }

  writeValue(value: SelectSelection) {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: SelectSelection) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabledByForm.set(isDisabled);
  }

  /**
   * The one validity the family owns. `required` on a native `select` is
   * satisfied by any non-empty option, and the hidden element this control
   * carries always holds one — so the browser cannot answer the question and
   * the family answers it here.
   */
  validate(): ValidationErrors | null {
    if (!this.resolvedRequired()) return null;
    return this.selection().length === 0 ? { required: true } : null;
  }
}
