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
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  cascadeSelection,
  createFilter,
  createTreeCollection,
  indeterminateKeys,
  moveIndex,
  nextSelection,
  virtualWindow,
} from '@slotted/core/collection';
import type {
  MoveIntent,
  TreeCollection,
  TreeNode as TreeNodeData,
} from '@slotted/core/collection';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';

import { SlTreeContext } from './tree-context';
import { injectTreeDefaults, SlTreeIdFactory } from './tree-defaults';
import type {
  TreeAlignment,
  TreeExpandOn,
  TreeFocusMode,
  TreeSelectionBehavior,
  TreeSelectionCascade,
  TreeSelectionIndicator,
  TreeSelectionMode,
  TreeSize,
  TreeStructure,
  TreeVariant,
} from './tree-defaults';
import { NODE_SELECTOR, SlTreeGroup, SlTreeNode } from './tree-parts';

export type {
  TreeAlignment,
  TreeExpandOn,
  TreeFocusMode,
  TreeSelectionBehavior,
  TreeSelectionCascade,
  TreeSelectionIndicator,
  TreeSelectionMode,
  TreeSize,
  TreeStructure,
  TreeVariant,
} from './tree-defaults';

/**
 * What the tree holds: one key in `single` and `none`, a set of them in
 * `multiple`. The shape `listbox` settled, for the same reason.
 */
export type TreeValue = string | readonly string[] | null;

export type TreeChangeRequest = ChangeRequest<TreeValue>;
export type TreeExpansionRequest = ChangeRequest<readonly string[]>;
export type TreeActiveRequest = ChangeRequest<string | null>;

/** One visible row, as the DOM reports it at the moment a key was pressed. */
interface Row {
  key: string;
  depth: number;
  branch: boolean;
  disabled: boolean;
  label: string;
  element: HTMLElement;
}

/** One row of the render plan the template walks. */
interface PlanNode {
  key: string;
  item: unknown;
  label: string;
  level: number;
  disabled: boolean;
  branch: boolean;
  loading: boolean;
  match: 'hit' | 'ancestor' | undefined;
  /** Where a pinned row sits on the canvas, or `undefined` for one in flow. */
  offset: number | undefined;
  children: PlanNode[];
}

function toKeys(value: TreeValue | undefined): readonly string[] {
  if (value === undefined || value === null) return [];
  return typeof value === 'string' ? [value] : value;
}

