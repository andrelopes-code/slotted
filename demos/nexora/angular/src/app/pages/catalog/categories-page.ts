import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSkeleton, SlSkeletonRegion, SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardComparison,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardValue,
} from '@slotted/angular/stat-card';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlMenuItem } from '@slotted/angular/menu';
import {
  SlToolbar,
  SlToolbarItem,
  SlToolbarOverflow,
  SlToolbarSeparator,
} from '@slotted/angular/toolbar';
import {
  SlTree,
  SlTreeDescription,
  SlTreeEmpty,
  SlTreeGroup,
  SlTreeLabel,
  SlTreeMeta,
  SlTreeNode,
} from '@slotted/angular/tree';

import { CategoriesStore, type CategoryNode } from '../../core/catalog/categories.store';
import { PRODUCTS_ROUTE, SKUS_ROUTE } from '../../core/catalog/catalog.model';
import { phoneSignal } from '../../core/layout/phone';

/**
 * The category tree. Two counts answer different questions and the screen says
 * which is which (BR-03): the number on a row is everything filed in that
 * category and in the categories under it, and a category that also holds
 * products of its own says how many on its second line. Choosing a row opens
 * the products of that place (BR-01), which is where the list's heading and
 * breadcrumb come from.
 *
 * The nodes are written rather than handed over as data. The family's `nodes`
 * shape reaches no row cell — see the ledger row "a tree built from `nodes` has
 * no way into a row's `meta`" — so the screen writes them, and with them owns
 * the query: it keeps the categories above every hit, marks each row `hit` or
 * `ancestor` with the input the family publishes for it, and holds the path
 * open without writing into the set the reader opened.
 */
