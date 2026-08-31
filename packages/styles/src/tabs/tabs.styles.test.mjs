import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(new URL('../../../../specs/components/tabs/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./tabs.css', import.meta.url), 'utf8');
const normalized = css.replace(/\s+/g, '');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const part of ['list', 'tab', 'panel']) {
    assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
  }
});

test('styles both orientations and every declared state', () => {
  for (const orientation of contract.orientations) {
    assert.ok(
      normalized.includes(`[data-orientation='${orientation}']`) || orientation === 'horizontal',
      `Missing orientation ${orientation}`,
    );
  }
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.ok(normalized.includes(`[${attribute}]`), `Missing ${attribute}`);
  }
  assert.ok(normalized.includes(':focus-visible'), 'Missing focus ring');
});

test('keeps the selected tab out of the generic hover selector', () => {
  const hover = css.match(/\[data-part='tab'\]:hover[^{]*\{/)?.[0];
  assert.ok(hover, 'Missing hover rule');
  assert.match(hover.replace(/\s+/g, ''), /:not\(\[data-selected\]\)/);
});

test('never falls back to a system colour for decoration', () => {
  // Text and interactive surfaces must stay readable without a theme, so a
  // visible system colour is the right last resort there. A decorative rule is
  // the opposite: unthemed, it should disappear rather than shout.
  const decorative = css.match(/\[data-part='list'\]::after\s*\{[\s\S]*?\}/)?.[0];
  assert.ok(decorative, 'Missing track rule');
  assert.doesNotMatch(decorative, /ButtonBorder|CanvasText|GrayText|Highlight|ButtonFace/);
  assert.match(decorative, /var\(--slotted-border-subtle, transparent\)/);
});

test('lets one token remove the track entirely', () => {
  assert.match(css, /--slotted-tabs-track-color/);
});
