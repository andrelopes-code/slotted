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
    new URL('../../../../specs/components/avatar-group/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./avatar-group.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./avatar-group.harness.html', import.meta.url), 'utf8'),
);
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const rules = [...normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(([, selector]) => !selector.includes('@'))
  .map(([, selector, body]) => ({
    selectors: selector.split(',').map((one) => one.trim()),
    body,
  }));

function rule(selector) {
  return rules.find((candidate) => candidate.selectors.includes(selector))?.body ?? '';
}

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = `[data-ui-${contract.memberFamily.toLowerCase()}][data-part-root]`;

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`));
});

test('styles every part the contract declares', () => {
  for (const part of contract.members.avatarGroup.parts) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

test('answers every value of every axis the contract names', () => {
  const { defaults } = contract.members.avatarGroup;
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      /**
       * `shape` is written on the group so a consumer can select on it, and
       * answered by every member rather than by the group: the corner belongs
       * to the box that has one.
       */
      if (axis === 'shape') continue;
      const answered =
        rules.some((candidate) =>
          candidate.selectors.some((one) => one.includes(`[data-${axis}='${value}']`)),
        ) || defaults[axis] === value;
      assert.ok(answered, `Missing ${axis} ${value}`);
    }
  }
});

/**
 * The group is a list and the browser paints a list with a marker and an
 * indent. Neither belongs to a row of faces, and both are the user agent's
 * rather than the family's, so the family clears them once.
 */
test('takes the list marker and the list indent off the element that needs to be a list', () => {
  const body = rule(root);
  assert.ok(body.includes('list-style:none'));
  assert.ok(body.includes('margin:0'));
  assert.ok(body.includes('padding:0'));
  assert.ok(body.includes('display:flex'));
});

/** An empty group takes no room, so a permission-filtered row does not drift. */
test('disappears when it holds nothing', () => {
  assert.ok(rule(`${root}:empty`).includes('display:none'));
});

/**
 * The size is restated on the group as well as reaching every member through
 * the binding's defaults: the member needs it to scale its own type, and the
 * group needs it as a number to work out an overlap no child can compute for
 * its parent.
 */
test('states the size it lays out at, in the token every member already reads', () => {
  for (const size of contract.axes.size) {
    assert.ok(
      rule(`${root}[data-size='${size}']`).includes(
        `--slotted-avatar-size:var(--slotted-avatar-size-${size}`,
      ),
      `${size} does not declare the size the overlap is measured against`,
    );
  }
  assert.ok(rule(root).includes('--_size:var(--slotted-avatar-size'));
});

/**
 * A negative logical inset, so a right-to-left document gets the same component
 * mirrored rather than a second stylesheet. Ant, MUI, Chakra and Primer all
 * write the physical form.
 */
test('overlaps by a fraction of the member, in a logical direction', () => {
  const overlap = rule(`${root}[data-layout='stack'] > * + *`);
  assert.ok(
    overlap.includes('margin-inline-start:calc(round(nearest,'),
    'the covering is whole pixels',
  );
  assert.ok(overlap.includes('var(--_overlap)'));
  assert.ok(overlap.includes('-1'), 'the stack should move members closer together');
  assert.ok(!overlap.includes('var(--slotted-avatar-ring-width)'));
  assert.ok(!/margin-left|margin-right/.test(normalized));
  assert.ok(rule(`${root}[data-layout='stack']`).includes('flex-wrap:nowrap'));
});

/**
 * The ring is what separates one member from the one beneath it, and it is the
 * surface the group stands on rather than a fixed white, so a group inside a
 * card or a coloured row is still a row of separate faces.
 */
test('does not add a second group ring to the avatar edge', () => {
  assert.ok(!rule(root).includes('--slotted-avatar-ring-width'));
});

test('lays the members apart on a step of the space scale, and lets that row wrap', () => {
  const spread = rule(`${root}[data-layout='spread']`);
  assert.ok(spread.includes('flex-wrap:wrap'));
  assert.ok(spread.includes('gap:var(--slotted-space-'));
});

/**
 * A member covered by the one after it would show half a focus ring, so the one
 * under the pointer or the caret rises. It is a change of stacking order and
 * therefore instant: a raise that took two hundred milliseconds would leave the
 * avatar behind its neighbour for most of the time the pointer is on it.
 */
test('raises the member under the pointer, and holds that back when it is disabled', () => {
  const hover = `${ui}[data-layout='stack'] ${member}:not([data-disabled]):hover`;
  const focus = `${ui}[data-layout='stack'] ${member}:focus-visible`;
  assert.ok(rule(hover).includes('z-index:1'), 'no raise on hover');
  assert.ok(rule(focus).includes('z-index:1'), 'no raise on focus');
  assert.ok(
    rule(`${root}[data-layout='stack'] ${member}`).includes(
      'transition-timing-function:var(--slotted-easing-exit)',
    ),
    'the face settles back on the exiting curve',
  );
  assert.ok(rule(hover).includes('transition-timing-function:var(--slotted-easing-enter)'));
  assert.ok(
    rule(`${ui}[data-layout='stack'] ${member}:not([data-disabled]):active`)
      .replace(/\s/g, '')
      .includes('transform:translateY(calc(var(--_raise-lift)/2))'),
    'the press must differ from the hover',
  );
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

/**
 * The stacking order alone is not the answer: a face in front of another face,
 * both flat and both the same size, is one shape. The member the pointer is on
 * carries a ring of the surface between it and what it covers, a shadow that
 * says which of the two is in front, and a lean towards the reader (AG1). The
 * lean is a lift and nothing else: an avatar holds its member's initials, and
 * R7 keeps a scale off a box that holds type.
 *
 * The ring is the avatar's own ring token and not an `outline`: R3 gives the
 * outline of every family to the focus ring. The shadow reaches the avatar as
 * its elevation token rather than as a second `box-shadow`, which would
 * overwrite that ring.
 */
test('separates the raised member from the ones it covers', () => {
  const hover = rule(`${ui}[data-layout='stack'] ${member}:not([data-disabled]):hover`);
  assert.ok(hover.includes('--slotted-avatar-ring-width:var(--_raise-ring)'), 'no ring');
  assert.ok(hover.includes('--slotted-avatar-elevation:var(--_raise-shadow)'), 'no elevation');
  assert.ok(hover.includes('transform:translateY(var(--_raise-lift))'));
  assert.ok(!/scale/.test(hover), 'a face of letters may not be scaled (R7)');
  const group = rule(root);
  assert.ok(
    group.includes('--_raise-shadow:var(--slotted-shadow-'),
    'the elevation is not a token',
  );
  assert.ok(group.includes('--_raise-ring:var(--slotted-border-width-'), 'the ring is not a token');
});

/**
 * Stillness keeps the two that are not motion. The lift and the shadow the
 * lift implies are redefined to nothing under the query, so the raise stays
 * one rule and the reader who asked for stillness still sees which face the
 * pointer is on.
 */
test('drops the movement under reduced motion and keeps the answer', () => {
  const query = normalized.slice(normalized.indexOf('prefers-reduced-motion'));
  const still = query.slice(query.indexOf(`${root}[data-layout='stack']{`)).split('}')[0];
  assert.ok(still.includes('--_raise-lift:0px'), 'the member still travels');
  assert.ok(
    still.includes('--_raise-shadow:0 0 transparent'),
    'the member still lifts off the row',
  );
  assert.ok(!still.includes('z-index'), 'the stacking order must survive stillness');
  assert.ok(!still.includes('--_raise-ring'), 'the ring must survive stillness');
});

/** Not a stacking context: a raised member has to rise past its whole row. */
test('leaves the item positioned and unlayered', () => {
  const item = rule(`${ui} [data-part-item]`);
  assert.ok(item.includes('position:relative'));
  assert.ok(!item.includes('z-index'));
});

/**
 * `+12` is three figures where a pair of initials is two, and tabular figures
 * keep the box from jittering as the count crosses a power of ten — the rule
 * `badge` applies to its own count.
 */
test('gives the summary room for a third figure', () => {
  const overflow = rule(`${ui} [data-part-overflow] ${member}`);
  assert.ok(overflow.includes('--slotted-avatar-initials-size:round(nearest,calc('));
  assert.ok(overflow.includes('font-variant-numeric:tabular-nums'));
});

test('the harness fragment exercises every part, layout and size', () => {
  for (const part of contract.members.avatarGroup.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
  for (const layout of contract.axes.layout) {
    assert.match(fragment, new RegExp(`data-layout="${layout}"`), `no scene renders ${layout}`);
  }
  assert.match(fragment, /<ul\b[^>]*data-ui="avatar-group"/, 'the group is not a list');
  assert.match(fragment, /<li\b[^>]*data-part="item"/, 'the members are not list items');
  assert.match(fragment, /aria-label="/, 'no scene names the list');
  assert.match(fragment, /data-disabled=""/, 'no scene holds a deactivated member');
});
