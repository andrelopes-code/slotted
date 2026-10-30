import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/wizard/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./wizard.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

/**
 * The error, the optional mark and the actions are other families' elements
 * carrying this family's part name: `alert`, `tag` and `button` paint them,
 * and this sheet places the groups that hold them. Every other part is drawn
 * here.
 */
test('styles every part the contract declares', () => {
  const composed = new Set([
    'error',
    'optional',
    'cancel',
    'save-draft',
    'skip',
    'previous',
    'next',
    'submit',
  ]);
  for (const part of contract.members.wizard.parts) {
    if (composed.has(part)) continue;
    const selector = part === 'root' ? '[data-ui-wizard]{' : `[data-part-${part.toLowerCase()}]`;
    assert.ok(normalized.includes(selector), `Missing part ${part}`);
  }
});

test('answers every value of the progress and scroll axes', () => {
  for (const axis of ['progress', 'scroll']) {
    for (const value of contract.axes[axis]) {
      if (axis === 'progress' && value === 'top') {
        assert.ok(normalized.includes(`[data-progress='top']`), 'Missing progress top');
        continue;
      }
      if (axis === 'scroll' && value === 'ancestor') continue; /* The default paints nothing. */
      assert.ok(normalized.includes(`[data-${axis}='${value}']`), `Missing ${axis} ${value}`);
    }
  }
});

test('changes composition at the compact size class, 600 pixels of its own width', () => {
  assert.match(normalized, /@containerslotted-wizard\(width<600px\)/);
  assert.equal(contract.reflow.breakpoint, '600px');
});

/**
 * A region that scrolls clips at its padding edge, and the ring of a field as
 * wide as the column stands outside it: the reviewer saw every input's ring cut
 * on the right under `scroll=self`. Each scrolling region pads its content by
 * the ring, inside the wizard's own box — a negative margin that reached past
 * it was clipped by the layer around the wizard instead.
 */
test('leaves room for a focus ring inside every region that scrolls', () => {
  assert.match(
    normalized,
    /--_ring-room:calc\(var\(--slotted-focus-ring-width,2px\)\+var\(--slotted-focus-ring-offset,2px\)\)/,
  );
  const scrolling = [...declarations.matchAll(/([^{}]+)\{([^{}]*overflow:\s*auto[^{}]*)\}/g)];
  assert.ok(scrolling.length > 0, 'no scrolling region found');
  for (const [, selector, body] of scrolling) {
    assert.match(body, /padding(-inline)?:[^;]*var\(--_ring-room\)/, selector.trim());
    assert.doesNotMatch(body, /margin-inline:\s*calc\(/, selector.trim());
  }
});

/** Every segment fills the track's height; color separates the states. */
test('draws the compact track in one thickness', () => {
  assert.match(normalized, /\[data-part-progress-segment\]\{background-color:[^}]*block-size:100%/);
  assert.doesNotMatch(normalized, /\[data-part-progress-segment\]:is\([^)]*\)\{block-size:/);
});
