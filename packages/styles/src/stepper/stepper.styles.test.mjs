import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { STATE_PRECEDENCE } from '../../../../specs/contract.schema.mjs';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/stepper/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./stepper.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('styles every part the contract declares', () => {
  for (const part of contract.members.stepper.parts) {
    if (part === 'status') continue; /* The visually-hidden family owns it. */
    const selector = part === 'root' ? '[data-ui-stepper]{' : `[data-part-${part.toLowerCase()}]`;
    assert.ok(normalized.includes(selector), `Missing part ${part}`);
  }
});

test('answers every value of every axis the contract names', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    if (axis === 'navigation') continue; /* The element changes, not the paint. */
    const attribute = axis === 'labelPlacement' ? 'data-label-placement' : `data-${axis}`;
    for (const value of values) {
      assert.ok(normalized.includes(`[${attribute}='${value}']`), `Missing ${axis} ${value}`);
    }
  }
});

/**
 * Every status is a fill and an edge rather than a colour alone. Section 7 of
 * `docs/component-features.md` requires it in those words: progress must not
 * depend on colour.
 */
test('separates the four statuses by shape as well as by colour', () => {
  for (const status of ['data-current', 'data-complete', 'data-invalid', 'data-disabled']) {
    assert.ok(declarations.includes(`[${status}]`), `${status} paints nothing of its own`);
  }
  assert.ok(!declarations.includes('mask'), 'the check and the cross are Glyph elements');
  assert.ok(
    normalized.includes(
      '[data-part-marker]>[data-ui-icon]{--slotted-icon-size:var(--_mark-size);color:var(--_mark);',
    ),
    'the glyph the binding renders is sized and painted by the marker',
  );
  assert.ok(
    normalized.includes('background-color:var(--slotted-stepper-marker-surface-complete'),
    'a finished step fills as well as changing colour',
  );
});

/**
 * The status glyphs carry their own container, and the bare marks are the ones
 * drawn inside a box some control already provides. The marker is that box, so
 * a circled alert inside a disc would be a ring inside a ring.
 */
test('draws a bare mark inside the marker rather than a status glyph', () => {
  assert.ok(!/icon-circle-/.test(declarations));
  assert.ok(!/icon-triangle-/.test(declarations));
});

/**
 * The number and the mark are never painted together. Both status rules used
 * to set a colour for the number, both outranked the rule that hides it, and a
 * finished step drew its number and its check on top of each other.
 */
test('hides the number wherever a mark replaces it', () => {
  assert.ok(
    normalized.includes(
      '[data-ui-stepper]:is([data-complete],[data-invalid])[data-part-marker]{color:transparent',
    ) ||
      normalized.includes(
        ':is([data-complete],[data-invalid]) [data-part-marker]{color:transparent'.replace(
          /\s+/g,
          '',
        ),
      ),
  );
  const painted = [
    ...normalized.matchAll(
      /\[data-complete\]:not\(\[data-current\],\[data-invalid\]\)[^{]*\{([^}]*)\}/g,
    ),
  ].map(([, block]) => block);
  for (const block of painted) {
    assert.ok(!/(^|;)color:/.test(block), 'a status rule paints the number under its own mark');
  }
});

/**
 * Where the reader is outranks what they have finished: a step that is both
 * current and complete keeps its number, and an error outranks both. The
 * binding draws no glyph on such a step; the sheet paints its number back.
 */
test('resolves the statuses in the order the vocabulary declares', () => {
  assert.ok(STATE_PRECEDENCE.indexOf('invalid') < STATE_PRECEDENCE.indexOf('complete'));
  assert.ok(STATE_PRECEDENCE.indexOf('current') < STATE_PRECEDENCE.indexOf('complete'));
  assert.ok(
    normalized.includes(
      '[data-current]:not([data-invalid])[data-part-marker]{color:var(--slotted-stepper-marker-color-current',
    ),
  );
});

