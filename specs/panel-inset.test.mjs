import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * A panel family whose `content` holds a header, a body and a footer draws no
 * padding of its own: the three rows carry the inset. Content written straight
 * inside the panel sits against its edges unless the anatomy says which parts
 * own the inset, so the `content` row of each binding's anatomy names them.
 */
const PANELS = {
  dialog: ['DialogHeader', 'DialogBody', 'DialogFooter'],
  popover: ['PopoverHeader', 'PopoverBody', 'PopoverFooter'],
  tour: ['TourHeader', 'TourBody', 'TourFooter'],
};

function contentPurpose(source) {
  const at = source.indexOf("part: 'content',");
  assert.notEqual(at, -1, 'no content row in the anatomy');
  const end = source.indexOf('\n  },', at);
  return source.slice(at, end);
}

test('names the parts that own the inner padding of every panel', () => {
  for (const [family, parts] of Object.entries(PANELS)) {
    const bindings = {
      react: [`packages/react/src/${family}/${family}.docs.ts`, parts],
      angular: [
        `packages/angular/${family}/src/${family}.docs.ts`,
        parts.map((part) => `sl${part}`),
      ],
    };
    for (const [binding, [path, names]] of Object.entries(bindings)) {
      const purpose = contentPurpose(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
      assert.match(
        purpose,
        /draws no padding/,
        `${binding} ${family}: content does not say it draws no padding`,
      );
      for (const name of names) {
        assert.ok(purpose.includes(name), `${binding} ${family}: content does not name ${name}`);
      }
    }
  }
});
