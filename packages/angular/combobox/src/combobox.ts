import { createFilter, moveIndex, revealWithin } from '@slotted/core/collection';
import type { Filter, MoveIntent } from '@slotted/core/collection';
import { createDismissableLayer, pressOrigin } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { comboboxMessages, type ComboboxMessages, type PartialMessages } from '@slotted/core/i18n';
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

import { injectComboboxDefaults } from './combobox-defaults';
import type {
  ComboboxAlign,
  ComboboxAutocomplete,
  ComboboxFilter,
  ComboboxHighlightReason,
  ComboboxInputReason,
  ComboboxItems,
  ComboboxMount,
  ComboboxOpenOn,
  ComboboxOpenReason,
  ComboboxOption,
  ComboboxOptionGroup,
  ComboboxOptionValue,
  ComboboxSide,
  ComboboxSize,
  ComboboxStrategy,
  ComboboxValueReason,
  ComboboxVariant,
  ComboboxWidth,
} from './combobox-defaults';

export * from './combobox-defaults';

type Entry = 'selected' | 'first' | 'last' | 'none';

/**
 * A filtered-out option stays in the DOM and is hidden, so that the element a
 * reader's pointer is over survives a keystroke. It is therefore not part of
 * the result set, and every count, every move and every completion has to skip
 * it — which is what the `:not([hidden])` is for.
 */
const OPTION_SELECTOR = "[data-part='item']:not([hidden])";

const isGroup = (entry: ComboboxItems[number]): entry is ComboboxOptionGroup => 'options' in entry;

const flatten = (items: ComboboxItems | undefined): readonly ComboboxOption[] =>
  items === undefined ? [] : items.flatMap((entry) => (isGroup(entry) ? entry.options : [entry]));

/**
 * A text input with a listbox of options filtered by what was typed.
 *
 * **The host element is the control**, as `sl-select`'s is: the frame carries
 * `data-ui`, and the input, the clear button, the trigger and the hidden
 * submission field are its template. The popup is an `ng-template` built into
 * the portal when it opens.
 *
 * **The typed text and the chosen key are two contracts.** `inputValue` and
 * `value` are separate models, each with its own request, because a list whose
 * labels are not unique cannot derive one from the other.
 *
 * **Every text-editing key stays the browser's.** The key handler binds the
 * arrows, `Enter`, `Escape` and the page keys, and nothing else — the pattern's
 * IMPORTANT note asks exactly that.
 */