/** Every selector in the sheet, one per rule, with the at-rules left out. */
function selectors() {
  return [...declarations.matchAll(/(^|\}|\{)([^{}]+)\{/g)]
    .map(([, , selector]) => selector.trim())
    .filter((selector) => selector.length > 0 && !selector.startsWith('@'));
}

test('holds hover and press back for the states that outrank them', () => {
  const weak = selectors().filter((selector) => /:hover|:active(?![-\w])/.test(selector));

  assert.ok(weak.length > 0, 'the family paints no weak state at all');
  for (const selector of weak) {
    assert.ok(
      selector.includes('[data-disabled], [data-loading]'),
      `a weak state is painted without holding back: ${selector}`,
    );
  }
});

/**
 * A step whose header is not a control answers neither the pointer nor the
 * press, because there is nothing to press: `navigation="none"` renders a
 * `span`, and the two rules name the two elements that are controls.
 */
test('answers the pointer only where the header is a control', () => {
  assert.ok(normalized.includes(':is(button,a)[data-part-trigger]:hover'));
  assert.ok(normalized.includes(':is(button,a)[data-part-trigger]:active'));
});

/**
 * The connector fills for a step the reader has walked past, which is distance
 * travelled rather than work completed. It is the family's own arithmetic, on
 * the connector, and not the consumer's claim about the item.
 */
test('fills the connector from where the reader has been', () => {
  assert.ok(normalized.includes('[data-part-separator][data-complete]'));
  assert.ok(normalized.includes('[data-part-item]:last-child[data-part-separator]{display:none'));
});

/**
 * Nothing knows how wide a label is, so nothing can position around it. With
 * the label beside the marker the connector is a flex child that takes the
 * rest; with the label under it, the columns are equal and the next centre is
 * exactly one column away.
 */
test('measures the connector from the marker in both placements', () => {
  assert.ok(
    normalized.includes(
      "[data-label-placement='end'][data-part-separator]{align-self:center;block-size:var(--_rule);flex:11auto",
    ),
  );
  assert.ok(normalized.includes('inset-inline-start:calc(50%+0.5*var(--_marker)+var(--_gap))'));
  assert.ok(normalized.includes('inset-inline-start:calc(0.5*(var(--_marker)-var(--_rule)))'));
});

/**
 * Five labels in a row at 320 pixels are five columns two characters wide.
 * The reflow is a container query, so a stepper in a narrow panel becomes a
 * column while the same stepper on a full page does not.
 */
test('turns the row into a column from its own container', () => {
  assert.ok(normalized.includes('container-type:inline-size'));
  assert.ok(normalized.includes('container-name:slotted-stepper'));
  assert.ok(normalized.includes('@containerslotted-stepper(max-width:30rem)'));
  assert.equal(contract.reflow.breakpoint, '30rem');
});

/**
 * A container query adds no specificity of its own, so the reflow has to match
 * the placement rules it replaces. Without it the row's connector geometry
 * survived the reflow and the column drew four-pixel dots down its side.
 */
test('reaches past the placement rules it replaces', () => {
  const reflow = normalized.slice(normalized.indexOf('@containerslotted-stepper'));
  assert.ok(
    reflow.includes("[data-orientation='horizontal'][data-label-placement][data-part-separator]"),
  );
  assert.ok(
    reflow.includes("[data-orientation='horizontal'][data-label-placement][data-part-trigger]"),
  );
});

/**
 * The ring of a step the reader has not reached holds the 3:1 a non-text
 * element needs; the track behind the flow is decoration and may be fainter.
 */
test('gives the pending ring more weight than the pending track', () => {
  assert.ok(
    normalized.includes(
      '--_pending-ring:var(--slotted-stepper-marker-border,var(--slotted-control-border-color,ButtonBorder))',
    ),
  );
  assert.ok(
    normalized.includes(
      '--_pending-line:var(--slotted-stepper-connector-color,var(--slotted-border-subtle,GrayText))',
    ),
  );
});

test('restates the statuses forced colours would flatten, and names no system colour in a mark', () => {
  assert.ok(normalized.includes('@media(forced-colors:active)'));
  for (const [, block] of declarations.matchAll(/::(?:before|after)[^{]*\{([\s\S]*?)\}/g)) {
    assert.ok(
      !/\b(ButtonText|CanvasText|GrayText|Highlight|HighlightText|Canvas|Mark|MarkText)\b/.test(
        block,
      ),
      'a pseudo-element must not name a system colour',
    );
  }
});

/**
 * A vertical connector leaves the same room at both of its ends. Its end is
 * measured from the bottom of the item, which is where the next marker
 * begins, so an end inset of zero drew a rule that stopped short of the
 * marker above and ran into the marker below: the reviewer read it as
 * misaligned in every vertical flow, `wizard`'s progress column first.
 */
test('leaves the same room above and below a vertical connector', () => {
  const rule =
    /\[data-ui-stepper\]\[data-orientation='vertical'\]\[data-part-separator\]\{([^}]*)\}/.exec(
      normalized,
    );
  assert.ok(rule, 'no vertical connector rule');
  const start = /inset-block-start:calc\(var\(--_marker\)\+(.+?)\);/.exec(rule[1]);
  const end = /inset-block-end:(.+?);/.exec(rule[1]);
  assert.ok(start && end, 'the connector states both block insets');
  assert.equal(end[1], start[1], 'the room below the connector differs from the room above it');
  assert.notEqual(end[1], '0', 'the connector runs into the next marker');
});
