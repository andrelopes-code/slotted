import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/breadcrumb/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./breadcrumb.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      if (part === 'root') continue;
      assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
    }
  }
});

test('draws the separator, rather than leaving it to be written and hidden', () => {
  assert.equal(contract.separator, 'stylesheet');
  assert.ok(
    normalized.includes("[data-part='item']+[data-part='item']::before"),
    'Only an item after another gets a separator',
  );
  assert.ok(
    normalized.includes('content:var(--slotted-breadcrumb-separator'),
    'The glyph should be a theme decision',
  );
});

test('states every state the contract declares on the link', () => {
  for (const state of contract.members.breadcrumbLink.states) {
    if (state === 'default') continue;
    const selector = state === 'current' ? '[data-current]' : `:${state}`;
    assert.ok(normalized.includes(`[data-part='link']${selector}`), `Missing state ${state}`);
  }
});

test('clears the list styling the user agent puts on an ol', () => {
  const list = normalized.split(".slotted-breadcrumb[data-part='list']{")[1]?.split('}')[0] ?? '';
  assert.ok(list.includes('list-style:none'), 'The markers would read as a list of numbers');
  assert.ok(list.includes('padding:0'), 'The default indent has nothing to do with a breadcrumb');
});