@Component({
  selector: 'sl-combobox',
  standalone: true,
  exportAs: 'slCombobox',
  imports: [SlGlyph, SlIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../../../styles/src/combobox/combobox.css'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlCombobox), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlCombobox), multi: true },
  ],
  host: {
    'data-ui': 'combobox',
    'data-ui-combobox': '',
    'data-part': 'root',
    'data-part-root': '',
    /* The name a page writes on the element is forwarded to the control, and
       the root keeps none: ARIA 1.2 does not name a generic element. */
    '[attr.aria-label]': 'null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-full-width]': "resolvedFullWidth() ? '' : null",
    '[attr.data-open]': "isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() ? '' : null",
    '[attr.data-required]': "resolvedRequired() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
  },
  template: `
    <input
      #control
      type="text"
      role="combobox"
      data-part="input"
      data-part-input=""
      [id]="controlId()"
      [value]="display()"
      [disabled]="resolvedDisabled()"
      [readOnly]="resolvedReadOnly()"
      [required]="resolvedRequired()"
      [placeholder]="placeholder()"
      [attr.aria-autocomplete]="resolvedAutocomplete()"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-controls]="isOpen() ? contentId : null"
      [attr.aria-activedescendant]="activeDescendant()"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-readonly]="resolvedReadOnly() ? true : null"
      [attr.aria-invalid]="resolvedInvalid() ? true : null"
      (input)="onInput($event)"
      (keydown)="onKeyDown($event)"
      (focus)="onFocus()"
      (click)="onClick($event)"
      (blur)="onBlur($event)"
    />

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
    <button
      type="button"
      tabindex="-1"
      data-part="trigger"
      data-part-trigger=""
      [disabled]="resolvedDisabled()"
      [attr.aria-label]="t('trigger')"
      (click)="onToggle($event)"
    >
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
    </button>

    @if (name(); as submissionName) {
      <input
        type="text"
        aria-hidden="true"
        tabindex="-1"
        readonly
        [name]="submissionName"
        [attr.form]="form() ?? null"
        [value]="value() ?? ''"
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
      />
    }

    <ng-template #layer>
      <div
        data-ui="combobox"
        data-ui-combobox=""
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
          [id]="contentId"
          [attr.aria-label]="ariaLabel() ?? null"
          [attr.aria-busy]="loading() ? true : null"
          [attr.data-loading]="loading() ? '' : null"
        >
          <ng-content />
          <!--
            The offer to add what was typed (CB8). It is an option, not a
            button: ArrowDown reaches it, aria-activedescendant names it and
            Enter takes it, through the machinery every other option uses. It
            replaces the empty message rather than standing beside it.
          -->
          @if (!loading() && creating(); as query) {
            <div
              role="option"
              data-part="item"
              data-part-item=""
              data-create
              [attr.data-value]="query"
              [id]="optionId(query)"
              [attr.data-current]="highlightedValue() === query ? '' : null"
              (click)="onCreateClick(query, $event)"
              (pointerdown)="onOptionPointerDown($event)"
              (pointerenter)="setHighlighted(query, 'pointer', $event)"
            >
              <span data-part="label" data-part-label="">{{ t('create', { query: query }) }}</span>
            </div>
          } @else if (!loading() && optionCount() === 0) {
            <div data-part="empty" data-part-empty="">{{ t('empty') }}</div>
          }
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
export class SlCombobox implements ControlValueAccessor, OnInit, Validator {
  private static readonly flag = (given: boolean | string | undefined) =>
    given === undefined ? undefined : booleanAttribute(given);
  private static readonly count = (given: number | string | undefined) =>
    given === undefined ? undefined : numberAttribute(given);

  /** The chosen option's key. */
  readonly value = model<ComboboxOptionValue | null>(null);
  readonly valueChangeRequest = output<ChangeRequest<ComboboxOptionValue | null>>();
  /** What an unbound `value` starts from, read once. It seeds the key and not the text. */
  readonly defaultValue = input<ComboboxOptionValue | null | undefined>(undefined);

  /** The characters in the field, which are not the chosen key. */
  readonly inputValue = model<string>('');
  readonly inputValueChangeRequest = output<ChangeRequest<string>>();

  readonly open = model<boolean>(false);
  readonly openChangeRequest = output<ChangeRequest<boolean>>();

  readonly highlightedValue = model<ComboboxOptionValue | null>(null);
  readonly highlightedValueChangeRequest = output<ChangeRequest<ComboboxOptionValue | null>>();

  /** The last option came into view; the consumer fetches the next page. */
  readonly loadMore = output<void>();

  /** The text the field refused, and why (CB7). */
  readonly inputReset = output<{ rejected: string; reason: 'blur' }>();

  /** The query the reader asked to add. The collection is the consumer's (CB8). */
  readonly create = output<{ query: string; reason: ComboboxValueReason }>();

  /** Whether the consumer will take a value the collection does not hold (CB8). */
  readonly creatable = input(undefined, { transform: SlCombobox.flag });

  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly placeholder = input<string>('');
  readonly name = input<string | undefined>(undefined);
  readonly form = input<string | undefined>(undefined);
  readonly items = input<ComboboxItems | undefined>(undefined);
  readonly total = input(undefined, { transform: SlCombobox.count });
  /** BCP 47, for the comparison the default filter makes. The language in force when absent. */
  readonly locale = input<string | undefined>(undefined);
  readonly filter = input<ComboboxFilter | undefined>(undefined);

  readonly size = input<ComboboxSize | undefined>(undefined);
  readonly variant = input<ComboboxVariant | undefined>(undefined);
  readonly side = input<ComboboxSide | undefined>(undefined);
  readonly align = input<ComboboxAlign | undefined>(undefined);
  readonly width = input<ComboboxWidth | undefined>(undefined);
  readonly mount = input<ComboboxMount | undefined>(undefined);
  readonly strategy = input<ComboboxStrategy | undefined>(undefined);
  readonly autocomplete = input<ComboboxAutocomplete | undefined>(undefined);
  readonly openOn = input<ComboboxOpenOn | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * clear and trigger buttons, the offer to create, the empty, loading and
   * count sentences.
   */
  readonly messages = input<PartialMessages<ComboboxMessages> | undefined>(undefined);

  readonly sideOffset = input(undefined, { transform: SlCombobox.count });
  readonly alignOffset = input(undefined, { transform: SlCombobox.count });
  readonly collisionPadding = input(undefined, { transform: SlCombobox.count });

  readonly allowsCustomValue = input(undefined, { transform: SlCombobox.flag });
  readonly autoHighlight = input(undefined, { transform: SlCombobox.flag });
  readonly highlightMatch = input(undefined, { transform: SlCombobox.flag });
  readonly clearable = input(undefined, { transform: SlCombobox.flag });
  readonly loop = input(undefined, { transform: SlCombobox.flag });
  readonly closeOnSelect = input(undefined, { transform: SlCombobox.flag });
  readonly closeOnEscape = input(undefined, { transform: SlCombobox.flag });
  readonly closeOnOutsidePress = input(undefined, { transform: SlCombobox.flag });
  readonly flip = input(undefined, { transform: SlCombobox.flag });
  readonly shift = input(undefined, { transform: SlCombobox.flag });
  readonly hideWhenDetached = input(undefined, { transform: SlCombobox.flag });
  readonly portal = input(undefined, { transform: SlCombobox.flag });
  readonly fullWidth = input(undefined, { transform: SlCombobox.flag });
  readonly disabled = input(undefined, { transform: SlCombobox.flag });
  readonly readOnly = input(undefined, { transform: SlCombobox.flag });
  readonly required = input(undefined, { transform: SlCombobox.flag });
  readonly invalid = input(undefined, { transform: SlCombobox.flag });
  readonly loading = input(false, { transform: booleanAttribute });

  private readonly defaults = injectComboboxDefaults();
  /** The family's words in the language in force, with this combobox's `messages` laid over them. */
  readonly t = injectMessages(comboboxMessages, this.messages);
  private readonly inForceLocale = injectLocale();
  /** The locale the default filter compares in: the `locale` input, or the language in force. */
  readonly resolvedLocale = computed(() => this.locale() ?? this.inForceLocale());
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly template = viewChild.required<TemplateRef<unknown>>('layer');
  private readonly controlRef = viewChild.required<{ nativeElement: HTMLInputElement }>('control');

  readonly field = inject(SlField, { optional: true });

  private readonly identifier = Math.random().toString(36).slice(2, 8);
  readonly contentId = `sl-combobox-${this.identifier}`;
  private readonly ownId = `sl-combobox-input-${this.identifier}`;

  private readonly registry = signal(new Map<ComboboxOptionValue, string>());
  /** Bumped by an option whose presence or visibility changed; read once per render. */
  private readonly collection = signal(0);
  readonly optionCount = signal(0);
  /**
   * The completion `autocomplete="both"` shows: the rest of the first match, or
   * `null`. It is part of what the input renders rather than a write onto the
   * element, so nothing has to fight Angular for the value.
   */
  readonly completion = signal<string | null>(null);
  private wantsCompletion = false;
  private entry: Entry = 'none';

  private view: EmbeddedViewRef<unknown> | null = null;
  private layerNode: HTMLElement | null = null;
  private surfaceNode: HTMLElement | null = null;
  private portalRoot: PortalRootHandle | null = null;
  private positioner: PositionerHandle | null = null;
  private layer: DismissableLayerHandle | null = null;
  private presence: PresenceHandle | null = null;
  private observer: IntersectionObserver | null = null;
  private disabledByForm = signal<boolean | undefined>(undefined);

  private readonly hostId = inject(new HostAttributeToken('id'), { optional: true });

  private onChange: (value: ComboboxOptionValue | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly resolvedSize = computed(() => this.size() ?? this.field?.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  readonly resolvedSide = computed(() => this.side() ?? this.defaults.side);
  readonly resolvedWidth = computed(() => this.width() ?? this.defaults.width);
  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);
  readonly resolvedAutocomplete = computed(() => this.autocomplete() ?? this.defaults.autocomplete);
  readonly resolvedOpenOn = computed(() => this.openOn() ?? this.defaults.openOn);
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);
  readonly resolvedClearable = computed(() => this.clearable() ?? this.defaults.clearable);
  readonly resolvedFullWidth = computed(() => this.fullWidth() ?? this.defaults.fullWidth);
  readonly resolvedCloseOnSelect = computed(
    () => this.closeOnSelect() ?? this.defaults.closeOnSelect,
  );
  readonly resolvedAllowsCustomValue = computed(
    () => this.allowsCustomValue() ?? this.defaults.allowsCustomValue,
  );
  readonly resolvedAutoHighlight = computed(
    () => this.autoHighlight() ?? this.defaults.autoHighlight,
  );
  readonly resolvedHighlightMatch = computed(
    () => this.highlightMatch() ?? this.defaults.highlightMatch,
  );
  /**
   * The offer to add what was typed (CB8): the query, while the consumer will
   * take one, the reader typed something and nothing in the collection matched
   * it. It is one expression, so the row and the commit cannot disagree about
   * whether an offer is standing.
   */
  readonly creating = computed(() =>
    (this.creatable() ?? false) && this.query() !== '' && this.optionCount() === 0
      ? this.query()
      : null,
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
  readonly display = computed(() => this.completion() ?? this.inputValue());

  private readonly declared = computed(() => {
    const table = new Map<ComboboxOptionValue, string>();
    for (const option of flatten(this.items())) table.set(option.value, option.label);
    return table;
  });

  /**
   * The query the options filter against, and it is not always the typed text:
   * once an option has been committed the input holds its label, and filtering
   * on that would leave the popup showing the one option already chosen.
   */
  readonly query = computed(() => {
    const held = this.value();
    const committed = held === null ? undefined : this.labelFor(held);
    return this.inputValue() === committed ? '' : this.inputValue();
  });

  private readonly fallbackFilter = computed<Filter>(() =>
    createFilter({ locale: this.resolvedLocale() }),
  );

  readonly showClear = computed(
    () =>
      this.resolvedClearable() &&
      this.inputValue() !== '' &&
      !this.resolvedDisabled() &&
      !this.resolvedReadOnly(),
  );

  readonly activeDescendant = computed(() => {
    const held = this.highlightedValue();
    return this.isOpen() && held !== null ? this.optionId(held) : null;
  });

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
      if (this.resolvedMount() === 'eager' && !this.isOpen()) this.build();
    });

    /* One count per render, however many options changed in it. Each option
       counting the popup itself read the whole collection once per option —
       quadratic in the option count on every keystroke that filters. */
    afterRenderEffect(() => {
      this.collection();
      untracked(() => this.recount());
    });

    destroyRef.onDestroy(() => this.teardown());
  }

  /**
   * The uncontrolled start, read once. It is read here rather than in the
   * constructor because that is where Angular has finished writing the inputs.
   * A `value` the consumer bound is already in the model and wins; the seed
   * fills a model still at its declared default, and leaves `inputValue`
   * alone because the text and the key are two contracts.
   */
  ngOnInit() {
    const seed = this.defaultValue();
    if (seed === undefined || seed === null || this.value() !== null) return;
    this.value.set(seed);
  }

  optionId(value: ComboboxOptionValue): string {
    return `${this.contentId}-option-${encodeURIComponent(value)}`;
  }

  labelFor(value: ComboboxOptionValue): string | undefined {
    return this.declared().get(value) ?? this.registry().get(value);
  }

  registerLabel(value: ComboboxOptionValue, label: string) {
    if (this.registry().get(value) === label) return;
    const next = new Map(this.registry());
    next.set(value, label);
    this.registry.set(next);
  }

  /**
   * Three answers, and `undefined` is not one of them: an absent `filter` asks
   * for the library's own locale-sensitive `contains`, `null` turns filtering
   * off, and a function replaces the comparison.
   */
  matches(label: string): boolean {
    const query = this.query();
    const given = this.filter();
    if (query === '' || given === null) return true;
    if (given !== undefined) return given(label, query);
    return this.fallbackFilter().contains(label, query);
  }

  /** An option says the collection changed; the count follows after the render. */
  collectionChanged() {
    this.collection.update((version) => version + 1);
  }

  recount() {
    /* The offer to add what was typed is drawn *because* the count is nought,
       so counting it would take it away, which would bring it back (CB8). */
    this.optionCount.set(
      this.options().filter((option) => option.dataset['create'] === undefined).length,
    );
    this.applyCompletion();
    this.dropStaleHighlight();
    if (this.isOpen() && this.resolvedAutoHighlight()) this.land();
  }

  options(): HTMLElement[] {
    return [...(this.surfaceNode?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? [])];
  }

  focus() {
    this.controlRef().nativeElement.focus({ preventScroll: true });
  }

  scrollToKey(value: ComboboxOptionValue) {
    const option = this.options().find((candidate) => candidate.dataset['value'] === value);
    if (option !== undefined && this.surfaceNode !== null) revealWithin(option, this.surfaceNode);
  }

  setOpen(next: boolean, reason: ComboboxOpenReason, source?: Event) {
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
    next: ComboboxOptionValue | null,
    reason: ComboboxHighlightReason,
    source?: Event,
  ) {
    if (next === this.highlightedValue()) return;
    const state = createControllable<ComboboxOptionValue | null>({
      initial: this.highlightedValue(),
      onRequest: (request) => this.highlightedValueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) {
      this.highlightedValue.set(next);
      if (next !== null) this.scrollToKey(next);
    }
  }

  setInputValue(next: string, reason: ComboboxInputReason, source?: Event) {
    /* Whatever moves the text withdraws the completion: it is an offer about
       text that no longer exists. */
    this.completion.set(null);
    if (next === this.inputValue()) return;
    const state = createControllable<string>({
      initial: this.inputValue(),
      onRequest: (request) => this.inputValueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.inputValue.set(next);
  }

  select(next: ComboboxOptionValue | null, reason: ComboboxValueReason, source?: Event) {
    if (next === this.value()) return;
    const state = createControllable<ComboboxOptionValue | null>({
      initial: this.value(),
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (!state.request(next, reason, source)) return;
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }

  clear(reason: ComboboxValueReason, source?: Event) {
    this.select(null, reason, source);
    this.setInputValue('', reason === 'clear' ? 'clear' : 'programmatic', source);
  }

  /** Takes an option: the key, the label into the field, and the popup shut. */
  commitOption(value: ComboboxOptionValue, reason: ComboboxValueReason, source?: Event) {
    this.select(value, reason, source);
    this.setInputValue(this.labelFor(value) ?? value, 'select', source);
    if (this.resolvedCloseOnSelect()) this.setOpen(false, 'select', source);
  }

  protected onInput(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    const growing = next.length > this.inputValue().length;
    this.setInputValue(next, 'keyboard', event);
    /* A reader who is deleting is taking the text apart; writing the rest of a
       word back into a field they are emptying is what makes `both` unusable. */
    this.wantsCompletion = this.resolvedAutocomplete() === 'both' && growing;
    if (this.resolvedOpenOn() === 'input' && !this.isOpen() && !this.resolvedReadOnly()) {
      this.entry = this.resolvedAutoHighlight() ? 'first' : 'none';
      this.setOpen(true, 'keyboard', event);
    } else {
      /* After the render the new query causes: read now, the surface still
         holds the options the previous query kept, and the completion — which
         is consumed once — would be measured against the wrong first match. */
      afterNextRender(() => this.recount(), { injector: this.injector });
    }
  }

  protected onFocus() {
    if (this.resolvedOpenOn() !== 'focus' || this.resolvedReadOnly() || this.isOpen()) return;
    this.entry = 'selected';
    this.setOpen(true, 'keyboard');
  }

  /* A press on the input opens a closed popup and never closes an open one,
     because the same press places the caret. Under `focus` the press has
     already opened it through focus, so this finds it open. */
  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || this.resolvedOpenOn() === 'manual' || this.isOpen()) return;
    if (this.resolvedDisabled() || this.resolvedReadOnly()) return;
    this.entry = 'selected';
    this.setOpen(true, 'pointer', event);
  }

  protected onBlur(event: FocusEvent) {
    this.onTouched();
    const next = event.relatedTarget;
    if (next instanceof Node && this.surfaceNode?.contains(next) === true) return;
    /* A press on the popup's own surface — its padding, a group heading, its
       scrollbar — takes focus off the input and reports `relatedTarget: null`,
       which is indistinguishable from the reader leaving. The layer stack
       already records where the press in flight went down, so ask it (CB11). */
    const began = pressOrigin(this.controlRef().nativeElement.ownerDocument);
    if (began instanceof Node && this.surfaceNode?.contains(began) === true) return;
    /* The last moment at which the reader is still choosing, which is where
       text that matched no option is settled (CB7). */
    this.settleInput(event);
    if (this.isOpen()) this.setOpen(false, 'blur', event);
  }

  /**
   * The option whose label *is* the text, by the same collator the filter used:
   * a reader who typed an option in full has chosen it, and comparing with
   * `===` would refuse `resume` for `Resumé` on a page the filter had just
   * matched.
   */
  private valueForLabel(text: string): ComboboxOptionValue | undefined {
    if (text === '') return undefined;
    const filter = this.fallbackFilter();
    for (const [candidate, label] of this.declared()) {
      if (filter.equals(label, text)) return candidate;
    }
    for (const [candidate, label] of this.registry()) {
      if (filter.equals(label, text)) return candidate;
    }
    return undefined;
  }

  /**
   * What becomes of text that matched no option, at the moment the reader
   * leaves the field (CB7). `combobox`'s React binding states the reasoning;
   * the three answers are the same, in the same order. Text that *is* an option
   * is that option; text that is not, in a field that allows one of its own, is
   * the value; text that is not, in a field that does not, is undone and the
   * caller is told what was refused.
   */
  private settleInput(source?: Event) {
    const text = this.inputValue();
    const matched = this.valueForLabel(text);

    if (matched !== undefined) {
      if (matched !== this.value()) this.select(matched, 'blur', source);
      this.setInputValue(this.labelFor(matched) ?? text, 'blur', source);
      return;
    }

    if (text === '') {
      if (this.value() !== null) this.select(null, 'blur', source);
      return;
    }

    if (this.resolvedAllowsCustomValue()) {
      if (text !== this.value()) this.select(text, 'blur', source);
      return;
    }

    const held = this.value();
    this.setInputValue(held === null ? '' : (this.labelFor(held) ?? ''), 'blur', source);
    this.inputReset.emit({ rejected: text, reason: 'blur' });
  }

  protected onClear(event: MouseEvent) {
    this.clear('clear', event);
    this.focus();
  }

  protected onToggle(event: MouseEvent) {
    if (this.resolvedDisabled() || this.resolvedReadOnly()) return;
    this.entry = 'selected';
    this.setOpen(!this.isOpen(), 'pointer', event);
    this.focus();
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (this.resolvedDisabled()) return;
    const alt = event.altKey;

    switch (event.key) {
      case 'ArrowDown':
        if (this.resolvedReadOnly()) return;
        event.preventDefault();
        if (!this.isOpen()) this.openWith(alt ? 'none' : 'first', event);
        else if (!alt) this.move('next', event);
        return;
      case 'ArrowUp':
        if (this.resolvedReadOnly()) return;
        event.preventDefault();
        if (alt) this.setOpen(false, 'keyboard', event);
        else if (!this.isOpen()) this.openWith('last', event);
        else this.move('previous', event);
        return;
      case 'PageDown':
        if (!this.isOpen()) return;
        event.preventDefault();
        this.move('pageDown', event);
        return;
      case 'PageUp':
        if (!this.isOpen()) return;
        event.preventDefault();
        this.move('pageUp', event);
        return;
      case 'Enter':
        if (!this.isOpen() && !this.resolvedAllowsCustomValue()) return;
        event.preventDefault();
        this.commitFromKeyboard(event);
        return;
      case 'Escape':
        this.onEscape(event);
        return;
      case 'Tab':
        /* Not prevented, and no highlight is committed: one the reader arrowed
           past is not a choice they made. A completion still standing is. */
        if (this.completion() !== null) this.commitFromKeyboard(event);
        else if (this.isOpen()) this.setOpen(false, 'dismiss', event);
        return;
      default:
        /* Every other key is the browser's, which the pattern asks for by name. */
        break;
    }
  }

  private onEscape(event: KeyboardEvent) {
    if (this.isOpen()) {
      event.preventDefault();
      this.setOpen(false, 'escape', event);
      return;
    }
    const held = this.value();
    if (held === null) return;
    event.preventDefault();
    const label = this.labelFor(held) ?? '';
    if (this.inputValue() === label) this.clear('keyboard', event);
    else this.setInputValue(label, 'keyboard', event);
  }

  private commitFromKeyboard(event: Event) {
    const standing = this.completion();
    if (this.highlightedValue() === null && standing !== null) {
      const suggested = this.options().find((option) => this.labelOf(option) === standing);
      if (suggested !== undefined) {
        this.commitOption(suggested.dataset['value'] ?? '', 'keyboard', event);
        return;
      }
    }

    const held = this.highlightedValue();
    if (held !== null && held === this.creating()) {
      this.takeOffer(held, 'keyboard', event);
      return;
    }
    if (held !== null) {
      this.commitOption(held, 'keyboard', event);
      return;
    }
    if (this.resolvedAllowsCustomValue()) {
      this.select(this.inputValue() === '' ? null : this.inputValue(), 'keyboard', event);
    } else {
      const value = this.value();
      this.setInputValue(value === null ? '' : (this.labelFor(value) ?? ''), 'select', event);
    }
    this.setOpen(false, 'select', event);
  }

  /**
   * An option refuses the press, and this one is an option (CB11). The rule
   * itself lives on `SlComboboxOption`; the offer is written by this template,
   * so it repeats the one line rather than the reason.
   */
  protected onOptionPointerDown(event: PointerEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();
  }

  protected onCreateClick(query: string, event: MouseEvent) {
    this.takeOffer(query, 'pointer', event);
    this.focus();
  }

  /**
   * Taking the offer reports the query and selects nothing: the collection does
   * not hold the value yet, and a control naming an option that does not exist
   * is a control whose value and picture disagree — the fault CB7 fixed at the
   * other end. What the consumer does with it is the consumer's (CB8).
   */
  private takeOffer(query: string, reason: ComboboxValueReason, event: Event) {
    this.create.emit({ query, reason });
    this.setOpen(false, 'select', event);
  }

  private labelOf(option: HTMLElement): string {
    return (
      option.dataset['textValue'] ??
      option.querySelector("[data-part='label']")?.textContent?.trim() ??
      ''
    );
  }

  private openWith(entry: Entry, event: Event) {
    this.entry = entry;
    this.setOpen(true, 'keyboard', event);
  }

  private move(intent: MoveIntent, event?: Event) {
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

  /** The filter took the highlighted option away, so the highlight goes too. */
  private dropStaleHighlight() {
    const held = this.highlightedValue();
    if (held === null) return;
    const kept = this.options().some((option) => option.dataset['value'] === held);
    if (!kept) this.setHighlighted(null, 'keyboard');
  }

  private applyCompletion() {
    if (!this.wantsCompletion) return;
    this.wantsCompletion = false;
    const typed = this.inputValue();
    if (typed === '') return;
    const first = this.options().find((option) => option.dataset['disabled'] === undefined);
    if (first === undefined) return;
    const label = this.labelOf(first);
    if (!label.toLowerCase().startsWith(typed.toLowerCase()) || label === typed) return;
    this.completion.set(label);
    /* The completion is shown as a selected range, so the next character typed
       replaces it and Backspace withdraws it. */
    queueMicrotask(() => {
      const element = this.controlRef().nativeElement;
      if (element.value === label) element.setSelectionRange(typed.length, label.length);
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
      origin: this.controlRef().nativeElement,
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
    const anchor = this.controlRef().nativeElement.parentElement;
    if (anchor === null) return;

    this.positioner?.destroy();
    this.positioner = createPositioner(anchor, this.layerNode, {
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
      branches: [this.controlRef().nativeElement.parentElement].filter(
        (branch): branch is HTMLElement => branch !== null,
      ),
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

  /**
   * The last row came into view, so there is more to fetch. An observer rather
   * than a scroll listener: the question is whether the end of the list is
   * visible, and a scroll handler answers it by measuring on every frame.
   */
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
    this.land();
  }

  /**
   * Where the highlight lands: the chosen option, or — with `autoHighlight`,
   * when none is showing — the first match. The contract's `focus.onOpen`
   * asks it of every opening, a press or a focus included, and of every query
   * typed while the popup stays open, so `Enter` always has a match under it.
   */
  private land() {
    if (this.entry === 'none') return;
    if (this.entry === 'selected') {
      const held = this.value();
      const shown = this.options().some(
        (option) => option.dataset['value'] === held && option.dataset['disabled'] === undefined,
      );
      if (held !== null && shown) this.setHighlighted(held, 'keyboard');
      else if (this.resolvedAutoHighlight()) this.move('first');
      return;
    }
    this.move(this.entry);
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

  writeValue(value: ComboboxOptionValue | null) {
    this.value.set(value ?? null);
    this.inputValue.set(value === null ? '' : (this.labelFor(value) ?? value));
  }

  registerOnChange(fn: (value: ComboboxOptionValue | null) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabledByForm.set(isDisabled);
  }

  /**
   * Two validities the family owns, and neither is one a native input can
   * describe: a required control with nothing chosen, and a control holding
   * text that matches no option when a custom value is not allowed.
   */
  validate(): ValidationErrors | null {
    if (this.resolvedRequired() && this.value() === null) return { required: true };
    if (this.resolvedAllowsCustomValue()) return null;
    if (this.value() === null && this.inputValue() !== '') return { unmatched: true };
    return null;
  }
}
