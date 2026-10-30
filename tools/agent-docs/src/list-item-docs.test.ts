import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadFamilies } from './load.ts';
import { renderFamily } from './render.ts';

const root = resolve(import.meta.dirname, '../../..');

/**
 * An agent composing a row put ListItemBody around ListItemContent and its
 * buttons in ListItemEnd, and the row drew with no layout: the page listed the
 * parts flat, and its one example nested the body in a link. The page states
 * the nesting, shows a read row with two actions, and says which slot takes
 * metadata and which takes controls.
 */
describe.each([
  ['react', 'ListItemActions', 'ListItemContent', 'ListItemDescription'],
  ['angular', 'slListItemActions', 'slListItemContent', 'slListItemDescription'],
] as const)('the %s list-item page', (binding, actions, content, description) => {
  it('states the nesting, shows a row with two actions, and tells end from actions', async () => {
    const family = (await loadFamilies(binding, root)).find(
      (each) => each.contract.family === 'list-item',
    )!;
    /* No example is compiled here: every block renders as an excerpt. */
    const page = renderFamily({ ...family, verdicts: new Map() })
      .files.map((file) => file.content)
      .join('\n');

    expect(page).toContain('| Part | Parent | Element | Required |');
    expect(page).toMatch(/\| `body` \| `content` \|/);
    expect(page).toMatch(/\| `actions` \| `root` \|/);
    const example = page
      .split('```')
      .find(
        (block) =>
          block.includes(content) &&
          block.includes(description) &&
          block.includes(actions) &&
          (block.match(/<(Button|button)\b/g)?.length ?? 0) >= 2,
      );
    expect(example).toBeDefined();
    expect(page).toMatch(/end.*metadata.*actions.*controls|actions.*controls.*end.*metadata/is);
  });
});
