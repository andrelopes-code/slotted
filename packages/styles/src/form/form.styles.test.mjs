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
  readFileSync(new URL('../../../../specs/components/form/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./form.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./form.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.form;

/** The declarations of the first rule whose selector starts with `selector`. */
function rule(selector) {
  return (normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '').replace(/\s/g, '');
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const part of member.parts) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

/**
 * Vertical rhythm between fields belongs to `stack` and to `field-group`, which
 * already own arrangement. A form that laid its own children out would be a
 * second answer to a question two families have answered.
 */
test('arranges nothing but its own two parts', () => {
  const form = rule(root);
  assert.match(form, /display:block/);
  assert.ok(!/gap:/.test(form), 'the space between fields is not this family’s');
  assert.ok(!/flex-direction/.test(form), 'the column of fields is not this family’s');
  /* It does take the width it is offered: a form whose intrinsic width is its
     longest word prints one character per line in a shrink-to-fit stage. */
  assert.match(form, /inline-size:100%/);
  assert.match(form, /min-inline-size:0/);
});

/**
 * The summary is a danger-toned panel because a reader arriving at the top of a
 * page after a failed submit has to find it before they read it. The thicker
 * start edge is what survives the `high-contrast` scheme, where every border is
 * the same black.
 */
test('draws the summary as a toned panel with a heavier reading edge', () => {
  const summary = rule(`${ui}[data-part-summary]`);
  assert.match(summary, /background-color:var\(--slotted-form-summary-background/);
  assert.match(summary, /border-inline-start-width:var\(--slotted-border-width-thick,2px\)/);
  assert.match(summary, /color:var\(--slotted-form-summary-color/);
});

/**
 * The region is focusable so the summary can be reached rather than merely
 * announced. A `tabindex="-1"` target that showed nothing on focus would move a
 * reader somewhere they cannot see.
 */
test('shows the summary when focus is moved to it', () => {
  const focused = rule(`${ui}[data-part-summary]:focus-visible`);
  assert.match(focused, /outline:var\(--slotted-focus-ring-width,2px\)solid/);
});

/**
 * A hundred errors is a real answer from a real server. The list scrolls rather
 * than truncating, because `docs/build-briefing.md` refuses to take content
 * out of the DOM, and the ceiling is in lines of its own type rather than a
 * fraction of the viewport.
 */
test('scrolls a long list instead of cutting it out of the DOM', () => {
  const list = rule(`${ui}[data-part-summary]>[data-part-summary-list]`);
  assert.match(list, /overflow-y:auto/);
  assert.match(list, /max-block-size:calc\(12em\*var\(--slotted-line-height-sm/);
  assert.ok(!/vh/.test(list), 'a summary that grew with the screen would push the actions off it');
  assert.match(list, /list-style:none/);
});

/**
 * The form is the container, not the action row. A container cannot answer its
 * own query, so a `container-type` on the row left the reflow matching nothing.
 */
test('makes the form the container the action row is measured against', () => {
  const form = rule(root);
  assert.match(form, /container-type:inline-size/);
  assert.match(form, new RegExp(`container-name:${contract.containerName}`));

  const actions = rule(`${ui}[data-part-actions]`);
  assert.ok(!/container-type/.test(actions), 'a container cannot answer its own query');
});

/**
 * Below the breakpoint the row becomes a column, every action takes the whole
 * width, and the order reverses: in a row the primary action sits at the
 * reading end, and in a column the reader's thumb is at the bottom.
 */
test('reflows the action row from the container rather than from the viewport', () => {
  assert.match(css, new RegExp(`@container ${contract.containerName} \\(max-width: 360px\\)`));
  assert.ok(!/@media \(max-width/.test(css), 'a viewport query does not decide component layout');

  const query =
    normalized.split(`@container ${contract.containerName} (max-width:360px){`)[1] ?? '';
  assert.match(query, /flex-direction:column-reverse/);
  assert.match(query, /inline-size:100%/);
});

test('offers every alignment the contract declares', () => {
  for (const align of contract.axes.align) {
    if (align === 'end') continue;
    assert.ok(
      normalized.includes(`[data-part-actions][data-align='${align}']`),
      `no rule answers data-align="${align}"`,
    );
  }
  assert.match(rule(`${ui}[data-part-actions]`), /justify-content:flex-end/);
});

/**
 * A form waiting on its own submission says so with the cursor as well as with
 * `aria-busy`. It does not dim itself: a form that hid its own values while it
 * saved them would hide what the reader is waiting on.
 */
test('says it is busy without hiding what it holds', () => {
  const loading = rule(`${root}[data-loading]`);
  assert.match(loading, /cursor:progress/);
  assert.ok(!/opacity/.test(loading), 'a form that faded itself would hide its own values');
});

test('takes no duration of its own', () => {
  assert.ok(!/\d+m?s(?![\w-])/.test(declarations), 'a literal duration escapes the reduced query');
});

/**
 * The theme flattens a tone surface to `Canvas` under forced colours, which
 * would leave the panel with nothing but its border.
 */
test('keeps the summary’s reading edge under forced colours', () => {
  const forced = normalized.split('@media (forced-colors:active){')[1] ?? '';
  assert.match(forced, /border-inline-start-color:Highlight/);
});

/**
 * The summary and the action row stand anywhere inside the form — a consumer
 * places `summary="none"`'s summary where they choose — and so do other
 * families' parts of the same names: a `table`'s summary row, a `section`'s
 * actions. A rule that reached `[data-part-summary]` as any descendant of the
 * form painted a table's totals as an error panel. The two parts carry the
 * family's identifier, as `skeleton`'s region and `tag`'s group do, and every
 * rule names them by it; the summary's own parts are reached from it with a
 * child combinator.
 */
test('reaches its own parts only, never a nested family’s part of the same name', () => {
  for (const part of ['summary', 'summary-title', 'summary-list', 'summary-item', 'actions']) {
    const descendant = new RegExp(`\\[data-ui-form\\][^{>,]*? \\[data-part-${part}\\]`);
    assert.ok(
      !descendant.test(normalized),
      `a descendant rule reaches ${part} in any family under the form`,
    );
  }
  assert.ok(
    normalized.includes(`${ui}[data-part-summary]{`),
    'the summary is not named by its family',
  );
  assert.ok(
    normalized.includes(`${ui}[data-part-actions]{`),
    'the action row is not named by its family',
  );
  assert.match(
    fragment,
    /data-ui="form"[^>]*data-part="summary"|data-part="summary"[^>]*data-ui="form"/,
  );
  assert.match(fragment, /data-ui="form" data-part="actions"/);
});

test('renders every declared part in the harness fragment', () => {
  for (const part of member.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `the fragment omits ${part}`);
  }
});

test('exercises every declared state in the harness fragment', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.match(fragment, new RegExp(attribute), `the fragment never shows ${state}`);
  }
});

/** The four things the GOV.UK error summary states a summary must do. */
test('renders the summary the sourced component describes', () => {
  assert.match(fragment, /role="alert"/);
  assert.match(fragment, /tabindex="-1"/);
  assert.match(fragment, /data-part="summary-title"/);
  assert.match(fragment, /<a data-part="summary-item" href="#/);
  assert.match(fragment, /<span data-part="summary-item">/, 'an unlinked error has no link');
});

test('writes novalidate on every form in the fragment', () => {
  const forms = fragment.match(/<form[^>]*>/g) ?? [];
  assert.ok(forms.length > 0);
  for (const form of forms) {
    assert.match(form, /novalidate/, `a form without novalidate keeps the browser’s own bubble`);
  }
});
