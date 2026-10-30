import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * SL6/CB5 — a family that waits draws neither the ring nor the placeholder.
 *
 * The ring is `spinner`'s, extracted by B4 for exactly this second host; the
 * placeholder rows are `skeleton`'s. A family that drew either of them again
 * would be a second answer to the same wait, drifting from the first the
 * moment one of them is retuned. Each host says only where the two stand and
 * how big they are, through the size token the shared sheet reads.
 */
const HOSTS = [
  { family: 'select', busy: '[data-ui-select] > [data-part-busy]' },
  { family: 'combobox', busy: '[data-ui-combobox] [data-part-busy]' },
  { family: 'multi-select', busy: '[data-ui-multi-select] [data-part-busy]' },
];

/** A repeating animation, which is what drawing a wait of one's own looks like. */
const LOOP = /animation:[^;]*\binfinite\b/g;

function sheet(family) {
  return readFileSync(`${source}${family}/${family}.css`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

function rule(css, selector) {
  const normalized = css
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,:])\s*/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');
  const flat = selector.replace(/\s*([>])\s*/g, ' $1 ');
  return normalized.split(`${flat}{`)[1]?.split('}')[0] ?? '';
}

test('stands the shared ring where the chevron stood, and draws no arc of its own', () => {
  for (const { family, busy } of HOSTS) {
    const css = sheet(family);
    const declarations = rule(css, busy);
    assert.notEqual(declarations, '', `${family} places no ring while an answer travels`);
    assert.match(
      declarations,
      /--slotted-spinner-size:var\(--_icon-size\)/,
      `${family} does not give the shared ring the chevron's size`,
    );
    assert.doesNotMatch(declarations, /mask-image/, `${family} draws an arc of its own`);
    assert.doesNotMatch(declarations, /animation/, `${family} turns the ring itself`);
  }
});

test('waits as rows the height of an option, and paints no placeholder of its own', () => {
  for (const { family } of HOSTS) {
    const css = sheet(family);
    const declarations = rule(css, `[data-ui-${family.toLowerCase()}] [data-part-placeholder]`);
    assert.notEqual(declarations, '', `${family} shows no placeholder while an answer travels`);
    assert.match(declarations, /grid-column:1 \/ -1/, `${family} does not span the surface`);
    const row = rule(css, `[data-ui-${family.toLowerCase()}] [data-part-placeholder] > *`);
    assert.match(
      row,
      /min-block-size:var\(--_item-height\)/,
      `${family} does not give a waiting row the height of an option`,
    );
    assert.doesNotMatch(
      declarations,
      /background|border-radius/,
      `${family} paints the placeholder instead of reading it`,
    );
  }
});

/**
 * The wait has one motion. The ring turns and the placeholder sweeps, both in
 * the sheets that own them; a third loop in the popup was one answer too many
 * for one wait, and it is the only kind of motion that has to be stopped
 * rather than shortened under reduced motion.
 */
test('leaves no family looping a wait of its own', () => {
  for (const { family } of HOSTS) {
    const css = sheet(family);
    const loops = [...css.matchAll(LOOP)].map(([match]) => match.trim());
    assert.deepEqual(loops, [], `${family} loops ${loops.join(', ')} of its own`);
  }
});
