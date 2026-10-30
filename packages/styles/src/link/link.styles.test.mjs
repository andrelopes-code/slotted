import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(new URL('../../../../specs/components/link/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./link.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('answers every underline value the contract names', () => {
  for (const underline of contract.axes.underline) {
    const styled =
      underline === 'always'
        ? normalized.includes('[data-ui-link]{')
        : normalized.includes(`[data-ui-link][data-underline='${underline}']`);
    assert.ok(styled, `Missing underline ${underline}`);
  }
});

test('answers every variant the contract names', () => {
  for (const variant of contract.axes.variant) {
    const styled =
      variant === 'accent'
        ? normalized.includes('[data-ui-link]{')
        : normalized.includes(`[data-ui-link][data-variant='${variant}']`);
    assert.ok(styled, `Missing variant ${variant}`);
  }
});

test('reacts to every state the contract declares', () => {
  for (const state of contract.members.link.states) {
    if (state === 'default') continue;
    const selector =
      state === 'disabled'
        ? '[data-ui-link][data-disabled]'
        : `[data-ui-link]:not([data-disabled]):${state}`;
    const focus = `[data-ui-link]:${state}`;
    assert.ok(
      normalized.includes(selector.replace(/\s+/g, '')) || normalized.includes(focus),
      `Missing state ${state}`,
    );
  }
});

/**
 * The link that is the page the reader is already on is painted from
 * `aria-current`, and no mirrored `data-current` exists to paint instead. A
 * router writes that attribute and nothing else, so a family that waited for
 * its own mirror would paint nothing for the consumer who never adopted one.
 */
test('paints the current link from the platform attribute', () => {
  assert.ok(normalized.includes("[data-ui-link][aria-current]:not([aria-current='false'])"));
  assert.ok(!normalized.includes('data-current'));
});

/**
 * Every colour a state moves to is mixed toward a token the theme holds to a
 * contrast ratio, never toward a fill role. A fill that darkens in the light
 * scheme lightens nothing in the dark one, which is how the shipped family
 * came to make a link harder to read under the pointer than at rest.
 */
test('never paints text with a fill role', () => {
  assert.ok(!/tone-[a-z]+-solid/.test(declarations), 'A solid fill is not a text colour');
  assert.match(declarations, /--_hover:[\s\S]*?color-mix\(in oklab, var\(--_rest\) 65%/);
});

test('paints no marker of its own: the arrow is the Glyph element in an icon box', () => {
  assert.ok(!normalized.includes('mask'), 'The marker is an svg, not a mask');
  assert.ok(!normalized.includes('--slotted-icon-external'));
  assert.ok(
    normalized.includes(
      '[data-part-external-icon]{--slotted-icon-size:var(--slotted-link-external-icon-size,1em);',
    ),
    'The part sizes the box inside it at the size of the text',
  );
});

test('restores the underline under forced colours', () => {
  assert.ok(normalized.includes('@media(forced-colors:active)'), 'Missing the query');
  assert.ok(
    /@media\(forced-colors:active\)\{\[data-ui-link\]\{text-decoration-line:underline/.test(
      normalized,
    ),
    'A link with no underline is unrecognizable once the palette flattens colour',
  );
});

/**
 * `:visited` accepts colour and hides its computed value from script, so this
 * assertion on the source is the only evidence the rule exists. It is named at
 * the gate for the same reason.
 */
test('paints a visited link only where the application asked for it', () => {
  assert.ok(normalized.includes('[data-ui-link][data-visited]:visited{color:var(--_visited)'));
});
