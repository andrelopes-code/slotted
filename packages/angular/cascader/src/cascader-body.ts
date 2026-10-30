import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  inject,
  input,
  output,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlHighlight } from '@slotted/angular/highlight';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { CascaderCrumb, CascaderNodeView } from '@slotted/core/cascader';
import { matchRanges } from '@slotted/core/highlight';

import type { CascaderEngine } from './cascader-engine';

/** What a node template receives: the consumer's own item, and its state. */
export interface CascaderNodeContext<T> {
  $implicit: T;
  view: CascaderNodeView;
}

/**
 * The label of a node, written by the consumer:
 * `<ng-template slCascaderNode let-place let-view="view">…</ng-template>`.
 * The row, its marks and its count stay the family's.
 */
@Directive({ selector: 'ng-template[slCascaderNode]', standalone: true })
export class SlCascaderNode<T = unknown> {
  readonly template = inject<TemplateRef<CascaderNodeContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: SlCascaderNode<T>,
    context: unknown,
  ): context is CascaderNodeContext<T> {
    return context !== null;
  }
}

/**
 * What the surface holds, the same in the popup and on the page: the
 * breadcrumb, then the tree with its columns, or the results of a query. Its
 * host takes no box (`display: contents`), so the surface's own layout reaches
 * the breadcrumb and the tree as if they were its children.
 */
