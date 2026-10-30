import { createFilter, moveIndex, revealWithin } from '@slotted/core/collection';
import type { Filter, MoveIntent } from '@slotted/core/collection';
import { createDismissableLayer, pressOrigin } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createArrowNavigation, createRemovalFocus } from '@slotted/core/focus';
import type { ArrowNavigationHandle, RemovalFocusHandle } from '@slotted/core/focus';
import {
  multiSelectMessages,
  type MultiSelectMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createWidthGate } from '@slotted/core/measure';
import type { WidthGateHandle } from '@slotted/core/measure';
import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  ViewContainerRef,
  ViewEncapsulation,
  type EmbeddedViewRef,
  type OnInit,
  type TemplateRef,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlField } from '@slotted/angular/field';

import { injectMultiSelectDefaults } from './multi-select-defaults';
import type {
  MultiSelectAlign,
  MultiSelectChosenOptions,
  MultiSelectFilter,
  MultiSelectHighlightReason,
  MultiSelectInputReason,
  MultiSelectItems,
  MultiSelectMount,
  MultiSelectOpenOn,
  MultiSelectOpenReason,
  MultiSelectOption,
  MultiSelectOptionGroup,
  MultiSelectOptionValue,
  MultiSelectOverflow,
  MultiSelectRefuseCause,
  MultiSelectSide,
  MultiSelectSize,
  MultiSelectStrategy,
  MultiSelectValidator,
  MultiSelectValueReason,
  MultiSelectVariant,
  MultiSelectWidth,
} from './multi-select-defaults';

export * from './multi-select-defaults';

type Entry = 'first' | 'last' | 'none';

/**
 * A filtered-out option stays in the DOM and is hidden, so that the element a
 * reader's pointer is over survives a keystroke. It is therefore not part of
 * the result set, and every count and every move has to skip it.
 */
const OPTION_SELECTOR = "[data-part='item']:not([hidden])";

/** The chips in the row, which are every cell but the one holding the caret. */
const CHIP_SELECTOR = "[data-part='chips'] > [role='gridcell']:not([data-part='field'])";

const isGroup = (entry: MultiSelectItems[number]): entry is MultiSelectOptionGroup =>
  'options' in entry;

const flatten = (items: MultiSelectItems | undefined): readonly MultiSelectOption[] =>
  items === undefined ? [] : items.flatMap((entry) => (isGroup(entry) ? entry.options : [entry]));

const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * A frame of chosen values, with a field that adds more.
 *
 * **The host element is the frame**, as `sl-combobox`'s is: it carries
 * `data-ui`, and the grid, the chips, the field, the counter and the two
 * buttons are its template. The popup is an `ng-template` built into the portal
 * when it opens.
 *
 * **The set is ordered, and the order is the reader's.** It is an array and not
 * a set, because reorder is meaningless against a value the family is free to
 * re-sort.
 *
 * **What is refused is reported, not dropped.** `valueRefuse` carries the
 * values that did not get in and the cause — a duplicate, the limit, or the
 * consumer's own predicate.
 */