function same(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/**
 * A hierarchy the reader opens, walks and chooses from.
 *
 * ── Where the visible list comes from ───────────────────────────────────
 *
 * From the DOM, in document order, which is the flattening a tree would
 * otherwise have to keep in step with the expanded set. A collapsed branch
 * renders no group and therefore contributes no rows, so what the keyboard
 * counts and what the reader sees cannot disagree.
 *
 * `nodes` is a second thing and not a replacement: it is the hierarchy the tree
 * holds, and it answers the three questions the DOM cannot — what is under a
 * branch that is closed, which a cascade needs; what every branch is, which
 * `expandAll` opens; and what matches a query, whose ancestors the filter
 * keeps.
 *
 * ── Three mutable values ────────────────────────────────────────────────
 *
 * The pattern is explicit that focus and selection are two: "DOM focus (the
 * active element) is functionally distinct from the selected state". Expansion
 * is the third and belongs to neither.
 */
@Component({
  selector: '[slTree]',
  standalone: true,
  exportAs: 'slTree',
  imports: [NgTemplateOutlet, SlTreeGroup, SlTreeNode],
  styleUrls: ['../../../styles/src/tree/tree.css', '../../../styles/src/highlight/highlight.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: SlTreeContext, useExisting: forwardRef(() => SlTree) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlTree), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlTree), multi: true },
  ],
  template: `<ul
      data-part="canvas"
      data-part-canvas=""
      role="tree"
      #canvas
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledBy()"
      [attr.aria-multiselectable]="selection() === 'multiple' ? 'true' : null"
      [attr.aria-activedescendant]="activeDescendant()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.aria-disabled]="treeDisabled() ? 'true' : null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.tabindex]="canvasTabIndex()"
      [style.--_canvas-size]="canvasSize()"
      [style.--_canvas-offset]="canvasOffset()"
      (keydown)="onKeyDown($event)"
      (focusin)="onFocusIn($event)"
    >
      @if (plan(); as rows) {
        @for (node of rows; track node.key) {
          <ng-container
            [ngTemplateOutlet]="nodeRow"
            [ngTemplateOutletContext]="{ $implicit: node }"
          />
        }
      }
      <ng-content />
    </ul>
    @if (holdsNothing()) {
      <ng-content select="[slTreeEmpty]" />
    }

    <ng-template #nodeRow let-node>
      <li
        slTreeNode
        [value]="node.key"
        [label]="node.label"
        [level]="node.level"
        [hasChildren]="node.branch"
        [disabled]="node.disabled"
        [loading]="node.loading"
        [match]="node.match"
        [textValue]="node.label"
        [pinned]="node.offset !== undefined"
        [offset]="node.offset"
      >
        @if (nodeContent(); as content) {
          <ng-container
            [ngTemplateOutlet]="content"
            [ngTemplateOutletContext]="{ $implicit: node.item, key: node.key }"
          />
        }
        @if (node.children.length > 0) {
          <ul slTreeGroup [busy]="node.loading">
            @for (child of node.children; track child.key) {
              <ng-container
                [ngTemplateOutlet]="nodeRow"
                [ngTemplateOutletContext]="{ $implicit: child }"
              />
            }
          </ul>
        }
      </li>
    </ng-template>`,
  host: {
    'data-ui': 'tree',
    'data-ui-tree': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-structure]': 'structureMode()',
    '[attr.data-indicator]': 'indicatorMode()',
    '[attr.data-expand-on]': 'expandOnRow()',
    '[attr.data-selection]': 'selection()',
    '[attr.data-focus-mode]': 'mode()',
    '[attr.data-guides]': 'showGuides() ? "true" : "false"',
    '[attr.data-disabled]': 'treeDisabled() ? "" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '[attr.data-invalid]': 'invalid() ? "" : null',
    '[attr.data-required]': 'required() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '(scroll)': 'onScroll()',
  },
})
export class SlTree implements SlTreeContext, ControlValueAccessor, Validator {
  /* ── The three values a reader moves ─────────────────────────────────── */

  readonly value = model<TreeValue>(null);
  readonly expandedKeys = model<readonly string[]>([]);
  readonly activeKey = model<string | null>(null);

  /** The request behind each move, carrying the reason a boolean cannot say. */
  readonly valueRequest = output<TreeChangeRequest>();
  readonly expandedKeysRequest = output<TreeExpansionRequest>();
  readonly activeKeyRequest = output<TreeActiveRequest>();
  /** A node was activated: pressed, or `Enter` on the keyboard. */
  readonly nodeActivate = output<{ key: string; reason: 'pointer' | 'keyboard' }>();

  /* ── The axes ────────────────────────────────────────────────────────── */

  private readonly defaults = injectTreeDefaults();

  readonly size = input<TreeSize>(this.defaults.size);
  readonly variant = input<TreeVariant>(this.defaults.variant);
  readonly structure = input<TreeStructure>(this.defaults.structure);
  readonly selectionMode = input<TreeSelectionMode>(this.defaults.selectionMode);
  readonly selectionBehavior = input<TreeSelectionBehavior>(this.defaults.selectionBehavior);
  readonly selectionIndicator = input<TreeSelectionIndicator>(this.defaults.selectionIndicator);
  readonly selectionCascade = input<TreeSelectionCascade>(this.defaults.selectionCascade);
  readonly expandOn = input<TreeExpandOn>(this.defaults.expandOn);
  readonly focusMode = input<TreeFocusMode>(this.defaults.focusMode);
  readonly guides = input(this.defaults.guides, { transform: booleanAttribute });
  readonly loop = input(this.defaults.loop, { transform: booleanAttribute });
  readonly typeahead = input(this.defaults.typeahead, { transform: booleanAttribute });
  readonly typeaheadTimeout = input(this.defaults.typeaheadTimeout, { transform: numberAttribute });
  readonly selectOnFocus = input(this.defaults.selectOnFocus, { transform: booleanAttribute });
  readonly navigateDisabled = input(this.defaults.navigateDisabled, {
    transform: booleanAttribute,
  });
  readonly disallowEmptySelection = input(this.defaults.disallowEmptySelection, {
    transform: booleanAttribute,
  });
  readonly disallowSelectAll = input(this.defaults.disallowSelectAll, {
    transform: booleanAttribute,
  });
  readonly pageSize = input(this.defaults.pageSize, { transform: numberAttribute });
  readonly virtual = input(this.defaults.virtual, { transform: booleanAttribute });
  readonly itemSize = input(this.defaults.itemSize, { transform: numberAttribute });
  readonly overscan = input(this.defaults.overscan, { transform: numberAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });

  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /* ── The hierarchy, when the tree was handed one ─────────────────────── */

