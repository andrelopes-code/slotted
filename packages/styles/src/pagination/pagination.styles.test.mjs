import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/pagination/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./pagination.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      if (part === 'root') continue;
      assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
    }
  }
});

test('reacts to every state the page control declares', () => {
  for (const state of contract.members.paginationPage.states) {
    if (state === 'default') continue;
    const selector = state === 'current' || state === 'disabled' ? `[data-${state}]` : `:${state}`;
    assert.ok(normalized.includes(`[data-part='page']${selector}`), `Missing state ${state}`);
  }
});

test('matches a control disabled through the platform as well as through the attribute', () => {
  assert.ok(
    normalized.includes("[data-part='page']:disabled"),
    'A native disabled button must look disabled too',
  );
});

test('keeps a page square until its label is wider than it is tall', () => {
  const page = collapsed.split(".slotted-pagination [data-part='page'] {")[1]?.split('}')[0] ?? '';
  const block = /min-block-size: var\((--[a-z0-9-]+)/.exec(page)?.[1];
  const inline = /min-inline-size: var\((--[a-z0-9-]+)/.exec(page)?.[1];
  assert.equal(inline, block, 'Both minimums should read one token');
});

test('keeps a border under forced colours, where the fill is discarded', () => {
  assert.ok(
    /@media\(forced-colors:active\)\{\.slotted-pagination\[data-part='page'\]\[data-current\]\{border-color:currentColor/.test(
      normalized,
    ),
    'The current page would otherwise be indistinguishable',
  );
});
