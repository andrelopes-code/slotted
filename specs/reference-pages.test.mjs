import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const ledger = JSON.parse(
  readFileSync(new URL('./legacy-reference-pages.json', import.meta.url), 'utf8'),
);

/**
 * The ratchet the reference pages run on, and the second one in this
 * repository after `legacy-families.json`. Thirty-six pages were written
 * before the page contract in `.claude/skills/component/references/stories.md`:
 * they render two demonstrations with no source, and say nothing about what to
 * import, what the family is made of, or what it emits. Each leaves the list
 * when both of its pages are rewritten, and nothing may join it — without the
 * cap, a page written today could opt out of the contract by adding a line.
 */
const CEILING = 36;

/**
 * What a page written against the contract contains, and the string that
 * proves it is there. This is a presence ratchet, not the check itself: the
 * content is checked by `referencePageErrors` inside each family's own stories
 * spec, and this test is what makes a family run that check at all.
 */
const REQUIRED = [
  { file: 'docs', needle: 'imports:', why: 'the page never says what to import' },
  {
    file: 'docs',
    needle: 'anatomy:',
    why: 'the page names none of the parts the contract declares',
  },
  { file: 'docs', needle: 'scenes:', why: 'the page carries no demonstration of its own' },
  { file: 'stories', needle: 'bindScenes(', why: 'the demonstrations reach no story' },
  { file: 'spec', needle: 'referencePageErrors(', why: 'nothing checks the page' },
];

/**
 * A demonstration painted with an inline style answers no scheme switch and no
 * density, and it is how two examples came to sit against each other with no
 * distance between them. The workbench ships a primitive for every ground a
 * story needs, so a story reaching for `style` is reaching past one.
 */
const REFUSED = [
  {
    file: 'stories',
    pattern: /style=\{\{/,
    why: 'a React demonstration paints with an inline style',
  },
  {
    file: 'stories',
    pattern: /\sstyle="/,
    why: 'an Angular demonstration paints with an inline style',
  },
];

function reactPaths(family) {
  const base = join(root, 'packages/react/src', family);
  return {
    docs: join(base, `${family}.docs.ts`),
    stories: join(base, `${family}.stories.tsx`),
    spec: join(base, `${family}.stories.test.ts`),
  };
}

function angularPaths(family) {
  const base = join(root, 'packages/angular', family, 'src');
  return {
    docs: join(base, `${family}.docs.ts`),
    stories: join(base, `${family}.stories.ts`),
    spec: join(base, `${family}.stories.spec.ts`),
  };
}

function families() {
  return readdirSync(join(root, 'packages/react/src'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((family) => existsSync(reactPaths(family).docs));
}

test('never grows the ledger', () => {
  assert.ok(
    ledger.families.length <= CEILING,
    `The ledger holds ${ledger.families.length} pages and may never exceed ${CEILING}`,
  );
});

test('lists only families that have a reference page', () => {
  const present = new Set(families());
  for (const family of ledger.families) {
    assert.ok(present.has(family), `${family} is listed and has no reference page`);
  }
});

test('holds every unlisted family to the reference-page contract', () => {
  const legacy = new Set(ledger.families);
  const violations = [];

  for (const family of families()) {
    if (legacy.has(family)) continue;
    for (const [framework, paths] of [
      ['react', reactPaths(family)],
      ['angular', angularPaths(family)],
    ]) {
      for (const { file, needle, why } of REQUIRED) {
        const path = paths[file];
        if (!existsSync(path)) {
          violations.push(`${family} (${framework}): no ${file} file at ${path}`);
          continue;
        }
        if (!readFileSync(path, 'utf8').includes(needle)) {
          violations.push(`${family} (${framework}): ${why} — ${file} is missing ${needle}`);
        }
      }
      for (const { file, pattern, why } of REFUSED) {
        const path = paths[file];
        if (!existsSync(path)) continue;
        if (pattern.test(readFileSync(path, 'utf8'))) {
          violations.push(`${family} (${framework}): ${why}`);
        }
      }
    }
  }

  assert.deepEqual(violations, [], violations.join('\n  '));
});
