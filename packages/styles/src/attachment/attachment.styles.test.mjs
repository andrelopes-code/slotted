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
    new URL('../../../../specs/components/attachment/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./attachment.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./attachment.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Whitespace collapsed and parentheses closed up, so an assertion spells one form. */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.attachment;

/** The declarations of the first rule whose selector is exactly `selector`. */
function rule(selector) {
  for (const chunk of normalized.split('}')) {
    const parts = chunk.split('{');
    if (parts.length > 1 && parts.at(-2)?.trim() === selector) return parts.at(-1) ?? '';
  }
  return '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}[data-part-root]{`), 'no base rule keyed on data-ui');
  assert.ok(normalized.includes(`${ui}[data-part-group]{`), 'no rule for the set');
});

test('styles every part the contract declares', () => {
  for (const part of member.parts) {
    if (part === 'root') continue;
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

test('renders every part, state, kind and arrangement somewhere on the harness page', () => {
  for (const part of member.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `${part} is on no harness scene`);
  }
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.ok(fragment.includes(attribute), `${state} is exercised on no harness scene`);
  }
  for (const kind of Object.keys(contract.kinds)) {
    assert.ok(fragment.includes(`data-kind="${kind}"`), `${kind} is drawn on no harness scene`);
  }
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      assert.ok(fragment.includes(`data-${axis}="${value}"`), `${axis} ${value} is on no scene`);
    }
  }
});

/**
 * Every kind reads the tile the contract names, which is the one `upload`
 * reads: a PDF is the same red in a reply as it is in the upload it came from.
 */
test('paints every kind from the shared scale', () => {
  for (const [kind, entry] of Object.entries(contract.kinds)) {
    if (kind === 'other') {
      assert.match(
        rule(`${ui} [data-part-preview]`),
        /--_kind-tile:var\(--slotted-upload-kind-other\)/,
      );
      continue;
    }
    assert.match(
      rule(`${ui} [data-part-preview][data-kind='${kind}']`),
      new RegExp(`--_kind-tile:var\\(${entry.tile}\\)`),
      `${kind} does not read ${entry.tile}`,
    );
  }
  assert.match(rule(`${ui} [data-part-preview]`), /color:var\(--slotted-upload-kind-foreground\)/);
});

/**
 * The trigger is the whole attachment's target: its `::after` covers the
 * root, which is the positioned box, and `actions` stands above it.
 */
test('stretches the target over the root and lifts the actions above it', () => {
  assert.match(rule(`${ui}[data-part-root]`), /position:relative/);
  const stretch = rule(`${ui} [data-part-trigger]::after`);
  assert.match(stretch, /content:''/);
  assert.match(stretch, /inset:0/);
  assert.match(stretch, /position:absolute/);
  const actions = rule(`${ui} [data-part-actions]`);
  assert.match(actions, /position:relative/);
  assert.match(actions, /z-index:1/);
});

/**
 * The ring is drawn around the attachment, and the browser's own ring on the
 * trigger is suppressed so the two never stand at once.
 */
