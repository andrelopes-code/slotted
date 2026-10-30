import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import type { Category } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';

/** What `GET /categories` returns beside the record itself. */
export interface CategoryRow extends Category {
  depth: number;
  productCount: number;
}

/**
 * One node of the tree, with the two counts that answer different questions:
 * `ownCount` is what the backend files on this category itself, `treeCount`
 * is that number plus everything under it. On a branch the first is usually
 * zero, and a tree that printed it would say a whole department is empty.
 */
export interface CategoryNode {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: Category['status'];
  readonly depth: number;
  readonly parentId: string | undefined;
  readonly ownCount: number;
  readonly treeCount: number;
  readonly children: CategoryNode[];
  /** The nodes from the root to this one, this one last: the breadcrumb of a place. */
  readonly trail: { id: string; name: string }[];
  /** This node and every node under it, for a query that reads a whole branch. */
  readonly subtree: string[];
}

function buildNodes(rows: readonly CategoryRow[]): {
  roots: CategoryNode[];
  byId: Map<string, CategoryNode>;
} {
  const byId = new Map<string, CategoryNode>();
  const children = new Map<string, CategoryRow[]>();
  const roots: CategoryRow[] = [];
  for (const row of rows) {
    if (row.parentId === undefined) roots.push(row);
    else children.set(row.parentId, [...(children.get(row.parentId) ?? []), row]);
  }
  const make = (row: CategoryRow, path: { id: string; name: string }[]): CategoryNode => {
    const own = children.get(row.id) ?? [];
    const trail = [...path, { id: row.id, name: row.name }];
    const built = own.map((child) => make(child, trail));
    const node: CategoryNode = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      depth: row.depth,
      parentId: row.parentId,
      ownCount: row.productCount,
      treeCount: row.productCount + built.reduce((sum, child) => sum + child.treeCount, 0),
      children: built,
      trail,
      subtree: [row.id, ...built.flatMap((child) => child.subtree)],
    };
    byId.set(node.id, node);
    return node;
  };
  return { roots: roots.map((row) => make(row, [])), byId };
}

/**
 * The tenant's category tree, read once and shared: the Categories screen
 * draws it, and the Products list reads a branch out of it to know what a
 * place holds. 172 nodes at three levels in the light seed; the whole tree is
 * one call, so no branch is fetched on demand.
 */
@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly sessionStore = inject(SessionStore);

  readonly rows = signal<readonly CategoryRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** Null before the first answer; the empty state waits for an answer (AF-01). */
  readonly loaded = signal(false);

  private readonly tree = computed(() => buildNodes(this.rows()));
  readonly roots = computed(() => this.tree().roots);
  readonly byId = computed(() => this.tree().byId);
  readonly count = computed(() => this.rows().length);
  readonly leafCount = computed(() => [...this.byId().values()].filter((n) => n.children.length === 0).length);
  readonly maxDepth = computed(() => this.rows().reduce((deep, row) => Math.max(deep, row.depth), 0));
  /** Products filed on a branch rather than on one of its leaves; zero in the light seed. */
  readonly onBranchCount = computed(() =>
    [...this.byId().values()].reduce(
      (sum, node) => sum + (node.children.length > 0 ? node.ownCount : 0),
      0,
    ),
  );
  readonly productCount = computed(() =>
    this.roots().reduce((sum, node) => sum + node.treeCount, 0),
  );

  private tenant: string | null = null;
  private pending: Promise<void> | null = null;

  constructor() {
    this.tenant = untracked(() => this.tenantKey());
    effect(() => {
      const key = this.tenantKey();
      if (key === null) return;
      untracked(() => {
        if (this.tenant !== null && this.tenant !== key) this.forget();
        this.tenant = key;
      });
    });
  }

  private tenantKey(): string | null {
    const session = this.sessionStore.session();
    return session === null
      ? null
      : `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
  }

  private forget(): void {
    this.pending = null;
    this.rows.set([]);
    this.loaded.set(false);
    this.error.set(null);
  }

  /** Read once per tenant; a second caller waits on the first call's promise. */
  open(): Promise<void> {
    this.pending ??= this.load();
    return this.pending;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      this.rows.set(await api.catalog.categories());
      this.loaded.set(true);
    } catch (error) {
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(isApiError(error) ? error.message : 'The categories could not be loaded');
      this.pending = null;
    } finally {
      this.loading.set(false);
    }
  }

  reload(): Promise<void> {
    this.pending = this.load();
    return this.pending;
  }

  node(id: string | null): CategoryNode | null {
    return id === null ? null : (this.byId().get(id) ?? null);
  }

  /** Every id under a branch, the branch included: what "the products of this place" means. */
  subtree(id: string | null): readonly string[] {
    return this.node(id)?.subtree ?? [];
  }
}
