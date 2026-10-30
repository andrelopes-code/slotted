import {
  afterEveryRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlTreeContext } from './tree-context';

/** The selector the tree reads its visible rows through, in DOM order. */
export const NODE_SELECTOR = "[data-part='node']";

/**
 * One node, and the facts the tree reads back off it.
 *
 * The visible collection is read from the DOM rather than from a registry, as
 * `listbox` and `menu` already do: document order is reading order, a collapsed
 * branch renders no group and therefore contributes no rows, and nothing has to
 * be registered, unregistered or ordered by mount time. The flattening a tree
 * would otherwise need is the browser's own.
 *
 * `aria-disabled` and never the native attribute: the pattern needs a disabled
 * node to keep its place in the set, and `navigateDisabled` is what decides
 * whether the arrows land on it.
 */
@Component({
  selector: 'li[slTreeNode]',
  standalone: true,
  exportAs: 'slTreeNode',
  imports: [SlGlyph, SlIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<div data-part="row" data-part-row="" (click)="onRowClick($event)">
      @if (tree.showGuides() && depth() > 0) {
        <span data-part="guide" data-part-guide="" aria-hidden="true"></span>
      }
      @if (branch() && loading()) {
        <!-- The wait stands in the chevron's own cell, so a branch that starts
             fetching moves neither its own name nor the rows below it. -->
        <span
          data-part="loader"
          data-part-loader=""
          data-ui="spinner"
          data-ui-spinner=""
          aria-hidden="true"
          ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="8.875" />
            <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
        ></span>
      } @else {
        <span
          data-part="expander"
          data-part-expander=""
          aria-hidden="true"
          (click)="onExpanderClick($event)"
        >
          <!-- A leaf keeps the box and draws nothing in it. -->
          @if (branch()) {
            <span slIcon><svg slGlyph name="chevron-right"></svg></span>
          }
        </span>
      }
      @if (tree.indicatorMode() === 'checkbox') {
        <!-- The dash outranks the check: a branch partly chosen shows the state
             its children are in. -->
        <span
          data-part="indicator"
          data-part-indicator=""
          aria-hidden="true"
          (click)="onIndicatorClick($event)"
          ><span slIcon><svg slGlyph [name]="indeterminate() ? 'minus' : 'check'"></svg></span
        ></span>
      }
      <ng-content select="[slTreeIcon]" />
      <span data-part="label" data-part-label="" [attr.id]="labelId()"
        >{{ label() }}<ng-content select="[slTreeLabel]"
      /></span>
      <ng-content select="[slTreeDescription]" />
      <ng-content select="[slTreeMeta]" />
      <ng-content select="[slTreeActions]" />
    </div>
    @if (branch() && expanded()) {
      <!-- The group is placed only while the branch is open. One kept in the
           DOM and merely hidden would put every descendant of every closed
           branch into the reading order the root counts.

           The element is the consumer's rather than this template's, and the
           reason is the HTML parser: Angular parses a template as HTML, where
           an li closes the li before it, so a node written inside a node needs
           the list between them. React has no such rule and needs no such
           element, and the asymmetry is written in the design rather than
           levelled away. -->
      <ng-content select="[slTreeGroup]" />
    }
    <ng-content />`,
  host: {
    'data-part': 'node',
    'data-part-node': '',
    role: 'treeitem',
    '[attr.id]': 'id()',
    '[attr.data-key]': 'value()',
    '[attr.data-depth]': 'depth()',
    '[style.--slotted-tree-depth]': 'depth()',
    '[style.--slotted-tree-row-offset.px]': 'offset()',
    '[attr.data-text-value]': 'textValue() ?? null',
    '[attr.data-branch]': "branch() ? '' : null",
    '[attr.data-expanded]': "expanded() ? '' : null",
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-selected-within]': "holdsSelection() ? '' : null",
    '[attr.data-indeterminate]': "indeterminate() ? '' : null",
    '[attr.data-current]': "current() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.data-match]': 'match() ?? null',
    '[attr.data-pinned]': "pinned() ? '' : null",
    '[attr.aria-labelledby]': 'labelId()',
    '[attr.aria-expanded]': 'ariaExpanded()',
    '[attr.aria-selected]': 'ariaSelected()',
    '[attr.aria-checked]': 'ariaChecked()',
    '[attr.aria-disabled]': "resolvedDisabled() ? 'true' : null",
    '[attr.aria-level]': 'levelAttr()',
    '[attr.aria-setsize]': 'setSize()',
    '[attr.aria-posinset]': 'posInSet()',
    '[attr.tabindex]': 'tabIndex()',
  },
})
export class SlTreeNode {
  /** The key this node selects and expands by. */
  readonly value = input.required<string>();
  /** The node's name, when it is a plain string. */
  readonly label = input('');
  /**
   * Whether this node has children that have not been rendered yet. A branch
   * says so before it can prove it, which is what makes lazy loading possible.
   */
  readonly hasChildren = input(false, { transform: booleanAttribute });
  /** Whether the children are on their way. Writes `aria-busy` on the group. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Unstated rather than `false`, so the node defers to the tree. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * What typeahead matches and what a reader hears. Defaults to the label's own
   * text, which is wrong exactly when the label holds a mark or a number.
   */
  readonly textValue = input<string | undefined>(undefined);
  /** Whether a query matched this node's own name or one below it. */
  readonly match = input<'hit' | 'ancestor' | undefined>(undefined);
  /**
   * Rendered at its own place on the canvas whether or not the window covers
   * it. The tree pins the active node and the range anchor; nothing else sets
   * it, because an `aria-activedescendant` whose target has been recycled names
   * an id that is not in the document.
   */
  readonly pinned = input(false, { transform: booleanAttribute });
  /** Where the node sits on the canvas, in pixels. Windowed rows only. */
  readonly offset = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });
  /**
   * How deep the node sits, stated only by the flat shape. Everywhere else the
   * markup says it: a node inside another is one level deeper, and the number
   * is a fact about the tree rather than one more thing a consumer can get
   * wrong.
   */
  readonly level = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });

  protected readonly tree = inject(SlTreeContext);
  /**
   * The node this one is written inside, found through the element injector
   * rather than through a context signal: projected content keeps the injector
   * of the place it was declared, which is exactly the nesting the depth is
   * counted from.
   */
  private readonly parent = inject(SlTreeNode, { optional: true, skipSelf: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /**
   * The nodes this one is rendered inside, counted in the document once it is
   * attached. A template that calls itself declares every instance at the root,
   * so the injector finds no parent for any of them and the whole tree would
   * draw flat; the document still nests them, and so does the level the
   * platform reports.
   */
  private readonly renderedDepth = signal<number | null>(null);

  /**
   * The nodes written inside this one. Angular creates projected content with
   * the parent's own view and only decides where to place it, so the query
   * answers a branch that is closed and whose group is therefore not rendered —
   * which is what keeps a collapsed branch a branch.
   */
  private readonly childNodes = contentChildren(SlTreeNode, { descendants: true });

  /** A branch is a node that holds children or says it will. */
  protected readonly branch = computed(() => this.hasChildren() || this.childNodes().length > 0);
  /**
   * Annotated rather than inferred: the depth of a node reads the depth of the
   * node it is written inside, and an inferred type would be defined in terms
   * of itself.
   */
  readonly depth: Signal<number> = computed(
    () =>
      this.level() ?? this.renderedDepth() ?? (this.parent === null ? 0 : this.parent.depth() + 1),
  );
  protected readonly expanded = computed(() => this.branch() && this.tree.isExpanded(this.value()));
  protected readonly selected = computed(() => this.tree.isSelected(this.value()));
  protected readonly indeterminate = computed(() => this.tree.isIndeterminate(this.value()));
  protected readonly holdsSelection = computed(
    () => !this.expanded() && this.tree.holdsSelection(this.value()),
  );
  protected readonly current = computed(() => this.tree.isActive(this.value()));
  protected readonly id = computed(() => this.tree.nodeId(this.value()));
  protected readonly labelId = computed(() => this.tree.labelId(this.value()));
  protected readonly resolvedDisabled = computed(
    () => (this.disabled() ?? false) === true || this.tree.treeDisabled() === true,
  );
  protected readonly ariaExpanded = computed(() =>
    this.branch() ? (this.expanded() ? 'true' : 'false') : null,
  );
  private readonly chosen = computed(() =>
    this.tree.selection() === 'none' ? null : this.selected() ? 'true' : 'false',
  );
  protected readonly ariaSelected = computed(() =>
    this.tree.indicatorMode() === 'checkbox' ? null : this.chosen(),
  );
  protected readonly ariaChecked = computed(() =>
    this.tree.indicatorMode() === 'checkbox' ? this.chosen() : null,
  );
  /**
   * The level the node reports is the tree's answer and not the depth it was
   * handed: the depth places the row, and the property is written only where
   * the nesting no longer says it.
   */
  protected readonly levelAttr = computed(() => this.tree.levelOf(this.value()));
  protected readonly setSize = computed(() => this.tree.setSizeOf(this.value()));
  protected readonly posInSet = computed(() => this.tree.posInSetOf(this.value()));
  protected readonly tabIndex = computed(() => this.tree.nodeTabIndex(this.value()));

  constructor() {
    /*
     * Projected content is created with the parent's view, before a closed
     * branch has placed its group in the document, so one read at creation
     * finds no ancestor. The count waits until the node is attached, and stops
     * there: a view is never moved to another parent.
     */
    const measure = afterEveryRender({
      read: () => {
        const element = this.host.nativeElement;
        const root = element.closest("[data-ui='tree']");
        if (root === null) return;
        let depth = 0;
        let node = element.parentElement?.closest(NODE_SELECTOR);
        while (node && root.contains(node)) {
          depth += 1;
          node = node.parentElement?.closest(NODE_SELECTOR);
        }
        this.renderedDepth.set(depth);
        measure.destroy();
      },
    });
  }

  protected onRowClick(event: MouseEvent) {
    if (this.resolvedDisabled()) return;
    this.tree.press(this.value(), event);
  }

  protected onExpanderClick(event: MouseEvent) {
    event.stopPropagation();
    if (!this.branch() || this.resolvedDisabled()) return;
    this.tree.pressExpander(this.value(), event);
  }

  protected onIndicatorClick(event: MouseEvent) {
    event.stopPropagation();
    if (this.resolvedDisabled()) return;
    this.tree.pressIndicator(this.value(), event);
  }
}

/**
 * The list a branch's children are written in.
 *
 * It exists because Angular parses a template as HTML: an `li` closes the `li`
 * before it, so a node written inside a node needs the list between them. The
 * node decides whether the group is placed; the consumer decides what element
 * it is.
 */
@Directive({
  selector: 'ul[slTreeGroup]',
  standalone: true,
  host: {
    'data-part': 'group',
    'data-part-group': '',
    role: 'group',
    '[attr.aria-busy]': "busy() ? 'true' : null",
  },
})
export class SlTreeGroup {
  /** Whether the children are still on their way. */
  readonly busy = input(false, { transform: booleanAttribute });
}

/** The node's leading picture, which the consumer owns whole. */
@Directive({
  selector: '[slTreeIcon]',
  standalone: true,
  host: { 'data-part': 'icon', 'data-part-icon': '', 'aria-hidden': 'true' },
})
export class SlTreeIcon {}

/** The node's name, when it is richer than a string. */
@Directive({ selector: '[slTreeLabel]', standalone: true })
export class SlTreeLabel {}

/** A second line under the name. */
@Directive({
  selector: '[slTreeDescription]',
  standalone: true,
  host: { 'data-part': 'description', 'data-part-description': '' },
})
export class SlTreeDescription {}

/** The trailing count, size or badge. */
@Directive({
  selector: '[slTreeMeta]',
  standalone: true,
  host: { 'data-part': 'meta', 'data-part-meta': '' },
})
export class SlTreeMeta {}

/** The trailing controls. They stay in the DOM and stay reachable. */
@Directive({
  selector: '[slTreeActions]',
  standalone: true,
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlTreeActions {}

/** What the tree shows when it holds nothing. */
@Directive({
  selector: '[slTreeEmpty]',
  standalone: true,
  host: { 'data-part': 'empty', 'data-part-empty': '' },
})
export class SlTreeEmpty {}
