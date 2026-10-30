import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  createCollection,
  createRowMetrics,
  moveIndex,
  nextSelection,
  offsetForIndex,
  shouldLoadMore,
  virtualWindow,
} from '@slotted/core/collection';
import type {
  Collection,
  MoveIntent,
  RowMetrics,
  SelectionAction,
  SelectionBehavior,
} from '@slotted/core/collection';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';

import { SlListboxContext } from './listbox-context';
import { injectListboxDefaults, SlListboxIdFactory } from './listbox-defaults';
import type {
  ListboxAlignment,
  ListboxFocusMode,
  ListboxIndicatorMode,
  ListboxOrientation,
  ListboxSelectionBehavior,
  ListboxSelectionMode,
  ListboxSize,
  ListboxVariant,
} from './listbox-defaults';
import {
  OPTION_SELECTOR,
  SlListboxGroup,
  SlListboxOption,
  SlListboxOptionContent,
} from './listbox-parts';

export type {
  ListboxAlignment,
  ListboxFocusMode,
  ListboxIndicatorMode,
  ListboxOrientation,
  ListboxSelectionBehavior,
  ListboxSelectionMode,
  ListboxSize,
  ListboxVariant,
} from './listbox-defaults';

/**
 * What the listbox holds: one key in `single` and `none`, a set of them in
 * `multiple`. Three of the four surveyed implementations give single selection
 * a scalar; the array-always shape is what makes a consumer write `value[0]`.
 */
export type ListboxValue = string | readonly string[] | null;

export type ListboxChangeRequest = ChangeRequest<ListboxValue>;
export type ListboxActiveRequest = ChangeRequest<string | null>;

/** One section of a collection the listbox was handed. */
export interface ListboxSection<T = unknown> {
  key: string;
  label: string;
  items: readonly T[];
}

/** One option of the render plan the template walks. */
interface PlanOption {
  kind: 'option';
  id: string;
  key: string;
  item: unknown;
  label: string;
  disabled: boolean;
  /** Where a pinned row sits on the canvas, or `null` for a row in the slice. */
  offset: number | null;
}

interface PlanGroup {
  kind: 'group';
  id: string;
  sectionKey: string;
  label: string;
  /** Whether the label row itself is inside the window. */
  showLabel: boolean;
  options: PlanOption[];
}

type PlanEntry = PlanOption | PlanGroup;

const EMPTY_SNAPSHOT = { keys: [] as string[], labels: [] as string[], disabled: [] as boolean[] };

function toKeys(value: ListboxValue | undefined): readonly string[] {
  if (value === undefined || value === null) return [];
  return typeof value === 'string' ? [value] : value;
}

