import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;
const ledger = JSON.parse(
  readFileSync(new URL('../../../specs/legacy-families.json', import.meta.url), 'utf8'),
).families;

/**
 * A family is selected in public by `data-ui`, and its parts by `data-part`.
 * A class name is not contract, so a stylesheet that keys on one leaves the
 * library with no selector a consumer may rely on and one it must not touch,
 * both of which look identical from the outside.
 */
function currentFamilies() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !ledger.includes(entry.name))
    .map((entry) => ({
      name: entry.name,
      stylesheets: readdirSync(join(source, entry.name))
        .filter((file) => file.endsWith('.css'))
        .map((file) => ({ file, css: readFileSync(join(source, entry.name, file), 'utf8') })),
      fragment: readdirSync(join(source, entry.name)).includes(`${entry.name}.harness.html`)
        ? readFileSync(join(source, entry.name, `${entry.name}.harness.html`), 'utf8')
        : undefined,
    }));
}

test('keys every stylesheet on the public identifier, never on a class', () => {
  for (const { name, stylesheets } of currentFamilies()) {
    for (const { file, css } of stylesheets) {
      const classes = [...css.matchAll(/\.slotted-[a-z0-9-]+/g)].map(([match]) => match);
      assert.deepEqual(classes, [], `${name}/${file} selects ${classes.join(', ')} by class`);
      assert.match(css, /\[data-ui-[a-z0-9-]+\]/, `${name}/${file} names no family identifier`);
    }
  }
});

test('writes the identifier the contract declares in the rendered markup', () => {
  for (const { name, fragment } of currentFamilies()) {
    if (fragment === undefined) continue;
    assert.match(
      fragment,
      new RegExp(`data-ui=['"]${name}['"]`),
      `${name} renders no element carrying its own identifier`,
    );
  }
});
