import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * The fragment as its regular expressions read it: the selector keys the
 * stylesheet matches are left out, and every tag stands on one line, as it did
 * before the formatter wrapped the tags the keys made long.
 */
function withoutSelectorKeys(markup) {
  return markup
    .replace(/\s+data-(?:part|ui)-[a-z0-9-]+=""/g, '')
    .replace(/<[^<>]+>/g, (tag) => tag.replace(/\s+/g, ' ').replace(/ (\/?>)$/, '$1'));
}

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/code-block/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./code-block.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./code-block.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

/**
 * Every part the contract declares is drawn here except `body`, which is a
 * `scroll-area` root worn as `data-ui` and styled by that family's sheet; this
 * sheet only rounds it and bounds it.
 */
test('styles every part the contract declares', () => {
  for (const part of contract.members.codeBlock.parts) {
    const selector =
      part === 'root' ? '[data-ui-code-block]{' : `[data-part-${part.toLowerCase()}]`;
    assert.ok(normalized.includes(selector), `Missing part ${part}`);
  }
  assert.ok(
    normalized.includes('[data-part-body]>[data-part-viewport]'),
    'reaches scroll-area’s viewport, never a scroll measure of its own',
  );
  assert.doesNotMatch(declarations, /overflow(-x|-inline)?:\s*auto/);
});

/**
 * The fence agrees with `prose`'s in every measure, so a Markdown page that
 * upgrades a fence to this family moves nothing.
 */
test('draws the fence prose draws', () => {
  assert.ok(
    normalized.includes(
      '--_ground:var(--slotted-code-block-surface,var(--slotted-surface-sunken,Canvas))',
    ),
  );
  assert.ok(
    normalized.includes(
      '--_edge:var(--slotted-code-block-border-color,var(--slotted-border-subtle,GrayText))',
    ),
  );
  assert.ok(
    normalized.includes('--_radius:var(--slotted-code-block-radius,var(--slotted-radius-md,6px))'),
  );
  assert.ok(
    normalized.includes(
      '--_inset-block:var(--slotted-code-block-inset-block,var(--slotted-space-5,0.75rem))',
    ),
  );
  assert.ok(
    normalized.includes(
      '--_inset-inline:var(--slotted-code-block-inset-inline,var(--slotted-space-6,1rem))',
    ),
  );
  assert.ok(
    normalized.includes('[data-part-pre]{direction:ltr;'),
    'code reads left to right whatever the page does',
  );
});

/**
 * Twelve scopes, each from the theme's own scale and never from an engine, so
 * a scheme switch reaches every colour. Each falls back to a foundation token,
 * because the scale is in the component layer.
 */
test('paints every scope from the code scale', () => {
  for (const scope of contract.scopes) {
    const fallback =
      scope === 'comment' ? 'var(--slotted-text-muted,GrayText)' : 'var(--slotted-text,CanvasText)';
    assert.ok(
      normalized.includes(`[data-token='${scope}']{color:var(--slotted-code-${scope},${fallback})`),
      `Missing scope ${scope}`,
    );
  }
  assert.doesNotMatch(declarations, /color:\s*#[0-9a-f]{3,8}/i, 'no colour is stated');
});

/**
 * A line is a grid row of three columns, the two gutters never selectable, so a
 * selection across the block copies code and nothing else. The number is in
 * the DOM whether or not it is drawn, so turning numbers on moves no line.
 */
test('lays a line out as a grid whose gutters cannot be selected', () => {
  assert.ok(
    normalized.includes(
      '[data-part-line]{--_indent:calc(var(--slotted-code-block-indent,0)*1ch);box-sizing:border-box;display:grid;grid-template-columns:var(--_number,0px)var(--_marker,0px)minmax(0,1fr);',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-part-number]{color:var(--_muted);font-variant-numeric:tabular-nums;grid-column:1;padding-inline-end:var(--slotted-space-4,0.5rem);text-align:end;user-select:none;}',
    ),
  );
  assert.ok(
    normalized.includes('[data-part-marker]{grid-column:2;text-align:center;user-select:none;}'),
  );
  assert.ok(
    normalized.includes(
      '[data-ui-code-block]:not([data-line-numbers])[data-part-number]{display:none;}',
    ),
  );
  assert.ok(
    normalized.includes('--_gutter:calc(var(--_digits)*1ch+var(--slotted-space-4,0.5rem)*2)'),
  );
});

/** Under wrap a continuation keeps the code's own indent, measured once per line in characters. */
test('wraps at the box and indents the continuation to the line’s own indent', () => {
  assert.ok(
    normalized.includes(
      '[data-ui-code-block][data-wrap][data-part-pre]{min-inline-size:0;overflow-wrap:anywhere;white-space:pre-wrap;}',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-ui-code-block][data-wrap][data-part-line]>[data-part-text]{padding-inline-start:var(--_indent);text-indent:calc(var(--_indent)*-1);}',
    ),
  );
});

