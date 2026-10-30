import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { OUTPUTS, writtenAttributes } from '../scripts/generate-sources.mjs';

for (const [path, source] of Object.entries(OUTPUTS)) {
  test(`${path} is current`, () => {
    assert.equal(
      readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'),
      source(),
      `run: pnpm --filter @slotted/theme generate`,
    );
  });
}

test("the hook index lists each family's parts and data attributes", () => {
  const hooks = JSON.parse(
    readFileSync(new URL('../src/generated/hooks.json', import.meta.url), 'utf8'),
  );
  assert.ok(hooks.ui.button.includes('label'), 'button has a label part');
  assert.ok(hooks.attributes.includes('data-variant'));
});

test('every attribute in the hook index is written to the DOM by a family, as the family writes it', () => {
  const hooks = JSON.parse(
    readFileSync(new URL('../src/generated/hooks.json', import.meta.url), 'utf8'),
  );
  const written = writtenAttributes();
  const malformed = hooks.attributes.filter(
    (attribute) => !/^data-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(attribute),
  );
  assert.deepEqual(malformed, [], 'an HTML attribute name a family writes is kebab-case data-*');
  const unwritten = hooks.attributes.filter((attribute) => !written.has(attribute));
  assert.deepEqual(unwritten, [], 'no family binding or core module writes these');
  // `togglePlacement` is an axis of collapsible's contract, written as `data-toggle-placement`;
  // `addOnPaste` is an option of tags-input that no family reflects to the DOM.
  assert.ok(hooks.attributes.includes('data-toggle-placement'));
  assert.ok(!hooks.attributes.includes('data-add-on-paste'));
});

const SPECS = new URL('../../../specs/components/', import.meta.url);
const STYLES = new URL('../../styles/src/', import.meta.url);

/** Each family contract, keyed by the `data-ui` it renders. */
function contracts() {
  const byUi = new Map();
  for (const entry of readdirSync(SPECS, { withFileTypes: true })) {
    const file = new URL(`${entry.name}/contract.json`, SPECS);
    if (!entry.isDirectory() || !existsSync(file)) continue;
    const contract = JSON.parse(readFileSync(file, 'utf8'));
    byUi.set(contract.ui, contract);
  }
  return byUi;
}

/** Every stylesheet of `packages/styles`, with the family directory that holds it. */
function* stylesheets() {
  for (const entry of readdirSync(STYLES, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(new URL(`${entry.name}/`, STYLES)).filter((name) =>
      name.endsWith('.css'),
    ))
      yield {
        family: entry.name,
        path: `${entry.name}/${file}`,
        css: readFileSync(new URL(`${entry.name}/${file}`, STYLES), 'utf8'),
      };
  }
}

/**
 * Every compound selector in a stylesheet: a run of attribute selectors and
 * pseudo-classes with no combinator between them. The selectors inside a
 * functional pseudo-class are read as compounds of their own.
 */
function compounds(css) {
  const pieces = [];
  let text = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  while (/\([^()]*\)/.test(text))
    text = text.replace(/\(([^()]*)\)/g, (_whole, inner) => {
      pieces.push(inner);
      return '';
    });
  pieces.push(text);
  return pieces.flatMap((piece) => piece.match(/(?:\[[^\]]*\]|::?[\w-]+)+/g) ?? []);
}

test("a family's parts in the hook index are the parts its contract declares", () => {
  const hooks = JSON.parse(
    readFileSync(new URL('../src/generated/hooks.json', import.meta.url), 'utf8'),
  );
  const declared = new Map();
  const add = (ui, parts) => declared.set(ui, new Set([...(declared.get(ui) ?? []), ...parts]));
  for (const [ui, contract] of contracts()) {
    add(
      ui,
      Object.values(contract.members).flatMap((member) => member.parts ?? []),
    );
    // A member whose root is written under another part name (message's bubble).
    add(ui, Object.values(contract.rootPart ?? {}));
    // A part rendered as another family's root (split-button's halves are buttons).
    for (const [part, owner] of Object.entries(contract.partIdentity?.parts ?? {}))
      add(owner, [part]);
  }
  const foreign = Object.entries(hooks.ui).flatMap(([ui, parts]) =>
    parts.filter((part) => !declared.get(ui)?.has(part)).map((part) => `${ui} › ${part}`),
  );
  assert.deepEqual(foreign, [], 'parts no contract declares for that data-ui');
  assert.deepEqual(hooks.ui.avatar, [...declared.get('avatar')].sort());
  assert.ok(hooks.ui.message.includes('bubble'));
  assert.ok(hooks.ui.button.includes('primary') && hooks.ui.button.includes('menu-trigger'));
  assert.deepEqual(hooks.ui.spinner, [], 'a data-ui a stylesheet selects without a contract');
});

test('every data-ui and data-part pairing a family stylesheet selects is allowed by the hook index', () => {
  const hooks = JSON.parse(
    readFileSync(new URL('../src/generated/hooks.json', import.meta.url), 'utf8'),
  );
  const byUi = contracts();
  const partsOf = (ui) => hooks.ui[ui] ?? [];
  const composed = (ui) => {
    const contract = byUi.get(ui);
    if (!contract) return [];
    // Each field is a list of family names, one family name, or (code-block's `composes`) a
    // record of prose that names none.
    const names = (value) =>
      Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
    return ['composes', 'composesFamilies', 'holds', 'memberFamily'].flatMap((key) =>
      names(contract[key]),
    );
  };
  const refused = [];
  const unowned = [];
  for (const { family, path, css } of stylesheets()) {
    // `[data-ui='x'][data-part='y']`: one element is x's root and the part y, which the
    // policy allows only when the index lists y under x.
    for (const compound of compounds(css)) {
      const ui = /\[data-ui='([\w-]+)'\]/.exec(compound)?.[1];
      const part = /\[data-part='([\w-]+)'\]/.exec(compound)?.[1];
      if (ui && part && !partsOf(ui).includes(part)) refused.push(`${path}: ${compound}`);
    }
    // `[data-ui='x'] [data-part='y']`: y is a part of x, of a family x composes, or of the
    // family whose stylesheet writes the selector (a part it places inside x).
    for (const [, ui, part] of css.matchAll(
      /\[data-ui='([\w-]+)'\](?:\[[^\]]*\]|::?[\w-]+(?:\([^()]*\))?)*\s*[>~+]?\s*\[data-part='([\w-]+)'\]/g,
    )) {
      const owners = [ui, family, ...composed(ui)];
      if (!owners.some((owner) => partsOf(owner).includes(part)))
        unowned.push(`${path}: [data-ui='${ui}'] [data-part='${part}']`);
    }
  }
  assert.deepEqual(refused, []);
  assert.deepEqual([...new Set(unowned)], []);
});
