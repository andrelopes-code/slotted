import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;
const specs = new URL('../../../specs/components/', import.meta.url).pathname;
const EDGE = '--slotted-control-invalid-edge-width';

/**
 * Color alone does not say a control is wrong (WCAG 1.4.1): in `high-contrast`
 * the control edge, `--slotted-tone-danger-border` and both focus rings are one
 * black. Every family that paints an invalid state therefore adds width as
 * well as color, and the width is `--slotted-control-invalid-edge-width` —
 * read directly, or through a family token that falls back to it — so one
 * token retunes the cue everywhere.
 *
 * A family listed here states invalid and draws no edge for it, and the value
 * says where the non-color cue lives instead.
 */
const ELSEWHERE = {
  'checkbox-group': 'each checkbox in the group takes `data-invalid` and draws its own edge',
  'color-picker':
    'the panel has no frame; the binding marks its text input, a `text-field` frame, invalid whenever the picker is, and that frame draws the edge',
  'date-picker': 'the frame is the composed `date-field`, which takes `data-invalid`',
  'datetime-picker': 'the frame is the composed `datetime-field`, which takes `data-invalid`',
  field: 'a counter past its limit says so in figures and in weight',
  'field-group': 'it paints no invalid state; its fields paint their own',
  form: 'it paints no invalid state; its fields paint their own',
  message: 'a message that did not go says so in words under its surface',
  stepper: 'a failed step shows a cross in place of its number',
  'time-picker': 'the frame is the composed `time-field`, which takes `data-invalid`',
  wizard:
    'the progress segments are hidden from the tree, the step list draws a failed step’s cross, and the root’s error is a message',
};

/** A selector list split at its own commas, not inside `:is()`, `:not()` or `:has()`. */
function splitSelectorList(list) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const character of list) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  parts.push(current);
  return parts;
}

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const squash = (text) =>
  text.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();

/**
 * The text of a sheet apart from its `@media (forced-colors: active)` groups,
 * and the text inside them: the second is what a forced-colors reader sees
 * on top of the first, with every box shadow removed.
 */
function forcedSplit(css) {
  const text = strip(css);
  let normal = '';
  let forced = '';
  let index = 0;
  const pattern = /@media\s*\(\s*forced-colors:\s*active\s*\)\s*\{/g;
  for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
    normal += text.slice(index, match.index);
    let depth = 1;
    let end = pattern.lastIndex;
    while (depth > 0 && end < text.length) {
      if (text[end] === '{') depth += 1;
      if (text[end] === '}') depth -= 1;
      end += 1;
    }
    forced += text.slice(pattern.lastIndex, end - 1) + '\n';
    index = end;
    pattern.lastIndex = end;
  }
  return { normal: normal + text.slice(index), forced };
}

/** Every innermost block: a style rule's selector list and its declarations. */
function blocks(css) {
  return [...strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selectors: splitSelectorList(squash(selector)).map((item) => item.trim()),
    body: squash(body)
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*:\s*/g, ':'),
  }));
}

function statesInvalid(contract) {
  let found = false;
  (function walk(node) {
    if (node === null || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (key === 'stateAttributes' && value && typeof value === 'object') {
        const attributes = Array.isArray(value)
          ? value
          : [...Object.keys(value), ...Object.values(value)];
        if (attributes.some((attribute) => String(attribute).includes('invalid'))) found = true;
      }
      walk(value);
    }
  })(contract);
  return found;
}

function families() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const css = readdirSync(join(source, entry.name))
        .filter((file) => file.endsWith('.css'))
        .map((file) => readFileSync(join(source, entry.name, file), 'utf8'))
        .join('\n');
      const path = join(specs, entry.name, 'contract.json');
      const contract = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
      return { name: entry.name, css, contract };
    })
    .filter(({ css }) => css.length > 0)
    .filter(
      ({ contract, css }) =>
        /\[data-invalid\]|aria-invalid/.test(strip(css)) ||
        (contract !== null && statesInvalid(contract)),
    );
}

