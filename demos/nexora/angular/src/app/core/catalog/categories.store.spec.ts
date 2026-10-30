import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { CategoriesStore } from './categories.store';

describe('CategoriesStore', () => {
  let store: CategoriesStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    store = TestBed.inject(CategoriesStore);
    await store.reload();
  });

  it('reads the whole tree in one call', () => {
    expect(store.loaded()).toBe(true);
    expect(store.count()).toBe(172);
    expect(store.roots().length).toBeGreaterThan(0);
    expect(store.maxDepth()).toBeLessThanOrEqual(4);
  });

  /**
   * The rule BR-03 exists for: `GET /categories` counts only what is filed on
   * the category itself, so a branch reads zero and its leaves hold everything.
   */
  it('separates what a category holds itself from what its branch holds', () => {
    const branch = store.roots().find((node) => node.children.length > 0);
    expect(branch).toBeDefined();
    const fromLeaves = branch!.children.reduce((sum, child) => sum + child.treeCount, 0);

    expect(branch!.treeCount).toBe(branch!.ownCount + fromLeaves);
    expect(branch!.treeCount).toBeGreaterThan(branch!.ownCount);
  });

  it('the roots account for every product the catalogue files', () => {
    const roots = store.roots().reduce((sum, node) => sum + node.treeCount, 0);
    expect(store.productCount()).toBe(roots);
    expect(store.productCount()).toBeGreaterThan(0);
  });

  it('a branch carries itself and every node under it, for a query that reads a place', () => {
    const branch = store.roots().find((node) => node.children.length > 0)!;
    const subtree = store.subtree(branch.id);

    expect(subtree[0]).toBe(branch.id);
    for (const child of branch.children) expect(subtree).toContain(child.id);
    expect(store.subtree(null)).toEqual([]);
    expect(store.subtree('cat_does_not_exist')).toEqual([]);
  });

  it('a node carries the trail a breadcrumb reads, root first', () => {
    const leaf = [...store.byId().values()].find((node) => node.depth === 3);
    expect(leaf).toBeDefined();
    expect(leaf!.trail.at(-1)?.id).toBe(leaf!.id);
    expect(leaf!.trail.length).toBe(leaf!.depth);
    expect(store.node(leaf!.trail[0]!.id)?.parentId).toBeUndefined();
  });
});