@Component({
  selector: 'sl-multi-select',
  standalone: true,
  exportAs: 'slMultiSelect',
  imports: [SlGlyph, SlIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /*
   * Three of these belong to other families and are worn as `data-ui` beside
   * this one's own parts: the chips are `tag`s, the mark is `highlight`'s, the
   * ring while an answer travels is `spinner`'s and the waiting rows are
   * `skeleton`'s. A family that renders another's identifier and does not load
   * its sheet draws an element with no rules — the ring measured 0 × 0 on the
   * rendered page before the last two lines existed.
   */
  styleUrls: [
    '../../../styles/src/multi-select/multi-select.css',
    '../../../styles/src/tag/tag.css',
    '../../../styles/src/spinner/spinner.css',
    '../../../styles/src/skeleton/skeleton.css',
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlMultiSelect), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlMultiSelect), multi: true },
  ],
  host: {
    'data-ui': 'multi-select',
    'data-ui-multi-select': '',
    'data-part': 'root',
    'data-part-root': '',
    /* The name is the input's and the listbox's; on the host it would name a
       generic element, which is a role that prohibits one. */
    '[attr.aria-label]': 'null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-overflow]': 'resolvedOverflow()',
    '[attr.data-full-width]': "resolvedFullWidth() ? '' : null",
    '[attr.data-open]': "isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() ? '' : null",
    '[attr.data-required]': "resolvedRequired() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.data-complete]': "full() ? '' : null",
    '[attr.data-narrow]': "narrow() ? '' : null",
  },
  template: `
    <span hidden [id]="chosenId()">{{ gridLabel() }}</span>
    <div
      data-part="control"
      data-part-control=""
      role="grid"
      [attr.aria-label]="gridName().label"
      [attr.aria-labelledby]="gridName().labelledBy"
    >
      <div data-part="chips" data-part-chips="" role="row" #row>
        @for (chip of value(); track chip; let index = $index) {
          @if (editingValue() === chip) {
            <span
              role="gridcell"
              data-ui="tag"
              data-ui-tag=""
              data-part="root"
              data-part-root=""
              data-size="sm"
              data-variant="soft"
              [attr.data-value]="chip"
            >
              <span data-part="body" data-part-body="">
                <input
                  type="text"
                  [attr.aria-label]="labelFor(chip) ?? chip"
                  [value]="editingText()"
                  (input)="onEditInput($event)"
                  (blur)="commitEdit(chip, $event)"
                  (keydown)="onEditKeyDown(chip, $event)"
                />
              </span>
            </span>
          } @else {
            <span
              role="gridcell"
              tabindex="-1"
              data-ui="tag"
              data-ui-tag=""
              data-part="root"
              data-part-root=""
              data-size="sm"
              data-variant="soft"
              [attr.data-value]="chip"
              [attr.data-disabled]="frozen() ? '' : null"
              [attr.aria-label]="chipLabel(chip, index)"
              (keydown)="onChipKeyDown(chip, index, $event)"
            >
              <span data-part="body" data-part-body="">
                <span data-part="label" data-part-label="">{{ labelFor(chip) ?? chip }}</span>
              </span>
              @if (!frozen()) {
                <button
                  type="button"
                  tabindex="-1"
                  data-part="remove"
                  data-part-remove=""
                  [attr.aria-label]="removeLabelFor(chip)"
                  (click)="onRemoveClick(chip, $event)"
                >
                  <span slIcon><svg slGlyph name="x"></svg></span>
                </button>
              }
            </span>
          }
        }
        @if (resolvedOverflow() === 'collapse') {
          <span
            #count
            hidden
            role="gridcell"
            tabindex="-1"
            data-count
            data-ui="tag"
            data-ui-tag=""
            data-part="root"
            data-part-root=""
            data-size="sm"
            data-variant="outline"
            (click)="onCountClick($event)"
          >
            <span data-part="body" data-part-body="">
              <span data-part="label" data-part-label="">+{{ hiddenCount() }}</span>
            </span>
          </span>
        }
        <span data-part="field" data-part-field="" role="gridcell">
          <input
            #control
            type="text"
            role="combobox"
            data-part="input"
            data-part-input=""
            aria-autocomplete="list"
            [id]="controlId()"
            [value]="inputValue()"
            [disabled]="resolvedDisabled()"
            [readOnly]="resolvedReadOnly()"
            [required]="resolvedRequired() && value().length === 0"
            [placeholder]="value().length === 0 ? placeholder() : ''"
            [attr.aria-expanded]="isOpen()"
            [attr.aria-controls]="isOpen() ? contentId : null"
            [attr.aria-activedescendant]="activeDescendant()"
            [attr.aria-label]="ariaLabel() ?? null"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-readonly]="resolvedReadOnly() ? true : null"
            [attr.aria-invalid]="resolvedInvalid() ? true : null"
            (input)="onInput($event)"
            (focus)="onFocus()"
            (click)="onClick($event)"
            (keydown)="onKeyDown($event)"
            (paste)="onPaste($event)"
            (blur)="onBlur($event)"
          />
        </span>
      </div>
    </div>

    @if (counterText(); as counter) {
      <span data-part="counter" data-part-counter="" aria-hidden="true">{{ counter }}</span>
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
      <button
        type="button"
        tabindex="-1"
        data-part="trigger"
        data-part-trigger=""
        [disabled]="resolvedDisabled()"
        [attr.aria-label]="t('trigger')"
        (click)="onToggle($event)"
      >
        <span data-part="arrow" data-part-arrow=""
          ><span slIcon><svg slGlyph name="chevron-down"></svg></span
        ></span>
      </button>
    }

    <!--
      One hidden input per value, all under the same name: that is how a plain
      FormData receives several values under one key and how a native reset()
      restores them.
    -->
    @if (name(); as submissionName) {
      @for (held of value(); track held) {
        <input
          type="text"
          aria-hidden="true"
          tabindex="-1"
          readonly
          [name]="submissionName"
          [attr.form]="form() ?? null"
          [value]="held"
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
        />
      }
    }

    <ng-template #layer>
      <div
        data-ui="multi-select"
        data-ui-multi-select=""
        data-part="positioner"
        data-part-positioner=""
        [attr.data-align]="resolvedAlign()"
        [attr.data-size]="resolvedSize()"
        [attr.data-width]="resolvedWidth()"
        [attr.data-open]="isOpen() ? '' : null"
        [attr.inert]="isOpen() ? null : ''"
      >
        <div
          data-part="content"
          data-part-content=""
          role="listbox"
          aria-multiselectable="true"
          [id]="contentId"
          [attr.aria-label]="ariaLabel() ?? null"
          [attr.aria-busy]="loading() ? true : null"
          [attr.data-loading]="loading() ? '' : null"
        >
          @if (value().length > 0) {
            <!--
              Every chosen value, whatever the row in the control did with them.
              Its chips carry no remove control: focus never enters this layer,
              so one would be reachable by pointer and by nothing else.
            -->
            <div data-part="chosen" data-part-chosen="">
              @for (held of value(); track held) {
                <span
                  data-ui="tag"
                  data-ui-tag=""
                  data-part="root"
                  data-part-root=""
                  data-size="sm"
                  data-variant="soft"
                >
                  <span data-part="body" data-part-body="">
                    <span data-part="label" data-part-label="">{{ labelFor(held) ?? held }}</span>
                  </span>
                </span>
              }
            </div>
          }
          <ng-content />
          @if (!loading() && offering(); as query) {
            <div
              role="option"
              data-part="item"
              data-part-item=""
              data-create
              aria-selected="false"
              [attr.data-value]="query"
              [id]="optionId(query)"
              [attr.data-current]="highlightedValue() === query ? '' : null"
              (click)="onCreateClick(query, $event)"
              (pointerdown)="onOptionPointerDown($event)"
              (pointerenter)="setHighlighted(query, 'pointer', $event)"
            >
              <span data-part="icon" data-part-icon=""></span>
              <span data-part="label" data-part-label="">{{ t('create', { query: query }) }}</span>
              <span data-part="indicator" data-part-indicator=""
                ><span slIcon><svg slGlyph name="plus"></svg></span
              ></span>
            </div>
          } @else if (!loading() && optionCount() === 0) {
            <div data-part="empty" data-part-empty="">{{ t('empty') }}</div>
          }
          @if (loading()) {
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
          <div
            data-part="status"
            data-part-status=""
            role="status"
            aria-live="polite"
            [attr.data-loading]="loading() ? '' : null"
          >
            {{ statusMessage() }}
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class SlMultiSelect implements ControlValueAccessor, OnInit, Validator {
  private static readonly flag = (given: boolean | string | undefined) =>
    given === undefined ? undefined : booleanAttribute(given);
  private static readonly count = (given: number | string | undefined) =>
    given === undefined ? undefined : numberAttribute(given);

  /** The chosen values, in the order the reader chose them. */
  readonly value = model<readonly MultiSelectOptionValue[]>([]);
  readonly valueChangeRequest = output<ChangeRequest<readonly MultiSelectOptionValue[]>>();
  /** What an unbound `value` starts from, read once. */
  readonly defaultValue = input<readonly MultiSelectOptionValue[] | undefined>(undefined);

  /** The characters in the field, which are not the chosen values. */
  readonly inputValue = model<string>('');
  readonly inputValueChangeRequest = output<ChangeRequest<string>>();

  readonly open = model<boolean>(false);
  readonly openChangeRequest = output<ChangeRequest<boolean>>();

  readonly highlightedValue = model<MultiSelectOptionValue | null>(null);
  readonly highlightedValueChangeRequest = output<ChangeRequest<MultiSelectOptionValue | null>>();

  /** What the family refused, and why. It holds no state and cancels nothing. */
  readonly valueRefuse = output<{
    values: readonly MultiSelectOptionValue[];
    cause: MultiSelectRefuseCause;
  }>();

  /** The last option came into view; the consumer fetches the next page. */
  readonly loadMore = output<void>();

  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly placeholder = input<string>('');
  readonly name = input<string | undefined>(undefined);
  readonly form = input<string | undefined>(undefined);
  readonly items = input<MultiSelectItems | undefined>(undefined);
  readonly total = input(undefined, { transform: SlMultiSelect.count });
  /**
   * BCP 47, for the comparison the default filter and the duplicate rule make.
   * The language in force when absent.
   */
  readonly locale = input<string | undefined>(undefined);
  readonly filter = input<MultiSelectFilter | undefined>(undefined);
  readonly validateValue = input<MultiSelectValidator | undefined>(undefined);
  readonly delimiters = input<readonly string[] | undefined>(undefined);
  readonly max = input(undefined, { transform: SlMultiSelect.count });

  readonly size = input<MultiSelectSize | undefined>(undefined);
  readonly variant = input<MultiSelectVariant | undefined>(undefined);
  readonly side = input<MultiSelectSide | undefined>(undefined);
  readonly align = input<MultiSelectAlign | undefined>(undefined);
  readonly width = input<MultiSelectWidth | undefined>(undefined);
  readonly mount = input<MultiSelectMount | undefined>(undefined);
  readonly strategy = input<MultiSelectStrategy | undefined>(undefined);
  readonly openOn = input<MultiSelectOpenOn | undefined>(undefined);
  readonly overflow = input<MultiSelectOverflow | undefined>(undefined);
  readonly chosenOptions = input<MultiSelectChosenOptions | undefined>(undefined);

  /**
   * Words laid over the catalog of the language in force, key by key: the
   * buttons, the chips, the counter, the offer to add, and the sentences.
   */
  readonly messages = input<PartialMessages<MultiSelectMessages> | undefined>(undefined);

  readonly sideOffset = input(undefined, { transform: SlMultiSelect.count });
  readonly alignOffset = input(undefined, { transform: SlMultiSelect.count });
  readonly collisionPadding = input(undefined, { transform: SlMultiSelect.count });

  readonly addOnPaste = input(undefined, { transform: SlMultiSelect.flag });
  readonly allowDuplicates = input(undefined, { transform: SlMultiSelect.flag });
  readonly commitOnBlur = input(undefined, { transform: SlMultiSelect.flag });
  readonly creatable = input(undefined, { transform: SlMultiSelect.flag });
  readonly editable = input(undefined, { transform: SlMultiSelect.flag });
  readonly reorderable = input(undefined, { transform: SlMultiSelect.flag });
  readonly highlightMatch = input(undefined, { transform: SlMultiSelect.flag });
  readonly clearable = input(undefined, { transform: SlMultiSelect.flag });
  readonly loop = input(undefined, { transform: SlMultiSelect.flag });
  readonly closeOnSelect = input(undefined, { transform: SlMultiSelect.flag });
  readonly closeOnEscape = input(undefined, { transform: SlMultiSelect.flag });
  readonly closeOnOutsidePress = input(undefined, { transform: SlMultiSelect.flag });
  readonly flip = input(undefined, { transform: SlMultiSelect.flag });
  readonly shift = input(undefined, { transform: SlMultiSelect.flag });
  readonly hideWhenDetached = input(undefined, { transform: SlMultiSelect.flag });
  readonly portal = input(undefined, { transform: SlMultiSelect.flag });
  readonly fullWidth = input(undefined, { transform: SlMultiSelect.flag });
  readonly disabled = input(undefined, { transform: SlMultiSelect.flag });
  readonly readOnly = input(undefined, { transform: SlMultiSelect.flag });
  readonly required = input(undefined, { transform: SlMultiSelect.flag });
  readonly invalid = input(undefined, { transform: SlMultiSelect.flag });
  readonly loading = input(false, { transform: booleanAttribute });

  private readonly defaults = injectMultiSelectDefaults();
  /** The family's words in the language in force, with this control's `messages` laid over them. */
  readonly t = injectMessages(multiSelectMessages, this.messages);
  private readonly inForceLocale = injectLocale();
  /** The locale the filter and the duplicate rule compare in: the `locale` input, or the language in force. */
  readonly resolvedLocale = computed(() => this.locale() ?? this.inForceLocale());
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly template = viewChild.required<TemplateRef<unknown>>('layer');
  private readonly controlRef = viewChild.required<{ nativeElement: HTMLInputElement }>('control');
  private readonly rowRef = viewChild.required<{ nativeElement: HTMLElement }>('row');
  private readonly countRef = viewChild<{ nativeElement: HTMLElement }>('count');

  readonly field = inject(SlField, { optional: true });

  private readonly identifier = Math.random().toString(36).slice(2, 8);
  readonly contentId = `sl-multi-select-${this.identifier}`;
  private readonly ownId = `sl-multi-select-input-${this.identifier}`;

  private readonly registry = signal(new Map<MultiSelectOptionValue, string>());
  /** Bumped by an option whose presence or visibility changed; read once per render. */
  private readonly collection = signal(0);
  readonly optionCount = signal(0);
  readonly hiddenCount = signal(0);
  readonly narrow = signal(false);
  readonly editingValue = signal<MultiSelectOptionValue | null>(null);
  readonly editingText = signal('');
  private entry: Entry = 'none';

  private view: EmbeddedViewRef<unknown> | null = null;
  private layerNode: HTMLElement | null = null;
  private surfaceNode: HTMLElement | null = null;
  private portalRoot: PortalRootHandle | null = null;
  private positioner: PositionerHandle | null = null;
  private layer: DismissableLayerHandle | null = null;
  private presence: PresenceHandle | null = null;
  private observer: IntersectionObserver | null = null;
  private ring: ArrowNavigationHandle | null = null;
  private removal: RemovalFocusHandle | null = null;
  private collapse: CollapseHandle | null = null;
  private gate: WidthGateHandle | null = null;
  private disabledByForm = signal<boolean | undefined>(undefined);

  private readonly hostId = inject(new HostAttributeToken('id'), { optional: true });

  private onChange: (value: readonly MultiSelectOptionValue[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly resolvedSize = computed(() => this.size() ?? this.field?.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  readonly resolvedSide = computed(() => this.side() ?? this.defaults.side);
  readonly resolvedWidth = computed(() => this.width() ?? this.defaults.width);
  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);
  readonly resolvedOpenOn = computed(() => this.openOn() ?? this.defaults.openOn);
  readonly resolvedOverflow = computed(() => this.overflow() ?? this.defaults.overflow);
  readonly resolvedChosenOptions = computed(
    () => this.chosenOptions() ?? this.defaults.chosenOptions,
  );
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);
  readonly resolvedClearable = computed(() => this.clearable() ?? this.defaults.clearable);
  readonly resolvedFullWidth = computed(() => this.fullWidth() ?? this.defaults.fullWidth);
  readonly resolvedCreatable = computed(() => this.creatable() ?? this.defaults.creatable);
  readonly resolvedEditable = computed(() => this.editable() ?? this.defaults.editable);
  readonly resolvedReorderable = computed(() => this.reorderable() ?? this.defaults.reorderable);
  readonly resolvedAddOnPaste = computed(() => this.addOnPaste() ?? this.defaults.addOnPaste);
  readonly resolvedCommitOnBlur = computed(() => this.commitOnBlur() ?? this.defaults.commitOnBlur);
  readonly resolvedAllowDuplicates = computed(
    () => this.allowDuplicates() ?? this.defaults.allowDuplicates,
  );
  readonly resolvedDelimiters = computed(() => this.delimiters() ?? this.defaults.delimiters);
  readonly resolvedMax = computed(() => this.max() ?? this.defaults.max);
  readonly resolvedCloseOnSelect = computed(
    () => this.closeOnSelect() ?? this.defaults.closeOnSelect,
  );
  readonly resolvedHighlightMatch = computed(
    () => this.highlightMatch() ?? this.defaults.highlightMatch,
  );

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
  readonly controlId = computed(() => this.hostId ?? this.field?.ids().control ?? this.ownId);
  readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  /** The set has reached `max` and takes nothing more. */
  readonly full = computed(() => {
    const limit = this.resolvedMax();
    return limit !== null && this.value().length >= limit;
  });
  readonly frozen = computed(() => this.resolvedReadOnly() || this.resolvedDisabled());

  private readonly declared = computed(() => {
    const table = new Map<MultiSelectOptionValue, string>();
    for (const option of flatten(this.items())) table.set(option.value, option.label);
    return table;
  });

  /** The query is the typed text: unlike a combobox's, committing empties it. */
  readonly query = computed(() => this.inputValue());

  private readonly collator = computed<Filter>(() =>
    createFilter({ locale: this.resolvedLocale() }),
  );

  readonly showClear = computed(
    () =>
      this.resolvedClearable() &&
      (this.value().length > 0 || this.inputValue() !== '') &&
      !this.resolvedDisabled() &&
      !this.resolvedReadOnly(),
  );

  readonly gridLabel = computed(() => this.t('chosen', { count: this.value().length }));
  readonly chosenId = computed(() => `${this.controlId()}-chosen`);
  /**
   * The contract's wiring: the grid carries the field's label and the count of
   * chips. A label written as text is joined to the count; a field's label is
   * read through `aria-labelledby` with the count beside it.
   */
  readonly gridName = computed((): { label: string | null; labelledBy: string | null } => {
    const written = this.ariaLabel();
    if (written !== undefined)
      return { label: `${written}, ${this.gridLabel()}`, labelledBy: null };
    const field = this.field?.ids().label;
    if (field !== undefined) return { label: null, labelledBy: `${field} ${this.chosenId()}` };
    return { label: this.gridLabel(), labelledBy: null };
  });

  readonly counterText = computed(() => {
    const limit = this.resolvedMax();
    if (limit !== null) {
      return this.t('counter', { count: this.value().length, max: limit });
    }
    if (this.narrow() && this.value().length > 0) return this.gridLabel();
    return null;
  });

  readonly activeDescendant = computed(() => {
    const held = this.highlightedValue();
    return this.isOpen() && held !== null ? this.optionId(held) : null;
  });

  /**
   * The offer to add what was typed: while the consumer allows one, the reader
   * typed something, nothing matched, and there is room to take it. A full
   * control refuses every value, so an offer there is one the next press turns
   * down.
   */
  readonly offering = computed(() =>
    this.resolvedCreatable() &&
    !this.full() &&
    this.query().trim() !== '' &&
    this.optionCount() === 0
      ? this.query()
      : null,
  );

  readonly statusMessage = computed(() => {
    if (this.loading()) return this.t('loading');
    const count = this.optionCount();
    return count === 0 ? '' : this.t('count', { count });
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const open = this.isOpen();
      untracked(() => (open ? this.show() : this.hide()));
    });

    afterNextRender(() => {
      this.bindRow();
      if (this.resolvedMount() === 'eager' && !this.isOpen()) this.build();
    });

    /* A value arriving or leaving changes what there is to fit, and which cells
       the ring walks. */
    afterRenderEffect(() => {
      this.value();
      this.resolvedOverflow();
      untracked(() => {
        this.ring?.refresh();
        this.collapse?.refresh();
      });
    });

    /* One count per render, however many options changed in it. Each option
       counting the popup itself read the whole collection once per option —
       quadratic in the option count on every keystroke that filters. */
    afterRenderEffect(() => {
      this.collection();
      untracked(() => this.recount());
    });

    destroyRef.onDestroy(() => {
      this.teardown();
      this.ring?.destroy();
      this.removal?.destroy();
      this.collapse?.destroy();
      this.gate?.destroy();
    });
  }

  ngOnInit() {
    const seed = this.defaultValue();
    if (seed === undefined || this.value().length > 0) return;
    this.value.set([...seed]);
  }

  optionId(value: MultiSelectOptionValue): string {
    return `${this.contentId}-option-${encodeURIComponent(value)}`;
  }

  labelFor(value: MultiSelectOptionValue): string | undefined {
    return this.declared().get(value) ?? this.registry().get(value);
  }

  registerLabel(value: MultiSelectOptionValue, label: string) {
    if (this.registry().get(value) === label) return;
    const next = new Map(this.registry());
    next.set(value, label);
    this.registry.set(next);
  }

  protected removeLabelFor(value: MultiSelectOptionValue) {
    return this.t('remove', { label: this.labelFor(value) ?? value });
  }

  protected chipLabel(value: MultiSelectOptionValue, index: number) {
    if (!this.resolvedReorderable()) return null;
    return this.t('reorder', {
      label: this.labelFor(value) ?? value,
      position: index + 1,
      count: this.value().length,
    });
  }

  matches(label: string): boolean {
    const query = this.query();
    const given = this.filter();
    if (query === '' || given === null) return true;
    if (given !== undefined) return given(label, query);
    return this.collator().contains(label, query);
  }

  /** Whether an option may be taken: a full control refuses what it does not hold. */
  refuses(value: MultiSelectOptionValue): boolean {
    return this.full() && !this.value().includes(value);
  }

  /** An option says the collection changed; the count follows after the render. */
  collectionChanged() {
    this.collection.update((version) => version + 1);
  }

  recount() {
    this.optionCount.set(
      this.options().filter((option) => option.dataset['create'] === undefined).length,
    );
    this.dropStaleHighlight();
  }

  options(): HTMLElement[] {
    return [...(this.surfaceNode?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? [])];
  }

  focus() {
    this.controlRef().nativeElement.focus({ preventScroll: true });
  }

  scrollToKey(value: MultiSelectOptionValue) {
    const option = this.options().find((candidate) => candidate.dataset['value'] === value);
    if (option !== undefined && this.surfaceNode !== null) revealWithin(option, this.surfaceNode);
  }

  private announce(message: string) {
    if (message === '') return;
    getLiveAnnouncer(this.host.nativeElement.ownerDocument).announce(message, { repeat: true });
  }

  setOpen(next: boolean, reason: MultiSelectOpenReason, source?: Event) {
    if (next === this.isOpen()) return;
    const state = createControllable<boolean>({
      initial: this.isOpen(),
      onRequest: (request) => this.openChangeRequest.emit(request),
    });
    if (!state.request(next, reason, source)) return;
    this.open.set(next);
    if (!next) {
      this.highlightedValue.set(null);
      this.entry = 'none';
    }
  }

  setHighlighted(
    next: MultiSelectOptionValue | null,
    reason: MultiSelectHighlightReason,
    source?: Event,
  ) {
    if (next === this.highlightedValue()) return;
    const state = createControllable<MultiSelectOptionValue | null>({
      initial: this.highlightedValue(),
      onRequest: (request) => this.highlightedValueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) {
      this.highlightedValue.set(next);
      if (next !== null) this.scrollToKey(next);
    }
  }

  setInputValue(next: string, reason: MultiSelectInputReason, source?: Event) {
    if (next === this.inputValue()) return;
    const state = createControllable<string>({
      initial: this.inputValue(),
      onRequest: (request) => this.inputValueChangeRequest.emit(request),
    });
    if (!state.request(next, reason, source)) return;
    this.inputValue.set(next);
    /* The binding writes the input at the next render, and a key that arrives
       before it types into what the browser still holds: a commit left its
       text in the input, and the next character joined it. */
    const element = this.host.nativeElement.querySelector<HTMLInputElement>("[data-part='input']");
    if (element !== null && element.value !== next) element.value = next;
  }

  /** One request for one transition, whatever moved the set. */
  private commit(next: readonly string[], reason: MultiSelectValueReason, source?: Event) {
    if (same(next, this.value())) return false;
    const state = createControllable<readonly MultiSelectOptionValue[]>({
      initial: this.value(),
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (!state.request(next, reason, source)) return false;
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
    return true;
  }

  /**
   * Every candidate judged against the set it would join, in order. It returns
   * the set that survived rather than committing one, so a value arriving and a
   * value edited in place apply one rule and cannot drift apart.
   */
  private judge(candidates: readonly string[], held: readonly string[]) {
    const next = [...held];
    const refused: Record<MultiSelectRefuseCause, string[]> = {
      duplicate: [],
      limit: [],
      invalid: [],
    };
    let existing: MultiSelectOptionValue | null = null;
    const validate = this.validateValue();
    const collator = this.collator();
    const limit = this.resolvedMax();

    for (const candidate of candidates) {
      const text = candidate.trim();
      if (text === '') continue;

      if (validate !== undefined && !validate(text, next)) {
        refused.invalid.push(text);
        continue;
      }

      if (!this.resolvedAllowDuplicates()) {
        const twin = next.find(
          (value) =>
            value === text ||
            collator.equals(value, text) ||
            collator.equals(this.labelFor(value) ?? value, text),
        );
        if (twin !== undefined) {
          refused.duplicate.push(text);
          existing ??= twin;
          continue;
        }
      }

      if (limit !== null && next.length >= limit) {
        refused.limit.push(text);
        continue;
      }

      next.push(text);
    }

    return { existing, next, refused };
  }

  private report(
    refused: Record<MultiSelectRefuseCause, string[]>,
    existing: MultiSelectOptionValue | null,
  ) {
    for (const cause of ['duplicate', 'limit', 'invalid'] as const) {
      if (refused[cause].length === 0) continue;
      this.valueRefuse.emit({ values: refused[cause], cause });
    }

    /* A duplicate is answered by the chip that already holds it taking focus;
       the other two have nothing to point at, so they are said. */
    if (existing !== null) this.focusChip(existing);
    const limit = this.resolvedMax();
    if (refused.limit.length > 0 && limit !== null)
      this.announce(this.t('counter', { count: limit, max: limit }));
  }

  /** The one door into the set. */
  admit(candidates: readonly string[], reason: MultiSelectValueReason, source?: Event) {
    const held = this.value();
    const { existing, next, refused } = this.judge(candidates, held);
    if (next.length > held.length) this.commit(next, reason, source);
    this.report(refused, existing);
  }

  /**
   * One value edited in place, which is one transition and not a removal
   * followed by an addition — and judged against the set *without* it, or every
   * edit is a duplicate of itself.
   */
  replace(target: MultiSelectOptionValue, text: string, source?: Event) {
    const held = this.value();
    const index = held.indexOf(target);
    if (index === -1) return;
    if (text.trim() === '' || text === target) return;

    const without = held.filter((value) => value !== target);
    const { existing, next, refused } = this.judge([text], without);
    if (next.length > without.length) {
      const taken = next[next.length - 1] as string;
      const ordered = [...without];
      ordered.splice(index, 0, taken);
      this.commit(ordered, 'submit', source);
    }
    this.report(refused, existing);
  }

  remove(target: MultiSelectOptionValue, source?: Event) {
    const held = this.value();
    const next = held.filter((value) => value !== target);
    if (next.length === held.length) return;
    if (this.commit(next, 'remove', source)) {
      this.announce(`${this.labelFor(target) ?? target}, ${next.length}`);
    }
  }

  toggle(target: MultiSelectOptionValue, reason: MultiSelectValueReason, source?: Event) {
    if (this.value().includes(target)) {
      this.remove(target, source);
      return;
    }
    this.admit([target], reason, source);
  }

  clear(source?: Event) {
    this.commit([], 'clear', source);
    this.setInputValue('', 'clear', source);
  }

  /** Reorder, and the only shape it has: one value moving to one index. */
  move(from: number, to: number, source?: Event) {
    const held = this.value();
    if (from < 0 || from >= held.length) return;
    const target = Math.min(Math.max(to, 0), held.length - 1);
    if (target === from) return;

    const next = [...held];
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved as string);
    if (!this.commit(next, 'keyboard', source)) return;
    this.announce(`${this.labelFor(moved as string) ?? moved}, ${target + 1}, ${next.length}`);
    /* The chip travelled with the reader's focus; the ring has to be told the
       cells moved under it. After the render rather than after a microtask:
       a browser runs microtasks first, and the chip has not moved yet. */
    this.afterRender(() => {
      this.ring?.refresh();
      this.focusChip(moved as string);
    });
  }

  private chips(): HTMLElement[] {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>(CHIP_SELECTOR)];
  }

  /** Runs once the change in hand has reached the DOM. */
  private afterRender(callback: () => void) {
    afterNextRender(callback, { injector: this.injector });
  }

  private focusChip(value: MultiSelectOptionValue) {
    const chip = this.chips().find((candidate) => candidate.dataset['value'] === value);
    chip?.focus({ preventScroll: true });
  }

  private splitText(text: string): string[] {
    const delimiters = this.resolvedDelimiters();
    if (delimiters.length === 0) return [text];
    const pattern = new RegExp(
      `[${delimiters.map((mark) => mark.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')).join('')}]`,
    );
    return text.split(pattern);
  }

  /** The typed text, committed as one or several values. */
  private commitQuery(source?: Event) {
    if (!this.resolvedCreatable()) return false;
    const text = this.inputValue();
    if (text.trim() === '') return false;
    this.admit(this.splitText(text), 'submit', source);
    this.setInputValue('', 'submit', source);
    return true;
  }

  protected onInput(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    this.setInputValue(next, 'keyboard', event);
    if (
      this.resolvedOpenOn() !== 'manual' &&
      !this.isOpen() &&
      !this.resolvedReadOnly() &&
      next !== ''
    ) {
      this.entry = 'none';
      this.setOpen(true, 'keyboard', event);
    } else {
      this.recount();
    }
  }

  protected onFocus() {
    if (this.resolvedOpenOn() !== 'focus' || this.isOpen()) return;
    if (this.resolvedDisabled() || this.resolvedReadOnly()) return;
    this.entry = 'none';
    this.setOpen(true, 'keyboard');
  }

  /* A press on the input opens a closed popup and never closes an open one,
     because the same press places the caret. Under `focus` the press has
     already opened it through focus, so this finds it open. */
  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || this.resolvedOpenOn() === 'manual' || this.isOpen()) return;
    if (this.resolvedDisabled() || this.resolvedReadOnly()) return;
    this.entry = 'none';
    this.setOpen(true, 'pointer', event);
  }

  protected onEditInput(event: Event) {
    this.editingText.set((event.target as HTMLInputElement).value);
  }

  protected onEditKeyDown(value: MultiSelectOptionValue, event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitEdit(value, event);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.editingValue.set(null);
      this.afterRender(() => this.focusChip(value));
    }
  }

  protected commitEdit(value: MultiSelectOptionValue, event: Event) {
    if (this.editingValue() !== value) return;
    const text = this.editingText();
    this.editingValue.set(null);
    this.replace(value, text, event);
    this.afterRender(() => this.focusChip(text.trim() === '' ? value : text.trim()));
  }

  protected onPaste(event: ClipboardEvent) {
    if (!this.resolvedAddOnPaste() || !this.resolvedCreatable() || this.resolvedReadOnly()) return;
    const text = event.clipboardData?.getData('text') ?? '';
    const parts = this.splitText(text).filter((part) => part.trim() !== '');
    if (parts.length < 2) return;
    event.preventDefault();
    this.admit(parts, 'submit', event);
    this.setInputValue('', 'submit', event);
  }

  protected onBlur(event: FocusEvent) {
    this.onTouched();
    const next = event.relatedTarget;
    if (next instanceof Node && this.surfaceNode?.contains(next) === true) return;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    const began = pressOrigin(this.controlRef().nativeElement.ownerDocument);
    if (began instanceof Node && this.surfaceNode?.contains(began) === true) return;

    if (this.resolvedCommitOnBlur()) this.commitQuery(event);
    if (this.isOpen()) this.setOpen(false, 'blur', event);
  }

  protected onClear(event: MouseEvent) {
    this.clear(event);
    this.focus();
  }

  protected onRemoveClick(value: MultiSelectOptionValue, event: MouseEvent) {
    event.stopPropagation();
    this.remove(value, event);
  }

  protected onCountClick(event: MouseEvent) {
    this.setOpen(true, 'pointer', event);
  }

  protected onToggle(event: MouseEvent) {
    if (this.resolvedDisabled() || this.resolvedReadOnly()) return;
    this.entry = 'none';
    this.setOpen(!this.isOpen(), 'pointer', event);
    this.focus();
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (this.resolvedDisabled()) return;
    const alt = event.altKey;

    if (this.resolvedDelimiters().includes(event.key) && !alt) {
      event.preventDefault();
      this.commitQuery(event);
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        if (this.resolvedReadOnly()) return;
        event.preventDefault();
        if (!this.isOpen()) this.openWith(alt ? 'none' : 'first', event);
        else if (!alt) this.moveHighlight('next', event);
        return;
      case 'ArrowUp':
        if (this.resolvedReadOnly()) return;
        event.preventDefault();
        if (alt) this.setOpen(false, 'keyboard', event);
        else if (!this.isOpen()) this.openWith('last', event);
        else this.moveHighlight('previous', event);
        return;
      case 'PageDown':
        if (!this.isOpen()) return;
        event.preventDefault();
        this.moveHighlight('pageDown', event);
        return;
      case 'PageUp':
        if (!this.isOpen()) return;
        event.preventDefault();
        this.moveHighlight('pageUp', event);
        return;
      case 'Enter': {
        const held = this.highlightedValue();
        if (held !== null) {
          event.preventDefault();
          if (held === this.offering()) this.commitQuery(event);
          else {
            this.toggle(held, 'select', event);
            this.setInputValue('', 'select', event);
            if (this.resolvedCloseOnSelect()) this.setOpen(false, 'select', event);
          }
          return;
        }
        if (this.commitQuery(event)) event.preventDefault();
        return;
      }
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.setOpen(false, 'escape', event);
          return;
        }
        if (this.inputValue() === '') return;
        event.preventDefault();
        this.setInputValue('', 'clear', event);
        return;
      case 'Backspace': {
        /* §6's rule: from an empty field the first press moves focus to the
           last chip and removes nothing, and the second — which lands on the
           chip — removes it. */
        if (this.inputValue() !== '') return;
        const element = event.target as HTMLInputElement;
        if (element.selectionStart !== 0) return;
        if (this.resolvedReadOnly() || this.value().length === 0) return;
        const last = this.chips().at(-1);
        if (last === undefined) return;
        event.preventDefault();
        last.focus({ preventScroll: true });
        return;
      }
      case 'Tab':
        if (this.isOpen()) this.setOpen(false, 'dismiss', event);
        return;
      default:
        /* Every other key is the browser's, which the pattern asks for by name. */
        break;
    }
  }

  protected onChipKeyDown(value: MultiSelectOptionValue, index: number, event: KeyboardEvent) {
    if (event.defaultPrevented) return;

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (this.frozen()) return;
        event.preventDefault();
        this.remove(value, event);
        return;
      case 'Enter':
        if (this.frozen() || !this.resolvedEditable()) return;
        event.preventDefault();
        this.editingText.set(this.labelFor(value) ?? value);
        this.editingValue.set(value);
        this.afterRender(() => {
          const field = this.host.nativeElement.querySelector<HTMLInputElement>(
            `[data-value="${CSS.escape(value)}"] input`,
          );
          field?.focus({ preventScroll: true });
        });
        return;
      case 'Escape':
        event.preventDefault();
        this.focus();
        return;
      default:
        break;
    }

    /* Reorder. `Alt` and an arrow, following the writing direction. */
    if (this.resolvedReorderable() && event.altKey && !this.frozen()) {
      const rtl =
        this.host.nativeElement.ownerDocument.defaultView?.getComputedStyle(this.host.nativeElement)
          .direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (event.key === forward) {
        event.preventDefault();
        this.move(index, index + 1, event);
        return;
      }
      if (event.key === back) {
        event.preventDefault();
        this.move(index, index - 1, event);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        this.move(index, 0, event);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        this.move(index, this.value().length - 1, event);
        return;
      }
    }

    /* The grid pattern's alphanumeric branch: a printable character on a cell
       holding editable content takes focus into its field and types there. */
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.focus();
    }
  }

  protected onOptionPointerDown(event: PointerEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();
  }

  protected onCreateClick(query: string, event: MouseEvent) {
    this.admit(this.splitText(query), 'submit', event);
    this.setInputValue('', 'submit', event);
    this.focus();
  }

  private openWith(entry: Entry, event: Event) {
    this.entry = entry;
    this.setOpen(true, 'keyboard', event);
  }

  private moveHighlight(intent: MoveIntent, event?: Event) {
    const list = this.options();
    if (list.length === 0) return;
    const held = this.highlightedValue();
    const index = moveIndex({
      enabled: list.map(
        (option) =>
          option.dataset['disabled'] === undefined &&
          option.getAttribute('aria-disabled') !== 'true',
      ),
      from: held === null ? -1 : list.findIndex((option) => option.dataset['value'] === held),
      intent,
      loop: this.resolvedLoop(),
    });
    if (index !== -1) this.setHighlighted(list[index]?.dataset['value'] ?? null, 'keyboard', event);
  }

  private dropStaleHighlight() {
    const held = this.highlightedValue();
    if (held === null || held === this.offering()) return;
    const kept = this.options().some((option) => option.dataset['value'] === held);
    if (!kept) this.setHighlighted(null, 'keyboard');
  }

  /**
   * The ring over the cells, the removal rule, the collapse and the width gate.
   * All four belong to the row rather than to the layer, so they are bound once
   * and outlive every open.
   */
  private bindRow() {
    const row = this.rowRef().nativeElement;

    this.ring = createArrowNavigation(row, {
      itemSelector: `${CHIP_SELECTOR}, [data-part='field'] > [data-part='input']`,
      loop: false,
      /* The field keeps the caret keys while there is anything to move the
         caret through, and gives them up when the query is empty. */
      ownedKeys: (item) =>
        item instanceof HTMLInputElement && item.value !== ''
          ? ['ArrowLeft', 'ArrowRight', 'Home', 'End']
          : [],
    });

    this.removal = createRemovalFocus(row, {
      fallback: () => this.controlRef().nativeElement,
      itemSelector: CHIP_SELECTOR,
    });

    this.gate = createWidthGate(this.host.nativeElement, {
      at: 120,
      onChange: (narrow) => this.narrow.set(narrow),
    });

    this.collapse = createCollapse(row, {
      collapsible: () => this.resolvedOverflow() === 'collapse',
      onChange: (units) => this.hiddenCount.set(Math.max(units.length, 1)),
      trigger: () => this.countRef()?.nativeElement ?? null,
      /* The counting chip is the trigger, never a unit: measured as one, it
         counted itself and stood one too high, and was collapsed into itself. */
      units: () =>
        [...row.querySelectorAll<HTMLElement>(CHIP_SELECTOR)].filter(
          (unit) => !unit.hasAttribute('data-count'),
        ),
    });
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

    this.portalRoot = createPortalRoot({
      origin: this.host.nativeElement,
      disabled: this.portal() === false,
    });

    this.view = this.viewContainer.createEmbeddedView(this.template());
    this.view.detectChanges();

    this.layerNode = this.view.rootNodes.find(
      (node: unknown): node is HTMLElement => node instanceof HTMLElement,
    ) as HTMLElement | null;
    this.surfaceNode = this.layerNode?.querySelector<HTMLElement>("[data-part='content']") ?? null;
    if (this.layerNode === null) return;

    this.portalRoot.container?.append(this.layerNode);
    this.presence = createPresence({ present: this.isOpen() });
    this.presence.setNode(this.layerNode);
  }

  private position() {
    if (this.layerNode === null) return;

    this.positioner?.destroy();
    this.positioner = createPositioner(this.host.nativeElement, this.layerNode, {
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
    });
    /* The height that bounds the list arrives with the position, after the
       highlight has landed, so the highlighted row is revealed again. */
    void this.positioner.update().then(() => {
      const held = this.highlightedValue();
      if (held !== null) this.scrollToKey(held);
    });
  }

  private bind() {
    if (this.layerNode === null) return;

    this.layer = createDismissableLayer(this.layerNode, {
      branches: [this.host.nativeElement],
      escape: this.closeOnEscape() ?? this.defaults.closeOnEscape,
      focusOutside: false,
      modal: false,
      outsidePress: this.closeOnOutsidePress() ?? this.defaults.closeOnOutsidePress,
      scrollLock: false,
      onDismiss: (request) => {
        this.setOpen(
          false,
          request.reason === 'escape' ? 'escape' : 'outsidePress',
          request.source as Event | undefined,
        );
      },
    });

    this.observeEnd();
  }

  private observeEnd() {
    this.observer?.disconnect();
    this.observer = null;
    const root = this.surfaceNode;
    if (root === null || typeof IntersectionObserver !== 'function') return;
    const last = this.options().at(-1);
    if (last === undefined) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this.loadMore.emit();
      },
      { root },
    );
    this.observer.observe(last);
  }

  private enter() {
    this.recount();
    if (this.entry === 'none') return;
    this.moveHighlight(this.entry);
    this.entry = 'none';
  }

  private hide() {
    this.unbind();
    if (this.resolvedMount() === 'active') this.teardown();
  }

  private unbind() {
    this.layer?.destroy();
    this.positioner?.destroy();
    this.observer?.disconnect();
    this.layer = null;
    this.positioner = null;
    this.observer = null;
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

  writeValue(value: readonly MultiSelectOptionValue[] | null) {
    this.value.set(value === null ? [] : [...value]);
  }

  registerOnChange(fn: (value: readonly MultiSelectOptionValue[]) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabledByForm.set(isDisabled);
  }

  /**
   * Three validities the family owns, and none of them is one a native input
   * can describe: a required control holding nothing, a set over its limit, and
   * a set holding a value twice where duplicates are refused. The second is the
   * one Zag has the mechanism for and no validator to report it with.
   */
  validate(): ValidationErrors | null {
    const held = this.value();
    if (this.resolvedRequired() && held.length === 0) return { required: true };

    const limit = this.resolvedMax();
    if (limit !== null && held.length > limit) {
      return { tooMany: { max: limit, actual: held.length } };
    }

    if (!this.resolvedAllowDuplicates() && new Set(held).size !== held.length) {
      return { duplicate: true };
    }
    return null;
  }
}
