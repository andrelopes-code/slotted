import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { CategoriesStore } from '../../core/catalog/categories.store';
import { ProductsStore } from '../../core/catalog/products.store';
import { SkusStore } from '../../core/catalog/skus.store';
import { SessionStore } from '../../core/session/session.store';
import { skuColumns, skuFilterFields } from './sku-columns';

describe('the catalogue list screens', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
  });

  async function open(path: string, persona = 'sofia-ramirez'): Promise<RouterTestingHarness> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
    const harness = await RouterTestingHarness.create(path);
    const store = path.startsWith('/catalog/skus')
      ? TestBed.inject(SkusStore)
      : TestBed.inject(ProductsStore);
    for (let attempt = 0; attempt < 120 && store.rows().length === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    harness.detectChanges();
    return harness;
  }

  const textOf = (harness: RouterTestingHarness): string =>
    harness.fixture.nativeElement.textContent as string;

  /**
   * PM-01 read as a model rule: a hidden column comes back through the grid's
   * own control, so a value the reader may not see is not in the model at all.
   */
  it('the price and the cost are absent from the model, not hidden in it', () => {
    const manager = skuColumns((permission) =>
      ['catalog.view', 'pricing.view', 'cost.view'].includes(permission),
    );
    const representative = skuColumns((permission) =>
      ['catalog.view', 'pricing.view'].includes(permission),
    );
    const operator = skuColumns((permission) => permission === 'catalog.view');

    expect(manager.map((column) => column.id)).toContain('listPrice');
    expect(manager.map((column) => column.id)).toContain('standardCost');
    expect(representative.map((column) => column.id)).toContain('listPrice');
    expect(representative.map((column) => column.id)).not.toContain('standardCost');
    expect(operator.map((column) => column.id)).not.toContain('listPrice');
    expect(operator.map((column) => column.id)).not.toContain('standardCost');
  });

  it('a filter a reader may not see is not offered either', () => {
    const operator = skuFilterFields((permission) => permission === 'catalog.view');
    expect(operator.map((field) => field.key)).not.toContain('listPrice');
    expect(operator.map((field) => field.key)).not.toContain('standardCost');
    expect(operator.map((field) => field.key)).toContain('belowReorderPoint');
  });

  it('LP-12 — the grid takes the height the bar leaves, so the page does not scroll', async () => {
    await open('/catalog/skus');
    const sheet = [...document.querySelectorAll('style')]
      .map((style) => style.textContent ?? '')
      .find((css) => css.includes('.listing') && css.includes('sl-data-grid'));

    expect(sheet).toBeDefined();
    expect(sheet!.replace(/\s+/g, ' ')).toMatch(
      /\.listing[^{]*\{[^}]*display: flex;[^}]*flex-direction: column;/,
    );
    expect(sheet!.replace(/\s+/g, ' ')).toMatch(
      /sl-data-grid[^{]*\{[^}]*flex: 1 1 0;[^}]*min-block-size: 0;/,
    );
  });

  /**
   * LP-04, the half a cell template has to carry itself. The rule is read
   * from the sheet rather than from the box, because jsdom lays nothing out
   * and what must not come back is the declaration: without a maximum the
   * value keeps its content's width, and dragging the SKU column to 70 pixels
   * drew a 98-pixel code over the Name column.
   */
  it('LP-04 — a value drawn in a cell states its maximum as well as its cut', async () => {
    await open('/catalog/skus');
    const sheets = [...document.querySelectorAll('style')].map((style) => style.textContent ?? '');
    // The screens name a value drawn in a cell with a `cell-` class; the
    // shell's own truncating rules are not cells and are not this rule's.
    const truncating = sheets
      .flatMap((css) => css.split('}'))
      .filter((rule) => rule.includes('text-overflow: ellipsis') && rule.includes('.cell-'));

    expect(truncating.length).toBeGreaterThan(0);
    for (const rule of truncating) {
      expect(rule, rule.trim().slice(0, 60)).toContain('max-inline-size: 100%');
      expect(rule, rule.trim().slice(0, 60)).toContain('overflow: hidden');
    }
  });

  it('LP-04 — no catalogue column asks for a cut without an ellipsis', () => {
    const columns = skuColumns(() => true);
    for (const column of columns) expect(column.text, column.id).not.toBe('nowrap');
  });

  /** LP-01 by rank: the frame drops columns by priority, and the code has none, so it always stays. */
  it('LP-01 — every column but the code carries a priority, and no two share one', () => {
    const columns = skuColumns(() => true);
    const code = columns.find((column) => column.id === 'sku')!;
    const ranked = columns.filter((column) => column.id !== 'sku');

    expect(code.priority).toBeUndefined();
    for (const column of ranked) expect(column.priority, column.id).toBeTypeOf('number');
    const priorities = ranked.map((column) => column.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
    expect(columns.find((column) => column.id === 'available')!.priority).toBe(1);
  });

  it('the SKU list offers its views, its columns and its density in the bar', async () => {
    const harness = await open('/catalog/skus');
    const root = harness.fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="saved-views"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="columns-trigger"]')?.textContent).toContain('Columns');
    expect(root.querySelector('[data-testid="density"]')).not.toBeNull();
  });

  it('LP-08 — every number on the SKU list names what it counts', async () => {
    const harness = await open('/catalog/skus');
    const text = textOf(harness);
    const store = TestBed.inject(SkusStore);

    expect(text).toContain(`${store.total()!.toLocaleString('en-US')} SKUs`);
    expect(text).toContain('SKUs per page');
    expect(text).toContain(`SKUs 1–25 of ${store.total()!.toLocaleString('en-US')}`);
  });

  it('the reader without pricing.view is told why the price is not a column', async () => {
    const harness = await open('/catalog/skus', 'jordan-wells');
    expect(textOf(harness)).toContain('Prices are not on this list');
    expect(textOf(harness)).not.toContain('$0.00');
  });

  /** BR-01: a place is the list's heading and its breadcrumb, never one of its pills. */
  it('a place names the list and the bar keeps only the facets', async () => {
    await signInAs('sofia-ramirez');
    await TestBed.inject(SessionStore).load();
    const categories = TestBed.inject(CategoriesStore);
    await categories.reload();
    const branch = categories.roots().find((node) => node.children.length > 0)!;

    const harness = await RouterTestingHarness.create(`/catalog/products?category=${branch.id}`);
    const store = TestBed.inject(ProductsStore);
    for (let attempt = 0; attempt < 120 && store.rows().length === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    harness.detectChanges();

    const heading = harness.fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(heading.textContent?.trim()).toBe(branch.name);
    expect(textOf(harness)).toContain('All products');
    expect(textOf(harness)).toContain(`the ${branch.subtree.length - 1} categories under it`);
    expect(store.filter()).toBeNull();
  });

  it('offers no control for anything the catalogue cannot do', async () => {
    const harness = await open('/catalog/products');
    const controls = [
      ...harness.fixture.nativeElement.querySelectorAll('button, a[href]'),
    ] as HTMLElement[];

    for (const control of controls) {
      const label = `${control.textContent ?? ''} ${control.getAttribute('aria-label') ?? ''}`;
      expect(label, label).not.toMatch(
        /\b(Edit|Delete|Remove|Save|Create|New product|New SKU|Import|Publish)\b/,
      );
    }
  });
});
