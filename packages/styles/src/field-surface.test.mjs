import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * A part that draws a field's resting edge, `--slotted-control-border-color`,
 * is a field, and it paints a field's fill, `--slotted-control-surface`. A row
 * of controls reads as one row only when every box in it has the same ground:
 * Nexora's list toolbar put a text field painted with the control surface
 * beside a `multi-select` painted `transparent` and a `segmented-control`
 * painted `--slotted-surface-sunken`, and the three read as three kinds of
 * thing. `--slotted-surface` is not the same token either: it answers
 * `Canvas` under forced colours where a field answers `Field`.
 *
 * The rule reads the resting rule of the part — the one that is not a hover,
 * focus, invalid or disabled state — and a variant that gives the fill up
 * (`plain`, `subtle`, `ghost`) is a rule of its own that this test does not
 * read. The parts below draw the same edge and are not fields; each says why.
 */
const NOT_FIELDS = new Map([
  ["[data-ui-button][data-variant='outline']", 'a button: its ground is the surface it stands on'],
  [
    '[data-ui-toggle][data-part-root]',
    'a button that stays pressed, with the outline button’s ground',
  ],
  ['[data-ui-toggle-group][data-part-root]', 'a frame around toggles, which are buttons'],
  ['[data-ui-datetime-picker] [data-part-now]', 'a button in the panel footer'],
  [
    '[data-ui-loading-overlay] > [data-part-scrim] > [data-part-panel] > [data-part-cancel]:not([data-ui])',
    'a button on the overlay panel',
  ],
  [
    "[data-ui-button-group][data-part-root] > [data-ui-button][data-variant='outline'][data-pressed]",
    'a pressed outline button',
  ],
  [
    "[data-ui-split-button][data-part-root] > [data-ui-button][data-variant='outline'][data-pressed]",
    'a pressed outline button',
  ],
  ['[data-ui-kbd]', 'a key cap: the raised ground above its rim is what says the word is a key'],
  ['[data-ui-listbox]', 'a list on the page surface, not a field'],
  ['[data-ui-tree]', 'a list on the page surface, not a field'],
  ['[data-ui-slider] [data-part-track]', 'a track, whose sunken ground is the unfilled range'],
  ['[data-ui-switch] > [data-part-track]', 'a track, painted by its state'],
  ['[data-ui-switch] > [data-part-track] > [data-part-thumb]', 'a thumb, painted by its state'],
  ['[data-ui-upload] [data-part-trigger]', 'a button that opens the file chooser'],
]);

/** A selector list split at its own commas, never at one inside `:is()` or `:not()`. */
function selectorList(text) {
  const list = [];
  let depth = 0;
  let current = '';
  for (const character of text) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      list.push(current);
      current = '';
    } else current += character;
  }
  list.push(current);
  return list.map((entry) => entry.replace(/\s+/g, ' ').trim());
}

const STATE =
  /:hover|:active|:focus|invalid|disabled|readonly|data-checked|\[data-variant='(plain|subtle|ghost)'\]/;

function fieldEdgedRules() {
  const found = [];
  for (const family of readdirSync(source)) {
    const path = `${source}${family}/${family}.css`;
    if (!statSync(`${source}${family}`).isDirectory()) continue;
    let css;
    try {
      css = readFileSync(path, 'utf8');
    } catch {
      continue;
    }
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selectors, body] of rules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/border(-color)?\s*:[^;]*--slotted-control-border-color/.test(body)) continue;
      for (const selector of selectorList(selectors)) {
        if (STATE.test(selector)) continue;
        found.push({ family, selector, body });
      }
    }
  }
  return found;
}

test('paints the field fill wherever a part draws the field edge', () => {
  const wrong = [];
  for (const { family, selector, body } of fieldEdgedRules()) {
    if (NOT_FIELDS.has(selector)) continue;
    const fill = body.match(/background(-color)?\s*:\s*([^;]*)/)?.[2].replace(/\s+/g, ' ');
    if (!fill || !fill.includes('--slotted-control-surface')) {
      wrong.push(`${family}: ${selector} paints ${fill ?? 'nothing'}`);
    }
  }
  assert.deepEqual(wrong, []);
});

test('names only parts that still draw the field edge', () => {
  const selectors = new Set(fieldEdgedRules().map((rule) => rule.selector));
  for (const selector of NOT_FIELDS.keys()) {
    assert.ok(selectors.has(selector), `${selector} no longer draws the field edge; drop it`);
  }
});
