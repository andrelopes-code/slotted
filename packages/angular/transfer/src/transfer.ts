import { writeSelectorKey } from '@slotted/core/selector-key';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterEveryRender,
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import {
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ControlValueAccessor,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlButton, SlButtonEnd, SlButtonStart } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import {
  SlListbox,
  SlListboxDescription,
  SlListboxEmpty,
  SlListboxIndicator,
  SlListboxLabel,
  SlListboxLoader,
  SlListboxOptionContent,
  type ListboxChangeRequest,
} from '@slotted/angular/listbox';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import { SlTextField, SlTextFieldInput, SlTextFieldStart } from '@slotted/angular/text-field';
import { createFilter } from '@slotted/core/collection';
import { createDragController, type DragController } from '@slotted/core/drag';
import {
  dragMessages,
  type PartialMessages,
  transferMessages,
  type TransferMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  keysToMove,
  moveKeys,
  partitionKeys,
  reorderKeys,
  reorderKeysTo,
  toggleVisibleSelection,
  type TransferSide,
} from '@slotted/core/transfer';

import {
  injectTransferDefaults,
  SlTransferIdFactory,
  type TransferItem,
  type TransferLayout,
  type TransferMoveReason,
  type TransferMoveRequest,
  type TransferPaneReason,
  type TransferPaneRequest,
  type TransferQueryReason,
  type TransferQueryRequest,
  type TransferSelectionReason,
  type TransferSelectionRequest,
  type TransferSize,
} from './transfer-defaults';

const SIDES: readonly TransferSide[] = ['source', 'target'];
const EMPTY: readonly string[] = [];

/** The step one below the family's, for the search field and the buttons. */
const INNER_SIZE: Record<TransferSize, 'sm' | 'md'> = { sm: 'sm', md: 'sm', lg: 'md' };