function sameKeys(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/**
 * A list of options the reader chooses from, and the primitive `select`,
 * `combobox` and the pickers are built on.
 *
 * ── Where the collection comes from ─────────────────────────────────────
 *
 * Two ways in, one shape out. Written in the template, the collection is read
 * from the rendered options in DOM order — which is the reading order, survives
 * nesting inside groups, and cannot disagree with what the reader sees. Handed
 * `items` or `sections`, it is built by `@slotted/core/collection`, which is
 * the only way a listbox can window a set larger than the DOM or report a set
 * the DOM does not hold.
 *
 * ── Two mutable values ──────────────────────────────────────────────────
 *
 * The pattern is explicit that they are two: "DOM focus (the active element) is
 * functionally distinct from the selected state". `value` is what the reader
 * chose and `activeKey` is where the keyboard is, and a `select` reopening onto
 * the option chosen last time needs the second and nothing else.
 *
 * ── The focus model is read, not asked for ──────────────────────────────
 *
 * `focusMode="auto"` answers `activedescendant` whenever the set is windowed,
 * because a roving `tabindex` cannot survive its own element being recycled:
 * the element carrying `tabindex="0"` is removed while it holds focus, and
 * focus falls to the document body.
 */
@Component({
  selector: '[slListbox]',
  standalone: true,
  exportAs: 'slListbox',
  imports: [NgTemplateOutlet, SlListboxGroup, SlListboxOption],
  styleUrls: ['../../../styles/src/listbox/listbox.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: SlListboxContext, useExisting: forwardRef(() => SlListbox) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlListbox), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlListbox), multi: true },
  ],
  template: `@if (collection(); as held) {
      @if (windowed()) {
        <div
          data-part="canvas"
          data-part-canvas=""
          role="presentation"
          [style.--_canvas-size]="slice().totalSize + 'px'"
          [style.--_canvas-offset]="slice().startOffset + 'px'"
        >
          <ng-container
            [ngTemplateOutlet]="planRows"
            [ngTemplateOutletContext]="{ $implicit: plan() }"
          />
        </div>
      } @else {
        <ng-container
          [ngTemplateOutlet]="planRows"
          [ngTemplateOutletContext]="{ $implicit: plan() }"
        />
      }
    }
    <ng-content />

    <ng-template #planRows let-entries>
      @for (entry of entries; track entry.id) {
        @if (entry.kind === 'group') {
          <div
            slListboxGroup
            [label]="entry.showLabel ? entry.label : undefined"
            [groupLabel]="entry.label"
          >
            @for (option of entry.options; track option.id) {
              <ng-container
                [ngTemplateOutlet]="optionRow"
                [ngTemplateOutletContext]="{ $implicit: option }"
              />
            }
          </div>
        } @else {
          <ng-container
            [ngTemplateOutlet]="optionRow"
            [ngTemplateOutletContext]="{ $implicit: entry }"
          />
        }
      }
    </ng-template>

    <ng-template #optionRow let-option>
      <div
        slListboxOption
        [value]="option.key"
        [textValue]="option.label"
        [disabled]="option.disabled"
        [pinned]="option.offset !== null"
        [style.inset-block-start.px]="option.offset"
      >
        @if (optionContent(); as content) {
          <ng-container
            [ngTemplateOutlet]="content"
            [ngTemplateOutletContext]="{ $implicit: option.item }"
          />
        }
      </div>
    </ng-template>`,
  host: {
    'data-ui': 'listbox',
    'data-ui-listbox': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'writtenRole ?? "listbox"',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-indicator]': 'indicatorMode()',
    '[attr.data-focus-mode]': 'mode()',
    '[attr.data-layout]': 'resolvedColumns() > 1 ? "grid" : null',
    '[attr.data-disabled]': 'listboxDisabled() ? "" : null',
    '[attr.data-readonly]': 'resolvedReadOnly() ? "" : null',
    '[attr.data-invalid]': 'resolvedInvalid() ? "" : null',
    '[attr.data-required]': 'resolvedRequired() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.aria-multiselectable]': 'selection() === "multiple" ? "true" : null',
    '[attr.aria-orientation]': 'resolvedOrientation() === "horizontal" ? "horizontal" : null',
    '[attr.aria-activedescendant]': 'activeDescendant()',
    '[attr.aria-disabled]': 'listboxDisabled() ? "true" : null',
    '[attr.aria-readonly]': 'resolvedReadOnly() ? "true" : null',
    '[attr.aria-required]': 'resolvedRequired() ? "true" : null',
    '[attr.aria-invalid]': 'resolvedInvalid() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.tabindex]': 'rootTabIndex()',
    '[style.--slotted-listbox-rows]': 'resolvedRows()',
    '[style.--slotted-listbox-columns]': 'resolvedColumns()',
    '(keydown)': 'handleKeyDown($event)',
    '(focusin)': 'handleFocusIn($event)',
    '(focusout)': 'handleFocusOut($event)',
    '(scroll)': 'readViewport()',
  },
})
export class SlListbox implements ControlValueAccessor, OnInit, SlListboxContext, Validator {
  /* ── Inputs ───────────────────────────────────────────────────────── */

  /** Present means the consumer owns the choice, for the life of the component. */
  readonly value = input<ListboxValue | undefined>(undefined);
  /** What an uncontrolled listbox starts from, read once. */
  readonly defaultValue = input<ListboxValue | undefined>(undefined);
  /** Present means the consumer owns which option the keyboard is on. */
  readonly activeKey = input<string | null | undefined>(undefined);
  readonly defaultActiveKey = input<string | null | undefined>(undefined);

  readonly selectionMode = input<ListboxSelectionMode | undefined>(undefined);
  readonly selectionBehavior = input<ListboxSelectionBehavior | undefined>(undefined);
  readonly size = input<ListboxSize | undefined>(undefined);
  readonly variant = input<ListboxVariant | undefined>(undefined);
  readonly orientation = input<ListboxOrientation | undefined>(undefined);
  readonly focusMode = input<ListboxFocusMode | undefined>(undefined);
  readonly indicator = input<ListboxIndicatorMode | undefined>(undefined);

