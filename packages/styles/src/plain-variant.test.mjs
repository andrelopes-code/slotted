import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * The `plain` variant of a field (SL5): a cell that is only a control while it
 * is being used. At rest it has no edge, no lift and no ground of its own —
 * the row it sits in is the ground — and it keeps exactly the box of the
 * other two variants, so the row does not reflow when the pointer crosses it.
 * Hover answers with the neutral subtle surface, one step, and nothing else;
 * the accent edge the other variants take on hover would draw the cell's
 * outline where there is none. Keyboard focus keeps the theme's ring (R3).
 *
 * The box is not the control's own. A `plain` control sits in a cell, a row or
 * another control's frame, and it paints nothing past that box: no corner
 * radius, because the cell has none and a rounded wash inside a square cell is
 * a pill; the focus ring drawn inward, `outline-offset` negated, the way every
 * inner control already draws it, because a ring two pixels outside the
 * control is a ring over the next row's rule; and no lift under focus, because
 * the resting lift was already given up and a shadow that appears only on
 * focus is a control that changes size when it is used. The invalid edge
 * stays: a cell in error has to say so, and it says so square.
 *
 * Twelve families ship the variant with the same values; a form with a `plain`
 * text field beside a `plain` select that is lifted by its resting shadow is
 * a form that looks unfinished.
 */
const FAMILIES = [
  { family: 'select' },
  { family: 'combobox' },
  { family: 'multi-select' },
  { family: 'text-field' },
  { family: 'textarea' },
  { family: 'number-field' },
  { family: 'currency-field' },
  { family: 'date-field' },
  { family: 'time-field' },
  { family: 'datetime-field' },
  { family: 'tags-input' },
  /* The frame is the `control` part, one element in from the root. */
  { family: 'date-range-picker', frame: ' [data-part-control]' },
  { family: 'time-range-picker', frame: ' [data-part-control]' },
  { family: 'datetime-range-picker', frame: ' [data-part-control]' },
  { family: 'entity-picker', frame: ' > [data-part-control]' },
];

const INWARD = 'calc(var(--slotted-focus-ring-offset, 2px) * -1)';

/** Every innermost `selector { declarations }` pair outside a media query. */
function rules(css) {
  const found = [];
  const stack = [];
  let start = 0;
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    if (char === '{') {
      stack.push({
        selector: css
          .slice(start, index)
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .trim(),
        body: index + 1,
      });
      start = index + 1;
    } else if (char === '}') {
      const open = stack.pop();
      if (open && !open.selector.startsWith('@')) {
        found.push({
          selector: open.selector
            .replace(/\s+/g, ' ')
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .trim(),
          body: css.slice(open.body, index).replace(/\/\*[\s\S]*?\*\//g, ''),
          media: stack.map((frame) => frame.selector).find((s) => s.startsWith('@media')) ?? '',
        });
      }
      start = index + 1;
    }
  }
  return found;
}

function declaration(body, property) {
  const match = body.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`));
  return match ? match[1].replace(/\s+/g, ' ').trim() : undefined;
}

function find(all, selector) {
  const rule = all.find((candidate) => !candidate.media && candidate.selector === selector);
  assert.ok(rule, `no rule for \`${selector}\``);
  return rule;
}

/** The hover rule of a variant: guarded against every stronger state, as the family words it. */
function hover(all, variant) {
  const rule = all.find(
    (candidate) =>
      !candidate.media &&
      candidate.selector.startsWith(variant) &&
      candidate.selector.includes(':hover') &&
      candidate.selector.includes(':not([data-disabled])') &&
      candidate.selector.includes(':not([data-readonly])') &&
      candidate.selector.includes(':not([data-invalid])'),
  );
  assert.ok(rule, `no guarded hover rule for \`${variant}\``);
  return rule;
}

/**
 * The focus rule of the plain frame: the one rule on the variant that names
 * focus in its selector and draws the ring. The family decides whether that is
 * `:focus-visible`, `:focus-within` or `:has(… :focus)`; this test only asks
 * where the ring lands.
 */
function focus(all, variant) {
  const rule = all.find(
    (candidate) =>
      !candidate.media &&
      candidate.selector.startsWith(variant) &&
      /:focus/.test(candidate.selector) &&
      declaration(candidate.body, 'outline-offset') !== undefined,
  );
  assert.ok(rule, `no focus rule for \`${variant}\``);
  return rule;
}

for (const { family, frame = '' } of FAMILIES) {
  const css = readFileSync(`${source}${family}/${family}.css`, 'utf8');
  const all = rules(css);
  const root = `[data-ui-${family.toLowerCase()}][data-part-root]`;
  const plain = `${root}[data-variant='plain']`;

  test(`${family}: a plain control at rest has no edge, no lift, no ground and no corner`, () => {
    const rest = find(all, `${plain}${frame}`);
    assert.equal(declaration(rest.body, 'border-color'), 'transparent');
    assert.equal(declaration(rest.body, 'box-shadow'), 'none');
    assert.equal(declaration(rest.body, 'background-color'), 'transparent');
    assert.equal(declaration(rest.body, 'border-radius'), 'var(--slotted-radius-none, 0px)');
  });

  test(`${family}: a plain control answers hover with the neutral subtle surface and nothing else`, () => {
    const rule = hover(all, plain);
    assert.equal(
      declaration(rule.body, 'background-color'),
      `var( --slotted-${family}-plain-hover-background, var(--slotted-tone-secondary-subtle-hover) )`,
    );
    assert.equal(declaration(rule.body, 'border-color'), 'transparent');
    assert.equal(declaration(rule.body, 'box-shadow'), undefined);
  });

  test(`${family}: a plain control draws its focus ring inward and adds no lift`, () => {
    const rule = focus(all, plain);
    assert.equal(declaration(rule.body, 'outline-offset'), INWARD);
    assert.equal(declaration(rule.body, 'box-shadow'), 'none');
  });
}