@Component({
  selector: 'app-categories-page',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlField,
    SlFieldLabel,
    SlGrid,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlSkeletonText,
    SlStack,
    SlStatCard,
    SlStatCardComparison,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardValue,
    SlTextField,
    SlTextFieldInput,
    SlMenuItem,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlToolbarSeparator,
    SlTree,
    SlTreeDescription,
    SlTreeEmpty,
    SlTreeGroup,
    SlTreeLabel,
    SlTreeMeta,
    SlTreeNode,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .body {
      container-type: inline-size;
      display: grid;
      /* The tree draws its own scroller; the track gives it a zero minimum (CP-03). */
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    /*
     * The family caps a tree at its own measure and shows twelve of its rows
     * before scrolling. A catalogue browsed at a desk reads wider and taller,
     * and the family publishes a variable for each.
     */
    .catalog-tree {
      --slotted-tree-measure: 46rem;
      --slotted-tree-rows: 14;
    }
    .search {
      max-inline-size: 22rem;
    }
  `,
  template: `
    <div slPage>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Categories</h1></div>
            <div slPageHeaderActions>
              <div slToolbar aria-label="The catalogue and the whole tree" overflow="menu">
                <div slToolbarItem [slToolbarItemCounterpart]="openAllItem">
                  <button
                    slButton
                    variant="outline"
                    tone="secondary"
                    type="button"
                    (click)="expandAll()"
                  >
                    Open all
                  </button>
                </div>
                <div slToolbarItem [slToolbarItemCounterpart]="closeAllItem">
                  <button
                    slButton
                    variant="ghost"
                    tone="secondary"
                    type="button"
                    (click)="expanded.set([])"
                  >
                    Close all
                  </button>
                </div>
                <div slToolbarSeparator></div>
                <div slToolbarItem [slToolbarItemCounterpart]="productsItem">
                  <a slButtonLink variant="ghost" tone="secondary" [routerLink]="productsRoute">
                    All products
                  </a>
                </div>
                <sl-toolbar-overflow />
              </div>
            </div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              Where the catalogue files what it sells. The number on a row counts every product in
              that category and in the categories under it; a category that also holds products of
              its own says how many on its second line. Choosing a row opens its products.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="body">
          <!--
            The field is chrome, not content: it is drawn with its own words
            before the answer and after it, so the tree below it does not move
            when the categories land.
          -->
          @if (store.error() === null) {
            <div slField class="search">
              <label slFieldLabel>Find a category</label>
              <div slTextField>
                <input
                  slTextFieldInput
                  type="search"
                  name="category-query"
                  placeholder="Servo, hydraulic, safety…"
                  [disabled]="!store.loaded()"
                  [value]="query()"
                  (valueChange)="query.set($event.value)"
                />
              </div>
            </div>
          }
          @if (store.error(); as message) {
            <div slResultState status="error" reach="section">
              <div slResultStateContent>
                <h2 slResultStateTitle>The categories could not be loaded</h2>
                <p slResultStateDescription>{{ message }}</p>
              </div>
              <div slResultStateActions>
                <button slButton type="button" (click)="retry()">Try again</button>
              </div>
            </div>
          } @else if (store.loaded()) {
            <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
              <div slStatCard size="sm">
                <div slStatCardHeader><span slStatCardLabel>Categories</span></div>
                <div slStatCardFigure>
                  <span slStatCardValue>{{ number(store.count()) }}</span>
                  <p slStatCardComparison>{{ depthWord() }}</p>
                </div>
              </div>
              <div slStatCard size="sm">
                <div slStatCardHeader><span slStatCardLabel>Leaf categories</span></div>
                <div slStatCardFigure>
                  <span slStatCardValue>{{ number(store.leafCount()) }}</span>
                  <p slStatCardComparison>with no category under them</p>
                </div>
              </div>
              <div slStatCard size="sm">
                <div slStatCardHeader><span slStatCardLabel>Products filed</span></div>
                <div slStatCardFigure>
                  <span slStatCardValue>{{ number(store.productCount()) }}</span>
                  <p slStatCardComparison>{{ branchWord() }}</p>
                </div>
              </div>
              <div slStatCard size="sm">
                <div slStatCardHeader><span slStatCardLabel>Top level</span></div>
                <div slStatCardFigure>
                  <span slStatCardValue>{{ number(store.roots().length) }}</span>
                  <p slStatCardComparison>departments of the catalogue</p>
                </div>
              </div>
            </div>

            <div slStack [gap]="4">
              @if (query().trim().length > 0) {
                <div slInlineMessage tone="secondary">
                  <span slInlineMessageIcon></span>
                  {{ matchWord() }}
                </div>
              }

              <div
                slTree
                class="catalog-tree"
                variant="framed"
                aria-label="Product categories"
                expandOn="expander"
                selectionMode="none"
                [expandedKeys]="openKeys()"
                (expandedKeysChange)="keepOwn($event)"
                (nodeActivate)="openPlace($event.key)"
              >
                <ng-container
                  [ngTemplateOutlet]="branch"
                  [ngTemplateOutletContext]="{ $implicit: visible(store.roots()) }"
                />
                @if (visible(store.roots()).length === 0) {
                  <p slTreeEmpty>No category is named after "{{ query().trim() }}".</p>
                }
                <!--
                  One template called on itself. It is written inside the tree
                  rather than beside it: a node injects the tree's context from
                  where its view is declared, and a template declared outside
                  the root answers NG0201 with no mention of the family.
                -->
                <ng-template #branch let-nodes>
                  @for (node of nodes; track node.id) {
                    <li
                      slTreeNode
                      [value]="node.id"
                      [label]="node.name"
                      [hasChildren]="node.children.length > 0"
                      [match]="markOf(node)"
                    >
                      @if (ownWord(node); as own) {
                        <span slTreeDescription>{{ own }}</span>
                      }
                      <span slTreeMeta [title]="metaTitle(node)">{{ number(node.treeCount) }}</span>
                      @if (node.children.length > 0) {
                        <ul slTreeGroup>
                          <ng-container
                            [ngTemplateOutlet]="branch"
                            [ngTemplateOutletContext]="{ $implicit: visible(node.children) }"
                          />
                        </ul>
                      }
                    </li>
                  }
                </ng-template>
              </div>

              <p slInline [gap]="3">
                <a slButtonLink variant="ghost" tone="secondary" [routerLink]="skusRoute">
                  Open the SKU list instead
                </a>
              </p>
            </div>
          } @else {
            <!--
              The wait reserves what the answer brings, in the boxes it will
              occupy: the four figures, and a tree of rows whose labels are
              text placeholders the family already varies in width by row.
            -->
            <div slSkeletonRegion [messages]="{ label: 'Reading the categories' }" [loading]="true">
              <div slStack [gap]="6">
                <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                  @for (figure of figureLabels; track figure) {
                    <div slStatCard size="sm" loading>
                      <div slStatCardHeader>
                        <span slStatCardLabel>{{ figure }}</span>
                      </div>
                      <div slStatCardFigure>
                        <span slStatCardValue>—</span>
                        <!-- Every loaded card carries a comparison line; the wait reserves it. -->
                        <p slStatCardComparison>
                            <span slSkeletonText [lines]="1" lastLineSize="70%"></span>
                          </p>
                      </div>
                    </div>
                  }
                </div>
                <div
                  slTree
                  class="catalog-tree"
                  variant="framed"
                  aria-label="Product categories"
                  selectionMode="none"
                >
                  @for (row of placeholderRows; track row) {
                    <li slTreeNode [value]="'placeholder-' + row" hasChildren>
                      <span slTreeLabel><span slSkeleton shape="text"></span></span>
                    </li>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </div>
      <ng-template #openAllItem>
        <button slMenuItem type="button" (click)="expandAll()">Open all</button>
      </ng-template>
      <ng-template #closeAllItem>
        <button slMenuItem type="button" (click)="expanded.set([])">Close all</button>
      </ng-template>
      <ng-template #productsItem>
        <a slMenuItem [routerLink]="productsRoute">All products</a>
      </ng-template>
    </div>
  `,
})
export class CategoriesPage {
  readonly store = inject(CategoriesStore);
  private readonly router = inject(Router);

  readonly productsRoute = PRODUCTS_ROUTE;
  readonly skusRoute = SKUS_ROUTE;
  readonly phone = phoneSignal();
  readonly query = signal('');
  /** The branches the reader opened; a query never writes into this. */
  readonly expanded = signal<readonly string[]>([]);

  /** The names of the four figures: chrome, and known before the answer is. */
  readonly figureLabels = ['Categories', 'Leaf categories', 'Products filed', 'Top level'];
  /** Ten rows reserved: the tree grows downward to its thirteen departments, and never shrinks. */
  readonly placeholderRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  /** The categories whose own name answers the query. */
  private readonly hits = computed(() => {
    const needle = this.query().trim().toLowerCase();
    if (needle.length === 0) return null;
    return new Set(
      [...this.store.byId().values()]
        .filter((node) => node.name.toLowerCase().includes(needle))
        .map((node) => node.id),
    );
  });

  /** A hit and every category above it: a name with no path says nothing. */
  private readonly kept = computed(() => {
    const hits = this.hits();
    if (hits === null) return null;
    const kept = new Set(hits);
    for (const id of hits) for (const step of this.store.node(id)?.trail ?? []) kept.add(step.id);
    return kept;
  });

  /** The path a query holds open, which the reader's own set never learns about. */
  private readonly heldOpen = computed(() => {
    const kept = this.kept();
    const hits = this.hits();
    if (kept === null || hits === null) return new Set<string>();
    return new Set([...kept].filter((id) => !hits.has(id)));
  });

  readonly openKeys = computed(() => [...new Set([...this.expanded(), ...this.heldOpen()])]);

  readonly depthWord = computed(() => {
    const depth = this.store.maxDepth();
    return depth === 0 ? 'in one level' : `over ${depth} levels`;
  });

  readonly branchWord = computed(() => {
    const onBranch = this.store.onBranchCount();
    return onBranch === 0
      ? 'every one of them on a leaf category'
      : `${this.number(onBranch)} of them on a category that has others under it`;
  });

  readonly matchWord = computed(() => {
    const hits = this.hits();
    if (hits === null) return '';
    const needle = this.query().trim();
    if (hits.size === 0) return `No category is named after "${needle}".`;
    const products = [...hits].reduce((sum, id) => sum + (this.store.node(id)?.treeCount ?? 0), 0);
    return `${hits.size} ${hits.size === 1 ? 'category is' : 'categories are'} named after "${needle}", holding ${this.number(products)} products between them. The categories above each hit are kept so the path still reads.`;
  });

  constructor() {
    void this.store.open();
  }

  /** The nodes of one level the query leaves standing. */
  visible(nodes: readonly CategoryNode[]): readonly CategoryNode[] {
    const kept = this.kept();
    return kept === null ? nodes : nodes.filter((node) => kept.has(node.id));
  }

  markOf(node: CategoryNode): 'hit' | 'ancestor' | undefined {
    const hits = this.hits();
    if (hits === null) return undefined;
    return hits.has(node.id) ? 'hit' : 'ancestor';
  }

  /** What the reader opened, kept apart from what the query is holding open. */
  keepOwn(next: readonly string[]): void {
    const held = this.heldOpen();
    const own = new Set(this.expanded());
    this.expanded.set(next.filter((key) => own.has(key) || !held.has(key)));
  }

  number(value: number): string {
    return value.toLocaleString('en-US');
  }

  /** A branch that also holds products of its own; a leaf says nothing, its number is its own. */
  ownWord(node: CategoryNode): string {
    return node.children.length > 0 && node.ownCount > 0
      ? `${this.number(node.ownCount)} filed here`
      : '';
  }

  metaTitle(node: CategoryNode): string {
    return node.children.length === 0
      ? `${this.number(node.treeCount)} products in ${node.name}`
      : `${this.number(node.treeCount)} products in ${node.name} and the ${node.subtree.length - 1} categories under it`;
  }

  expandAll(): void {
    this.expanded.set([...this.store.byId().keys()]);
  }

  retry(): void {
    void this.store.reload();
  }

  openPlace(id: string): void {
    void this.router.navigate([PRODUCTS_ROUTE], { queryParams: { category: id } });
  }
}