  readonly loop = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly typeahead = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly selectOnFocus = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly navigateDisabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly disallowEmptySelection = input<boolean | undefined, boolean | string | undefined>(
    undefined,
    { transform: (state) => (state === undefined ? undefined : booleanAttribute(state)) },
  );
  readonly disallowSelectAll = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });

  readonly rows = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });
  readonly columns = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });
  readonly pageSize = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });
  readonly typeaheadTimeout = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });

  /** Unstated rather than `false`, so the listbox defers to the form around it. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly required = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly loading = input(false, { transform: booleanAttribute });

  /** The whole collection, when the listbox is to window it or to report a set larger than the DOM. */
  readonly items = input<readonly unknown[] | undefined>(undefined);
  /** A grouped collection. Mutually exclusive with `items`. */
  readonly sections = input<readonly ListboxSection[] | undefined>(undefined);
  readonly getKey = input<((item: never) => string) | undefined>(undefined);
  readonly getLabel = input<((item: never) => string) | undefined>(undefined);
  readonly isItemDisabled = input<((item: never) => boolean) | undefined>(undefined);
  /** How large the whole set is when only part of it has been loaded. */
  readonly totalCount = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });

  /** Renders only the options the viewport covers, plus the pinned ones. */
  readonly virtual = input(false, { transform: booleanAttribute });
  /** The block size of one option. Required whenever `virtual` is set. */
  readonly itemSize = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });
  /** The block size of a group label row. Defaults to `itemSize`. */
  readonly sectionSize = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });
  readonly overscan = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });

  readonly hasMore = input(false, { transform: booleanAttribute });
  readonly loadMoreThreshold = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });

  /* ── Outputs ──────────────────────────────────────────────────────── */

  /** Emitted before the selection moves, with the request that carries the reason. */
  readonly valueChange = output<ListboxChangeRequest>();
  /** Emitted before the option the keyboard is on moves. */
  readonly activeKeyChange = output<ListboxActiveRequest>();
  /** Asked when the rendered window reaches the end of what has been loaded. */
  readonly loadMore = output<void>();

  /* ── Wiring ───────────────────────────────────────────────────────── */

  private readonly defaults = injectListboxDefaults();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly idPrefix = inject(SlListboxIdFactory).next();
  private readonly destroyRef = inject(DestroyRef);

  /** A role the consumer wrote is never replaced by the family's. */
  protected readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  /* The consumer's `<ng-template slListboxOptionContent let-item>`: what one
     option of a handed collection holds, so the template says what an option is
     made of and never how it is wired. */
  protected readonly optionContent = contentChild(SlListboxOptionContent, {
    read: TemplateRef,
  });

  private readonly ownKeys = signal<readonly string[]>([]);
  private readonly ownActive = signal<string | null>(null);
  private readonly formKeys = signal<readonly string[] | null>(null);
  private readonly formDisabled = signal(false);
  private readonly anchor = signal<string | undefined>(undefined);
  private typeaheadHandle: TypeaheadHandle | null = null;
  private onChangeFn: (value: ListboxValue) => void = () => {};
  private onTouchedFn: () => void = () => {};

  protected readonly viewportSize = signal(0);
  protected readonly scrollOffset = signal(0);

  constructor() {
    afterNextRender(() => {
      const element = this.host.nativeElement;
      this.readViewport();
      /* A `ResizeObserver` where there is one, and the viewport's own resize
         where there is not: a test environment and an old browser both answer
         the second, and a window that never re-measured would render the first
         frame's slice forever. */
      if (typeof ResizeObserver === 'undefined') {
        const view = element.ownerDocument.defaultView;
        const read = () => this.readViewport();
        view?.addEventListener('resize', read);
        this.destroyRef.onDestroy(() => view?.removeEventListener('resize', read));
        return;
      }
      const observer = new ResizeObserver(() => this.readViewport());
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    this.destroyRef.onDestroy(() => this.typeaheadHandle?.destroy());
  }

  /**
   * The uncontrolled start, read once. It is read here rather than in the
   * constructor because that is where Angular has finished writing the inputs,
   * and a value read a moment earlier is the input's declared default rather
   * than the consumer's.
   */
  ngOnInit() {
    this.ownKeys.set(toKeys(this.defaultValue()));
    this.ownActive.set(this.defaultActiveKey() ?? null);
  }

  /* ── Resolved axes ────────────────────────────────────────────────── */

  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedOrientation = computed(() => this.orientation() ?? this.defaults.orientation);
  readonly indicatorMode = computed(() => this.indicator() ?? this.defaults.indicator);
  readonly selection = computed(() => this.selectionMode() ?? this.defaults.selectionMode);
  readonly resolvedBehavior = computed<SelectionBehavior>(
    () => this.selectionBehavior() ?? this.defaults.selectionBehavior,
  );
  readonly resolvedRows = computed(() => this.rows() ?? this.defaults.rows);
  readonly resolvedColumns = computed(() =>
    Math.max(Math.floor(this.columns() ?? this.defaults.columns), 1),
  );
  readonly resolvedReadOnly = computed(() => (this.readOnly() ?? false) === true);
  readonly resolvedRequired = computed(() => (this.required() ?? false) === true);
  readonly resolvedInvalid = computed(() => (this.invalid() ?? false) === true);
  readonly listboxDisabled = computed(() => (this.disabled() ?? this.formDisabled()) === true);

  readonly windowed = computed(() => this.virtual() && (this.itemSize() ?? 0) > 0);
  readonly mode = computed<'roving' | 'activedescendant'>(() => {
    const asked = this.focusMode() ?? this.defaults.focusMode;
    return asked === 'auto' ? (this.windowed() ? 'activedescendant' : 'roving') : asked;
  });

  /* ── State ────────────────────────────────────────────────────────── */

  readonly selectedKeys = computed<readonly string[]>(() => {
    const controlled = this.value();
    if (controlled !== undefined) return toKeys(controlled);
    return this.formKeys() ?? this.ownKeys();
  });

  readonly active = computed<string | null>(() => {
    const controlled = this.activeKey();
    return controlled === undefined ? this.ownActive() : controlled;
  });

  protected readonly activeDescendant = computed(() => {
    const key = this.active();
    return this.mode() === 'activedescendant' && key !== null ? this.optionId(key) : null;
  });

  protected readonly rootTabIndex = computed(() =>
    this.mode() === 'activedescendant' || this.active() === null ? 0 : -1,
  );

  /* ── The collection ───────────────────────────────────────────────── */

  readonly collection = computed<Collection<unknown> | undefined>(() => {
    const items = this.items();
    const sections = this.sections();
    if (items === undefined && sections === undefined) return undefined;
    const key = this.getKey() as ((item: unknown) => string) | undefined;
    const label = this.getLabel() as ((item: unknown) => string) | undefined;
    const disabled = this.isItemDisabled() as ((item: unknown) => boolean) | undefined;
    const total = this.totalCount();
    return createCollection<unknown>({
      ...(items === undefined ? {} : { items }),
      ...(sections === undefined ? {} : { sections }),
      getKey: key === undefined ? (_item, index) => String(index) : (item) => key(item),
      ...(label === undefined ? {} : { getLabel: label }),
      ...(disabled === undefined ? {} : { isDisabled: disabled }),
      ...(total === undefined ? {} : { totalCount: total }),
    });
  });

  private readonly rowMetrics = computed<RowMetrics | undefined>(() => {
    const held = this.collection();
    if (!this.windowed() || held === undefined || this.sections() === undefined) return undefined;
    const option = this.itemSize() ?? 0;
    const label = this.sectionSize() ?? option;
    return createRowMetrics(held.rows.map((row) => (row.kind === 'option' ? option : label)));
  });

  readonly slice = computed(() => {
    const held = this.collection();
    const metrics = this.rowMetrics();
    const activeRow =
      this.active() === null ? -1 : (held?.optionFor(this.active() as string)?.row ?? -1);
    const anchorKey = this.anchor();
    const anchorRow = anchorKey === undefined ? -1 : (held?.optionFor(anchorKey)?.row ?? -1);
    return virtualWindow({
      itemCount: held?.rows.length ?? 0,
      ...(metrics === undefined ? { itemSize: this.itemSize() ?? 0 } : { metrics }),
      overscan: this.overscan() ?? this.defaults.overscan,
      scrollOffset: this.scrollOffset(),
      viewportSize: this.viewportSize(),
      pinned: [activeRow, anchorRow],
    });
  });

  /**
   * What the template walks. A windowed slice starts and ends in the middle of
   * the collection, so a group is emitted per contiguous run of rows belonging
   * to one section rather than per section — and a run whose label row is
   * outside the window is named by `aria-label` instead. Each run is still a
   * group carrying the section's name, which is what the pattern asks of a
   * grouped option.
   */
  protected readonly plan = computed<PlanEntry[]>(() => {
    const held = this.collection();
    if (held === undefined) return [];

    const metrics = this.rowMetrics();
    const size = this.itemSize() ?? 0;
    const offsetOf = (row: number) => metrics?.offsetOf(row) ?? row * size;

    const toOption = (index: number, pinned: boolean): PlanOption | null => {
      const option = held.options[index];
      if (option === undefined) return null;
      return {
        kind: 'option',
        id: `${option.key}-${pinned ? 'pinned' : 'row'}`,
        key: option.key,
        item: option.item,
        label: option.label,
        disabled: option.disabled,
        offset: pinned ? offsetOf(option.row) : null,
      };
    };

    const window_ = this.slice();
    const rows = this.windowed()
      ? held.rows.slice(window_.startIndex, window_.endIndex)
      : held.rows;

    const entries: PlanEntry[] = [];

    if (this.windowed()) {
      for (const row of [...window_.pinnedBefore, ...window_.pinnedAfter]) {
        const held_ = held.rows[row];
        if (held_?.kind !== 'option') continue;
        const option = toOption(held_.option.index, true);
        if (option !== null) entries.push(option);
      }
    }

    const group = (sectionKey: string, label: string, showLabel: boolean): PlanGroup => {
      const made: PlanGroup = {
        kind: 'group',
        id: `group-${sectionKey}-${window_.startIndex}`,
        sectionKey,
        label,
        showLabel,
        options: [],
      };
      entries.push(made);
      return made;
    };

    let run: PlanGroup | undefined;

    for (const row of rows) {
      if (row.kind === 'section-label') {
        run = group(row.section.key, row.section.label ?? '', true);
        continue;
      }
      const option = toOption(row.option.index, false);
      if (option === null) continue;
      const section = row.option.section;
      if (section === undefined) {
        run = undefined;
        entries.push(option);
        continue;
      }
      if (run === undefined || run.sectionKey !== section) {
        run = group(section, held.sections.find((s) => s.key === section)?.label ?? '', false);
      }
      run.options.push(option);
    }

    return entries;
  });

  /**
   * The collection as the reducers want it, read at the moment of a key press
   * rather than held in state: an option added or removed between two presses
   * is already accounted for, and nothing has to be registered.
   */
  private snapshot() {
    const held = this.collection();
    if (held !== undefined) {
      return {
        keys: held.keys,
        labels: held.labels,
        disabled: held.options.map((option) => option.disabled),
      };
    }
    const nodes = [...this.host.nativeElement.querySelectorAll<HTMLElement>(OPTION_SELECTOR)];
    if (nodes.length === 0) return EMPTY_SNAPSHOT;
    return {
      keys: nodes.map((node) => node.dataset['key'] ?? ''),
      labels: nodes.map((node) => node.dataset['textValue'] ?? node.textContent?.trim() ?? ''),
      disabled: nodes.map((node) => node.getAttribute('aria-disabled') === 'true'),
    };
  }

  /* ── What the parts are told ──────────────────────────────────────── */

  isSelected(key: string) {
    return this.selectedKeys().includes(key);
  }

  isActive(key: string) {
    return this.active() === key;
  }

  optionId(key: string) {
    return `${this.idPrefix}-${key}`;
  }

  optionTabIndex(key: string) {
    if (this.mode() !== 'roving') return null;
    return this.active() === key ? 0 : -1;
  }

  setSize() {
    return this.collection()?.setSize ?? null;
  }

  posInSet(key: string) {
    const position = this.collection()?.posInSet(key);
    return position === undefined || position === -1 ? null : position;
  }

  press(key: string, event: MouseEvent) {
    if (this.listboxDisabled()) return;
    const snap = this.snapshot();
    const index = snap.keys.indexOf(key);
    const optionDisabled = index !== -1 && snap.disabled[index] === true;
    const navigateDisabled = this.navigateDisabled() ?? this.defaults.navigateDisabled;

    if (this.mode() === 'roving') this.focusOption(key);
    else this.host.nativeElement.focus();

    if (optionDisabled && !navigateDisabled) return;
    this.requestActive(key, 'pointer', event);
    if (optionDisabled) return;

    if (event.shiftKey) this.applySelection('range', key, 'pointer', event);
    /* Control or Command adds one, whichever model is in force: it is the press
       that says "this one as well", and it means that in both. */
    else if (event.ctrlKey || event.metaKey) {
      this.applySelection('toggle', key, 'pointer', event, 'toggle');
    } else this.applySelection('toggle', key, 'pointer', event);
  }

  /* ── Moving and choosing ──────────────────────────────────────────── */

  private focusOption(key: string) {
    this.host.nativeElement
      .querySelector<HTMLElement>(`${OPTION_SELECTOR}[data-key="${CSS.escape(key)}"]`)
      ?.focus();
  }

  private requestActive(
    key: string | null,
    reason: 'pointer' | 'keyboard' | 'programmatic',
    source: unknown,
  ) {
    let cancelled = false;
    const controlled = this.activeKey();
    const state = createControllable<string | null>({
      ...(controlled === undefined ? {} : { controlled }),
      initial: this.active(),
      onRequest: (request) => {
        this.activeKeyChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(key, reason, source);
    if (cancelled) return;
    if (moved) this.ownActive.set(key);
  }

  private applySelection(
    action: SelectionAction,
    key: string | undefined,
    reason: 'pointer' | 'keyboard' | 'select' | 'clear' | 'programmatic',
    source: unknown,
    behavior: SelectionBehavior = this.resolvedBehavior(),
  ) {
    if (this.selection() === 'none' || this.resolvedReadOnly()) return;
    const snap = this.snapshot();
    const selected = this.selectedKeys();
    const result = nextSelection({
      action,
      behavior,
      mode: this.selection(),
      selected,
      keys: snap.keys,
      ...(key === undefined ? {} : { key }),
      ...(this.anchor() === undefined ? {} : { anchor: this.anchor() as string }),
      disabled: (candidate) => snap.disabled[snap.keys.indexOf(candidate)] === true,
      disallowEmpty: this.disallowEmptySelection() ?? this.defaults.disallowEmptySelection,
      disallowSelectAll: this.disallowSelectAll() ?? this.defaults.disallowSelectAll,
    });
    this.anchor.set(result.anchor);
    if (!result.changed) return;

    let cancelled = false;
    const controlled = this.value();
    const outward = (keys: readonly string[]): ListboxValue =>
      this.selection() === 'multiple' ? keys : (keys[0] ?? null);
    const state = createControllable<readonly string[]>({
      ...(controlled === undefined ? {} : { controlled: toKeys(controlled) }),
      initial: selected,
      equals: sameKeys,
      onRequest: (request) => {
        /* The request the consumer sees carries the shape the consumer gave:
           one key in single selection, the set in multiple. The reducer works in
           arrays throughout, and this is the one place the two meet. */
        this.valueChange.emit({
          value: outward(request.value),
          previous: outward(request.previous),
          reason: request.reason,
          source: request.source,
          get cancelled() {
            return request.cancelled;
          },
          cancel: () => request.cancel(),
        });
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(result.selected, reason, source);
    if (cancelled) return;
    if (moved) {
      this.ownKeys.set(result.selected);
      this.formKeys.set(result.selected);
    }
    this.onChangeFn(outward(result.selected));
  }

  private moveActive(index: number, source: unknown, keys: readonly string[]) {
    const key = keys[index];
    if (key === undefined) return;
    this.requestActive(key, 'keyboard', source);
    this.revealIndex(index, 'nearest');
    if (this.mode() === 'roving') this.focusOption(key);
  }

  private revealIndex(index: number, align: ListboxAlignment) {
    const element = this.host.nativeElement;
    if (index < 0) return;

    if (!this.windowed()) {
      const key = this.snapshot().keys[index];
      if (key === undefined) return;
      element
        .querySelector<HTMLElement>(`${OPTION_SELECTOR}[data-key="${CSS.escape(key)}"]`)
        /* Optional-called: `scrollIntoView` is absent in a test environment. */
        ?.scrollIntoView?.({ block: align === 'nearest' ? 'nearest' : 'center' });
      return;
    }

    const held = this.collection();
    const metrics = this.rowMetrics();
    element.scrollTop = offsetForIndex({
      index: held?.options[index]?.row ?? index,
      itemCount: held?.rows.length ?? 0,
      ...(metrics === undefined ? { itemSize: this.itemSize() ?? 0 } : { metrics }),
      scrollOffset: element.scrollTop,
      viewportSize: element.clientHeight,
      align,
    });
  }

  /* ── The keyboard ─────────────────────────────────────────────────── */

  protected handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || this.listboxDisabled()) return;

    const snap = this.snapshot();
    if (snap.keys.length === 0) return;

    const navigateDisabled = this.navigateDisabled() ?? this.defaults.navigateDisabled;
    const enabled = snap.keys.map((_, index) => navigateDisabled || snap.disabled[index] !== true);
    const active = this.active();
    const from = active === null ? -1 : snap.keys.indexOf(active);
    const modifier = event.ctrlKey || event.metaKey;
    const element = this.host.nativeElement;
    const rtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
    const loop = this.loop() ?? this.defaults.loop;
    const columns = this.resolvedColumns();
    const pageSize = this.pageSize() ?? this.defaults.pageSize;
    const selectOnFocus = this.selectOnFocus() ?? this.defaults.selectOnFocus;

    /**
     * A row in a two-dimensional arrangement is `pageDown` with the page set to
     * `columns`: the engine's page arithmetic already clamps rather than
     * wrapping and lands on the nearest enabled option inward, which is exactly
     * what a row step needs.
     */
    const step = (intent: MoveIntent, page?: number) => {
      const index = moveIndex({
        enabled,
        from,
        intent,
        loop,
        ...(page === undefined ? {} : { page }),
      });
      if (index === -1 || index === from) return;
      event.preventDefault();
      this.moveActive(index, event, snap.keys);

      const key = snap.keys[index];
      if (key === undefined || snap.disabled[index] === true) return;
      if (event.shiftKey && this.selection() === 'multiple') {
        this.applySelection('toggle', key, 'keyboard', event, 'toggle');
      } else if (!modifier && selectOnFocus) {
        this.applySelection('replace', key, 'keyboard', event);
      }
    };

    const edge = (intent: 'first' | 'last') => {
      const index = moveIndex({ enabled, from, intent });
      if (index === -1) return;
      event.preventDefault();
      const key = snap.keys[index];
      this.moveActive(index, event, snap.keys);
      if (modifier && event.shiftKey && key !== undefined) {
        this.applySelection('range', key, 'keyboard', event, 'toggle');
      } else if (!modifier && selectOnFocus && key !== undefined) {
        this.applySelection('replace', key, 'keyboard', event);
      }
    };

    const inlineNext = rtl ? 'ArrowLeft' : 'ArrowRight';
    const inlinePrevious = rtl ? 'ArrowRight' : 'ArrowLeft';
    const horizontal = this.resolvedOrientation() === 'horizontal';
    const grid = columns > 1;

    if (event.key === 'ArrowDown' && !horizontal) {
      return grid ? step('pageDown', columns) : step('next');
    }
    if (event.key === 'ArrowUp' && !horizontal) {
      return grid ? step('pageUp', columns) : step('previous');
    }
    if (event.key === inlineNext && (horizontal || grid)) return step('next');
    if (event.key === inlinePrevious && (horizontal || grid)) return step('previous');
    if (event.key === 'Home') return edge('first');
    if (event.key === 'End') return edge('last');
    if (event.key === 'PageDown') return step('pageDown', pageSize);
    if (event.key === 'PageUp') return step('pageUp', pageSize);

    const sequenceOpen = (this.typeaheadHandle?.query.length ?? 0) > 0;

    if ((event.key === ' ' && !sequenceOpen) || event.key === 'Enter') {
      if (active === null) return;
      event.preventDefault();
      if (event.shiftKey && this.selection() === 'multiple') {
        this.applySelection('range', active, 'keyboard', event, 'toggle');
      } else {
        /* Control+Space toggles even under the alternative model, where a plain
           Space replaces. It is the one key that says "this one as well". */
        this.applySelection(
          'toggle',
          active,
          'keyboard',
          event,
          modifier ? 'toggle' : this.resolvedBehavior(),
        );
      }
      return;
    }

    if (modifier && (event.key === 'a' || event.key === 'A')) {
      event.preventDefault();
      this.applySelection('all', undefined, 'select', event);
      return;
    }

    const typeahead = this.typeahead() ?? this.defaults.typeahead;
    if (typeahead && !modifier && isPrintable(event.key, sequenceOpen)) {
      this.typeaheadHandle ??= createTypeahead({
        timeout: this.typeaheadTimeout() ?? this.defaults.typeaheadTimeout,
      });
      const index = this.typeaheadHandle.match(event.key, snap.labels, from);
      if (index === -1) return;
      event.preventDefault();
      this.moveActive(index, event, snap.keys);
      const key = snap.keys[index];
      if (selectOnFocus && key !== undefined) {
        this.applySelection('replace', key, 'keyboard', event);
      }
    }
  }

  protected handleFocusIn(event: FocusEvent) {
    if (this.listboxDisabled()) return;
    if (event.target !== this.host.nativeElement || this.active() !== null) return;

    /* The pattern: focus lands on the selected option when there is one, and on
       the first option otherwise, in both single and multiple selection. */
    const snap = this.snapshot();
    const navigateDisabled = this.navigateDisabled() ?? this.defaults.navigateDisabled;
    const enabled = snap.keys.map((_, index) => navigateDisabled || snap.disabled[index] !== true);
    const selected = this.selectedKeys();
    const chosen = selected.length > 0 ? snap.keys.indexOf(selected[0] as string) : -1;
    const index =
      chosen !== -1 && enabled[chosen] === true
        ? chosen
        : moveIndex({ enabled, from: -1, intent: 'first' });
    if (index !== -1) this.moveActive(index, event, snap.keys);
  }

  protected handleFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (next !== null && this.host.nativeElement.contains(next)) return;
    /**
     * Only when focus has actually left. Under the roving model the family
     * moves focus from option to option on every key, and each of those moves
     * raises a `focusout` on the root: resetting on all of them cleared the
     * typeahead buffer after every character, so a sequence longer than one
     * letter could never be typed.
     */
    this.typeaheadHandle?.reset();
    this.onTouchedFn();
  }

  protected readViewport() {
    const element = this.host.nativeElement;
    this.viewportSize.set(element.clientHeight);
    this.scrollOffset.set(element.scrollTop);
    if (!this.windowed()) return;
    this.askForMore();
  }

  private askForMore() {
    const held = this.collection();
    if (held === undefined) return;
    if (
      shouldLoadMore({
        endIndex: this.windowed() ? this.slice().endIndex : held.rows.length,
        loadedCount: held.rows.length,
        threshold: this.loadMoreThreshold() ?? this.defaults.loadMoreThreshold,
        hasMore: this.hasMore(),
        loading: this.loading(),
      })
    ) {
      this.loadMore.emit();
    }
  }

  /* ── The imperative actions ───────────────────────────────────────── */

  /** Moves real focus into the listbox, under either focus model. */
  focus() {
    const active = this.active();
    if (this.mode() === 'activedescendant' || active === null) {
      this.host.nativeElement.focus();
      return;
    }
    this.focusOption(active);
  }

  /** Reveals an option, whether or not it is currently rendered. */
  scrollToKey(key: string, align: ListboxAlignment = 'nearest') {
    const index = this.snapshot().keys.indexOf(key);
    if (index !== -1) this.revealIndex(index, align);
  }

  /** Which option the keyboard is on, or `null`. */
  getActiveKey() {
    return this.active();
  }

  /* ── Forms ────────────────────────────────────────────────────────── */

  writeValue(value: ListboxValue | undefined) {
    this.formKeys.set(toKeys(value));
  }

  registerOnChange(fn: (value: ListboxValue) => void) {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  /**
   * The listbox owns validity over the set, which no single option can see:
   * "choose one" is a fact about the collection and not about any one option.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.resolvedRequired()) return null;
    const value = control.value as ListboxValue | undefined;
    return toKeys(value).length === 0 ? { required: true } : null;
  }
}
