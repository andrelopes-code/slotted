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
    new URL('../../../../specs/components/field/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./field.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./field.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.field;

/** A selector list split at its top-level commas, leaving `:is(a, b)` whole. */
function selectors(list) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < list.length; index += 1) {
    const char = list[index];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ',' && depth === 0) {
      out.push(list.slice(start, index).trim());
      start = index + 1;
    }
  }
  out.push(list.slice(start).trim());
  return out;
}

/**
 * The declarations of every rule whose selector list names `selector`, in
 * source order. A label on the root and a label in the header share their type
 * in one rule, so a rule is found by any selector in its list rather than by
 * the text that happens to precede its brace.
 */
function rule(selector) {
  return [...normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, list]) => selectors(list).includes(selector))
    .map(([, , body]) => body)
    .join('');
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
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

test('renders every part the contract declares, in at least one scene', () => {
  for (const part of member.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `${part} appears in no scene`);
  }
});

/**
 * The three tracks are stated once and never restated, because an element
 * cannot query its own container: `container-type` makes a box a container for
 * what is inside it, so a template changed under `@container` would apply to
 * nothing while the child rules beside it applied normally. The first capture
 * of this family showed the result — a label holding 235 pixels and its control
 * 185 — and this assertion is what keeps the template out of the query.
 */