@Component({
  selector: 'sl-cascader-body',
  standalone: true,
  imports: [NgTemplateOutlet, SlButton, SlGlyph, SlHighlight, SlIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    @let view = engine().view();
    @if (view.crumbs.length > 0) {
      <nav
        data-part="breadcrumb"
        data-part-breadcrumb=""
        [attr.aria-label]="engine().t('breadcrumb')"
      >
        @for (crumb of view.crumbs; track $index) {
          @if (!$first) {
            <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
          }
          @if (crumb.type === 'collapsed') {
            <button
              type="button"
              data-part="crumb"
              data-part-crumb=""
              data-collapsed
              [attr.aria-label]="backLabel(crumb.target)"
              (click)="goTo(crumb.target, $event)"
            >
              …
            </button>
          } @else {
            <button
              type="button"
              data-part="crumb"
              data-part-crumb=""
              [attr.aria-current]="crumb.current ? 'location' : null"
              (click)="onCrumb(crumb, $event)"
            >
              {{ engine().labelOf(crumb.key) }}
            </button>
          }
        }
        @if (engine().layout() === 'columns') {
          <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
        }
      </nav>
    }
    <div
      data-part="panel"
      data-part-panel=""
      role="tree"
      [id]="treeId()"
      [attr.tabindex]="focusable() ? 0 : null"
      [attr.aria-activedescendant]="
        focusable() && engine().activeKey !== null ? nodeId()(engine().activeKey!) : null
      "
      [attr.aria-label]="label() ?? null"
      [attr.aria-labelledby]="label() === undefined ? (labelledBy() ?? null) : null"
      [attr.aria-multiselectable]="engine().multiple ? true : null"
      (keydown)="treeKeydown.emit($event)"
    >
      @if (view.searching) {
        <div
          data-part="column"
          data-part-column=""
          role="group"
          [attr.aria-label]="engine().t('search')"
        >
          @for (node of view.results; track node.key) {
            <ng-container *ngTemplateOutlet="row; context: { $implicit: node }" />
          }
          @if (view.results.length === 0) {
            <div data-part="empty" data-part-empty="">{{ noResults() }}</div>
          }
          <div data-part="status" data-part-status="" role="status">
            {{ resultCount(view.results.length) }}
          </div>
        </div>
      } @else {
        @for (column of view.columns; track column.parent ?? '') {
          <div
            data-part="column"
            data-part-column=""
            role="group"
            [attr.aria-label]="engine().labelOf(column.parent)"
            [attr.aria-busy]="column.pending && !column.failed ? true : null"
          >
            @for (node of column.nodes; track node.key) {
              <ng-container *ngTemplateOutlet="row; context: { $implicit: node }" />
            }
            @if (column.pending && !column.failed) {
              @for (index of [0, 1, 2]; track index) {
                <div data-part="loader" data-part-loader="" aria-hidden="true">
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
            }
            @if (column.failed && column.parent !== undefined) {
              <div data-part="status" data-part-status="" role="status">
                {{ failedLabel(column.parent) }}
                <button
                  slButton
                  size="sm"
                  variant="outline"
                  type="button"
                  (click)="retry.emit(column.parent)"
                >
                  {{ engine().t('retry') }}
                </button>
              </div>
            }
            @if (!column.pending && !column.failed && column.nodes.length === 0) {
              <div data-part="empty" data-part-empty="">{{ engine().t('empty') }}</div>
            }
          </div>
        }
      }
    </div>

    <ng-template #row let-node>
      <div
        data-part="node"
        data-part-node=""
        role="treeitem"
        [id]="nodeId()(node.key)"
        [attr.aria-level]="view.searching ? null : node.level"
        [attr.aria-posinset]="view.searching ? null : node.posInSet"
        [attr.aria-setsize]="view.searching ? null : node.setSize"
        [attr.aria-expanded]="node.branch && !view.searching ? node.expanded : null"
        [attr.aria-selected]="engine().multiple ? null : node.selected"
        [attr.aria-checked]="
          engine().multiple ? (node.indeterminate ? 'mixed' : node.selected) : null
        "
        [attr.aria-disabled]="node.disabled ? true : null"
        [attr.aria-busy]="node.loading ? true : null"
        [attr.data-current]="node.current ? '' : null"
        [attr.data-expanded]="node.expanded && !view.searching ? '' : null"
        [attr.data-selected]="node.selected ? '' : null"
        [attr.data-indeterminate]="node.indeterminate ? '' : null"
        [attr.data-disabled]="node.disabled ? '' : null"
        [attr.data-loading]="node.loading ? '' : null"
        [style.--slotted-cascader-depth]="
          engine().layout() === 'tree' && !view.searching ? node.depth : null
        "
        (click)="onNodeClick(node, $event)"
        (pointermove)="onPointerMove(node, $event)"
        (pointerenter)="onPointerEnter(node)"
        (pointerleave)="cancelHover()"
      >
        @if (engine().multiple) {
          <span data-part="indicator" data-part-indicator=""
            ><span slIcon><svg slGlyph [name]="node.indeterminate ? 'minus' : 'check'"></svg></span
          ></span>
        }
        <span data-part="label" data-part-label="">
          @if (nodeTemplate(); as template) {
            <ng-container
              *ngTemplateOutlet="
                template;
                context: { $implicit: engine().itemFor(node.key), view: node }
              "
            />
          } @else if (view.searching && engine().query !== '') {
            <span slHighlight [text]="node.label" [ranges]="ranges(node.label)"></span>
          } @else {
            {{ node.label }}
          }
        </span>
        @if (descriptionOf(node, view.searching); as description) {
          <span data-part="description" data-part-description="">{{ description }}</span>
        }
        @if (metaOf(node); as meta) {
          <span data-part="meta" data-part-meta="" aria-hidden="true">{{ meta }}</span>
        }
        @if (node.branch) {
          <span data-part="expander" data-part-expander="" aria-hidden="true">
            @if (node.loading) {
              <span data-ui="spinner" data-ui-spinner="" data-part="root" data-part-root=""
                ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="12" r="8.875" />
                  <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
              ></span>
            } @else {
              <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
            }
          </span>
        } @else if (!engine().multiple) {
          <span data-part="indicator" data-part-indicator=""
            ><span slIcon><svg slGlyph name="check"></svg></span
          ></span>
        }
      </div>
    </ng-template>
  `,
})
export class SlCascaderBody<T> {
  readonly engine = input.required<CascaderEngine<T>>();
  readonly nodeId = input.required<(key: string) => string>();
  readonly treeId = input.required<string>();
  readonly focusable = input(false);
  readonly label = input<string | undefined>(undefined);
  readonly labelledBy = input<string | undefined>(undefined);
  readonly separator = input('/');
  readonly expandOn = input<'press' | 'hover'>('press');
  readonly hoverDelay = input(150);
  readonly nodeTemplate = input<TemplateRef<CascaderNodeContext<T>> | undefined>(undefined);
  readonly getDescription = input<((node: T) => string | undefined) | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);

  readonly retry = output<string>();
  readonly treeKeydown = output<KeyboardEvent>();

  private hover: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.hover));
  }

  /**
   * The `highlight` family draws the match, from the collator the search used,
   * so the mark reads the same here as in every other filtered list.
   */
  protected ranges(label: string) {
    return matchRanges(label, this.engine().query, { locale: this.locale() });
  }

  protected backLabel(key: string | undefined) {
    return this.engine().t('back', { label: this.engine().labelOf(key) });
  }

  protected failedLabel(key: string) {
    return this.engine().t('failed', { label: this.engine().labelOf(key) });
  }

  protected noResults() {
    return this.engine().t('noResults', { query: this.engine().query });
  }

  protected resultCount(count: number) {
    return count === 0 ? '' : this.engine().t('results', { count });
  }

  protected descriptionOf(node: CascaderNodeView, searching: boolean): string | undefined {
    const engine = this.engine();
    if (searching) {
      const trail = node.trail.map((key) => engine.labelOf(key)).join(` ${this.separator()} `);
      return trail === '' ? undefined : trail;
    }
    const item = engine.itemFor(node.key);
    return item === undefined ? undefined : this.getDescription()?.(item);
  }

  protected metaOf(node: CascaderNodeView): string | undefined {
    if (!node.branch) return undefined;
    /* Inside a chosen branch the count is how many are chosen there. */
    if (this.engine().multiple && node.selectedInside > 0) return String(node.selectedInside);
    return node.childrenCount === undefined ? undefined : String(node.childrenCount);
  }

  protected goTo(level: string | undefined, event: MouseEvent) {
    this.engine().goTo(level, event.detail === 0 ? 'keyboard' : 'pointer', event);
  }

  protected onCrumb(crumb: CascaderCrumb, event: MouseEvent) {
    if (crumb.type === 'level' && !crumb.current) this.goTo(crumb.key, event);
  }

  protected onPointerMove(node: CascaderNodeView, event: PointerEvent) {
    if (!node.current) this.engine().setActive(node.key, 'pointer', event);
  }

  protected onPointerEnter(node: CascaderNodeView) {
    this.cancelHover();
    const engine = this.engine();
    if (this.expandOn() !== 'hover' || !node.branch || node.disabled) return;
    if (engine.layout() === 'tree' || engine.view().searching) return;
    /* Hover shows a level after a rest and never commits. */
    this.hover = setTimeout(() => engine.showLevel(node.key, 'pointer'), this.hoverDelay());
  }

  protected cancelHover() {
    clearTimeout(this.hover);
  }

  protected onNodeClick(node: CascaderNodeView, event: MouseEvent) {
    if (node.disabled) return;
    const engine = this.engine();
    const reason = event.detail === 0 ? 'keyboard' : 'pointer';
    const target = event.target as Element;
    const onBox = target.closest("[data-part='indicator']") !== null;
    const onExpander = target.closest("[data-part='expander']") !== null;

    if (engine.view().searching) {
      if (node.selectable) engine.choose(node.key, reason, event);
      else if (node.branch) {
        engine.setQuery('', 'select', event);
        engine.showLevel(node.key, reason, event);
      }
      return;
    }
    if (engine.layout() === 'tree') {
      if (node.branch && (onExpander || !node.selectable)) {
        engine.toggleExpanded(node.key, reason, event);
        return;
      }
      engine.choose(node.key, reason, event);
      return;
    }
    if (engine.multiple && onBox) {
      engine.choose(node.key, reason, event);
      return;
    }
    if (node.branch) {
      engine.showLevel(node.key, reason, event);
      engine.setActive(node.key, reason, event);
      /* A branch the consumer made selectable is chosen as it opens, and the
         popup stays: the reader is drilling. */
      if (node.selectable && !engine.multiple)
        engine.choose(node.key, reason, event, { close: false });
      return;
    }
    engine.choose(node.key, reason, event);
  }
}
