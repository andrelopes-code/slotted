import { writeToClipboard } from '@slotted/core/clipboard';
import { createFilter, revealWithin } from '@slotted/core/collection';
import type { Filter } from '@slotted/core/collection';
import { createArrowNavigation, createRemovalFocus } from '@slotted/core/focus';
import type { ArrowNavigationHandle, RemovalFocusHandle } from '@slotted/core/focus';
import {
  tagsInputMessages,
  type PartialMessages,
  type TagsInputMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createWidthGate } from '@slotted/core/measure';
import type { WidthGateHandle } from '@slotted/core/measure';
import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { admitValues, constraintVerdict, joinValues, splitValues } from '@slotted/core/tags';
import type { TagsVerdict } from '@slotted/core/tags';
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
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlField } from '@slotted/angular/field';

import { injectTagsInputDefaults } from './tags-input-defaults';
import type {
  TagsInputCopyOutcome,
  TagsInputInputReason,
  TagsInputInvalidValues,
  TagsInputOverflow,
  TagsInputPendingOnBlur,
  TagsInputRefuseCause,
  TagsInputSize,
  TagsInputValidator,
  TagsInputValueReason,
  TagsInputVariant,
} from './tags-input-defaults';

/** The chips in the row, in the order the row holds them. */
export const CHIP_SELECTOR = "[data-part='chips'] > [role='gridcell']:not([data-part='field'])";

/** The width, in CSS pixels, under which a chip has no room for a word. */
export const NARROW_WIDTH = 120;

