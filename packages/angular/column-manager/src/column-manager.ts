import { writeSelectorKey } from '@slotted/core/selector-key';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterEveryRender,
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  Renderer2,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlDrawer } from '@slotted/angular/drawer';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import type { MenuSelectEvent } from '@slotted/angular/menu';
import { SlPopover, SlPopoverContent, SlPopoverLayer } from '@slotted/angular/popover';
import { SlTextField, SlTextFieldInput, SlTextFieldStart } from '@slotted/angular/text-field';
import { createDragController, type DragController, type DragState } from '@slotted/core/drag';
import {
  columnStateChanges,
  normalizeColumnState,
  withColumnHidden,
  withColumnMoved,
  withColumnPinned,
  type GridColumn,
  type GridColumnState,
  type GridOutOfSpace,
  type GridPinZone,
} from '@slotted/core/grid';
import {
  columnManagerMessages,
  dragMessages,
  type ColumnManagerMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable, type ChangeRequest } from '@slotted/core/state';

import {
  injectColumnManagerDefaults,
  SlColumnManagerIdFactory,
  type ColumnManagerApply,
  type ColumnManagerColumnReason,
  type ColumnManagerOpenReason,
  type ColumnManagerPresentation,
  type ColumnManagerRequest,
} from './column-manager-defaults';

type ZoneKey = 'start' | 'middle' | 'end';
const ZONE_KEYS: readonly ZoneKey[] = ['start', 'middle', 'end'];
/** No column taken out for room: the grid's set before its frame is measured. */
const NONE_OUT: GridOutOfSpace = { popin: [], hidden: [] };

/** The three pin zones over the normalised order, every column in one of them. */
export function columnZones(state: GridColumnState): Record<ZoneKey, readonly string[]> {
  const start = state.pinned.start.filter((id) => state.order.includes(id));
  const end = state.pinned.end.filter((id) => state.order.includes(id));
  const middle = state.order.filter((id) => !start.includes(id) && !end.includes(id));
  return { start, middle, end };
}