const isInvalid = (selector) => /\[data-invalid\]|\[aria-invalid/.test(selector);
const FOCUS = /:focus(-visible|-within)?\b/;

/** The private properties a family defines from the edge token, directly or through another. */
function edgeProperties(list) {
  const names = new Set();
  let grew = true;
  while (grew) {
    grew = false;
    for (const { body } of list) {
      for (const [, name, value] of body.matchAll(/(--_[a-z0-9-]+):([^;]*)/g)) {
        if (names.has(name)) continue;
        if ([EDGE, ...names].some((read) => value.includes(`var(${read}`))) {
          names.add(name);
          grew = true;
        }
      }
    }
  }
  return [...names];
}

const reading = (list) => [EDGE, ...edgeProperties(list)].map((property) => `var(${property}`);
const DRAWS_EDGE = /box-shadow:[^;]*var\(--_invalid-edge/;

/** Selector text with what does not name the box removed: focus, :has(), :not(), variant and root. */
const frame = (selector) =>
  selector
    .replace(/:has\((?:[^()]|\([^()]*\))*\)/g, '')
    .replace(/:not\((?:[^()]|\([^()]*\))*\)/g, '')
    .replace(new RegExp(FOCUS.source, 'g'), '')
    .replace(/\[data-variant='[a-z-]+'\]/g, '')
    .replace(/\[data-part-root\]/g, '')
    .replace(/\[data-invalid\]/g, '')
    .trim();

/**
 * Per family: the boxes that draw the edge at rest, every focus rule over one
 * of them that repaints its shadow, and the invalid twins that keep the edge.
 */
function focusRules(css) {
  const list = blocks(forcedSplit(css).normal);
  const edges = list
    .filter(
      ({ selectors, body }) =>
        selectors.some(isInvalid) &&
        !selectors.some((selector) => FOCUS.test(selector)) &&
        DRAWS_EDGE.test(body),
    )
    .flatMap(({ selectors }) => selectors.filter(isInvalid).map(frame));
  const twins = new Map();
  for (const { selectors, body } of list) {
    if (!DRAWS_EDGE.test(body)) continue;
    for (const selector of selectors.filter(isInvalid)) {
      twins.set(selector.replace(/\[data-invalid\]/g, ''), { selector, body });
    }
  }
  const focus = [];
  for (const { selectors, body } of list) {
    if (!/(^|;)box-shadow:/.test(body)) continue;
    for (const selector of selectors) {
      if (!FOCUS.test(selector) || /data-invalid/.test(selector)) continue;
      const key = frame(selector);
      const covers = edges.some(
        (edge) => key === edge || (key.startsWith(edge) && key[edge.length] === '['),
      );
      if (covers) focus.push({ selector, body, twin: twins.get(selector) });
    }
  }
  return { list, edges, focus };
}

test('finds the families that state invalid', () => {
  const names = families().map(({ name }) => name);
  for (const name of ['text-field', 'select', 'checkbox', 'radio-group', 'switch', 'listbox']) {
    assert.ok(names.includes(name), `${name} is not seen to state invalid`);
  }
});

test('names in the exemptions only families that state invalid', () => {
  const names = new Set(families().map(({ name }) => name));
  for (const name of Object.keys(ELSEWHERE)) {
    assert.ok(names.has(name), `${name} is exempted and does not state invalid`);
  }
});

test('tells invalid by width as well as color in every family that paints it', () => {
  const missing = [];
  for (const { name, css } of families()) {
    if (name in ELSEWHERE) continue;
    const list = blocks(css);
    const reads = reading(list);
    const drawn = list.some(
      ({ selectors, body }) =>
        selectors.some(isInvalid) && reads.some((read) => body.includes(read)),
    );
    if (!drawn) missing.push(name);
  }
  assert.deepEqual(missing, [], `no invalid rule reads ${EDGE} in: ${missing.join(', ')}`);
});

test('reads a family edge token only as a step in front of the shared one', () => {
  for (const { name, css } of families()) {
    for (const [, family] of strip(css).matchAll(
      /var\(\s*(--slotted-[a-z0-9-]+-invalid-edge-width)/g,
    )) {
      if (family === EDGE) continue;
      assert.equal(family, `--slotted-${name}-invalid-edge-width`, `${name} reads ${family}`);
      assert.match(
        squash(strip(css)),
        new RegExp(`var\\(${family},\\s?var\\(${EDGE}`),
        `${family} does not fall back to ${EDGE}`,
      );
    }
  }
});

/**
 * A frame whose focus rule repaints its shadow would lose the edge exactly
 * when the reader is in it, because the focus rule outranks the invalid one.
 * Each such focus rule has an invalid twin — the same selector with
 * `[data-invalid]` written into it — that keeps the edge in the list.
 */
test('keeps the edge under focus wherever focus repaints the frame’s shadow', () => {
  const failures = [];
  for (const { name, css } of families()) {
    if (name in ELSEWHERE) continue;
    for (const { selector, twin } of focusRules(css).focus) {
      if (twin === undefined) failures.push(`${name}: ${selector}`);
    }
  }
  assert.deepEqual(failures, [], `focus drops the invalid edge:\n${failures.join('\n')}`);
});

/**
 * A ring drawn inside the box — the `plain` variant's, at minus the ring
 * offset — lies over the border and over an edge only as wide as the border,
 * so an invalid ring and a valid one were the same pixels. The twin of such a
 * rule takes the edge past the ring: its spread reads the ring offset.
 */
test('takes the edge past a ring drawn inside the box', () => {
  const failures = [];
  for (const { name, css } of families()) {
    if (name in ELSEWHERE) continue;
    for (const { body, twin } of focusRules(css).focus) {
      const inward = /outline-offset:calc\(var\(--slotted-focus-ring-offset[^;]*\* -1\)/.test(body);
      if (inward && twin && !/box-shadow:[^;]*var\(--slotted-focus-ring-offset/.test(twin.body)) {
        failures.push(`${name}: ${twin.selector}`);
      }
    }
  }
  assert.deepEqual(failures, [], `the inward ring covers the edge:\n${failures.join('\n')}`);
});

/**
 * The frame's ring answers a control inside it, and that control's own ring —
 * the browser's, unless the family removes it — would be drawn inside the
 * frame over the edge.
 */
test('leaves no inner control’s own ring over the frame’s edge', () => {
  const failures = [];
  for (const { name, css } of families()) {
    if (name in ELSEWHERE) continue;
    const { list, focus } = focusRules(css);
    for (const { selector } of focus) {
      const inner =
        selector
          .replace(/:not\((?:[^()]|\([^()]*\))*\)/g, '')
          .match(/:has\((?:[^()]|\([^()]*\))*\)/g)
          ?.join(' ') ?? '';
      for (const [, part] of inner.matchAll(/\[data-part-([a-z-]+)\]:focus(?:-visible)?\b/g)) {
        const quiet = list.some(
          ({ selectors, body }) =>
            selectors.some((item) => item.includes(`[data-part-${part.toLowerCase()}]`)) &&
            /(^|;)outline:(none|0)(;|$)/.test(body),
        );
        if (!quiet) failures.push(`${name}: ${part}`);
      }
    }
  }
  assert.deepEqual([...new Set(failures)], [], 'an inner control keeps its own ring');
});

/**
 * Forced colors remove every box shadow, so an edge drawn as one is gone for
 * the reader who asked for the system's colors. Each family that draws its
 * edge so restates it there as an outline or a border, which survive, and
 * gives each focused twin a double ring, which a valid ring is not — or,
 * where the focus is a ring of its own inside the frame, the edge again.
 */
test('keeps a width under forced colors where the edge is a shadow', () => {
  const failures = [];
  for (const { name, css } of families()) {
    if (name in ELSEWHERE) continue;
    const { normal, forced } = forcedSplit(css);
    const list = blocks(normal);
    const reads = reading(list);
    const shadowed = list.some(
      ({ selectors, body }) =>
        selectors.some(isInvalid) &&
        /[:\s]inset\s|box-shadow:[^;]*var\(--_invalid-edge\)/.test(body) &&
        reads.some((read) => body.includes(read)),
    );
    if (!shadowed) continue;
    const forcedList = blocks(forced);
    const kept = forcedList.some(
      ({ selectors, body }) =>
        selectors.some(isInvalid) &&
        /(^|;)(outline|border)[a-z-]*:[^;]*var\(/.test(body) &&
        reads.some((read) => body.includes(read)),
    );
    if (!kept) failures.push(`${name}: no width under forced colors`);
    for (const { twin } of focusRules(css).focus) {
      if (twin === undefined) continue;
      const doubled = forcedList.some(
        ({ selectors, body }) =>
          selectors.includes(twin.selector) &&
          (/outline:[^;]*double/.test(body) || reads.some((read) => body.includes(read))),
      );
      if (!doubled) failures.push(`${name}: ${twin.selector}`);
    }
  }
  assert.deepEqual(failures, [], failures.join('\n'));
});
