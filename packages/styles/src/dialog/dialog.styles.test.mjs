import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/dialog/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./dialog.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const panel = `${ui}>[data-part-viewport]>[data-part-content]`;
const backdrop = `${ui}>[data-part-backdrop]`;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

/**
 * DG4. The panel arrives by changing its ink and by nothing else.
 *
 * It grew into place first, from `0.98`, which R7 refuses because scaling a
 * box of type resamples every letter in it. It travelled four pixels next, and
 * that was reported as the same defect: a box the browser is moving is a
 * composited layer, and a layer moved by a fraction of a pixel has its text
 * resampled for every frame it is between two of them — eleven of the twelve
 * frames of that movement landed on a fractional position.
 *
 * The rule is narrower than `text-scale.test.mjs`, and deliberately: an
 * anchored layer still arrives across one step of the space scale (R7), and a
 * menu is a small box whose movement says which side it opened on. A dialog is
 * centred, has nothing to travel *from*, and is the largest block of type the
 * library moves.
 */
test('lets the panel arrive by ink alone (DG4)', () => {
  for (const selector of [panel, `${ui}[data-open]>[data-part-viewport]>[data-part-content]`]) {
    const body = rule(selector);
    assert.ok(body.length > 0, `${selector} has no rule`);
    assert.ok(!/(?:^|;)(?:translate|scale|rotate|transform):/.test(body), `${selector} moves type`);
  }
  assert.ok(
    !/translate|scale\(|transform:/.test(normalized.split('[data-part-header]')[0]),
    'the panel is moved by some other rule',
  );
});

/**
 * The two halves of one layer arrive together, over the long step and on the
 * standard curve. On the entrance curve — written for something that travels
 * and decelerates into place — the scrim was at 57.6 per cent of its ink by
 * the second frame and at 83 per cent by the fourth, and it was reported as a
 * scrim that simply appeared.
 */
test('opens the scrim and the panel over one duration and one curve (DG4)', () => {
  const arrival = 'opacity var(--slotted-duration-long) var(--slotted-easing-standard)';
  for (const selector of [
    `${ui}[data-open]>[data-part-backdrop]`,
    `${ui}[data-open]>[data-part-viewport]>[data-part-content]`,
  ]) {
    assert.equal(rule(selector).includes(`transition:${arrival.replace(/\s+/g, ' ')}`), true);
  }
  for (const selector of [backdrop, panel]) {
    assert.match(
      rule(selector),
      /transition:opacity var\(--slotted-duration-short\) var\(--slotted-easing-exit\)/,
      'leaving is not the short step on the exit curve',
    );
  }
});

/**
 * The entering frame has no `data-open`, and the focus scope enters in it. A
 * layer hidden by `content-visibility` in that frame refuses the initial focus,
 * so the closed rule keys on `inert`, which the binding leaves off while the
 * layer enters.
 */
test('hides the layer only while it is inert, never in the entering frame', () => {
  assert.match(rule(`${ui}[inert]`), /content-visibility:hidden/);
  assert.equal(rule(`${ui}:not([data-open])`).includes('content-visibility'), false);
});

/**
 * A non-modal layer leaves the page reachable (contract › `back.modalOnly`,
 * `focus.contain`), and that includes the pointer and the wheel. The layer is
 * fixed over the whole viewport, so a layer that takes the pointer and paints
 * the scrim over a non-modal panel puts the page out of reach while
 * `aria-modal` says it is not: every press lands on the scrim, and a wheel
 * over it scrolls nothing.
 */
test('leaves the page under a non-modal layer reachable by the pointer', () => {
  const modeless = `${ui}:not([data-modal])`;
  assert.match(rule(modeless), /pointer-events:none/);
  assert.match(rule(`${modeless}>[data-part-backdrop]`), /visibility:hidden/);
  assert.match(rule(`${modeless}>[data-part-viewport]>[data-part-content]`), /pointer-events:auto/);
});

/**
 * The panel draws no padding; the header, the body and the footer carry its
 * inset. A layout of the consumer's own that skips those parts reads the same
 * inset from the public tokens, at every size step — the names popover, tour
 * and card already give theirs.
 */
test('states the panel inset as public tokens the three rows read', () => {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  assert.match(
    source,
    /--_padding-inline: var\(--slotted-dialog-padding-inline, var\(--slotted-space-8/,
  );
  assert.match(
    source,
    /--_padding-block: var\(--slotted-dialog-padding-block, var\(--slotted-space-7/,
  );
  assert.match(
    source,
    /--_padding-inline: var\(--slotted-dialog-padding-inline-sm, var\(--slotted-space-7/,
  );
  assert.match(
    source,
    /--_padding-block: var\(--slotted-dialog-padding-block-sm, var\(--slotted-space-6/,
  );
});
