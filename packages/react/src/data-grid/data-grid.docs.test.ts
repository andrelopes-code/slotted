import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { REACT_DATA_GRID_DOCS } from './data-grid.docs';

/**
 * `columns`, `disabledKeys` and a function `rowKey` are compared by identity:
 * written inline, a new one on every render of the parent re-renders every
 * mounted row. An example is code a reader copies, so none writes them inline,
 * and the rules say why.
 */
const INLINE = /\b(columns=\{\[|disabledKeys=\{\[|rowKey=\{\()/;

const examples = join(import.meta.dirname, '../../../../apps/docs/examples/react/data-grid');

describe('the data-grid examples', () => {
  it('declare the props compared by identity outside the render', () => {
    const sources = [
      ...REACT_DATA_GRID_DOCS['data-grid'].scenes.flatMap((scene) =>
        scene.snippet ? [[scene.id, scene.snippet.source] as const] : [],
      ),
      ...readdirSync(examples).map(
        (file) => [file, readFileSync(join(examples, file), 'utf8')] as const,
      ),
    ];
    expect(sources.filter(([, source]) => INLINE.test(source)).map(([name]) => name)).toEqual([]);
  });

  it('say which props are compared by identity and which are read when a row renders', () => {
    const rule = REACT_DATA_GRID_DOCS['data-grid'].accessibility.find((entry) =>
      entry.includes('compared by identity'),
    );
    for (const name of ['columns', 'disabledKeys', 'rowKey', 'cellRenderers', 'messages', 'tree']) {
      expect(rule).toContain(name);
    }
  });
});