  readonly nodes = input<readonly unknown[] | undefined>(undefined);
  readonly getKey = input<((node: never) => string) | undefined>(undefined);
  readonly getLabel = input<((node: never) => string) | undefined>(undefined);
  readonly getChildren = input<((node: never) => readonly unknown[] | undefined) | undefined>(
    undefined,
  );
  readonly getLevel = input<((node: never) => number) | undefined>(undefined);
  readonly hasChildren = input<((node: never) => boolean) | undefined>(undefined);
  readonly getChildrenCount = input<((node: never) => number | undefined) | undefined>(undefined);
  readonly isNodeDisabled = input<((node: never) => boolean) | undefined>(undefined);
  readonly isNodeLoading = input<((node: never) => boolean) | undefined>(undefined);
  /**
   * A query the tree filters by. The consumer owns the string and the control
   * it is typed into; the tree keeps the ancestors of every hit.
   */
  readonly query = input<string | undefined>(undefined);

  /** The row's content, re-rendered per node rather than projected once. */
  protected readonly nodeContent = contentChild<TemplateRef<unknown>>('slTreeNodeContent');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ids = inject(SlTreeIdFactory);
  private readonly base = this.ids.next();
  private readonly typeaheadHandle: TypeaheadHandle = createTypeahead({
    timeout: this.defaults.typeaheadTimeout,
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.typeaheadHandle.destroy());

    /**
     * The viewport is measured as soon as there is one, and again whenever it
     * changes size — not only when the reader scrolls.
     *
     * Measuring on `scroll` alone left the window with a viewport of nought
     * until the first scroll, and a window of nought renders one row: a tree of
     * four thousand showed its first name and nothing else until the reader
     * nudged the wheel, at which point the rest appeared at once. It is the
     * kind of defect that only exists on the first paint, which is exactly
     * where a reader meets it.
     */
    afterNextRender(() => this.measure());

    const root = this.host.nativeElement;
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(root);
      destroyRef.onDestroy(() => observer.disconnect());
    }
  }

  private measure() {
    const root = this.host.nativeElement;
    this.viewportSize.set(root.clientHeight);
    this.scrollOffset.set(root.scrollTop);
  }

  /* ── What the axes resolve to ────────────────────────────────────────── */

  readonly selection = computed(() => this.selectionMode());
  readonly treeDisabled = computed(() => this.disabled() || this.formDisabled());
  readonly showGuides = computed(() => this.guides());
  readonly expandOnRow = computed(() => this.expandOn());

  /**
   * `auto` reads the mode beside it: a box for a set the reader ticks, a
   * highlight for the one thing they chose, and neither when nothing is
   * selectable. The pattern's own note recommends exactly this convention.
   */
  readonly indicatorMode = computed<Exclude<TreeSelectionIndicator, 'auto'>>(() => {
    const stated = this.selectionIndicator();
    if (stated !== 'auto') return stated;
    if (this.selection() === 'multiple') return 'checkbox';
    return this.selection() === 'single' ? 'highlight' : 'none';
  });

  /**
   * The flat shape is the windowed one, and it is the handed collection's
   * alone: a slice of rows cannot preserve nesting, and a node written in a
   * template cannot render its children as its own siblings.
   */
  protected readonly structureMode = computed<Exclude<TreeStructure, 'auto'>>(() => {
    if (this.collection() === undefined) return 'nested';
    const stated = this.structure();
    if (stated !== 'auto') return stated;
    return this.virtual() ? 'flat' : 'nested';
  });

  protected readonly mode = computed<'roving' | 'activedescendant'>(() => {
    const stated = this.focusMode();
    if (stated !== 'auto') return stated;
    return this.virtual() && this.collection() !== undefined ? 'activedescendant' : 'roving';
  });

  private readonly collection = computed<TreeCollection<unknown> | undefined>(() => {
    const held = this.nodes();
    const key = this.getKey();
    if (held === undefined || key === undefined) return undefined;
    const level = this.getLevel();
    return createTreeCollection<unknown>({
      ...(level === undefined ? { roots: held } : { items: held, getLevel: level as never }),
      getKey: key as never,
      ...(this.getLabel() === undefined ? {} : { getLabel: this.getLabel() as never }),
      ...(this.getChildren() === undefined ? {} : { getChildren: this.getChildren() as never }),
      ...(this.hasChildren() === undefined ? {} : { hasChildren: this.hasChildren() as never }),
      ...(this.getChildrenCount() === undefined
        ? {}
        : { getChildrenCount: this.getChildrenCount() as never }),
      ...(this.isNodeDisabled() === undefined
        ? {}
        : { isDisabled: this.isNodeDisabled() as never }),
    });
  });

  private readonly selected = computed(() => toKeys(this.value()));

  /* ── The filter ─────────────────────────────────────────────────────── */

  private readonly filtered = computed(() => {
    const held = this.collection();
    const query = this.query();
    if (held === undefined || query === undefined || query.trim() === '') return undefined;
    const filter = createFilter();
    const hits = new Set<string>();
    for (const node of held.nodes) if (filter.contains(node.label, query)) hits.add(node.key);
    const kept = new Set(hits);
    for (const key of hits) for (const ancestor of held.ancestorsOf(key)) kept.add(ancestor);
    return { hits, kept };
  });

  /* ── The window ─────────────────────────────────────────────────────── */

  private readonly viewportSize = signal(0);
  private readonly scrollOffset = signal(0);

  private readonly visible = computed<readonly TreeNodeData<unknown>[]>(() => {
    const held = this.collection();
    return held === undefined ? [] : held.visible(this.expandedKeys());
  });

  private readonly windowed = computed(() => this.virtual() && this.collection() !== undefined);

  private readonly slice = computed(() => {
    if (!this.windowed()) return undefined;
    const rows = this.visible();
    const activeIndex = rows.findIndex((node) => node.key === this.activeKey());
    const anchorIndex = rows.findIndex((node) => node.key === this.anchor);
    return virtualWindow({
      itemCount: rows.length,
      itemSize: this.itemSize(),
      overscan: this.overscan(),
      pinned: [activeIndex, anchorIndex].filter((index) => index !== -1),
      scrollOffset: this.scrollOffset(),
      viewportSize: this.viewportSize(),
    });
  });

  protected readonly canvasSize = computed(() => {
    const slice = this.slice();
    return slice === undefined ? null : `${slice.totalSize}px`;
  });

  protected readonly canvasOffset = computed(() => {
    const slice = this.slice();
    return slice === undefined ? null : `${slice.startOffset}px`;
  });

  protected onScroll() {
    this.measure();
  }

  /* ── The render plan ────────────────────────────────────────────────── */

  protected readonly plan = computed<PlanNode[]>(() => {
    const held = this.collection();
    if (held === undefined) return [];
    const label = (item: unknown) => {
      const read = this.getLabel();
      return read === undefined
        ? ((this.getKey() as never as (n: unknown) => string)(item) ?? '')
        : (read as never as (n: unknown) => string)(item);
    };
    const loading = this.isNodeLoading() as never as ((n: unknown) => boolean) | undefined;
    const filtered = this.filtered();
    const flat = this.structureMode() === 'flat';

    const entry = (node: TreeNodeData<unknown>, offset: number | undefined): PlanNode => ({
      key: node.key,
      item: node.item,
      label: label(node.item),
      level: node.level,
      disabled: node.disabled,
      branch: node.hasChildren,
      loading: loading?.(node.item) === true,
      match: filtered === undefined ? undefined : filtered.hits.has(node.key) ? 'hit' : 'ancestor',
      offset,
      children: [],
    });

    if (flat) {
      const rows = this.visible();
      const slice = this.slice();
      if (slice === undefined) return rows.map((node) => entry(node, undefined));
      const inside = rows
        .slice(slice.startIndex, slice.endIndex)
        .map((node) => entry(node, undefined));
      const pinned = [...slice.pinnedBefore, ...slice.pinnedAfter]
        .map((index) => ({ index, node: rows[index] }))
        .filter(
          (row): row is { index: number; node: TreeNodeData<unknown> } => row.node !== undefined,
        )
        .map((row) => entry(row.node, row.index * this.itemSize()));
      return [...pinned, ...inside];
    }

    const walk = (keys: readonly string[]): PlanNode[] =>
      keys
        .map((key) => held.nodeFor(key))
        .filter((node): node is TreeNodeData<unknown> => node !== undefined)
        .filter((node) => filtered === undefined || filtered.kept.has(node.key))
        .map((node) => {
          const row = entry(node, undefined);
          if (node.hasChildren && this.isExpanded(node.key)) row.children = walk(node.children);
          return row;
        });

    return walk(held.roots);
  });

  protected readonly holdsNothing = computed(() => {
    const held = this.collection();
    if (held === undefined) return false;
    const filtered = this.filtered();
    return held.nodes.length === 0 || (filtered !== undefined && filtered.kept.size === 0);
  });

  /* ── What every part reads ──────────────────────────────────────────── */

  private readonly positions = computed(() =>
    this.structureMode() === 'flat' ? this.collection() : undefined,
  );

  private readonly indeterminateSet = computed(() => {
    const held = this.collection();
    if (this.selectionCascade() !== 'descendants' || held === undefined) return new Set<string>();
    return new Set(indeterminateKeys(held, this.selected()));
  });

  isSelected(key: string) {
    return this.selected().includes(key);
  }

  /**
   * A branch the reader opened, or one a query is holding open.
   *
   * A filter that asked for the expansion instead would move the reader's own
   * set and have to put it back when the query emptied, and a reader who
   * cleared a search would find branches open that they never opened. Holding
   * the path open for as long as the query lasts keeps the set the reader owns
   * untouched, and keeps `aria-expanded` telling the truth about what is on
   * screen.
   */
  isExpanded(key: string) {
    if (this.expandedKeys().includes(key)) return true;
    const filtered = this.filtered();
    return filtered !== undefined && filtered.kept.has(key) && !filtered.hits.has(key);
  }

  isActive(key: string) {
    return this.activeKey() === key;
  }

  isIndeterminate(key: string) {
    return this.indeterminateSet().has(key);
  }

  holdsSelection(key: string) {
    const held = this.collection();
    if (held === undefined || this.isSelected(key)) return false;
    return held.descendantsOf(key).some((child) => this.isSelected(child));
  }

  nodeId(key: string) {
    return `${this.base}-node-${key}`;
  }

  labelId(key: string) {
    return `${this.base}-label-${key}`;
  }

  nodeTabIndex(key: string) {
    if (this.mode() === 'activedescendant') return null;
    if (this.activeKey() === null) return -1;
    return this.activeKey() === key ? 0 : -1;
  }

  levelOf(key: string) {
    const node = this.positions()?.nodeFor(key);
    return node === undefined ? null : node.level + 1;
  }

  setSizeOf(key: string) {
    return this.positions()?.nodeFor(key)?.setSize ?? null;
  }

  posInSetOf(key: string) {
    return this.positions()?.nodeFor(key)?.posInSet ?? null;
  }

  protected readonly activeDescendant = computed(() => {
    const key = this.activeKey();
    return this.mode() === 'activedescendant' && key !== null ? this.nodeId(key) : null;
  });

  protected readonly canvasTabIndex = computed(() =>
    this.mode() === 'activedescendant' || this.activeKey() === null ? 0 : -1,
  );

  /* ── The rows, read from the DOM ────────────────────────────────────── */

  private canvas(): HTMLElement | null {
    return this.host.nativeElement.querySelector("[data-part='canvas']");
  }

  private readRows(): Row[] {
    const canvas = this.canvas();
    if (canvas === null) return [];
    return [...canvas.querySelectorAll<HTMLElement>(NODE_SELECTOR)].map((element) => ({
      key: element.dataset['key'] ?? '',
      depth: Number(element.dataset['depth'] ?? 0),
      branch: element.dataset['branch'] !== undefined,
      disabled: element.getAttribute('aria-disabled') === 'true',
      label:
        element.dataset['textValue'] ??
        element.querySelector("[data-part='label']")?.textContent?.trim() ??
        '',
      element,
    }));
  }

  private parentOf(rows: readonly Row[], index: number) {
    const depth = rows[index]?.depth ?? 0;
    for (let step = index - 1; step >= 0; step -= 1) {
      if ((rows[step] as Row).depth < depth) return step;
    }
    return -1;
  }

  private renderedDescendants(rows: readonly Row[], index: number) {
    const depth = rows[index]?.depth ?? 0;
    const held: string[] = [];
    for (let step = index + 1; step < rows.length; step += 1) {
      const row = rows[step] as Row;
      if (row.depth <= depth) break;
      held.push(row.key);
    }
    return held;
  }

  /* ── Moving the three values ────────────────────────────────────────── */

  private anchor: string | undefined = undefined;

  private requestValue(
    keys: readonly string[],
    reason: TreeChangeRequest['reason'],
    source: unknown,
  ) {
    const outward = (held: readonly string[]): TreeValue =>
      this.selection() === 'multiple' ? held : (held[0] ?? null);
    let cancelled = false;
    const state = createControllable<readonly string[]>({
      initial: this.selected(),
      equals: same,
      onRequest: (request) => {
        const outwardRequest: TreeChangeRequest = {
          value: outward(request.value),
          previous: outward(request.previous),
          reason: request.reason,
          source: request.source,
          get cancelled() {
            return request.cancelled;
          },
          cancel: () => request.cancel(),
        };
        this.valueRequest.emit(outwardRequest);
        cancelled = request.cancelled;
      },
    });
    state.request(keys, reason, source);
    if (cancelled) return;
    this.value.set(outward(keys));
    this.onChange(outward(keys));
    this.onTouched();
  }

  private requestExpanded(
    keys: readonly string[],
    reason: TreeExpansionRequest['reason'],
    source: unknown,
  ) {
    let cancelled = false;
    const state = createControllable<readonly string[]>({
      initial: this.expandedKeys(),
      equals: same,
      onRequest: (request) => {
        this.expandedKeysRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    state.request(keys, reason, source);
    if (!cancelled) this.expandedKeys.set(keys);
  }

  private requestActive(key: string | null, reason: TreeActiveRequest['reason'], source: unknown) {
    let cancelled = false;
    const state = createControllable<string | null>({
      initial: this.activeKey(),
      onRequest: (request) => {
        this.activeKeyRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    state.request(key, reason, source);
    if (!cancelled) this.activeKey.set(key);
  }

  private setExpanded(
    key: string,
    open: boolean,
    reason: 'pointer' | 'keyboard' | 'programmatic',
    source: unknown,
  ) {
    const held = this.expandedKeys();
    if (held.includes(key) === open) return;
    const next = open ? [...held, key] : held.filter((candidate) => candidate !== key);

    /* Closing a branch that holds the active node moves the active node to the
       branch, and that request goes out first: a consumer that accepts one and
       refuses the other is left with a coherent pair, where the reverse order
       would strand the keyboard on an element the next render removes. */
    const active = this.activeKey();
    if (!open && active !== null && active !== key) {
      const rows = this.readRows();
      const index = rows.findIndex((row) => row.key === key);
      if (index !== -1 && this.renderedDescendants(rows, index).includes(active)) {
        this.requestActive(key, reason === 'programmatic' ? 'programmatic' : reason, source);
      }
    }
    this.requestExpanded(next, reason, source);
  }

  private applySelection(
    key: string,
    event: Event | undefined,
    intent: 'toggle' | 'replace' | 'range' | 'all' | 'clear',
    reason: 'pointer' | 'keyboard',
  ) {
    if (this.selection() === 'none' || this.readOnly()) return;
    const held = this.collection();
    const rows = this.readRows();

    if (
      this.selectionCascade() === 'descendants' &&
      held !== undefined &&
      (intent === 'toggle' || intent === 'replace')
    ) {
      const result = cascadeSelection({
        collection: held,
        selected: this.selected(),
        key,
        action: 'toggle',
      });
      if (result.changed) this.requestValue(result.selected, reason, event);
      return;
    }

    const result = nextSelection({
      action: intent,
      mode: this.selection(),
      behavior: this.selectionBehavior(),
      selected: this.selected(),
      keys: rows.filter((row) => !row.disabled).map((row) => row.key),
      key,
      anchor: this.anchor ?? key,
      disabled: (candidate) => rows.find((row) => row.key === candidate)?.disabled === true,
      disallowEmpty: this.disallowEmptySelection(),
      disallowSelectAll: this.disallowSelectAll(),
    });
    this.anchor = result.anchor;
    if (result.changed) this.requestValue(result.selected, reason, event);
  }

  /* ── The pointer ────────────────────────────────────────────────────── */

  press(key: string, event: MouseEvent) {
    if (this.treeDisabled()) return;
    const rows = this.readRows();
    const row = rows.find((candidate) => candidate.key === key);
    if (row === undefined || row.disabled) return;

    this.requestActive(key, 'pointer', event);
    if (row.branch && this.expandOn() === 'row') {
      this.setExpanded(key, !this.isExpanded(key), 'pointer', event);
    }
    if (this.selection() !== 'none') {
      const intent = event.shiftKey
        ? 'range'
        : event.ctrlKey || event.metaKey
          ? 'toggle'
          : this.selectionBehavior() === 'replace'
            ? 'replace'
            : 'toggle';
      this.applySelection(key, event, intent, 'pointer');
    }
    this.nodeActivate.emit({ key, reason: 'pointer' });
  }

  pressExpander(key: string, event: MouseEvent) {
    if (this.treeDisabled()) return;
    this.requestActive(key, 'pointer', event);
    this.setExpanded(key, !this.isExpanded(key), 'pointer', event);
  }

  pressIndicator(key: string, event: MouseEvent) {
    if (this.treeDisabled()) return;
    this.requestActive(key, 'pointer', event);
    this.applySelection(key, event, 'toggle', 'pointer');
  }

  /* ── The keyboard ───────────────────────────────────────────────────── */

  private moveTo(rows: readonly Row[], index: number, event: KeyboardEvent) {
    const row = rows[index];
    if (row === undefined) return;
    this.requestActive(row.key, 'keyboard', event);
    row.element.focus();
    if (this.selectOnFocus()) this.applySelection(row.key, event, 'replace', 'keyboard');
  }

  private move(rows: readonly Row[], intent: MoveIntent, event: KeyboardEvent) {
    const next = moveIndex({
      enabled: rows.map((row) => this.navigateDisabled() || !row.disabled),
      from: rows.findIndex((row) => row.key === this.activeKey()),
      intent,
      loop: this.loop(),
      page: this.pageSize(),
    });
    if (next !== -1) this.moveTo(rows, next, event);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || this.treeDisabled()) return;
    /* Arrow navigation stands down while focus is inside a control the reader
       is typing in, which is what makes an inline rename composable. */
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable="true"]') !== null) return;

    const rows = this.readRows();
    if (rows.length === 0) return;
    const index = rows.findIndex((row) => row.key === this.activeKey());
    const row = index === -1 ? undefined : (rows[index] as Row);
    const canvas = this.canvas();
    const rtl = canvas !== null && getComputedStyle(canvas).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    const take = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      take();
      const intent: MoveIntent = event.key === 'ArrowDown' ? 'next' : 'previous';
      if (event.shiftKey && this.selection() === 'multiple') {
        const next = moveIndex({
          enabled: rows.map((candidate) => this.navigateDisabled() || !candidate.disabled),
          from: index,
          intent,
          loop: this.loop(),
        });
        if (next !== -1) {
          this.moveTo(rows, next, event);
          this.applySelection((rows[next] as Row).key, event, 'toggle', 'keyboard');
        }
        return;
      }
      this.move(rows, intent, event);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      take();
      const edge = event.key === 'Home' ? 0 : rows.length - 1;
      if (event.ctrlKey && event.shiftKey && row !== undefined) {
        this.anchor = (rows[edge] as Row).key;
        this.applySelection(row.key, event, 'range', 'keyboard');
        return;
      }
      this.move(rows, event.key === 'Home' ? 'first' : 'last', event);
      return;
    }

    if (event.key === 'PageDown' || event.key === 'PageUp') {
      take();
      this.move(rows, event.key === 'PageDown' ? 'pageDown' : 'pageUp', event);
      return;
    }

    if (event.key === forward) {
      take();
      if (row === undefined || !row.branch) return;
      if (!this.isExpanded(row.key)) {
        this.setExpanded(row.key, true, 'keyboard', event);
        return;
      }
      if (index + 1 < rows.length && (rows[index + 1] as Row).depth > row.depth) {
        this.moveTo(rows, index + 1, event);
      }
      return;
    }

    if (event.key === backward) {
      take();
      if (row === undefined) return;
      if (row.branch && this.isExpanded(row.key)) {
        this.setExpanded(row.key, false, 'keyboard', event);
        return;
      }
      const parent = this.parentOf(rows, index);
      if (parent !== -1) this.moveTo(rows, parent, event);
      return;
    }

    if (event.key === 'Enter') {
      take();
      if (row === undefined) return;
      if (row.branch && this.expandOn() === 'row') {
        this.setExpanded(row.key, !this.isExpanded(row.key), 'keyboard', event);
      }
      if (this.selection() !== 'none') this.applySelection(row.key, event, 'replace', 'keyboard');
      this.nodeActivate.emit({ key: row.key, reason: 'keyboard' });
      return;
    }

    if (event.key === ' ') {
      take();
      if (row === undefined) return;
      this.applySelection(row.key, event, event.shiftKey ? 'range' : 'toggle', 'keyboard');
      return;
    }

    if ((event.key === 'a' || event.key === 'A') && (event.ctrlKey || event.metaKey)) {
      take();
      this.applySelection(row?.key ?? '', event, 'all', 'keyboard');
      return;
    }

    if (event.key === '*') {
      take();
      if (row === undefined) return;
      const parent = this.parentOf(rows, index);
      const siblings = rows
        .filter(
          (candidate, step) =>
            candidate.depth === row.depth && this.parentOf(rows, step) === parent,
        )
        .filter((candidate) => candidate.branch)
        .map((candidate) => candidate.key);
      const next = [...new Set([...this.expandedKeys(), ...siblings])];
      if (!same(next, this.expandedKeys())) this.requestExpanded(next, 'keyboard', event);
      return;
    }

    if (!this.typeahead() || !isPrintable(event.key) || event.ctrlKey || event.metaKey) return;
    const match = this.typeaheadHandle.match(
      event.key,
      rows.map((candidate) => candidate.label),
      index,
    );
    if (match === -1) return;
    take();
    this.moveTo(rows, match, event);
  }

  protected onFocusIn(event: FocusEvent) {
    if (event.target !== this.canvas() || this.mode() === 'activedescendant') return;
    const rows = this.readRows();
    /* The pattern: the selected node when there is one, otherwise the first. */
    const wanted =
      rows.find((row) => this.isSelected(row.key) && !row.disabled) ??
      rows.find((row) => !row.disabled);
    if (wanted === undefined) return;
    this.requestActive(wanted.key, 'keyboard', event);
    wanted.element.focus();
  }

  /* ── The imperative surface ─────────────────────────────────────────── */

  focus() {
    const rows = this.readRows();
    const wanted = rows.find((row) => row.key === this.activeKey()) ?? rows[0];
    (wanted?.element ?? this.canvas())?.focus();
  }

  expand(key: string) {
    const held = this.collection();
    const path = held === undefined ? [] : held.ancestorsOf(key);
    const next = [...new Set([...this.expandedKeys(), ...path, key])];
    if (!same(next, this.expandedKeys())) this.requestExpanded(next, 'programmatic', undefined);
  }

  collapse(key: string) {
    this.setExpanded(key, false, 'programmatic', undefined);
  }

  expandAll() {
    const held = this.collection();
    if (held === undefined) return;
    this.requestExpanded(held.branchKeys, 'programmatic', undefined);
  }

  collapseAll() {
    this.requestExpanded([], 'programmatic', undefined);
  }

  scrollToKey(key: string, align: TreeAlignment = 'nearest') {
    this.expand(key);
    const row = this.readRows().find((candidate) => candidate.key === key);
    row?.element.scrollIntoView({ block: align === 'nearest' ? 'nearest' : align });
  }

  /* ── Reactive Forms ─────────────────────────────────────────────────── */

  private readonly formDisabled = signal(false);
  private onChange: (value: TreeValue) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: TreeValue) {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: TreeValue) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(state: boolean) {
    this.formDisabled.set(state);
  }

  /**
   * The family owns validity only for `required`, which is the one rule it can
   * decide from the value alone: everything else about a hierarchy is the
   * consumer's own.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.required()) return null;
    return toKeys(control.value as TreeValue).length === 0 ? { required: true } : null;
  }
}