/**
 * A mark tints the ground from the tone's text at the band share the highlight
 * scale states, never from the tone's surface, which would take `string` in
 * the light scheme below the text ratio. The diff pair carries a sign in the
 * gutter as text, never as an icon, and never on the clipboard.
 */
test('marks a line with a tint of the tone’s text, a bar, or a sign', () => {
  assert.ok(normalized.includes('--_tint:var(--slotted-highlight-tint-opacity,0.075)'));
  assert.ok(
    normalized.includes(
      '[data-part-line][data-mark]{--_tone:var(--slotted-tone-accent-text,CanvasText);background-color:color-mix(insrgb,var(--_tone)calc(var(--_tint)*100%),transparent);}',
    ),
  );
  const marks = normalized.slice(
    normalized.indexOf('[data-part-line][data-mark]{'),
    normalized.indexOf('[data-part-line][data-dim]{'),
  );
  assert.doesNotMatch(marks, /-surface/, 'a mark never fills from a tone surface');
  for (const [mark, tone] of [
    ['add', 'success'],
    ['remove', 'danger'],
    ['error', 'danger'],
    ['warning', 'warning'],
  ]) {
    assert.ok(
      normalized.includes(
        `[data-mark='${mark}']{--_tone:var(--slotted-tone-${tone}-text,CanvasText);}`,
      ),
      mark,
    );
  }
  assert.ok(
    normalized.includes(
      "[data-mark='add']>[data-part-marker]::before{color:var(--_tone);content:'+';}",
    ),
  );
  assert.ok(
    normalized.includes(
      "[data-mark='remove']>[data-part-marker]::before{color:var(--_tone);content:'−';}",
    ),
  );
  assert.ok(
    normalized.includes('[data-part-line][data-dim]{color:var(--_muted);filter:blur(1px);'),
  );
});

/**
 * The two controls are description-list's: the copy glyph, the check when
 * done, the shared ring. The glyphs are `Icon` elements the binding draws; the
 * sheet sizes them from the control and paints none of its own.
 */
test('sizes the glyphs of the copy and wrap controls and borrows the ring', () => {
  assert.ok(
    normalized.includes(
      '[data-ui-code-block]:is([data-part-copy],[data-part-wrap]){--slotted-icon-size:var(--_icon);',
    ),
  );
  assert.ok(!/mask-image:var\(--slotted-(icon|code-block)-/.test(normalized), 'no glyph is a mask');
  assert.ok(
    normalized.includes(
      '[data-part-copy][data-complete]{color:var(--slotted-tone-success-text,CanvasText);}',
    ),
  );
  assert.ok(
    normalized.includes(
      ':focus-visible{outline:var(--slotted-focus-ring-width,2px)solidvar(--slotted-focus-ring-color,Highlight);outline-offset:var(--slotted-focus-ring-offset,2px);}',
    ),
  );
  assert.doesNotMatch(declarations, /content:\s*'[^'+−]/, 'no character is an icon');
});

/** The collapse is a maximum and a mask; print releases it and wraps, so the paper holds the whole block. */
test('collapses behind the reveal control and prints the whole block', () => {
  assert.ok(
    normalized.includes(
      '[data-ui-code-block][data-collapse]:not([data-revealed])>[data-part-body]>[data-part-viewport]{',
    ),
  );
  assert.match(
    declarations,
    /@media print[\s\S]*white-space: pre-wrap;[\s\S]*max-block-size: none;/,
  );
});

test('gives the palette back under forced colours and stops the blur under reduced motion', () => {
  assert.match(
    declarations,
    /@media \(forced-colors: active\)[\s\S]*\[data-mark\]\s*\{\s*background-color: transparent;/,
  );
  assert.match(
    declarations,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\[data-dim\]\s*\{\s*filter: none;/,
  );
});

test('renders every part, every state and every mark in the harness fragment', () => {
  for (const part of contract.members.codeBlock.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `harness renders no ${part}`);
  }
  for (const state of Object.values(contract.stateAttributes)) {
    assert.ok(fragment.includes(state), `harness exercises no ${state}`);
  }
  for (const mark of ['highlight', 'add', 'remove', 'error', 'warning']) {
    assert.ok(fragment.includes(`data-mark="${mark}"`), `harness exercises no ${mark}`);
  }
  for (const attribute of [
    'data-dim',
    'data-wrap',
    'data-line-numbers',
    'data-collapse',
    'data-ui="scroll-area"',
    'data-ui="skeleton"',
  ]) {
    assert.ok(fragment.includes(attribute), `harness exercises no ${attribute}`);
  }
  for (const scope of contract.scopes) {
    assert.ok(fragment.includes(`data-token="${scope}"`), `harness paints no ${scope}`);
  }
});