test('states its tracks outside the container query it cannot answer', () => {
  assert.match(
    rule(root),
    /grid-template-columns:minmax\(0,var\(--slotted-field-label-inline-size/,
  );
  const query = normalized.split('@container slotted-field (min-width:320px){')[1] ?? '';
  assert.ok(
    !query.includes('grid-template-columns'),
    'the container query restates a template the container cannot answer for itself',
  );
});

test('owns the container the side label is measured against', () => {
  assert.match(rule(root), new RegExp(`container-name:${contract.containerName}`));
  assert.match(rule(root), /container-type:inline-size/);
  assert.ok(
    normalized.includes(
      `@container ${contract.containerName} (min-width:${contract.reflowBreakpoint})`,
    ),
    'the reflow breakpoint disagrees with the contract',
  );
});

/**
 * Every child spans the field; the label and the counter say otherwise. That is
 * what lets the description and the error be another family's elements — they
 * are `inline-message` roots, and no rule here selects them to place them.
 */
test('places its children without selecting the messages', () => {
  assert.match(rule(`${root}>*`), /grid-column:1 \/ -1/);
  assert.match(rule(`${ui}>[data-part-label]`), /grid-column:1 \/ -1/);
  assert.match(rule(`${ui}>[data-part-header]`), /grid-column:1 \/ -1/);
  assert.match(rule(`${ui}>[data-part-counter]`), /grid-column:3/);
  assert.ok(
    !normalized.includes(`${ui}>[data-ui-inline-message]{`),
    'the field paints the message family it composes with',
  );
});

/**
 * Two grid items in one cell overlap. A field with a counter stops its label
 * before the counter's track; a field without one keeps the whole row, rather
 * than losing a track's width to a part that is not there.
 */
test('stops the label at the counter only when there is a counter', () => {
  assert.match(rule(`${root}:has(>[data-part-counter])>[data-part-label]`), /grid-column:1 \/ 3/);
});

/**
 * A control spanning to the last track would meet the counter's cell on the
 * first row and be pushed to a row of its own, which is the side layout undone.
 */
test('keeps the side label and its control on one row, and the count in the label track', () => {
  const query = normalized.split('@container slotted-field (min-width:320px){')[1] ?? '';
  assert.ok(
    query.includes(`${root}[data-label-placement='side']>*{align-self:start;grid-column:2 / 3`),
    'a side child stretches to the height of the label beside it',
  );
  assert.ok(
    query.includes(
      `[data-label-placement='side']>[data-part-counter]{grid-column:1;grid-row:2;justify-self:end`,
    ),
    'the counter a field draws beside its control is not where a header puts it',
  );
  assert.ok(
    query.includes(`${root}[data-label-placement='side']>[data-part-header]{grid-column:1`),
    'the header does not take the label track',
  );
});

/**
 * The side label is centerd on the control's first line rather than on the
 * control, so it stays level with the text a reader is typing when the control
 * is a textarea four lines tall. `max()` keeps a label taller than its control
 * from being pushed down.
 */
test('centers the side label on the control’s first line', () => {
  const query = normalized.split('@container slotted-field (min-width:320px){')[1] ?? '';
  assert.match(
    query,
    /padding-block-start:max\(0px,calc\(\(var\(--_control-block-size\) - 1lh\) \/ 2\)\)/,
  );
});

/**
 * A compound noun no language can break otherwise runs out of the label's track
 * and under the control. The necessity word is the one part of the label that
 * is always a word, and it never breaks.
 */
test('breaks a label that cannot fit, and never breaks the necessity word', () => {
  assert.match(rule(`${ui}>[data-part-label]`), /overflow-wrap:anywhere/);
  assert.match(rule(`${ui}>[data-part-label]>[data-part-mark]`), /overflow-wrap:normal/);
});

/**
 * Latin label text in a right-to-left document forms one left-to-right run, and
 * the marker joined it — so the distance written as `margin-inline-start`
 * landed outside the run and `CNPJ` and `(required)` touched.
 */
test('keeps the necessity marker in a bidi run of its own', () => {
  assert.match(rule(`${ui}>[data-part-label]>[data-part-mark]`), /unicode-bidi:isolate/);
  assert.match(rule(`${ui}>[data-part-label]>[data-part-mark]`), /margin-inline-start:/);
});

/**
 * The glyph takes the danger ink and the words do not: `(optional)` is not a
 * severity, and a field that painted it red would be saying the opposite of
 * what it means.
 */
test('paints the mark as a severity and the words as a qualifier', () => {
  assert.match(
    rule(`${ui}>[data-part-label]>[data-part-mark]`),
    /color:var\(--slotted-field-mark-color,var\(--slotted-tone-danger-text\)\)/,
  );
  assert.match(
    rule(
      `${ui}:is([data-necessity='optional'],[data-necessity='words'])>[data-part-label]>[data-part-mark]`,
    ),
    /color:var\(--slotted-field-mark-text-color,var\(--slotted-text-muted\)\)/,
  );
});

/**
 * The label is deliberately not repainted when the field is invalid. A red
 * marker on a red label is a marker nobody can see, and the error already says
 * the same thing in words, in color and in a glyph.
 */
test('never repaints the label for the state the error already carries', () => {
  assert.ok(!normalized.includes(`${root}[data-invalid]>[data-part-label]{`));
});

/**
 * `disabled` sits above `invalid` in `STATE_PRECEDENCE`. A control nobody can
 * type in is not over a limit; it is off.
 */
test('holds the counter’s limit back for the stronger state', () => {
  assert.match(
    rule(`${root}[data-disabled]>[data-part-counter][data-invalid]`),
    /color:var\(--slotted-disabled-foreground\)/,
  );
});

/**
 * A count that jitters as it counts is a count the eye follows instead of the
 * field, and the change from under the limit to over it is a value moving —
 * which is the one thing in this family worth animating.
 */
test('counts in tabular figures and moves only the color', () => {
  assert.match(rule(`${ui}>[data-part-counter]`), /font-variant-numeric:tabular-nums/);
  assert.match(
    rule(`${ui}>[data-part-counter]`),
    /transition:color var\(--slotted-control-transition-duration\)/,
  );
});

/**
 * A message with nothing to say is withdrawn rather than left as an empty line;
 * `[data-reserve]` is the exception a form uses so nothing below it moves when
 * the error arrives.
 */
test('withdraws an empty message unless the form asked for its line', () => {
  assert.match(
    normalized,
    new RegExp(
      `\\[data-ui-inline-message\\]:not\\(\\[data-reserve\\]\\):has\\(\\[data-part-text\\]:empty\\)\\{display:none`,
    ),
  );
});

/** The whole of what the field does to a control it does not own. */
test('lets the control shrink and touches nothing else about it', () => {
  assert.equal(rule(`${ui}>[data-part-control]`).trim(), 'min-inline-size:0;');
});

/**
 * F1. Help under a field is muted text at the regular weight with no mark; an
 * outcome — error or success — carries the tone's own silhouette at the type's
 * size (`inline-message`, R5), the tone's ink, and one weight up. The size is
 * one step under the smallest control type, from the type scale. The selector
 * carries the root's part so it outweighs the message family's own root rule.
 */
test('sets the type of what the field says: xs, and a weight up for an outcome', () => {
  const message = rule(`${root}>[data-ui-inline-message]`);
  assert.match(message, /font-size:var\(--slotted-font-size-xs,0\.75rem\)/);
  for (const tone of ['danger', 'success']) {
    assert.ok(
      normalized.includes(`${root}>[data-ui-inline-message][data-tone='${tone}']`),
      `${tone} is not set a weight up`,
    );
  }
  const outcome = normalized.split(`${root}>[data-ui-inline-message][data-tone='danger']`)[1];
  assert.match(outcome ?? '', /^,[^{]*\{font-weight:var\(--slotted-font-weight-medium,500\);\}/);
  assert.equal(contract.messageMark, 'none', 'the field asks for a mark again (F2)');
  assert.ok(!/data-mark="(?:dot|glyph)"/.test(fragment), 'the fragment still draws a mark');
});

/**
 * A field in a stretched track — a dialog body filling a phone's height — had
 * its rows share the surplus: the label stood a finger's width from the
 * control it names. A field is as tall as its rows.
 */
test('never distributes surplus height between its rows', () => {
  assert.match(declarations, /\[data-ui-field\]\[data-part-root\][^}]*align-content:\s*start/);
});

/**
 * The header aligns what it holds on the label's first baseline, wraps when it
 * runs out of room, and puts the action and the counter at its end. ReUI
 * centers every item of the same row (`items-center`), which sets a 13-pixel
 * label and a 12-pixel count on one center instead of one line of text.
 */
test('sets the header on the label’s baseline and ends it with the action and the count', () => {
  const header = rule(`${ui}>[data-part-header]`);
  assert.match(header, /align-items:baseline/);
  assert.match(header, /display:flex/);
  assert.match(header, /flex-wrap:wrap/);
  assert.match(rule(`${ui}>[data-part-header]>[data-part-action]`), /margin-inline-start:auto/);
  assert.match(rule(`${ui}>[data-part-header]>[data-part-counter]`), /margin-inline-start:auto/);
});

/**
 * Nothing in the header makes the row taller than the label. The help gives
 * back the difference between its box and the label's line, and never stands
 * shorter than that line — at dense the inside of a control is 16 pixels and
 * the line 17.39, and a shorter button overflowed downward and grew the row.
 * The badges of the indicator are centerd on the line rather than set on its
 * baseline, where their inset stood them 1.77 pixels above it.
 */
test('keeps the label row as tall as the label', () => {
  const help = rule(`${ui}>[data-part-header]>[data-part-help]`);
  assert.match(help, /--_box:max\(min\(/);
  assert.match(help, /,1lh\);/);
  assert.match(help, /margin-block:calc\(/);
  assert.match(rule(`${ui}>[data-part-header]>[data-part-indicator]`), /align-self:center/);
});

/**
 * The action speaks the vocabulary `link` settled for text that answers a
 * pointer: accent ink, a hover a third of the way to the body color with the
 * underline drawn, a press two thirds of the way. The press differs from the
 * hover, which ReUI's does not.
 */
test('answers the pointer on the action the way a link does', () => {
  const hover = normalized.match(
    /\[data-part-action\]:not\(:disabled,\[aria-disabled='true'\]\):hover\{([^}]*)\}/,
  )?.[1];
  const active = normalized.match(
    /\[data-part-action\]:not\(:disabled,\[aria-disabled='true'\]\):active\{([^}]*)\}/,
  )?.[1];
  assert.match(hover ?? '', /65%/);
  assert.match(active ?? '', /35%/);
  assert.match(hover ?? '', /text-decoration-color:currentColor/);
});

/** The glyph sits on the band between the capitals and the lowercase. */
test('centers the help glyph on the label’s text rather than on its line box', () => {
  assert.match(
    rule(`${ui}>[data-part-header]>[data-part-help]>[data-ui-icon]`),
    /vertical-align:calc\(\(\(1cap \+ 1ex\) \/ 2 - var\(--_help-glyph\)\) \/ 2\)/,
  );
});

/** The help and the action stay operable when the field is disabled. */
test('leaves the help and the action alone on a disabled field', () => {
  for (const part of contract.disabledLeaves) {
    assert.ok(
      !normalized.includes(
        `${root}[data-disabled]>[data-part-header]>[data-part-${part.toLowerCase()}]`,
      ),
      `a disabled field repaints its ${part}`,
    );
  }
});
