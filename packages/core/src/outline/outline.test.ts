import { describe, expect, it } from 'vitest';

import { collectOutline, flattenOutline, nestOutline, slugify } from './outline';

describe('slugify', () => {
  it('folds a heading to lower-case words joined by hyphens, without diacritics', () => {
    expect(slugify('Königsallee tours')).toBe('konigsallee-tours');
    expect(slugify('  Payment terms — due dates!  ')).toBe('payment-terms-due-dates');
  });

  it('keeps digits and letters of other scripts', () => {
    expect(slugify('Zürich 12.3')).toBe('zurich-12-3');
    expect(slugify('Überblick')).toBe('uberblick');
  });

  it('gives nothing for a text that leaves nothing, and cuts at the limit', () => {
    expect(slugify('— · —')).toBe('');
    expect(slugify('a'.repeat(80)).length).toBe(64);
    expect(slugify(`${'a'.repeat(63)} bb`)).toBe('a'.repeat(63));
  });
});

describe('nestOutline', () => {
  it('folds a flat list into a tree by level', () => {
    const tree = nestOutline([
      { id: 'a', label: 'A', level: 2 },
      { id: 'a1', label: 'A1', level: 3 },
      { id: 'a2', label: 'A2', level: 3 },
      { id: 'b', label: 'B', level: 2 },
    ]);
    expect(tree.map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(tree[0]?.children.map((entry) => entry.id)).toEqual(['a1', 'a2']);
  });

  /** A document whose author skipped a level still lists every heading. */
  it('closes a gap in the ladder', () => {
    const tree = nestOutline([
      { id: 'a', label: 'A', level: 2 },
      { id: 'deep', label: 'Deep', level: 4 },
      { id: 'b', label: 'B', level: 3 },
    ]);
    expect(tree[0]?.children.map((entry) => entry.id)).toEqual(['deep', 'b']);
  });

  it('starts a new root when the first entry is deeper than the next', () => {
    const tree = nestOutline([
      { id: 'x', label: 'X', level: 3 },
      { id: 'y', label: 'Y', level: 2 },
    ]);
    expect(tree.map((entry) => entry.id)).toEqual(['x', 'y']);
  });
});

describe('collectOutline', () => {
  function region(html: string) {
    const root = document.createElement('div');
    root.innerHTML = html;
    document.body.append(root);
    return root;
  }

  it('reads h2 and h3 by default, in document order, as a tree', () => {
    const root = region(
      '<h1 id="t">Title</h1><h2 id="a">A</h2><h3 id="a1">A1</h3><h4 id="skip">Skip</h4><h2 id="b">B</h2>',
    );
    const tree = collectOutline(root);
    expect(flattenOutline(tree).map((entry) => entry.id)).toEqual(['a', 'a1', 'b']);
    expect(tree[0]?.children[0]?.element?.tagName).toBe('H3');
    root.remove();
  });

  it('writes an id on a heading without one, unique in the document, and rewrites none', () => {
    region('<p id="zurich"></p>');
    const root = region(
      '<h2>Zürich</h2><h2>Zürich</h2><h2 id="kept">Zürich</h2><h2>— · —</h2><h2>— · —</h2>',
    );
    const ids = collectOutline(root).map((entry) => entry.id);
    expect(ids).toEqual(['zurich-2', 'zurich-3', 'kept', 'section-1', 'section-2']);
    expect(root.querySelectorAll('h2')[0]?.id).toBe('zurich-2');
    expect(root.querySelectorAll('h2')[2]?.id).toBe('kept');
    root.remove();
  });

  it('leaves out a heading inside the excluded selector and one with no text', () => {
    const root = region(
      '<h2 id="a">A</h2><aside><h2 id="side">Side</h2></aside><h2 data-toc-ignore id="i">I</h2><h2 id="empty">  </h2>',
    );
    const ids = collectOutline(root, { exclude: 'aside, [data-toc-ignore]' }).map(
      (entry) => entry.id,
    );
    expect(ids).toEqual(['a']);
    root.remove();
  });

  it('takes the levels it is given', () => {
    const root = region('<h2 id="a">A</h2><h3 id="b">B</h3><h4 id="c">C</h4>');
    expect(collectOutline(root, { levels: [3, 4] }).map((entry) => entry.id)).toEqual(['b']);
    expect(flattenOutline(collectOutline(root, { levels: [3, 4] })).map((e) => e.id)).toEqual([
      'b',
      'c',
    ]);
    root.remove();
  });
});