/** A click with no coordinates is a key. */
function pressReason(event: MouseEvent): 'pointer' | 'keyboard' {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

function escapeValue(value: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value.replace(/["\\]/g, '\\$&');
}

const sameKeys = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

/** A request whose `cancel()` the family reads back after emitting it. */
function makeRequest<T, Extra extends object>(
  value: T,
  previous: T,
  reason: ChangeReason,
  source: unknown,
  extra: Extra,
): ChangeRequest<T> & Extra & { readonly cancelled: boolean } {
  let cancelled = false;
  return {
    value,
    previous,
    reason,
    source,
    ...extra,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/** One option of a pane: the item, or the key a target holds without one. */
export interface TransferEntry<T = unknown> {
  readonly key: string;
  readonly item: T | undefined;
}

interface DragView {
  readonly items: readonly string[];
  readonly over: TransferSide | null;
  readonly index: number | null;
  readonly from: TransferSide | null;
}

const NO_DRAG: DragView = { items: EMPTY, over: null, index: null, from: null };

/**
 * The consumer's `<ng-template slTransferItem let-item let-side="side">`: what
 * one option holds besides its check. The listbox family's label, description
 * and meta directives are the parts to write it with.
 */
@Directive({ selector: 'ng-template[slTransferItem]', standalone: true })
export class SlTransferItem {}

/** `<ng-template slTransferFooter let-side>`: content under a pane's list. */
@Directive({ selector: 'ng-template[slTransferFooter]', standalone: true })
export class SlTransferFooter {}

/**
 * Writes this family's part name on a button. `slButton` writes
 * `data-part="root"` as a static host attribute, which erases the part the
 * template wrote, so it is written back after the first render.
 */
@Directive({ selector: '[slTransferPart]', standalone: true })
export class SlTransferPart {
  readonly part = input.required<string>({ alias: 'slTransferPart' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => writeSelectorKey(this.host.nativeElement, 'part', this.part()));
  }
}

/**
 * Two lists and the moves between them: available on one side, chosen on the
 * other, each a listbox with a search, a count and a select-all box, and the
 * move buttons between them.
 *
 * The host is the root. Its value is `targetKeys`, the keys in the chosen
 * list; a form reads the same array through `ControlValueAccessor`, and a
 * `required` transfer reports `{ required: true }` while the list is empty.
 */
@Component({
  selector: '[slTransfer]',
  standalone: true,
  exportAs: 'slTransfer',
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlButtonEnd,
    SlButtonStart,
    SlCheckbox,
    SlGlyph,
    SlIcon,
    SlListbox,
    SlListboxDescription,
    SlListboxEmpty,
    SlListboxIndicator,
    SlListboxLabel,
    SlListboxLoader,
    SlListboxOptionContent,
    SlSegment,
    SlSegmentedControl,
    SlTextField,
    SlTextFieldInput,
    SlTextFieldStart,
    SlTransferPart,
  ],
  template: `
    <div data-part="switch" data-part-switch="">
      <div
        slSegmentedControl
        [attr.aria-label]="t('panes')"
        [disabled]="isDisabled()"
        [fullWidth]="true"
        [size]="resolvedSize()"
        [value]="currentPane()"
        (valueChange)="onSwitch($event)"
      >
        @for (side of sides; track side) {
          <label slSegment [value]="side">{{ paneCount(side) }}</label>
        }
      </div>
    </div>
    <div data-part="body" data-part-body="">
      <ng-container
        [ngTemplateOutlet]="paneTemplate"
        [ngTemplateOutletContext]="{ $implicit: 'source' }"
      />
      <div data-part="actions" data-part-actions="" role="group" [attr.aria-label]="t('actions')">
        <button
          slButton
          slTransferPart="move-to-target"
          tone="secondary"
          variant="outline"
          aria-keyshortcuts="Enter"
          [size]="innerSize()"
          [disabled]="frozen() || selectedToMove('source').length === 0"
          [focusableWhenDisabled]="!isDisabled()"
          (click)="move(selectedToMove('source'), 'target', pressReason($event), $event)"
        >
          {{ t('moveToTarget')
          }}<span slButtonEnd aria-hidden="true"
            ><span slIcon><svg slGlyph name="chevron-right"></svg></span
          ></span>
        </button>
        <button
          slButton
          slTransferPart="move-all-to-target"
          tone="secondary"
          variant="outline"
          [size]="innerSize()"
          [disabled]="frozen() || enabledVisible('source').length === 0"
          [focusableWhenDisabled]="!isDisabled()"
          (click)="move(enabledVisible('source'), 'target', pressReason($event), $event)"
        >
          {{ t('moveAllToTarget')
          }}<span slButtonEnd aria-hidden="true"
            ><span slIcon><svg slGlyph name="chevrons-right"></svg></span
          ></span>
        </button>
        <button
          slButton
          slTransferPart="move-to-source"
          tone="secondary"
          variant="outline"
          aria-keyshortcuts="Delete"
          [size]="innerSize()"
          [disabled]="frozen() || selectedToMove('target').length === 0"
          [focusableWhenDisabled]="!isDisabled()"
          (click)="move(selectedToMove('target'), 'source', pressReason($event), $event)"
        >
          <span slButtonStart aria-hidden="true"
            ><span slIcon><svg slGlyph name="chevron-right"></svg></span></span
          >{{ t('moveToSource') }}
        </button>
        <button
          slButton
          slTransferPart="move-all-to-source"
          tone="secondary"
          variant="outline"
          [size]="innerSize()"
          [disabled]="frozen() || enabledVisible('target').length === 0"
          [focusableWhenDisabled]="!isDisabled()"
          (click)="move(enabledVisible('target'), 'source', pressReason($event), $event)"
        >
          <span slButtonStart aria-hidden="true"
            ><span slIcon><svg slGlyph name="chevrons-right"></svg></span></span
          >{{ t('moveAllToSource') }}
        </button>
        @if (resolvedReorderable()) {
          <div
            data-part="reorder"
            data-part-reorder=""
            role="group"
            [attr.aria-label]="t('reorder')"
          >
            <button
              slButton
              slTransferPart="move-up"
              tone="secondary"
              variant="ghost"
              aria-keyshortcuts="Alt+ArrowUp"
              [size]="innerSize()"
              [disabled]="frozen() || !canReorder() || selectedToMove('target').length === 0"
              [focusableWhenDisabled]="!isDisabled()"
              (click)="shift(-1, pressReason($event), $event, false)"
            >
              <span slButtonStart aria-hidden="true"
                ><span slIcon><svg slGlyph name="chevron-down"></svg></span></span
              >{{ t('moveUp') }}
            </button>
            <button
              slButton
              slTransferPart="move-down"
              tone="secondary"
              variant="ghost"
              aria-keyshortcuts="Alt+ArrowDown"
              [size]="innerSize()"
              [disabled]="frozen() || !canReorder() || selectedToMove('target').length === 0"
              [focusableWhenDisabled]="!isDisabled()"
              (click)="shift(1, pressReason($event), $event, false)"
            >
              <span slButtonStart aria-hidden="true"
                ><span slIcon><svg slGlyph name="chevron-down"></svg></span></span
              >{{ t('moveDown') }}
            </button>
          </div>
        }
      </div>
      <ng-container
        [ngTemplateOutlet]="paneTemplate"
        [ngTemplateOutletContext]="{ $implicit: 'target' }"
      />
    </div>
    @if (name(); as field) {
      @for (key of partition().target; track key) {
        <input type="hidden" [attr.name]="field" [value]="key" />
      }
    }

    <ng-template #paneTemplate let-side>
      <div
        data-part="pane"
        data-part-pane=""
        role="group"
        [attr.data-side]="side"
        [attr.aria-labelledby]="titleId(side)"
        [attr.data-current]="currentPane() === side ? '' : null"
        [attr.data-drop-target]="dropTarget(side) ? '' : null"
      >
        <div data-part="pane-header" data-part-pane-header="">
          @if (resolvedSelectAll()) {
            <span data-part="select-all" data-part-select-all="">
              <div
                slCheckbox
                [size]="resolvedSize()"
                [checked]="selectAllState(side) === 'all'"
                [indeterminate]="selectAllState(side) === 'some'"
                [disabled]="isDisabled() || enabledVisible(side).length === 0"
                (checkedChange)="onSelectAll(side, $event)"
              ></div>
            </span>
          }
          <span data-part="title" data-part-title="" [attr.id]="titleId(side)">{{
            title(side)
          }}</span>
          <span data-part="count" data-part-count="">{{ countText(side) }}</span>
        </div>
        @if (resolvedSearchable()) {
          <div data-part="search" data-part-search="">
            <div slTextField [clearable]="true" [size]="innerSize()">
              <span slTextFieldStart aria-hidden="true"
                ><span data-part="search-icon" data-part-search-icon=""
                  ><span slIcon><svg slGlyph name="search"></svg></span></span
              ></span>
              <input
                slTextFieldInput
                type="search"
                [disabled]="isDisabled()"
                [value]="queryOf(side)"
                [attr.aria-label]="t('search', { pane: title(side) })"
                [attr.placeholder]="t('search', { pane: title(side) })"
                (valueChange)="onQuery(side, $event)"
              />
            </div>
          </div>
        }
        <div
          data-part="list"
          data-part-list=""
          [attr.data-side]="side"
          (focusin)="onListFocus(side, $event)"
        >
          <div
            slListbox
            variant="plain"
            selectionMode="multiple"
            [attr.aria-labelledby]="titleId(side)"
            [size]="resolvedSize()"
            [rows]="resolvedRows()"
            [items]="entriesOf(side)"
            [getKey]="entryKey"
            [getLabel]="entryLabel"
            [isItemDisabled]="entryDisabled"
            [activeKey]="activeOf(side)"
            [value]="selectionFor(side)"
            [disabled]="isDisabled()"
            [invalid]="isInvalid()"
            [required]="required()"
            [virtual]="virtual() && itemSize() !== undefined"
            [itemSize]="itemSize()"
            [overscan]="overscan()"
            [loading]="side === 'source' && loading()"
            [hasMore]="side === 'source' && hasMore()"
            (loadMore)="loadMore.emit()"
            (activeKeyChange)="setActive(side, $event.value)"
            (valueChange)="onPaneSelection(side, $event)"
          >
            <ng-template slListboxOptionContent let-entry>
              <span
                slListboxIndicator
                [attr.data-dragging]="dragging().has(entry.key) ? '' : null"
                [attr.data-unresolved]="entry.item === undefined ? '' : null"
              ></span>
              @if (entry.item === undefined) {
                <span slListboxLabel>{{ entry.key }}</span>
              } @else if (itemTemplate(); as template) {
                <ng-container
                  [ngTemplateOutlet]="template"
                  [ngTemplateOutletContext]="{ $implicit: entry.item, side: side }"
                />
              } @else {
                <span slListboxLabel>{{ labelOf(entry.key) }}</span>
                @if (descriptionOf(entry.item); as description) {
                  <span slListboxDescription>{{ description }}</span>
                }
              }
            </ng-template>
            @if (isEmpty(side)) {
              <div slListboxEmpty>
                <div
                  data-part="empty"
                  data-part-empty=""
                  [attr.data-query]="typed(side) ? '' : null"
                >
                  <span slIcon
                    ><svg slGlyph [name]="typed(side) ? 'search-x' : 'inbox'"></svg
                  ></span>
                  {{ typed(side) ? t('noResults') : t('empty') }}
                </div>
              </div>
            }
            @if (side === 'source' && hasMore()) {
              <div slListboxLoader>{{ t('loading') }}</div>
            }
          </div>
          @if (side === 'target' && dropOffset() !== null) {
            <div
              data-part="drop-indicator"
              data-part-drop-indicator=""
              aria-hidden="true"
              [style.--_drop-offset]="dropOffset() + 'px'"
            ></div>
          }
        </div>
        @if (footerTemplate(); as footer) {
          <div data-part="pane-footer" data-part-pane-footer="">
            <ng-container
              [ngTemplateOutlet]="footer"
              [ngTemplateOutletContext]="{ $implicit: side }"
            />
          </div>
        }
      </div>
    </ng-template>
  `,
  styleUrl: '../../../styles/src/transfer/transfer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlTransfer), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlTransfer), multi: true },
  ],
  host: {
    'data-ui': 'transfer',
    'data-ui-transfer': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'writtenRole ?? "group"',
    '[attr.data-layout]': 'resolvedLayout()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-pane]': 'currentPane()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-required]': 'required() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[style.--slotted-transfer-rows]': 'resolvedRows()',
  },
})
export class SlTransfer<T = TransferItem> implements ControlValueAccessor, Validator {
  /* ── Inputs ───────────────────────────────────────────────────────── */

  /** The whole collection, both sides. */
  readonly items = input.required<readonly T[]>();
  readonly getKey = input<(item: T) => string>((item) => (item as TransferItem).key);
  readonly getLabel = input<(item: T) => string>((item) => (item as TransferItem).label);
  readonly getDescription = input<(item: T) => string | undefined>(
    (item) => (item as TransferItem).description,
  );
  readonly isItemDisabled = input<(item: T) => boolean>(
    (item) => (item as TransferItem).disabled === true,
  );
  /** Whether an item answers a query. Defaults to a locale-aware contains. */
  readonly filter = input<((item: T, query: string, side: TransferSide) => boolean) | undefined>(
    undefined,
  );

  /** The keys in the target; two-way, so a template may bind it directly. */
  readonly targetKeys = model<readonly string[] | undefined>(undefined);
  readonly defaultTargetKeys = input<readonly string[] | undefined>(undefined);
  readonly selectedKeys = model<readonly string[] | undefined>(undefined);
  readonly defaultSelectedKeys = input<readonly string[] | undefined>(undefined);
  readonly sourceQuery = model<string | undefined>(undefined);
  readonly defaultSourceQuery = input<string | undefined>(undefined);
  readonly targetQuery = model<string | undefined>(undefined);
  readonly defaultTargetQuery = input<string | undefined>(undefined);
  /** The pane shown in steps. */
  readonly pane = model<TransferSide | undefined>(undefined);
  readonly defaultPane = input<TransferSide | undefined>(undefined);

  readonly size = input<TransferSize | undefined>(undefined);
  readonly layout = input<TransferLayout | undefined>(undefined);
  readonly searchable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly selectAll = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly reorderable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly rows = input<number | undefined, number | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });
  readonly virtual = input(false, { transform: booleanAttribute });
  readonly itemSize = input<number | undefined, number | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });
  /** Options rendered either side of a windowed viewport. */
  readonly overscan = input<number | undefined, number | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly hasMore = input(false, { transform: booleanAttribute });
  /** Submits one hidden input per target key. */
  readonly name = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * panes' names, the controls, the counts and the announcements.
   */
  readonly messages = input<PartialMessages<TransferMessages> | undefined>(undefined);

  /* ── Outputs ──────────────────────────────────────────────────────── */

  /** Before the target moves, with the direction, the keys and the reason. */
  readonly targetKeysChangeRequest = output<TransferMoveRequest>();
  readonly selectedKeysChangeRequest = output<TransferSelectionRequest>();
  readonly sourceQueryChangeRequest = output<TransferQueryRequest>();
  readonly targetQueryChangeRequest = output<TransferQueryRequest>();
  readonly paneChangeRequest = output<TransferPaneRequest>();
  /** Asked when the source list reaches the end of what has been loaded. */
  readonly loadMore = output<void>();

  /* ── State ────────────────────────────────────────────────────────── */

  private readonly defaults = injectTransferDefaults();
  private readonly base = inject(SlTransferIdFactory).next();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  /** A role the consumer wrote is never replaced by the family's. */
  protected readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  protected readonly itemTemplate = contentChild(SlTransferItem, { read: TemplateRef });
  protected readonly footerTemplate = contentChild(SlTransferFooter, { read: TemplateRef });
  private readonly listboxes = viewChildren(SlListbox);

  protected readonly sides = SIDES;
  protected readonly pressReason = pressReason;

  /** The family's words in the language in force, with this transfer's `messages` laid over them. */
  protected readonly t = injectMessages(transferMessages, this.messages);
  /** What a keyboard drag between the panes says, in the language in force. */
  private readonly dragT = injectMessages(dragMessages);
  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  protected readonly innerSize = computed(() => INNER_SIZE[this.resolvedSize()]);
  protected readonly resolvedLayout = computed(() => this.layout() ?? this.defaults.layout);
  protected readonly resolvedSearchable = computed(
    () => this.searchable() ?? this.defaults.searchable,
  );
  protected readonly resolvedSelectAll = computed(
    () => this.selectAll() ?? this.defaults.selectAll,
  );
  protected readonly resolvedReorderable = computed(
    () => this.reorderable() ?? this.defaults.reorderable,
  );
  protected readonly resolvedRows = computed(() => this.rows() ?? this.defaults.rows);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isInvalid = computed(() => this.invalid());
  protected readonly frozen = computed(() => this.isDisabled() || this.readOnly());

  /** The committed values: the bound one, or the default. */
  readonly currentTargetKeys = computed(
    () => this.targetKeys() ?? this.defaultTargetKeys() ?? EMPTY,
  );
  readonly currentSelectedKeys = computed(
    () => this.selectedKeys() ?? this.defaultSelectedKeys() ?? EMPTY,
  );
  readonly currentSourceQuery = computed(
    () => this.sourceQuery() ?? this.defaultSourceQuery() ?? '',
  );
  readonly currentTargetQuery = computed(
    () => this.targetQuery() ?? this.defaultTargetQuery() ?? '',
  );
  readonly currentPane = computed<TransferSide>(
    () => this.pane() ?? this.defaultPane() ?? 'source',
  );

  private readonly byKey = computed(
    () => new Map(this.items().map((item) => [this.getKey()(item), item])),
  );
  private readonly allKeys = computed(() => this.items().map(this.getKey()));
  private readonly disabledKeys = computed(() => {
    const disabled = this.isItemDisabled();
    const key = this.getKey();
    return new Set(
      this.items()
        .filter((item) => disabled(item))
        .map(key),
    );
  });
  readonly partition = computed(() =>
    partitionKeys(this.allKeys(), this.currentTargetKeys(), this.resolvedReorderable()),
  );
  private readonly matcher = createFilter();

  protected readonly visible = computed<Record<TransferSide, readonly string[]>>(() => {
    const partition = this.partition();
    const byKey = this.byKey();
    const filter = this.filter();
    const getLabel = this.getLabel();
    const getDescription = this.getDescription();
    const pick = (side: TransferSide, typed: string) => {
      const query = typed.trim();
      if (query === '') return partition[side];
      return partition[side].filter((key) => {
        const item = byKey.get(key);
        if (item === undefined) return this.matcher.contains(key, query);
        if (filter) return filter(item, query, side);
        return (
          this.matcher.contains(getLabel(item), query) ||
          this.matcher.contains(getDescription(item) ?? '', query)
        );
      });
    };
    return {
      source: pick('source', this.currentSourceQuery()),
      target: pick('target', this.currentTargetQuery()),
    };
  });

  protected readonly entries = computed<Record<TransferSide, TransferEntry<T>[]>>(() => {
    const byKey = this.byKey();
    const visible = this.visible();
    const build = (side: TransferSide) =>
      visible[side].map((key) => ({ key, item: byKey.get(key) }));
    return { source: build('source'), target: build('target') };
  });

  protected entriesOf(side: TransferSide) {
    return this.entries()[side];
  }

  protected isEmpty(side: TransferSide) {
    return this.visible()[side].length === 0;
  }

  protected readonly entryKey = (entry: TransferEntry<T>) => entry.key;
  protected readonly entryLabel = (entry: TransferEntry<T>) => this.labelOf(entry.key);
  protected readonly entryDisabled = (entry: TransferEntry<T>) =>
    entry.item !== undefined && this.isItemDisabled()(entry.item);

  protected readonly canReorder = computed(
    () => this.resolvedReorderable() && this.currentTargetQuery().trim() === '',
  );

  protected readonly drag = signal<DragView>(NO_DRAG);
  protected readonly dragging = computed(() => new Set(this.drag().items));
  protected readonly dropOffset = signal<number | null>(null);

  constructor() {
    /* The APG keys a dual list adds, taken before the listbox's own. */
    const onKeyDown = (event: KeyboardEvent) => this.onListKeyDown(event);
    afterNextRender(() => {
      this.host.nativeElement.addEventListener('keydown', onKeyDown, true);
      this.createController();
    });
    this.destroyRef.onDestroy(() => {
      this.host.nativeElement.removeEventListener('keydown', onKeyDown, true);
      this.teardown?.();
    });

    afterEveryRender(() => {
      this.nameSelectAll();
      this.syncDraggables();
      const side = this.pendingFocus;
      if (side !== null) {
        this.pendingFocus = null;
        this.listboxOf(side)?.focus();
      }
      this.measureDropLine();
    });
  }

  /* ── Reading ──────────────────────────────────────────────────────── */

  protected title(side: TransferSide) {
    return side === 'target' ? this.t('target') : this.t('source');
  }

  protected titleId(side: TransferSide) {
    return `${this.base}-${side}-title`;
  }

  protected labelOf(key: string) {
    const item = this.byKey().get(key);
    return item === undefined ? key : this.getLabel()(item);
  }

  protected descriptionOf(item: T) {
    return this.getDescription()(item);
  }

  protected queryOf(side: TransferSide) {
    return side === 'source' ? this.currentSourceQuery() : this.currentTargetQuery();
  }

  protected typed(side: TransferSide) {
    return this.queryOf(side).trim() !== '';
  }

  protected enabledVisible(side: TransferSide) {
    const disabled = this.disabledKeys();
    return this.visible()[side].filter((key) => !disabled.has(key));
  }

  protected selectionFor(side: TransferSide): readonly string[] {
    const selected = new Set(this.currentSelectedKeys());
    return this.visible()[side].filter((key) => selected.has(key));
  }

  protected selectedToMove(side: TransferSide) {
    return keysToMove({
      visible: this.visible()[side],
      selected: this.currentSelectedKeys(),
      disabled: this.disabledKeys(),
      active: null,
    });
  }

  protected selectAllState(side: TransferSide): 'none' | 'some' | 'all' {
    const reach = this.enabledVisible(side);
    const selected = new Set(this.currentSelectedKeys());
    const chosen = reach.filter((key) => selected.has(key)).length;
    if (chosen === 0) return 'none';
    return chosen === reach.length ? 'all' : 'some';
  }

  protected countText(side: TransferSide) {
    const keys = this.partition()[side];
    if (this.typed(side)) {
      return this.t('countFiltered', { shown: this.visible()[side].length, total: keys.length });
    }
    const selected = new Set(this.currentSelectedKeys());
    const chosen = keys.filter((key) => selected.has(key)).length;
    return chosen > 0
      ? this.t('countSelected', { selected: chosen, total: keys.length })
      : this.t('count', { total: keys.length });
  }

  protected paneCount(side: TransferSide) {
    return this.t('paneCount', {
      pane: this.title(side),
      total: this.partition()[side].length,
    });
  }

  protected dropTarget(side: TransferSide) {
    const drag = this.drag();
    return drag.over === side && (drag.from !== side || side === 'target');
  }

  private listboxOf(side: TransferSide): SlListbox | undefined {
    return this.listboxes()[side === 'source' ? 0 : 1];
  }

  private listOf(side: TransferSide): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(
      `[data-part="pane"][data-side="${side}"] > [data-part="list"]`,
    );
  }

  /**
   * The option the keyboard is on: the option holding focus under the roving
   * model, where Tab lands on the tab stop without the listbox calling it
   * active, and the listbox's active option under `aria-activedescendant`,
   * where focus is on the listbox itself.
   */
  private activeIn(side: TransferSide): string | null {
    const list = this.listOf(side);
    const focused = list?.ownerDocument.activeElement;
    if (list && focused instanceof HTMLElement && list.contains(focused)) {
      const key = focused.closest<HTMLElement>('[data-part="option"]')?.dataset['key'];
      if (key !== undefined) return key;
    }
    return this.listboxOf(side)?.getActiveKey() ?? null;
  }

  private announce(message: string) {
    if (message !== '') getLiveAnnouncer(this.host.nativeElement.ownerDocument).announce(message);
  }

  /* ── Requests ─────────────────────────────────────────────────────── */

  private pendingFocus: TransferSide | null = null;

  /**
   * Which option the keyboard is on in each list. The family holds it rather
   * than each listbox, because a move has to say where the keyboard goes next:
   * the APG example sends it to the first option after the moved ones that is
   * still in the list, and the listbox cannot know which of its options left
   * on purpose.
   */
  private readonly actives = signal<Record<TransferSide, string | null>>({
    source: null,
    target: null,
  });

  /* A key that left the list is no tab stop: the list would be unreachable by Tab. */
  protected activeOf(side: TransferSide) {
    const key = this.actives()[side];
    return key !== null && this.visible()[side].includes(key) ? key : null;
  }

  protected setActive(side: TransferSide, key: string | null) {
    if (this.actives()[side] === key) return;
    this.actives.update((current) => ({ ...current, [side]: key }));
  }

  /* Tab lands on the option holding the tab stop, and the keyboard is on it from then on. */
  protected onListFocus(side: TransferSide, event: FocusEvent) {
    const key = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-part="option"]')
      ?.dataset['key'];
    if (key !== undefined) this.setActive(side, key);
  }

  private requestTarget(
    next: readonly string[],
    reason: TransferMoveReason,
    source: unknown,
    extra: Pick<TransferMoveRequest, 'direction' | 'keys'>,
  ) {
    const previous = this.currentTargetKeys();
    if (sameKeys(previous, next)) return false;
    const request = makeRequest(next, previous, reason, source, extra) as TransferMoveRequest;
    this.targetKeysChangeRequest.emit(request);
    if (request.cancelled) return false;
    this.targetKeys.set(next);
    this.onChangeFn(next);
    this.onTouchedFn();
    return true;
  }

  private requestSelected(
    next: readonly string[],
    reason: TransferSelectionReason,
    source: unknown,
  ) {
    const previous = this.currentSelectedKeys();
    if (sameKeys(previous, next)) return;
    const request = makeRequest(next, previous, reason, source, {}) as TransferSelectionRequest;
    this.selectedKeysChangeRequest.emit(request);
    if (!request.cancelled) this.selectedKeys.set(next);
  }

  protected move(
    keys: readonly string[],
    to: TransferSide,
    reason: TransferMoveReason,
    source?: unknown,
    index?: number,
  ) {
    if (this.frozen() || keys.length === 0) return;
    const from: TransferSide = to === 'target' ? 'source' : 'target';
    const next = moveKeys({
      allKeys: this.allKeys(),
      targetKeys: this.currentTargetKeys(),
      keys,
      to,
      reorderable: this.resolvedReorderable(),
      index,
    });
    const visibleBefore = this.visible()[from];
    if (!this.requestTarget(next, reason, source, { direction: to, keys })) return;
    const moving = new Set(keys);
    this.requestSelected(
      this.currentSelectedKeys().filter((key) => !moving.has(key)),
      reason,
      source,
    );
    const pane = this.title(to);
    this.announce(
      keys.length === 1
        ? this.t('movedOne', { item: this.labelOf(keys[0]!), pane })
        : this.t('moved', { count: keys.length, pane }),
    );
    const list = this.listOf(from);
    if (!list?.contains(list.ownerDocument.activeElement)) return;
    /* The keyboard stays in the list it moved from, on the first option after
       the moved ones that is still there, then on the last one before them;
       a list left empty hands it to the other. */
    const first = visibleBefore.findIndex((key) => moving.has(key));
    const after = first === -1 ? [] : visibleBefore.slice(first);
    const before = first === -1 ? visibleBefore : visibleBefore.slice(0, first);
    const disabled = this.disabledKeys();
    const stays = (key: string) => !moving.has(key) && !disabled.has(key);
    const neighbour = after.find(stays) ?? [...before].reverse().find(stays) ?? null;
    if (neighbour === null) {
      this.pendingFocus = to;
      return;
    }
    this.setActive(from, neighbour);
    this.pendingFocus = from;
  }

  private reorder(
    keys: readonly string[],
    next: readonly string[],
    reason: TransferMoveReason,
    source?: unknown,
  ) {
    if (this.frozen() || keys.length === 0 || sameKeys(next, this.partition().target)) return;
    if (!this.requestTarget(next, reason, source, { direction: 'reorder', keys })) return;
    this.announce(
      this.t('reordered', {
        item: this.labelOf(keys[0]!),
        position: next.indexOf(keys[0]!) + 1,
      }),
    );
    const list = this.listOf('target');
    if (!list?.contains(list.ownerDocument.activeElement)) return;
    const held = this.activeIn('target');
    if (held !== null) this.setActive('target', held);
    this.pendingFocus = 'target';
  }

  protected shift(delta: -1 | 1, reason: TransferMoveReason, source: unknown, withActive: boolean) {
    if (!this.canReorder()) return;
    const keys = keysToMove({
      visible: this.visible().target,
      selected: this.currentSelectedKeys(),
      disabled: this.disabledKeys(),
      active: withActive ? this.activeIn('target') : null,
    });
    this.reorder(keys, reorderKeys(this.partition().target, keys, delta), reason, source);
  }

  protected onPaneSelection(side: TransferSide, request: ListboxChangeRequest) {
    const value = request.value;
    const chosen = Array.isArray(value) ? value : value === null ? [] : [value as string];
    const shown = new Set(this.visible()[side]);
    const next = [...this.currentSelectedKeys().filter((key) => !shown.has(key)), ...chosen];
    const reason = request.reason;
    const mapped: TransferSelectionReason =
      reason === 'pointer' || reason === 'keyboard' || reason === 'programmatic'
        ? reason
        : 'select';
    this.requestSelected(next, mapped, request.source);
  }

  protected onSelectAll(side: TransferSide, request: ChangeRequest<boolean>) {
    this.requestSelected(
      toggleVisibleSelection(
        this.currentSelectedKeys(),
        this.visible()[side],
        this.disabledKeys(),
        request.value,
      ),
      'select',
      request.source,
    );
  }

  protected onQuery(side: TransferSide, change: ChangeRequest<string>) {
    const reason: TransferQueryReason = change.reason === 'clear' ? 'clear' : 'keyboard';
    const previous = this.queryOf(side);
    if (previous === change.value) return;
    const request = makeRequest(
      change.value,
      previous,
      reason,
      change.source,
      {},
    ) as TransferQueryRequest;
    if (side === 'source') this.sourceQueryChangeRequest.emit(request);
    else this.targetQueryChangeRequest.emit(request);
    if (request.cancelled) return;
    if (side === 'source') this.sourceQuery.set(change.value);
    else this.targetQuery.set(change.value);
  }

  protected onSwitch(change: ChangeRequest<string | undefined>) {
    const next = change.value as TransferSide | undefined;
    if (next === undefined || next === this.currentPane()) return;
    const reason: TransferPaneReason = change.reason === 'keyboard' ? 'keyboard' : 'pointer';
    const request = makeRequest(
      next,
      this.currentPane(),
      reason,
      change.source,
      {},
    ) as TransferPaneRequest;
    this.paneChangeRequest.emit(request);
    if (!request.cancelled) this.pane.set(next);
  }

  private onListKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || this.frozen()) return;
    const target = event.target as Element | null;
    const list = target?.closest<HTMLElement>('[data-part="list"][data-side]');
    if (!list || !this.host.nativeElement.contains(list)) return;
    const side = list.dataset['side'] as TransferSide;
    const other: TransferSide = side === 'source' ? 'target' : 'source';
    const pick = () =>
      keysToMove({
        visible: this.visible()[side],
        selected: this.currentSelectedKeys(),
        disabled: this.disabledKeys(),
        active: this.activeIn(side),
      });
    const modifier = event.ctrlKey || event.metaKey;
    const element = this.host.nativeElement;
    const rtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
    const end = rtl ? 'ArrowLeft' : 'ArrowRight';
    const start = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === 'Enter' && !modifier && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      this.move(pick(), other, 'keyboard', event);
    } else if (side === 'target' && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault();
      this.move(pick(), 'source', 'keyboard', event);
    } else if (modifier && !event.altKey && (event.key === end || event.key === start)) {
      const to: TransferSide = event.key === end ? 'target' : 'source';
      event.preventDefault();
      if (to !== side) this.move(pick(), to, 'keyboard', event);
    } else if (
      side === 'target' &&
      event.altKey &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      event.preventDefault();
      this.shift(event.key === 'ArrowUp' ? -1 : 1, 'keyboard', event, true);
    }
  }

  /**
   * The select-all box is named on its input. The checkbox family takes its
   * name from its label and has no input for one, and a label holding a
   * visually hidden sentence would take the box's width and halo with it; the
   * empty label is the case that family already draws.
   */
  private nameSelectAll() {
    for (const side of SIDES) {
      const control = this.host.nativeElement.querySelector<HTMLInputElement>(
        `[data-part="pane"][data-side="${side}"] [data-part="select-all"] input`,
      );
      const name = this.t('selectAll', { pane: this.title(side) });
      if (control && control.getAttribute('aria-label') !== name) {
        control.setAttribute('aria-label', name);
      }
    }
  }

  /* ── The handle ───────────────────────────────────────────────────── */

  /** Moves focus into a pane's list; the source's when no side is named. */
  focus(side: TransferSide = 'source') {
    this.listboxOf(side)?.focus();
  }

  /** Reveals an item in whichever pane holds it. */
  scrollToKey(key: string) {
    const side: TransferSide = this.partition().target.includes(key) ? 'target' : 'source';
    this.listboxOf(side)?.scrollToKey(key);
  }

  /* ── The drag ─────────────────────────────────────────────────────── */

  private controller: DragController | null = null;
  private teardown: (() => void) | null = null;
  private readonly draggables = new Map<HTMLElement, () => void>();

  private createController() {
    const root = this.host.nativeElement;
    const listboxIn = (side: TransferSide) =>
      root.querySelector<HTMLElement>(
        `[data-part="pane"][data-side="${side}"] [data-ui="listbox"]`,
      );
    const created = createDragController({
      document: root.ownerDocument,
      preview: false,
      restoreFocus: false,
      autoScroll: { axis: 'y' },
      t: this.dragT,
      /* The move says what happened once, in the family's own words. */
      silent: ['moved', 'dropped'],
      onDrop: ({ items: carried, source, target, reason, event }) => {
        const from = source.container as TransferSide;
        const to = target.container as TransferSide;
        const why: TransferMoveReason = reason === 'keyboard' ? 'keyboard' : 'pointer';
        const shown = this.visible().target;
        const full = this.partition().target;
        const indexInTarget = () => {
          if (target.kind !== 'between') return full.length;
          const anchor = shown[target.index];
          if (anchor !== undefined) return full.indexOf(anchor);
          const last = shown[shown.length - 1];
          return last === undefined ? full.length : full.indexOf(last) + 1;
        };
        if (from !== to) {
          this.move(carried, to, why, event, to === 'target' ? indexInTarget() : undefined);
        } else if (to === 'target') {
          this.reorder(carried, reorderKeysTo(full, carried, indexInTarget()), why, event);
        }
      },
    });
    const unregister = SIDES.map((side) =>
      created.registerContainer({
        key: side,
        items: () => this.visible()[side],
        orientation: 'vertical',
        element: () => listboxIn(side),
        itemElement: (key) =>
          listboxIn(side)?.querySelector(`[data-part="option"][data-key="${escapeValue(key)}"]`) ??
          null,
        accepts: (state, target) => {
          if (state.source?.container !== target.container) return true;
          return target.container === 'target' && this.canReorder();
        },
        disabled: () => this.frozen(),
        label: () => this.title(side),
        itemLabel: (key) => this.labelOf(key),
      }),
    );
    /* The click the browser fires after a pointer drag is the drag's, not a
       press on the option: with the pointer captured it lands on the option
       that was carried and would toggle its selection. */
    let swallow = false;
    let wasDragging: 'pointer' | 'other' | null = null;
    const onClick = (event: Event) => {
      if (!swallow) return;
      swallow = false;
      event.preventDefault();
      event.stopPropagation();
    };
    root.addEventListener('click', onClick, true);
    const unsubscribe = created.subscribe((next) => {
      if (next.status !== 'dragging') {
        if (wasDragging === 'pointer') {
          swallow = true;
          window.setTimeout(() => {
            swallow = false;
          }, 0);
        }
        wasDragging = null;
        this.drag.set(NO_DRAG);
        return;
      }
      wasDragging = next.reason === 'pointer' ? 'pointer' : 'other';
      const target = next.target;
      this.drag.set({
        items: next.items,
        from: (next.source?.container as TransferSide | undefined) ?? null,
        over: target && next.valid ? (target.container as TransferSide) : null,
        index: target && target.kind === 'between' && next.valid ? target.index : null,
      });
    });
    this.controller = created;
    this.teardown = () => {
      root.removeEventListener('click', onClick, true);
      unsubscribe();
      for (const off of unregister) off();
      created.destroy();
      this.controller = null;
      for (const detach of this.draggables.values()) detach();
      this.draggables.clear();
    };
    this.syncDraggables();
  }

  /* Every option is a draggable, and carries its pane's selection when it is in it. */
  private syncDraggables() {
    const created = this.controller;
    if (!created) return;
    const root = this.host.nativeElement;
    const seen = new Set<HTMLElement>();
    for (const side of SIDES) {
      const nodes = root.querySelectorAll<HTMLElement>(
        `[data-part="pane"][data-side="${side}"] [data-part="option"][data-key]`,
      );
      for (const node of nodes) {
        seen.add(node);
        if (this.draggables.has(node)) continue;
        const key = node.dataset['key']!;
        const detach = created.attachDraggable(node, {
          container: side,
          key,
          items: () => {
            const carried = this.selectedToMove(side);
            return carried.includes(key) ? carried : [key];
          },
          disabled: () => this.frozen() || this.disabledKeys().has(key),
          distance: 4,
        });
        this.draggables.set(node, detach);
      }
    }
    for (const [node, detach] of this.draggables) {
      if (seen.has(node)) continue;
      detach();
      this.draggables.delete(node);
    }
  }

  /* The drop line stands between two options, where script alone can measure. */
  private measureDropLine() {
    const drag = this.drag();
    const shows = drag.over === 'target' && drag.index !== null && this.resolvedReorderable();
    if (!shows || drag.index === null) {
      if (this.dropOffset() !== null) this.dropOffset.set(null);
      return;
    }
    const list = this.listOf('target');
    const listbox = list?.querySelector('[data-ui="listbox"]');
    if (!list || !listbox) return;
    const options = listbox.querySelectorAll<HTMLElement>('[data-part="option"]');
    const frame = list.getBoundingClientRect().top;
    const at = options[drag.index];
    const last = options[options.length - 1];
    const edge = at
      ? at.getBoundingClientRect().top
      : last
        ? last.getBoundingClientRect().bottom
        : listbox.getBoundingClientRect().top;
    const offset = Math.round(edge - frame);
    if (this.dropOffset() !== offset) this.dropOffset.set(offset);
  }

  /* ── Forms ────────────────────────────────────────────────────────── */

  private onChangeFn: (value: readonly string[]) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(value: readonly string[] | null | undefined) {
    this.targetKeys.set(value ?? EMPTY);
  }

  registerOnChange(fn: (value: readonly string[]) => void) {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(disabled: boolean) {
    this.formDisabled.set(disabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.required()) return null;
    const value = control.value as readonly string[] | null | undefined;
    return (value ?? EMPTY).length === 0 ? { required: true } : null;
  }
}