test('rings the attachment when its trigger holds focus, and only once', () => {
  assert.match(rule(`${ui} [data-part-trigger]:focus-visible`), /outline:none/);
  assert.match(
    normalized,
    /\[data-part-root\]:has\(> \[data-part-body\] > \[data-part-trigger\]:focus-visible\)\{outline:var\(--slotted-focus-ring-width,2px\) solid var\(--slotted-focus-ring-color,Highlight\);outline-offset:var\(--slotted-focus-ring-offset,2px\)/,
  );
});

/**
 * A disabled or loading attachment refuses its trigger, so the fill that
 * promises a press is held back for both.
 */
test('holds the pointer fill back while the file cannot be opened', () => {
  for (const state of ['hover', 'active']) {
    const selector = `${ui}[data-part-root]:not([data-disabled]):not([data-loading]):has(> [data-part-body] > [data-part-trigger]:${state})`;
    const body = rule(selector);
    assert.match(body, new RegExp(`--_fill:var\\(--_fill-${state}\\)`), `no ${state} fill`);
  }
  assert.match(rule(`${ui}[data-part-root]`), /background-color:var\(--_fill\)/);
});

/**
 * The actions are inner controls (R2), held to `inner-control.test.mjs`'s
 * rules here because that list belongs to the families it already names: no
 * ground at rest, a ground step on hover and a larger one on press, the ring
 * inside the box, a 24-pixel floor and a 44-pixel halo on a finger.
 */
test('draws the actions as inner controls', () => {
  const base = rule(`${ui} [data-part-action],${ui} [data-part-remove]`);
  assert.match(base, /background-color:transparent/);
  assert.match(base, /padding:0/);
  assert.match(base, /block-size:var\(--_action-size\)/);
  assert.match(base, /inline-size:var\(--_action-size\)/);
  assert.match(
    normalized,
    /--_action-size:var\(--slotted-attachment-action-size,max\(var\(--slotted-target-min,24px\)/,
  );
  assert.match(
    normalized,
    /--_action-glyph-size:max\(var\(--slotted-attachment-icon-size-min,14px\)/,
  );
  assert.match(
    rule(
      `${ui} [data-part-action]:not(:disabled):not([aria-disabled='true']):hover,${ui} [data-part-remove]:not(:disabled):not([aria-disabled='true']):hover`,
    ),
    /^background-color:var\(--_state-hover\);?$/,
  );
  assert.match(
    rule(
      `${ui} [data-part-action]:not(:disabled):not([aria-disabled='true']):active,${ui} [data-part-remove]:not(:disabled):not([aria-disabled='true']):active`,
    ),
    /^background-color:var\(--_state-active\);?$/,
  );
  assert.match(
    rule(`${ui} [data-part-action]:focus-visible,${ui} [data-part-remove]:focus-visible`),
    /outline-offset:calc\(-1 \* var\(--slotted-focus-ring-width,2px\)\)/,
  );
  assert.match(normalized, /@media \(pointer:coarse\)/);
  assert.match(normalized, /--slotted-target-comfortable,44px/);
});

/**
 * The name shrinks and the extension does not; the name keeps its own
 * direction, and the leading is a whole pixel so every edge under it is.
 */
test('truncates the stem, keeps the extension, and isolates the run', () => {
  assert.match(rule(`${ui} [data-part-name]`), /text-overflow:ellipsis/);
  assert.match(rule(`${ui} [data-part-extension]`), /flex:none/);
  assert.match(rule(`${ui} [data-part-filename]`), /unicode-bidi:isolate/);
  assert.match(
    normalized,
    /--_title-leading:round\(up,calc\(var\(--_font-size\) \* var\(--_line-height\)\),1px\)/,
  );
  assert.match(
    normalized,
    /--_detail-leading:round\(up,calc\(var\(--_detail-size\) \* var\(--_line-height\)\),1px\)/,
  );
});

/** A failed attachment says so in line as well as in colour. */
test('marks a failed file with an edge that survives a scheme with no tint', () => {
  const invalid = rule(`${ui}[data-part-root][data-invalid]`);
  assert.match(invalid, /--_surface:var\(--slotted-tone-danger-surface\)/);
  assert.match(
    invalid,
    /--_invalid-edge-width:var\(--slotted-control-invalid-edge-width,var\(--_border-width\)\)/,
  );
  assert.match(invalid, /box-shadow:inset 0 0 0 var\(--_invalid-edge-width\) var\(--_edge\)/);
});

test('arrives on the motion scale and leaves the platform to collapse it', () => {
  assert.match(normalized, /@starting-style\{\[data-ui-attachment\]\[data-part-root\]\{opacity:0/);
  assert.match(
    rule(`${ui}[data-part-root]`),
    /opacity var\(--slotted-duration-medium\) var\(--slotted-easing-enter\)/,
  );
  assert.doesNotMatch(declarations, /\d+m?s\b(?![^(]*\))/, 'a literal duration');
  assert.doesNotMatch(declarations, /transition:[^;]*\ball\b/);
});

test('uses logical properties only', () => {
  assert.doesNotMatch(declarations, /\b(?:margin|padding|border)-(?:left|right|top|bottom)\b/);
  assert.doesNotMatch(declarations, /(?<![-\w])(?:left|right|top|bottom):/);
  assert.doesNotMatch(declarations, /(?<![-\w])(?:width|height):/);
});

test('answers forced colours where a mix into Canvas would say nothing', () => {
  const forced = normalized.split('@media (forced-colors:active){')[1] ?? '';
  assert.match(forced, /border-color:Highlight/);
  assert.match(forced, /background-color:Highlight;color:HighlightText/);
});

/** Arrangements that keep every card a whole pixel wide. */
test('lays the set out in three arrangements', () => {
  assert.match(rule(`${ui}[data-part-group][data-layout='grid']`), /display:grid/);
  assert.match(
    rule(`${ui}[data-part-group][data-layout='grid'][data-orientation='vertical']`),
    /grid-template-columns:repeat\(auto-fill,var\(--_card-size\)\)/,
  );
  const strip = rule(`${ui}[data-part-group][data-layout='strip']`);
  assert.match(strip, /overflow-x:auto/);
  assert.match(strip, /scroll-snap-type:inline proximity/);
});
