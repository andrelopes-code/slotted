import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

/**
 * The guard `.claude/skills/component/references/stories.md` describes and this
 * repository did not have.
 *
 * A family that declares `container-type: inline-size` on its root no longer
 * contributes its contents to its own intrinsic width, so a stage that
 * shrink-wraps its children resolves it to nothing. `collapsible`, `pagination`
 * and `stepper` each stood about one character wide on a published reference
 * page — breaking their text one letter per line — and every offline test
 * passed. `.slotted-demo-stage[data-layout="stack"]` is that shrink-wrapping
 * stage; `block` is the one whose children fill it.
 *
 * The rule is about the **root**. `progress-indicator` puts a container on the
 * track of its linear shape so a dash stated in stroke thicknesses can measure
 * itself, and a circle of its own on a `stack` stage is correct. Reading the
 * selector rather than the file is what keeps that from being a false report.
 */

const root = new URL('../', import.meta.url).pathname;
const stylesDir = join(root, 'packages/styles/src');

/** A rule body, paired with the selector list that introduces it. */
function rules(css) {
  const found = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = pattern.exec(css)) !== null) {
    found.push({ selectors: match[1], body: match[2] });
  }
  return found;
}

/**
 * Whether the last compound of a selector is the family's own root. A
 * descendant or child combinator moves the container onto a part, which is a
 * different claim and does not put the family on this list.
 */
function targetsRoot(selectorList, family) {
  return selectorList
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split(',')
    .some((selector) => {
      const compounds = selector
        .trim()
        .split(/\s*[\s>+~]\s*/)
        .filter(Boolean);
      const last = compounds.at(-1);
      return last !== undefined && last.includes(`[data-ui-${family}]`);
    });
}

function familiesWithARootContainer() {
  return readdirSync(stylesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((family) => {
      const stylesheet = join(stylesDir, family, `${family}.css`);
      if (!existsSync(stylesheet)) return false;
      return rules(readFileSync(stylesheet, 'utf8')).some(
        ({ selectors, body }) =>
          /container-type:\s*inline-size/.test(body) && targetsRoot(selectors, family),
      );
    });
}

function storyFiles(family) {
  return [
    join(root, 'packages/react/src', family, `${family}.stories.tsx`),
    join(root, 'packages/angular', family, 'src', `${family}.stories.ts`),
  ].filter((path) => existsSync(path));
}

test('finds the families that answer their own width', () => {
  const families = familiesWithARootContainer();
  assert.ok(
    families.length > 0,
    'no family declares a root container, which means the selector reading is broken rather than that none does',
  );
});

test('refuses a shrink-wrapping stage for a family that answers its own width', () => {
  const violations = [];

  for (const family of familiesWithARootContainer()) {
    for (const path of storyFiles(family)) {
      const source = readFileSync(path, 'utf8');
      if (!/data-layout=(?:"stack"|'stack'|\{'stack'\})/.test(source)) continue;
      violations.push(
        `${path.slice(root.length)}: ${family} declares container-type on its root, so its ` +
          'intrinsic width is zero and a data-layout="stack" stage resolves it to nothing. ' +
          'Use data-layout="block".',
      );
    }
  }

  assert.deepEqual(violations, [], `\n  ${violations.join('\n  ')}`);
});