// language: pt-BR
/** Case and accents fall away, so `Região` is found by `regiao`. */
// language: en-US
export function searchKey(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function sameState(a: GridColumnState, b: GridColumnState): boolean {
  return columnStateChanges(a, b).length === 0;
}

/** A click with no coordinates is a key. */
function pressReason(event: MouseEvent): 'pointer' | 'keyboard' {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

function escapeValue(value: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value.replace(/["\\]/g, '\\$&');
}

interface DragView {
  dragging: string | null;
  container: ZoneKey | null;
  index: number | null;
}

const NO_DRAG: DragView = { dragging: null, container: null, index: null };

interface ItemView {
  id: string;
  column: GridColumn<unknown>;
  hidden: boolean;
  locked: boolean;
  lastVisible: boolean;
  bySpace: boolean;
  handleDisabled: boolean;
  status: string | null;
  zone: GridPinZone;
  /** The index in the whole zone, which the drop line is placed by. */
  index: number;
}

interface SectionView {
  key: ZoneKey;
  label: string;
  items: ItemView[];
  /** Drop line after the last item. */
  dropAtEnd: boolean;
}

/**
 * Writes this family's part name on a control another family's directive
 * owns. `slButton` writes `data-part="root"` as a static host attribute and
 * `slMenuTriggerFor` binds `[attr.data-part]` to `null` on a trigger that is
 * neither a bar's item nor a submenu's; either erases the part the template
 * wrote, so it is written back after the first render.
 */
@Directive({ selector: '[slColumnManagerPart]', standalone: true })
export class SlColumnManagerPart {
  readonly part = input.required<string>({ alias: 'slColumnManagerPart' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => writeSelectorKey(this.host.nativeElement, 'part', this.part()));
  }
}

/**
 * The panel that edits a grid's column state: which columns are shown, in
 * which order, pinned to which edge. It does not know the grid: it is given
 * the columns, the state and the set the grid hid for room, and asks for every
 * change with a request carrying the reason and the keys that moved.
 *
 * The host renders nothing of its own (`display: contents`); the root is the
 * popover's one child, the drawer's content, or stands in place.
 */
@Component({
  selector: 'sl-column-manager',
  standalone: true,
  exportAs: 'slColumnManager',
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlCheckbox,
    SlCheckboxDescription,
    SlColumnManagerPart,
    SlDrawer,
    SlGlyph,
    SlIcon,
    SlMenu,
    SlMenuItem,
    SlMenuTrigger,
    SlPopover,
    SlPopoverContent,
    SlPopoverLayer,
    SlTextField,
    SlTextFieldInput,
    SlTextFieldStart,
  ],
  template: `
    @switch (resolvedPresentation()) {
      @case ('popover') {
        <ng-container
          slPopover
          size="lg"
          side="bottom"
          align="start"
          initialFocus="[data-part='search'] input"
          [open]="open()"
          (openChangeRequest)="onLayerRequest($event)"
        >
          <ng-template slPopoverLayer>
            <div slPopoverContent [attr.aria-labelledby]="titleId">
              <ng-container [ngTemplateOutlet]="panel" />
            </div>
          </ng-template>
        </ng-container>
      }
      @case ('drawer') {
        <sl-drawer
          side="end"
          size="sm"
          [open]="open()"
          [finalFocus]="triggerNode() ?? false"
          (openChangeRequest)="onLayerRequest($event)"
        >
          <ng-container [ngTemplateOutlet]="panel" />
        </sl-drawer>
      }
      @default {
        <ng-container [ngTemplateOutlet]="panel" />
      }
    }

    <ng-template #panel>
      <div
        #root
        data-ui="column-manager"
        data-ui-column-manager=""
        data-part="root"
        data-part-root=""
        role="group"
        [attr.id]="rootId"
        [attr.aria-labelledby]="titleId"
        [attr.data-presentation]="resolvedPresentation()"
        [attr.data-apply]="resolvedApply()"
      >
        <div data-part="header" data-part-header="">
          <h2 data-part="title" data-part-title="" [attr.id]="titleId">{{ t('title') }}</h2>
          <span data-part="summary" data-part-summary="">{{ summary() }}</span>
        </div>
        <div data-part="search" data-part-search="">
          <div slTextField size="sm" [clearable]="true">
            <span slTextFieldStart
              ><span slIcon><svg slGlyph name="search"></svg></span
            ></span>
            <input
              slTextFieldInput
              type="search"
              [value]="query()"
              [attr.aria-label]="t('search')"
              [attr.placeholder]="t('search')"
              (valueChange)="query.set($event.value)"
            />
          </div>
        </div>
        <div data-part="list" data-part-list="">
          @if (sections().length === 0 && searching()) {
            <div data-part="empty" data-part-empty="" role="status">{{ t('noResults') }}</div>
          }
          @for (section of sections(); track section.key) {
            <div
              data-part="section"
              data-part-section=""
              role="group"
              [attr.data-zone]="section.key"
              [attr.aria-labelledby]="rootId + '-' + section.key"
              [attr.data-sole]="sections().length === 1 ? '' : null"
              [attr.data-drop-target]="
                drag().container === section.key && drag().index !== null ? '' : null
              "
            >
              <div
                data-part="section-label"
                data-part-section-label=""
                [attr.id]="rootId + '-' + section.key"
              >
                {{ section.label }}
              </div>
              @for (item of section.items; track item.id) {
                @if (dropAt(section.key, item.index)) {
                  <div
                    data-part="drop-indicator"
                    data-part-drop-indicator=""
                    aria-hidden="true"
                  ></div>
                }
                <div
                  data-part="item"
                  data-part-item=""
                  [attr.data-column]="item.id"
                  [attr.data-hidden]="item.hidden ? '' : null"
                  [attr.data-locked]="item.locked ? '' : null"
                  [attr.data-space-hidden]="item.bySpace ? '' : null"
                  [attr.data-pinned]="item.zone"
                  [attr.data-dragging]="drag().dragging === item.id ? '' : null"
                >
                  <button
                    data-part="handle"
                    data-part-handle=""
                    type="button"
                    [attr.aria-label]="t('reorder', { column: item.column.label })"
                    [attr.aria-disabled]="item.handleDisabled ? 'true' : null"
                    [attr.data-disabled]="item.handleDisabled ? '' : null"
                    (keydown)="onHandleKeyDown($event, item.id, section.key)"
                  >
                    <span slIcon size="sm"><svg slGlyph name="grip-vertical"></svg></span>
                  </button>
                  <div data-part="visibility" data-part-visibility="">
                    <div
                      slCheckbox
                      [checked]="!item.hidden"
                      [disabled]="(item.locked && !item.hidden) || item.lastVisible"
                      (checkedChange)="toggle(item.id, $event)"
                    >
                      {{ item.column.label }}
                      @if (item.status) {
                        <span data-part="status" data-part-status="">{{ item.status }}</span>
                      }
                      @if (item.column.description) {
                        <p slCheckboxDescription>{{ item.column.description }}</p>
                      }
                    </div>
                  </div>
                  <button
                    type="button"
                    slColumnManagerPart="pin"
                    data-part="pin"
                    data-part-pin=""
                    [slMenuTriggerFor]="pinMenu"
                    [attr.aria-label]="t('pin', { column: item.column.label })"
                    [attr.data-pinned]="item.zone ? '' : null"
                  >
                    <span slIcon size="sm"><svg slGlyph name="pin"></svg></span>
                  </button>
                  <sl-menu #pinMenu size="sm">
                    <button
                      slMenuItem
                      [disabled]="item.zone === 'start'"
                      (select)="pin(item.id, 'start', $event)"
                    >
                      {{ t('pinStart') }}
                    </button>
                    <button
                      slMenuItem
                      [disabled]="item.zone === 'end'"
                      (select)="pin(item.id, 'end', $event)"
                    >
                      {{ t('pinEnd') }}
                    </button>
                    @if (item.zone) {
                      <button slMenuItem (select)="pin(item.id, null, $event)">
                        {{ t('unpin') }}
                      </button>
                    }
                  </sl-menu>
                </div>
              }
              @if (section.dropAtEnd) {
                <div
                  data-part="drop-indicator"
                  data-part-drop-indicator=""
                  aria-hidden="true"
                ></div>
              }
            </div>
          }
        </div>
        <div data-part="footer" data-part-footer="">
          <button
            slButton
            slColumnManagerPart="show-all"
            size="sm"
            tone="secondary"
            variant="ghost"
            type="button"
            [disabled]="working().hidden.length === 0"
            (click)="showAll($event)"
          >
            {{ t('showAll') }}
          </button>
          <button
            slButton
            slColumnManagerPart="reset"
            size="sm"
            tone="secondary"
            variant="ghost"
            type="button"
            [disabled]="atDefault()"
            (click)="reset($event)"
          >
            {{ t('reset') }}
          </button>
          @if (confirm()) {
            <button
              slButton
              slColumnManagerPart="cancel"
              size="sm"
              tone="secondary"
              variant="outline"
              type="button"
              (click)="cancel($event)"
            >
              {{ t('cancel') }}
            </button>
            <button
              slButton
              slColumnManagerPart="apply"
              size="sm"
              type="button"
              [disabled]="!dirty()"
              (click)="applyDraft($event)"
            >
              {{ t('apply') }}
            </button>
          }
        </div>
      </div>
    </ng-template>
  `,
  styleUrl: '../../../styles/src/column-manager/column-manager.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[style.display]': "'contents'" },
})
export class SlColumnManager {
  /** The grid's columns, as the grid is given them. */
  readonly columns = input.required<readonly GridColumn<never>[]>();
  /** The state; two-way, so a template may bind it directly. */
  readonly columnState = model<GridColumnState | undefined>(undefined);
  /** The start while nothing is bound, and the target of Restore defaults. */
  readonly defaultColumnState = input<Partial<GridColumnState> | undefined>(undefined);
  /**
   * The columns the grid took out for room — the grid's `outOfSpace()`:
   * listed with a status, never written to the state.
   */
  readonly outOfSpace = input<GridOutOfSpace>(NONE_OUT);
  readonly presentation = input<ColumnManagerPresentation | undefined>(undefined);
  readonly apply = input<ColumnManagerApply | undefined>(undefined);
  readonly open = model<boolean>(false);
  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<ColumnManagerMessages> | undefined>(undefined);

  /** Before the state moves, with the reason and every key that moved. */
  readonly columnStateChangeRequest = output<ColumnManagerRequest>();
  /** Before the layer opens or closes, with the reason. */
  readonly openChangeRequest = output<ChangeRequest<boolean>>();

  private readonly defaults = injectColumnManagerDefaults();
  private readonly base = inject(SlColumnManagerIdFactory).next();
  readonly rootId = `${this.base}-panel`;
  readonly titleId = `${this.base}-title`;

  /** The family's words in the language in force, with this manager's `messages` laid over them. */
  readonly t = injectMessages(columnManagerMessages, this.messages);
  /** What a drag of a column says, in the language in force. */
  private readonly dragT = injectMessages(dragMessages);
  readonly resolvedPresentation = computed(() => this.presentation() ?? this.defaults.presentation);
  readonly resolvedApply = computed(() => this.apply() ?? this.defaults.apply);
  protected readonly confirm = computed(() => this.resolvedApply() === 'confirm');

  private readonly normalizedDefault = computed(() =>
    normalizeColumnState(this.defaultColumnState(), this.columns()),
  );
  /** The committed state: the bound one, or the default. */
  readonly state = computed(() =>
    normalizeColumnState(this.columnState() ?? this.defaultColumnState(), this.columns()),
  );
  private readonly draft = signal<GridColumnState | null>(null);
  protected readonly working = computed(() =>
    this.confirm() ? (this.draft() ?? this.state()) : this.state(),
  );
  protected readonly dirty = computed(() => {
    const draft = this.draft();
    return draft !== null && !sameState(draft, this.state());
  });
  protected readonly atDefault = computed(() =>
    sameState(this.working(), this.normalizedDefault()),
  );

  /** How many columns the reader hid; the trigger's count. */
  readonly hiddenCount = computed(() => this.state().hidden.length);

  readonly query = signal('');
  private readonly searchText = computed(() => searchKey(this.query().trim()));
  protected readonly searching = computed(() => this.searchText() !== '');

  private readonly byId = computed(
    () => new Map(this.columns().map((column) => [column.id, column as GridColumn<unknown>])),
  );
  private readonly zones = computed(() => columnZones(this.working()));
  private readonly visibleCount = computed(() => {
    const hidden = new Set(this.working().hidden);
    return this.working().order.filter((id) => !hidden.has(id)).length;
  });
  protected readonly summary = computed(() =>
    this.t('visibleCount', {
      visible: this.visibleCount(),
      total: this.working().order.length,
    }),
  );

  protected readonly drag = signal<DragView>(NO_DRAG);

  protected readonly sections = computed<SectionView[]>(() => {
    const zones = this.zones();
    const byId = this.byId();
    const hidden = new Set(this.working().hidden);
    const space = new Set(this.outOfSpace().hidden);
    const inRow = new Set(this.outOfSpace().popin);
    const visible = this.visibleCount();
    const text = this.searchText();
    const searching = text !== '';
    const t = this.t;
    const labels = { start: t('pinnedStart'), middle: t('unpinned'), end: t('pinnedEnd') };
    return ZONE_KEYS.map((key) => {
      const items = zones[key]
        .map((id, index) => ({ id, index, column: byId.get(id) }))
        .filter(
          (entry): entry is { id: string; index: number; column: GridColumn<unknown> } =>
            entry.column !== undefined &&
            (!searching ||
              searchKey(entry.column.label).includes(text) ||
              searchKey(entry.column.description ?? '').includes(text)),
        )
        .map(({ id, index, column }) => {
          const isHidden = hidden.has(id);
          const locked = column.hideable === false;
          const bySpace = !isHidden && space.has(id);
          const shownInRow = !isHidden && inRow.has(id);
          return {
            id,
            column,
            index,
            hidden: isHidden,
            locked,
            lastVisible: !isHidden && visible <= 1,
            bySpace,
            handleDisabled: searching || column.reorderable === false,
            status: locked
              ? t('required')
              : bySpace
                ? t('hiddenBySpace')
                : shownInRow
                  ? t('inRow')
                  : null,
            zone: key === 'middle' ? null : key,
          } satisfies ItemView;
        });
      return {
        key,
        label: labels[key],
        items,
        dropAtEnd: this.dropAt(key, zones[key].length),
      };
    }).filter((section) => section.items.length > 0);
  });

  /* ── The trigger ─────────────────────────────────────────────────────── */

  readonly triggerNode = signal<HTMLElement | null>(null);
  private readonly popover = viewChild(SlPopover);

  /** Called by `slColumnManagerTrigger`. */
  registerTrigger(node: HTMLElement | null) {
    this.triggerNode.set(node);
  }

  /* ── The drag ────────────────────────────────────────────────────────── */

  private readonly root = viewChild<ElementRef<HTMLDivElement>>('root');
  private controller: DragController | null = null;
  private readonly draggables = new Map<string, { node: HTMLElement; detach: () => void }>();
  private pendingFocus: string | null = null;

  constructor() {
    /* The popover hangs from this family's trigger, and a press on it is not
       an outside press. */
    effect(() => {
      const popover = this.popover();
      const trigger = this.triggerNode();
      if (popover) untracked(() => popover.triggerNode.set(trigger));
    });

    /* A draft is read when the layer opens, and dropped when it closes. */
    effect(() => {
      if (!this.open()) {
        untracked(() => {
          this.draft.set(null);
          this.query.set('');
        });
      }
    });

    effect((onCleanup) => {
      const element = this.root()?.nativeElement;
      if (!element) return;
      const controller = untracked(() => this.createController(element));
      onCleanup(() => {
        controller.destroy();
        this.controller = null;
        for (const entry of this.draggables.values()) entry.detach();
        this.draggables.clear();
      });
    });

    afterEveryRender(() => {
      this.syncDraggables();
      const id = this.pendingFocus;
      const element = this.root()?.nativeElement;
      if (id && element) {
        this.pendingFocus = null;
        element
          .querySelector<HTMLElement>(
            `[data-part="item"][data-column="${escapeValue(id)}"] > [data-part="handle"]`,
          )
          ?.focus();
      }
    });

    inject(DestroyRef).onDestroy(() => this.controller?.destroy());
  }

  private createController(element: HTMLElement): DragController {
    const document = element.ownerDocument;
    const announce = (message: string) => {
      if (message !== '') getLiveAnnouncer(document).announce(message);
    };
    const itemOf = (id: string) =>
      element.querySelector<HTMLElement>(`[data-part="item"][data-column="${escapeValue(id)}"]`);
    const controller = createDragController({
      document,
      preview: false,
      restoreFocus: false,
      autoScroll: { axis: 'y' },
      announce,
      t: this.dragT,
      /* A one-step keyboard move says where the column landed once, below;
         the controller's own step-by-step position would say it twice. */
      silent: ['moved'],
      onDrop: ({ items, source, target, reason, event }) => {
        if (target.kind !== 'between' || target.container !== source.container) return;
        const zone = this.zones()[source.container as ZoneKey];
        const id = items[0]!;
        const to = target.index > source.index ? target.index - 1 : target.index;
        this.edit(
          withColumnMoved(this.working(), id, to, zone),
          reason === 'keyboard' ? 'keyboard' : 'pointer',
          event,
        );
        if (reason === 'keyboard') {
          this.pendingFocus = id;
          const label = this.byId().get(id)?.label ?? id;
          announce(this.t('moved', { column: label, position: to + 1 }));
        }
      },
    });
    for (const key of ZONE_KEYS) {
      controller.registerContainer({
        key,
        items: () => this.zones()[key],
        orientation: 'vertical',
        element: () => element.querySelector(`[data-part="section"][data-zone="${key}"]`),
        itemElement: itemOf,
        accepts: (state: DragState, target) => state.source?.container === target.container,
        disabled: () => this.searching(),
        itemLabel: (id) => this.byId().get(id)?.label ?? id,
      });
    }
    controller.subscribe((next) => {
      if (next.status !== 'dragging' || next.reason === 'keyboard') {
        this.drag.set(NO_DRAG);
        return;
      }
      const target = next.target;
      this.drag.set({
        dragging: next.items[0] ?? null,
        container: target && target.kind === 'between' ? (target.container as ZoneKey) : null,
        index: target && target.kind === 'between' && next.valid ? target.index : null,
      });
    });
    this.controller = controller;
    return controller;
  }

  /** Every item is a draggable whose press must start on its handle. */
  private syncDraggables() {
    const controller = this.controller;
    const element = this.root()?.nativeElement;
    if (!controller || !element) return;
    const seen = new Set<string>();
    for (const node of element.querySelectorAll<HTMLElement>('[data-part="item"][data-column]')) {
      const id = node.dataset['column']!;
      const key = node.closest<HTMLElement>('[data-part="section"]')?.dataset['zone'] ?? 'middle';
      seen.add(id);
      const existing = this.draggables.get(id);
      if (existing && existing.node === node && node.dataset['attachedZone'] === key) continue;
      existing?.detach();
      node.dataset['attachedZone'] = key;
      const detach = controller.attachDraggable(node, {
        container: key,
        key: id,
        handle: () => node.querySelector('[data-part="handle"]'),
        disabled: () => this.searching() || this.byId().get(id)?.reorderable === false,
        distance: 4,
      });
      this.draggables.set(id, { node, detach });
    }
    for (const [id, entry] of this.draggables) {
      if (seen.has(id)) continue;
      entry.detach();
      this.draggables.delete(id);
    }
  }

  protected dropAt(key: ZoneKey, index: number): boolean {
    const drag = this.drag();
    if (drag.container !== key || drag.index !== index || drag.dragging === null) return false;
    const from = this.zones()[key].indexOf(drag.dragging);
    return index !== from && index !== from + 1;
  }

  /* ── Requests ─────────────────────────────────────────────────────────── */

  private emit(next: GridColumnState, reason: ColumnManagerColumnReason, source?: unknown) {
    const previous = this.state();
    const changes = columnStateChanges(previous, next);
    if (changes.length === 0) return false;
    let cancelled = false;
    const request: ColumnManagerRequest = {
      value: next,
      previous,
      reason,
      source,
      change: changes[0]!,
      changes,
      get cancelled() {
        return cancelled;
      },
      cancel() {
        cancelled = true;
      },
    };
    this.columnStateChangeRequest.emit(request);
    if (cancelled) return false;
    this.columnState.set(next);
    return true;
  }

  private edit(next: GridColumnState, reason: ColumnManagerColumnReason, source?: unknown) {
    if (this.confirm()) this.draft.set(next);
    else this.emit(next, reason, source);
  }

  private setOpen(next: boolean, reason: ColumnManagerOpenReason, source?: unknown): boolean {
    if (next === this.open()) return false;
    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.open(),
      onRequest: (request) => {
        this.openChangeRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    state.request(next, reason, source);
    if (cancelled) return false;
    this.open.set(next);
    return true;
  }

  protected onLayerRequest(request: ChangeRequest<boolean>) {
    const moved = this.setOpen(
      request.value,
      request.reason as ColumnManagerOpenReason,
      request.source,
    );
    if (!moved) request.cancel();
  }

  protected toggle(id: string, request: ChangeRequest<boolean>) {
    this.edit(
      withColumnHidden(this.working(), id, !request.value),
      request.reason === 'keyboard' ? 'keyboard' : 'pointer',
      request.source,
    );
  }

  protected pin(id: string, zone: GridPinZone, event: MenuSelectEvent) {
    this.edit(withColumnPinned(this.working(), id, zone), event.reason, event.source);
  }

  protected showAll(event: MouseEvent) {
    this.edit({ ...this.working(), hidden: [] }, pressReason(event), event);
  }

  protected reset(event: MouseEvent) {
    this.edit(this.normalizedDefault(), 'clear', event);
  }

  protected applyDraft(event: MouseEvent) {
    const draft = this.draft();
    if (draft !== null) this.emit(draft, 'submit', event);
    this.draft.set(null);
    if (this.resolvedPresentation() !== 'inline') this.setOpen(false, pressReason(event), event);
  }

  protected cancel(event: MouseEvent) {
    this.draft.set(null);
    if (this.resolvedPresentation() !== 'inline') this.setOpen(false, pressReason(event), event);
  }

  protected onHandleKeyDown(event: KeyboardEvent, id: string, key: ZoneKey) {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    if (this.searching() || this.byId().get(id)?.reorderable === false) return;
    const zone = this.zones()[key];
    const index = zone.indexOf(id);
    const up = event.key === 'ArrowUp';
    if ((up && index <= 0) || (!up && index >= zone.length - 1)) return;
    this.controller?.moveBy({
      items: [id],
      source: { container: key, index },
      intent: up ? 'previous' : 'next',
      reason: 'keyboard',
      event,
    });
  }

  /* ── The imperative actions ──────────────────────────────────────────── */

  /** Opens the layer, with the reason `programmatic`. */
  show() {
    this.setOpen(true, 'programmatic');
  }

  /** Closes the layer, with the reason `programmatic`. */
  hide() {
    this.setOpen(false, 'programmatic');
  }

  /** Called by the trigger, with the reason of the press. */
  toggleOpen(reason: ColumnManagerOpenReason = 'programmatic', source?: unknown) {
    this.setOpen(!this.open(), reason, source);
  }
}

/**
 * The consumer's button, wired to a manager: the popup it opens, whether it
 * is open, what it controls, and the count of hidden columns after its words
 * — a chip on screen and a sentence in its accessible name. A directive
 * cannot project, so the two spans are appended to the host once and kept
 * current from the manager's count.
 */
@Directive({
  selector: '[slColumnManagerTrigger]',
  standalone: true,
  exportAs: 'slColumnManagerTrigger',
  host: {
    'aria-haspopup': 'dialog',
    'data-column-manager-trigger': '',
    '[attr.aria-expanded]': 'manager().open()',
    '[attr.aria-controls]': 'manager().open() ? manager().rootId : null',
    '[attr.data-open]': "manager().open() ? '' : null",
    '(click)': 'onClick($event)',
  },
})
export class SlColumnManagerTrigger {
  readonly manager = input.required<SlColumnManager>({ alias: 'slColumnManagerTriggerFor' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly count = signal<{ chip: HTMLElement; sentence: HTMLElement } | null>(null);

  constructor() {
    effect((onCleanup) => {
      const manager = this.manager();
      manager.registerTrigger(this.host);
      onCleanup(() => manager.registerTrigger(null));
    });

    /* `slButton` writes `data-part="root"` statically; the part is this family's. */
    afterNextRender(() => {
      writeSelectorKey(this.host, 'part', 'trigger');
      const chip = this.renderer.createElement('span') as HTMLElement;
      writeSelectorKey(chip, 'part', 'count');
      chip.setAttribute('aria-hidden', 'true');
      const sentence = this.renderer.createElement('span') as HTMLElement;
      writeSelectorKey(sentence, 'ui', 'visually-hidden');
      writeSelectorKey(sentence, 'part', 'root');
      this.count.set({ chip, sentence });
    });

    effect(() => {
      const nodes = this.count();
      if (!nodes) return;
      const manager = this.manager();
      const hidden = manager.hiddenCount();
      if (hidden === 0) {
        nodes.chip.remove();
        nodes.sentence.remove();
        return;
      }
      nodes.chip.textContent = String(hidden);
      nodes.sentence.textContent = manager.t('hiddenCount', { count: hidden });
      if (!nodes.chip.isConnected) {
        this.host.append(' ', nodes.chip, ' ', nodes.sentence);
      }
    });
  }

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.manager().toggleOpen(pressReason(event), event);
  }
}