function same(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** How long the chip that answered a duplicate stays marked: the theme's long step. */
function longDuration(element: HTMLElement) {
  const raw = element.ownerDocument.defaultView
    ?.getComputedStyle(element)
    .getPropertyValue('--slotted-duration-long')
    .trim();
  if (raw === undefined || raw === '') return 320;
  const number = Number.parseFloat(raw);
  if (!Number.isFinite(number)) return 320;
  return raw.endsWith('ms') ? number : number * 1000;
}

/**
 * A frame of typed values, with a field that adds more.
 *
 * **The host element is the frame**, as `sl-multi-select`'s is: it carries
 * `data-ui`, and the grid, the chips, the field, the counter and the clear
 * button are its template.
 *
 * **The value is a list of texts, and the text is the label.** There is no
 * collection behind it, which is what separates this family from
 * `multi-select`.
 *
 * **A value that fails is held and shown.** Every value is judged at render —
 * by `validate`, or by the input's own constraints through the browser — and a
 * value that fails wears the danger tone, the alert mark and a description,
 * marks the host, puts `invalidValues` on the form control through the
 * `Validator`, and blocks the native submit through `setCustomValidity`.
 *
 * **What is refused is reported, not dropped.** `valueRefuse` carries the
 * values that did not get in and the cause.
 *
 * **Suggestions make the input a combobox.** With `suggestions` the input
 * takes the APG combobox's list autocomplete without automatic selection: the
 * listbox under the frame holds what the typed text matches, nothing is
 * highlighted until an arrow key moves, and the text the reader typed still
 * commits as it does without them.
 */
@Component({
  selector: 'sl-tags-input',
  standalone: true,
  exportAs: 'slTagsInput',
  imports: [SlGlyph, SlIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /* `tag`'s sheet beside this family's own: the chips wear its identifier. */
  styleUrls: ['../../../styles/src/tags-input/tags-input.css', '../../../styles/src/tag/tag.css'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlTagsInput), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlTagsInput), multi: true },
  ],
  host: {
    'data-ui': 'tags-input',
    'data-ui-tags-input': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-overflow]': 'resolvedOverflow()',
    '[attr.data-full-width]': "resolvedFullWidth() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() ? '' : null",
    '[attr.data-invalid]': "isInvalid() ? '' : null",
    '[attr.data-required]': "resolvedRequired() ? '' : null",
    '[attr.data-complete]': "full() ? '' : null",
    '[attr.data-narrow]': "narrow() ? '' : null",
    '[attr.data-expanded]': "resolvedOverflow() === 'collapse' && expanded() ? '' : null",
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <div
      data-part="control"
      data-part-control=""
      role="grid"
      [attr.aria-label]="gridLabel()"
      [attr.aria-labelledby]="gridLabelledBy()"
    >
      <div
        data-part="chips"
        data-part-chips=""
        role="row"
        #row
        [attr.aria-label]="countText()"
        [attr.aria-describedby]="hintId"
      >
        @for (chip of value(); track trackChip(index, chip); let index = $index) {
          @if (editingIndex() === index) {
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
            >
              <span data-part="body" data-part-body="">
                <input
                  type="text"
                  [attr.aria-label]="labelFor(chip)"
                  [value]="editingText()"
                  [size]="chip.length || 1"
                  (input)="onEditInput($event)"
                  (blur)="commitEdit(index, $event)"
                  (keydown)="onEditKeyDown(index, $event)"
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
              [attr.data-disabled]="isLocked(chip) || resolvedDisabled() ? '' : null"
              [attr.data-invalid]="messageFor(index) === null ? null : ''"
              [attr.data-tone]="messageFor(index) === null ? null : 'danger'"
              [attr.data-current]="current() === chip ? '' : null"
              [attr.aria-invalid]="messageFor(index) === null ? null : true"
              [attr.aria-describedby]="messageFor(index) === null ? null : messageId(index)"
              [attr.aria-label]="chipLabel(chip, index)"
              [attr.title]="messageFor(index)"
              (keydown)="onChipKeyDown(chip, index, $event)"
              (dblclick)="onChipDoubleClick(chip, index)"
            >
              <span data-part="body" data-part-body="">
                @if (messageFor(index); as message) {
                  <span data-part="start" data-part-start=""
                    ><span slIcon><svg slGlyph name="circle-alert"></svg></span
                  ></span>
                }
                <span data-part="label" data-part-label="">{{ labelFor(chip) }}</span>
              </span>
              @if (messageFor(index); as message) {
                <span data-part="message" data-part-message="" [id]="messageId(index)">{{
                  message
                }}</span>
              }
              @if (!chipFrozen(chip)) {
                <button
                  type="button"
                  tabindex="-1"
                  data-part="remove"
                  data-part-remove=""
                  [attr.aria-label]="removeLabelFor(chip)"
                  (click)="onRemoveClick(index, $event)"
                >
                  <span slIcon><svg slGlyph name="x"></svg></span>
                </button>
              }
            </span>
          }
        }
        @if (collapsing()) {
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
            (click)="focus()"
          >
            <span data-part="body" data-part-body="">
              <span data-part="label" data-part-label="">+{{ hiddenCount() }}</span>
            </span>
          </span>
        }
        <span data-part="field" data-part-field="" role="gridcell">
          <input
            #control
            data-part="input"
            data-part-input=""
            [type]="type()"
            [id]="controlId()"
            [value]="inputValue()"
            [disabled]="resolvedDisabled()"
            [readOnly]="resolvedReadOnly()"
            [required]="resolvedRequired() && value().length === 0"
            [placeholder]="placeholder()"
            [attr.name]="null"
            [attr.list]="list() ?? null"
            [attr.pattern]="pattern() ?? null"
            [attr.minlength]="minLength() ?? null"
            [attr.maxlength]="maxLength() ?? null"
            [attr.inputmode]="inputMode() ?? null"
            [attr.autocomplete]="autocomplete() ?? null"
            [attr.aria-label]="ariaLabel() ?? null"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-invalid]="isInvalid() ? true : null"
            [attr.role]="suggestions() === undefined ? null : 'combobox'"
            [attr.aria-autocomplete]="suggestions() === undefined ? null : 'list'"
            [attr.aria-expanded]="suggestions() === undefined ? null : popup()"
            [attr.aria-controls]="popup() ? listboxId : null"
            [attr.aria-activedescendant]="active() < 0 ? null : optionId(active())"
            (input)="onInput($event)"
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
    <span data-part="hint" data-part-hint="" [id]="hintId">{{ hintText() }}</span>
    @if (popup()) {
      <div
        #suggestionList
        data-part="suggestions"
        data-part-suggestions=""
        role="listbox"
        [id]="listboxId"
        [attr.aria-label]="t('suggestions')"
      >
        @for (entry of matches(); track $index) {
          <!-- Focus stays in the input: the option is chosen, not focused. -->
          <div
            data-part="suggestion"
            data-part-suggestion=""
            role="option"
            [id]="optionId($index)"
            [attr.aria-selected]="$index === active()"
            [attr.data-highlighted]="$index === active() ? '' : null"
            (pointerdown)="$event.preventDefault()"
            (pointermove)="highlight.set($index)"
            (click)="choose(entry, $event)"
          >
            {{ labelFor(entry) }}
          </div>
        }
      </div>
    }

    <!--
      One hidden input per value, all under the same name: that is how a plain
      FormData receives several values under one key.
    -->
    @if (name(); as submissionName) {
      @for (held of value(); track trackChip(index, held); let index = $index) {
        <input type="hidden" [name]="submissionName" [attr.form]="form() ?? null" [value]="held" />
      }
    }
  `,
})
export class SlTagsInput implements ControlValueAccessor, OnInit, Validator {
  private static readonly flag = (given: boolean | string | undefined) =>
    given === undefined ? undefined : booleanAttribute(given);
  private static readonly count = (given: number | string | undefined) =>
    given === undefined ? undefined : numberAttribute(given);

  /** The values, in the order the reader gave them. */
  readonly value = model<readonly string[]>([]);
  readonly valueChangeRequest = output<ChangeRequest<readonly string[]>>();
  /** What an unbound `value` starts from, read once. */
  readonly defaultValue = input<readonly string[] | undefined>(undefined);

  /** The characters in the field, which are not yet a value. */
  readonly inputValue = model<string>('');
  readonly inputValueChangeRequest = output<ChangeRequest<string>>();

  /** What the family refused, and why. It holds no state and cancels nothing. */
  readonly valueRefuse = output<{ values: readonly string[]; cause: TagsInputRefuseCause }>();
  /** What was put on the clipboard, and whether it got there. */
  readonly valueCopy = output<{ values: readonly string[]; outcome: TagsInputCopyOutcome }>();

  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly placeholder = input<string>('');
  readonly name = input<string | undefined>(undefined);
  readonly form = input<string | undefined>(undefined);
  readonly type = input<'text' | 'email' | 'url' | 'tel' | 'search'>('text');
  readonly list = input<string | undefined>(undefined);
  readonly pattern = input<string | undefined>(undefined);
  readonly minLength = input(undefined, { transform: SlTagsInput.count });
  readonly maxLength = input(undefined, { transform: SlTagsInput.count });
  readonly inputMode = input<string | undefined>(undefined);
  readonly autocomplete = input<string | undefined>(undefined);
  /** BCP 47, for the comparison the duplicate rule makes. The language in force when absent. */
  readonly locale = input<string | undefined>(undefined);
  /** `validateValue` rather than `validate`, which is the Validator's own method. */
  readonly validateValue = input<TagsInputValidator | undefined>(undefined);
  /** Runs before a value is judged. Trim by default. */
  readonly normalize = input<((text: string) => string) | undefined>(undefined);
  /**
   * Values the reader may choose instead of typing them whole. Present, the
   * input is a combobox: a listbox under the field holds the suggestions the
   * typed text matches by the locale's collator, minus the values already
   * chosen; ArrowDown and ArrowUp move through it and Enter adds the
   * highlighted one. A chosen suggestion is normalized, judged, deduplicated
   * and capped like typed text, and typed text still commits as it does
   * without suggestions.
   */
  readonly suggestions = input<readonly string[] | undefined>(undefined);
  /** How a paste is split. The default splits on the delimiters and on line breaks. */
  readonly split = input<((text: string) => readonly string[]) | undefined>(undefined);
  /** The chip's text for a value. */
  readonly formatLabel = input<((value: string) => string) | undefined>(undefined);
  /** The values the reader may not remove. */
  readonly lockedValues = input<readonly string[]>([]);
  readonly delimiters = input<readonly string[] | undefined>(undefined);
  readonly max = input(undefined, { transform: SlTagsInput.count });

  readonly size = input<TagsInputSize | undefined>(undefined);
  readonly variant = input<TagsInputVariant | undefined>(undefined);
  readonly overflow = input<TagsInputOverflow | undefined>(undefined);
  readonly invalidValues = input<TagsInputInvalidValues | undefined>(undefined);
  readonly pendingOnBlur = input<TagsInputPendingOnBlur | undefined>(undefined);

  /**
   * Words laid over the catalog of the language in force, key by key: the
   * clear button, the chips, the counter, the hint, and the sentences the
   * announcer says.
   */
  readonly messages = input<PartialMessages<TagsInputMessages> | undefined>(undefined);

  readonly addOnPaste = input(undefined, { transform: SlTagsInput.flag });
  readonly allowDuplicates = input(undefined, { transform: SlTagsInput.flag });
  readonly editable = input(undefined, { transform: SlTagsInput.flag });
  readonly reorderable = input(undefined, { transform: SlTagsInput.flag });
  readonly clearable = input(undefined, { transform: SlTagsInput.flag });
  readonly fullWidth = input(undefined, { transform: SlTagsInput.flag });
  readonly disabled = input(undefined, { transform: SlTagsInput.flag });
  readonly readOnly = input(undefined, { transform: SlTagsInput.flag });
  readonly required = input(undefined, { transform: SlTagsInput.flag });
  readonly invalid = input(undefined, { transform: SlTagsInput.flag });

  private readonly defaults = injectTagsInputDefaults();
  /** The family's words in the language in force, with this control's `messages` laid over them. */
  readonly t = injectMessages(tagsInputMessages, this.messages);
  private readonly inForceLocale = injectLocale();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly controlRef = viewChild.required<{ nativeElement: HTMLInputElement }>('control');
  private readonly rowRef = viewChild.required<{ nativeElement: HTMLElement }>('row');
  private readonly countRef = viewChild<{ nativeElement: HTMLElement }>('count');
  private readonly listRef = viewChild<{ nativeElement: HTMLElement }>('suggestionList');

  readonly field = inject(SlField, { optional: true });

  private readonly identifier = Math.random().toString(36).slice(2, 8);
  private readonly ownId = `sl-tags-input-${this.identifier}`;
  readonly hintId = `${this.ownId}-hint`;
  readonly listboxId = `${this.ownId}-suggestions`;

  readonly hiddenCount = signal(1);
  readonly narrow = signal(false);
  readonly expanded = signal(false);
  /** The value a refused duplicate is already held under, marked for one long step. */
  readonly current = signal<string | null>(null);
  readonly editingIndex = signal<number | null>(null);
  readonly editingText = signal('');
  /** Whether the reader asked for the suggestions, by typing or by an arrow key. */
  private readonly suggesting = signal(false);
  /** The highlighted suggestion's index, or -1 while none is. */
  readonly highlight = signal(-1);

  private ring: ArrowNavigationHandle | null = null;
  private removal: RemovalFocusHandle | null = null;
  private collapse: CollapseHandle | null = null;
  private gate: WidthGateHandle | null = null;
  private currentTimer: ReturnType<typeof setTimeout> | null = null;
  private placement: PositionerHandle | null = null;
  private placedOn: HTMLElement | null = null;
  private reverting = false;
  private disabledByForm = signal<boolean | undefined>(undefined);

  private readonly hostId = inject(new HostAttributeToken('id'), { optional: true });

  private onChange: (value: readonly string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private validatorChange: () => void = () => undefined;

  readonly resolvedSize = computed(() => this.size() ?? this.field?.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedOverflow = computed(() => this.overflow() ?? this.defaults.overflow);
  readonly resolvedInvalidValues = computed(
    () => this.invalidValues() ?? this.defaults.invalidValues,
  );
  readonly resolvedPendingOnBlur = computed(
    () => this.pendingOnBlur() ?? this.defaults.pendingOnBlur,
  );
  readonly resolvedClearable = computed(() => this.clearable() ?? this.defaults.clearable);
  readonly resolvedFullWidth = computed(() => this.fullWidth() ?? this.defaults.fullWidth);
  readonly resolvedEditable = computed(() => this.editable() ?? this.defaults.editable);
  readonly resolvedReorderable = computed(() => this.reorderable() ?? this.defaults.reorderable);
  readonly resolvedAddOnPaste = computed(() => this.addOnPaste() ?? this.defaults.addOnPaste);
  readonly resolvedAllowDuplicates = computed(
    () => this.allowDuplicates() ?? this.defaults.allowDuplicates,
  );
  readonly resolvedDelimiters = computed(() => this.delimiters() ?? this.defaults.delimiters);
  readonly resolvedMax = computed(() => this.max() ?? this.defaults.max);

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

  readonly controlId = computed(() => this.hostId ?? this.field?.ids().control ?? this.ownId);
  readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  readonly frozen = computed(() => this.resolvedReadOnly() || this.resolvedDisabled());
  readonly collapsing = computed(() => this.resolvedOverflow() === 'collapse' && !this.expanded());
  /** The list has reached `max` and takes nothing more. */
  readonly full = computed(() => {
    const limit = this.resolvedMax();
    return limit !== null && this.value().length >= limit;
  });

  private readonly collator = computed<Filter>(() =>
    createFilter({ locale: this.locale() ?? this.inForceLocale() }),
  );

  /** What the typed text matches, by the locale's collator, minus what is already chosen. */
  readonly matches = computed<readonly string[]>(() => {
    const suggestions = this.suggestions();
    if (suggestions === undefined) return [];
    const { contains, equals } = this.collator();
    const query = this.inputValue().trim();
    const held = this.value();
    return suggestions.filter(
      (entry) => contains(entry, query) && !held.some((chosen) => equals(chosen, entry)),
    );
  });
  readonly popup = computed(
    () =>
      this.suggestions() !== undefined &&
      this.suggesting() &&
      !this.frozen() &&
      this.matches().length > 0,
  );
  readonly active = computed(() =>
    this.popup() && this.highlight() < this.matches().length ? this.highlight() : -1,
  );

  /**
   * A detached input carrying the visible one's constraints, rebuilt when they
   * change, so the platform's judgement reads the attributes the template is
   * about to write rather than the ones it wrote last time.
   */
  private readonly probe = computed(() => {
    const element = this.host.nativeElement.ownerDocument.createElement('input');
    element.type = this.type();
    const pattern = this.pattern();
    if (pattern !== undefined) element.setAttribute('pattern', pattern);
    const minLength = this.minLength();
    if (minLength !== undefined) element.minLength = minLength;
    const maxLength = this.maxLength();
    if (maxLength !== undefined) element.maxLength = maxLength;
    return element;
  });

  /**
   * Validity is a function of the value alone, judged at render, so a value a
   * form wrote in with an invalid entry is marked like one the reader typed.
   */
  readonly verdicts = computed<readonly TagsVerdict[]>(() =>
    this.value().map((entry) => this.judge(entry)),
  );
  readonly firstFailure = computed(() => this.verdicts().find((verdict) => !verdict.valid));
  readonly isInvalid = computed(() => {
    const limit = this.resolvedMax();
    return (
      this.resolvedInvalid() ||
      this.firstFailure() !== undefined ||
      (limit !== null && this.value().length > limit)
    );
  });

  readonly countText = computed(() => this.t('count', { count: this.value().length }));
  readonly gridLabel = computed(() => {
    const label = this.ariaLabel();
    return label === undefined ? null : this.t('countNamed', { label, count: this.value().length });
  });
  readonly gridLabelledBy = computed(() =>
    this.ariaLabel() === undefined && this.field ? this.field.ids().label : null,
  );
  readonly hintText = computed(() =>
    this.resolvedEditable() ? this.t('editHint') : this.t('hint'),
  );

  readonly showClear = computed(
    () =>
      this.resolvedClearable() &&
      (this.value().some((entry) => !this.isLocked(entry)) || this.inputValue() !== '') &&
      !this.frozen(),
  );

  readonly counterText = computed(() => {
    const limit = this.resolvedMax();
    if (limit !== null) {
      return this.t('counter', { count: this.value().length, max: limit });
    }
    if (this.narrow() && this.value().length > 0) return this.countText();
    return null;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => this.bindRow());

    /* A value arriving or leaving changes what there is to fit, and which cells
       the ring walks. */
    afterRenderEffect(() => {
      this.value();
      this.collapsing();
      untracked(() => {
        this.ring?.refresh();
        this.collapse?.refresh();
      });
    });

    /**
     * The platform's own gate: while the list holds an invalid value, or more
     * than `max`, the visible input carries the verdict as its custom validity,
     * so a plain form refuses to submit and shows the browser's bubble on the
     * control the reader is looking at.
     */
    afterRenderEffect(() => {
      const failure = this.firstFailure();
      const limit = this.resolvedMax();
      const count = this.value().length;
      const message =
        failure === undefined
          ? limit !== null && count > limit
            ? this.t('counter', { count, max: limit })
            : ''
          : failure.message || this.t('invalid');
      untracked(() => this.controlRef().nativeElement.setCustomValidity(message));
    });

    /* Under the frame and as wide as it, flipped above when there is no room. */
    afterRenderEffect(() => {
      const list = this.listRef()?.nativeElement ?? null;
      untracked(() => {
        if (list === this.placedOn) return;
        this.placement?.destroy();
        this.placement = null;
        this.placedOn = list;
        if (list === null) return;
        this.placement = createPositioner(this.host.nativeElement, list, {
          side: 'bottom',
          align: 'start',
          sideOffset: 4,
          matchWidth: true,
          strategy: 'fixed',
        });
        void this.placement.update();
      });
    });

    /* The highlighted suggestion is kept in sight inside a list that scrolls. */
    afterRenderEffect(() => {
      const active = this.active();
      const list = this.listRef()?.nativeElement;
      if (active < 0 || list === undefined) return;
      const option = list.querySelector<HTMLElement>(`[id="${this.optionId(active)}"]`);
      if (option !== null) revealWithin(option, list);
    });

    /* A Reactive Form is told when what the family judges has changed. */
    effect(() => {
      this.verdicts();
      this.resolvedMax();
      this.resolvedRequired();
      untracked(() => this.validatorChange());
    });

    destroyRef.onDestroy(() => {
      this.ring?.destroy();
      this.removal?.destroy();
      this.collapse?.destroy();
      this.gate?.destroy();
      this.placement?.destroy();
      if (this.currentTimer !== null) clearTimeout(this.currentTimer);
    });
  }

  ngOnInit() {
    const seed = this.defaultValue();
    if (seed === undefined || this.value().length > 0) return;
    this.value.set([...seed]);
  }

  protected trackChip(index: number, value: string) {
    /* The value, and its ordinal among equal values when duplicates are
       allowed, so a reorder keeps the chip — and the focus on it. */
    let times = 0;
    const held = this.value();
    for (let at = 0; at < index; at += 1) if (held[at] === value) times += 1;
    return times === 0 ? value : `${value} ${times}`;
  }

  labelFor(value: string): string {
    const format = this.formatLabel();
    return format === undefined ? value : format(value);
  }

  isLocked(value: string): boolean {
    return this.lockedValues().includes(value);
  }

  protected chipFrozen(value: string): boolean {
    return this.frozen() || this.isLocked(value);
  }

  protected optionId(index: number) {
    return `${this.listboxId}-${index}`;
  }

  protected messageId(index: number) {
    return `${this.ownId}-message-${index}`;
  }

  protected messageFor(index: number): string | null {
    const verdict = this.verdicts()[index];
    if (verdict === undefined || verdict.valid) return null;
    return verdict.message || this.t('invalid');
  }

  protected removeLabelFor(value: string) {
    return this.t('remove', { label: this.labelFor(value) });
  }

  protected chipLabel(value: string, index: number) {
    if (!this.resolvedReorderable()) return null;
    return this.t('reorder', {
      label: this.labelFor(value),
      position: index + 1,
      count: this.value().length,
    });
  }

  private judge(text: string): TagsVerdict {
    const validate = this.validateValue();
    if (validate === undefined) return constraintVerdict(this.probe(), text);
    const answer = validate(text);
    if (answer === true) return { valid: true };
    return { valid: false, message: answer === false ? '' : answer };
  }

  focus() {
    this.controlRef().nativeElement.focus({ preventScroll: true });
  }

  private announce(message: string) {
    if (message === '') return;
    getLiveAnnouncer(this.host.nativeElement.ownerDocument).announce(message, { repeat: true });
  }

  setInputValue(next: string, reason: TagsInputInputReason, source?: Event) {
    if (next === this.inputValue()) return;
    const state = createControllable<string>({
      initial: this.inputValue(),
      onRequest: (request) => this.inputValueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.inputValue.set(next);
  }

  /** One request for one transition, whatever moved the list. */
  private commit(next: readonly string[], reason: TagsInputValueReason, source?: Event) {
    if (same(next, this.value())) return false;
    const state = createControllable<readonly string[]>({
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
   * The one door into the list. Every candidate runs the sequence
   * `@slotted/core/tags` states — normalize, judge, deduplicate, cap — and each
   * refusal is reported under its cause rather than dropped.
   */
  admit(candidates: readonly string[], source?: Event, replacing?: number) {
    const normalize = this.normalize() ?? ((text: string) => text.trim());
    const result = admitValues({
      values: this.value(),
      candidates,
      max: this.resolvedMax(),
      allowDuplicates: this.resolvedAllowDuplicates(),
      invalidValues: this.resolvedInvalidValues(),
      normalize,
      judge: (text) => this.judge(text),
      equals: this.collator().equals,
      ...(replacing === undefined ? {} : { replacing }),
    });

    if (result.added.length > 0 && this.commit(result.next, 'submit', source)) {
      const last = result.added[result.added.length - 1] as string;
      const verdict = this.judge(last);
      const label = this.labelFor(last);
      const count = result.next.length;
      this.announce(
        verdict.valid
          ? this.t('added', { label, count })
          : this.t('addedInvalid', { label, count, reason: verdict.message || this.t('invalid') }),
      );
    }

    for (const cause of ['duplicate', 'limit', 'invalid'] as const) {
      if (result.refused[cause].length === 0) continue;
      this.valueRefuse.emit({ values: result.refused[cause], cause });
    }
    if (result.existing.length > 0) {
      const existing = result.existing[0] as string;
      this.markCurrent(existing);
      this.announce(this.t('duplicate', { label: this.labelFor(existing) }));
      queueMicrotask(() => this.focusChip(existing));
    }
    const limit = this.resolvedMax();
    if (result.refused.limit.length > 0 && limit !== null) {
      this.announce(this.t('counter', { count: limit, max: limit }));
    }
    if (result.refused.invalid.length > 0) this.announce(this.t('invalid'));
    return result;
  }

  /** The chip that answered a duplicate stays marked for one long step. */
  private markCurrent(value: string) {
    this.current.set(value);
    if (this.currentTimer !== null) clearTimeout(this.currentTimer);
    this.currentTimer = setTimeout(() => {
      this.current.set(null);
      this.currentTimer = null;
    }, longDuration(this.host.nativeElement));
  }

  remove(index: number, source?: Event) {
    const held = this.value();
    const target = held[index];
    if (target === undefined || this.isLocked(target)) return;
    const next = held.filter((_, at) => at !== index);
    if (this.commit(next, 'remove', source)) {
      this.announce(this.t('removed', { label: this.labelFor(target), count: next.length }));
    }
  }

  clear(source?: Event) {
    const kept = this.value().filter((entry) => this.isLocked(entry));
    this.commit(kept, 'clear', source);
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
    this.announce(
      this.t('reorder', {
        label: this.labelFor(moved as string),
        position: target + 1,
        count: next.length,
      }),
    );
    /* The chip travelled with the reader's focus; the ring has to be told the
       cells moved under it. */
    queueMicrotask(() => {
      this.ring?.refresh();
      this.chips()[target]?.focus({ preventScroll: true });
    });
  }

  async copy(values: readonly string[]) {
    if (values.length === 0) return;
    const outcome = await writeToClipboard(
      joinValues(values, this.resolvedDelimiters()),
      this.host.nativeElement.ownerDocument,
    );
    this.valueCopy.emit({ values, outcome });
    if (outcome !== 'refused') {
      this.announce(this.t('copied', { count: values.length }));
    }
  }

  setValue(values: readonly string[], reason: TagsInputValueReason = 'programmatic') {
    this.commit([...values], reason);
  }

  private chips(): HTMLElement[] {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>(CHIP_SELECTOR)];
  }

  private focusChip(value: string) {
    const chip = this.chips().find((candidate) => candidate.dataset['value'] === value);
    chip?.focus({ preventScroll: true });
  }

  private splitText(text: string): readonly string[] {
    const split = this.split();
    return split === undefined ? splitValues(text, this.resolvedDelimiters()) : split(text);
  }

  /** The typed text, committed as one or several values. */
  private commitText(source?: Event) {
    this.closeSuggestions();
    const text = this.inputValue();
    if (text.trim() === '') return false;
    this.admit(this.splitText(text), source);
    this.setInputValue('', 'submit', source);
    return true;
  }

  protected onInput(event: Event) {
    const text = (event.target as HTMLInputElement).value;
    this.suggesting.set(text.trim() !== '');
    this.highlight.set(-1);
    this.setInputValue(text, 'keyboard', event);
  }

  private closeSuggestions() {
    this.suggesting.set(false);
    this.highlight.set(-1);
  }

  /** A suggestion, through the same door as typed text. */
  protected choose(entry: string, source?: Event) {
    this.admit([entry], source);
    this.setInputValue('', 'submit', source);
    this.closeSuggestions();
  }

  protected onEditInput(event: Event) {
    this.editingText.set((event.target as HTMLInputElement).value);
  }

  protected onEditKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitEdit(index, event);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      /* The field blurs on the way out, and the blur must not commit what the
         key just reverted. */
      this.reverting = true;
      this.editingIndex.set(null);
      queueMicrotask(() => this.chips()[index]?.focus({ preventScroll: true }));
    }
  }

  protected commitEdit(index: number, event: Event) {
    if (this.reverting) {
      this.reverting = false;
      return;
    }
    if (this.editingIndex() !== index) return;
    const text = this.editingText();
    const held = this.value()[index];
    this.editingIndex.set(null);
    if (text.trim() !== '' && text !== held) this.admit([text], event, index);
    queueMicrotask(() => this.chips()[index]?.focus({ preventScroll: true }));
  }

  private beginEdit(value: string, index: number) {
    this.reverting = false;
    this.editingText.set(value);
    this.editingIndex.set(index);
    queueMicrotask(() => {
      this.chips()[index]?.querySelector('input')?.focus({ preventScroll: true });
    });
  }

  protected onChipDoubleClick(value: string, index: number) {
    if (this.chipFrozen(value) || !this.resolvedEditable()) return;
    this.beginEdit(value, index);
  }

  protected onChipKeyDown(value: string, index: number, event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const meta = event.ctrlKey || event.metaKey;
    const frozen = this.chipFrozen(value);

    if (meta && (event.key === 'c' || event.key === 'C')) {
      event.preventDefault();
      void this.copy([value]);
      return;
    }
    if (meta && (event.key === 'x' || event.key === 'X')) {
      if (frozen) return;
      event.preventDefault();
      void this.copy([value]);
      this.remove(index, event);
      return;
    }

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (frozen) return;
        event.preventDefault();
        this.remove(index, event);
        return;
      case 'Enter':
        if (frozen || !this.resolvedEditable()) return;
        event.preventDefault();
        this.beginEdit(value, index);
        return;
      case 'Escape':
        event.preventDefault();
        this.focus();
        return;
      default:
        break;
    }

    /* Reorder: `Alt` and an arrow, following the writing direction. */
    if (this.resolvedReorderable() && event.altKey && !frozen) {
      const target = event.currentTarget as HTMLElement;
      const rtl = target.ownerDocument.defaultView?.getComputedStyle(target).direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      const count = this.value().length;
      const to =
        event.key === forward
          ? index + 1
          : event.key === back
            ? index - 1
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? count - 1
                : null;
      if (to !== null) {
        event.preventDefault();
        this.move(index, to, event);
        return;
      }
    }

    /* A printable character returns to the field and types itself there. */
    if (event.key.length === 1 && !meta && !event.altKey) this.focus();
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (this.resolvedDisabled()) return;
    const meta = event.ctrlKey || event.metaKey;

    if (!this.frozen() && this.resolvedDelimiters().includes(event.key) && !event.altKey && !meta) {
      event.preventDefault();
      this.commitText(event);
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (this.suggestions() === undefined || this.frozen()) return;
        event.preventDefault();
        const down = event.key === 'ArrowDown';
        const count = this.matches().length;
        const active = this.active();
        if (!this.popup()) {
          this.suggesting.set(true);
          this.highlight.set(down ? 0 : count - 1);
          return;
        }
        /* The APG's list autocomplete: past either end, round to the other. */
        if (active < 0) this.highlight.set(down ? 0 : count - 1);
        else this.highlight.set((active + (down ? 1 : count - 1)) % count);
        return;
      }
      case 'Tab':
        this.closeSuggestions();
        return;
      case 'Enter': {
        /* With text, commits and never submits; with none, the platform's
           implicit submission is left alone. */
        if (this.frozen()) return;
        const active = this.active();
        if (active >= 0) {
          event.preventDefault();
          this.choose(this.matches()[active] as string, event);
          return;
        }
        if (this.commitText(event)) event.preventDefault();
        return;
      }
      case 'Escape':
        /* An open list closes first, and the text stays. */
        if (this.popup()) {
          event.preventDefault();
          this.closeSuggestions();
          return;
        }
        if (this.inputValue() === '') return;
        event.preventDefault();
        this.setInputValue('', 'clear', event);
        return;
      case 'Backspace': {
        /* §6's rule: from an empty field the first press moves focus to the
           last chip the reader may remove and removes nothing; the second
           press — on the chip — removes it. */
        if (this.inputValue() !== '' || this.frozen()) return;
        const control = event.currentTarget as HTMLInputElement;
        if (control.selectionStart !== 0) return;
        const last = this.chips()
          .reverse()
          .find((chip) => !chip.hasAttribute('data-disabled') && !chip.hasAttribute('data-count'));
        if (last === undefined) return;
        event.preventDefault();
        last.focus({ preventScroll: true });
        return;
      }
      case 'c':
      case 'C':
        if (!meta || this.inputValue() !== '' || this.value().length === 0) return;
        event.preventDefault();
        void this.copy(this.value());
        return;
      default:
        break;
    }
  }

  /** A paste that carries several values, split by the same rule the key reads. */
  protected onPaste(event: ClipboardEvent) {
    if (!this.resolvedAddOnPaste() || this.frozen()) return;
    const text = event.clipboardData?.getData('text') ?? '';
    const parts = this.splitText(text);
    if (parts.length < 2) return;
    event.preventDefault();
    this.admit(parts, event);
    this.setInputValue('', 'submit', event);
  }

  protected onBlur(event: FocusEvent) {
    this.onTouched();
    this.closeSuggestions();
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    if (this.frozen()) return;
    const policy = this.resolvedPendingOnBlur();
    if (policy === 'commit') this.commitText(event);
    else if (policy === 'discard') this.setInputValue('', 'blur', event);
  }

  /* The collapsed row opens while focus is anywhere inside the frame. */
  protected onFocusIn() {
    this.expanded.set(true);
  }

  protected onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    this.expanded.set(false);
  }

  protected onClear(event: MouseEvent) {
    this.clear(event);
    this.focus();
  }

  protected onRemoveClick(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.remove(index, event);
  }

  private bindRow() {
    const row = this.rowRef().nativeElement;

    this.ring = createArrowNavigation(row, {
      itemSelector: `${CHIP_SELECTOR}, [data-part='field'] > [data-part='input']`,
      loop: false,
      /* The field keeps the caret keys while there is anything to move the
         caret through, and gives them up when the text is empty. */
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
      at: NARROW_WIDTH,
      onChange: (narrow) => this.narrow.set(narrow),
    });

    this.collapse = createCollapse(row, {
      collapsible: () => this.collapsing(),
      onChange: (units) => this.hiddenCount.set(Math.max(units.length, 1)),
      trigger: () => this.countRef()?.nativeElement ?? null,
      /* The count is the trigger, not a unit. */
      units: () =>
        [...row.querySelectorAll<HTMLElement>(CHIP_SELECTOR)].filter(
          (unit) => !unit.hasAttribute('data-count'),
        ),
    });
  }

  writeValue(value: readonly string[] | null) {
    this.value.set(value === null ? [] : [...value]);
  }

  registerOnChange(fn: (value: readonly string[]) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void) {
    this.validatorChange = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabledByForm.set(isDisabled);
  }

  /**
   * Four validities the family owns: a required control holding nothing, a
   * list over its limit, a list holding a value twice where duplicates are
   * refused, and — the one no other family reports — the values in the list
   * that failed the judgement, by name, so a form can say which.
   */
  validate(): ValidationErrors | null {
    const held = this.value();
    if (this.resolvedRequired() && held.length === 0) return { required: true };

    const limit = this.resolvedMax();
    if (limit !== null && held.length > limit) {
      return { tooMany: { max: limit, actual: held.length } };
    }

    const failed = held.filter((_, index) => this.verdicts()[index]?.valid === false);
    if (failed.length > 0) return { invalidValues: failed };

    if (!this.resolvedAllowDuplicates() && new Set(held).size !== held.length) {
      return { duplicate: true };
    }
    return null;
  }
}
