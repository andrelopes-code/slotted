import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { CHANGE_REASONS, assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

/** Every member paints itself from the same three axes. */
const APPEARANCE_MEMBERS = ['button', 'buttonLink', 'iconButton', 'toggleButton'];

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('publishes one identifier for the whole family', () => {
  assert.equal(contract.family, 'button');
  assert.equal(contract.ui, 'button');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * IconButton is a member rather than a family. It is the same surface, the
 * same state machine and the same geometry scale as Button, differing only in
 * what it contains and in the shape that follows from it.
 */
test('names the members the family publishes, in order', () => {
  assert.deepEqual(Object.keys(contract.members), [
    'button',
    'buttonLink',
    'iconButton',
    'iconButtonLink',
    'toggleButton',
  ]);
});

/**
 * The five colours are tones in `docs/token-foundation.md`, so the axis that
 * selects one is named `tone`. `variant` is left to name what it actually
 * selects: how the tone is painted.
 */
test('separates the tone from the way it is painted', () => {
  assert.deepEqual(contract.axes.tone, [
    'accent',
    'secondary',
    'neutral',
    'info',
    'success',
    'warning',
    'danger',
  ]);
  assert.deepEqual(contract.axes.variant, ['solid', 'outline', 'ghost']);
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.ok(!('fill' in contract.axes), 'fill was the old name of variant and may not survive it');
});

/**
 * `soft` painted the tone's own surface and was removed at the visual review:
 * three ways to paint one tone is one more than a page can tell apart, and the
 * pale fill read as a disabled control rather than as a quieter action. The
 * `surface` role each tone carries is read by `badge`, `tag` and `alert`, which
 * are the families a tinted rectangle belongs to.
 */
test('offers one filled paint, one edged paint and one bare one', () => {
  assert.ok(!contract.axes.variant.includes('soft'));
  assert.equal(contract.axes.variant.length, 3);
});

/** Shape is what an icon-only member differs by, and only those two have one. */
test('gives the shape axis to the icon-only members, whose geometry differs', () => {
  assert.deepEqual(contract.axes.shape, ['square', 'circle']);
  for (const [name, member] of Object.entries(contract.members)) {
    const declaresShape = 'shape' in member.defaults;
    assert.equal(
      declaresShape,
      name === 'iconButton' || name === 'iconButtonLink',
      `${name} and the shape axis`,
    );
  }
});

test('gives every member a native element and semantic defaults', () => {
  const expected = {
    button: { nativeElement: 'button', type: 'button' },
    buttonLink: { nativeElement: 'a' },
    iconButton: { nativeElement: 'button', type: 'button', shape: 'square' },
    iconButtonLink: { nativeElement: 'a', shape: 'square' },
    toggleButton: { nativeElement: 'button', type: 'button', defaultPressed: false },
  };

  for (const [name, semantics] of Object.entries(expected)) {
    const member = contract.members[name];
    assert.equal(member.nativeElement, semantics.nativeElement, name);
    for (const [key, value] of Object.entries(semantics)) {
      if (key === 'nativeElement') continue;
      assert.equal(member.defaults[key], value, `${name}.${key}`);
    }
  }

  for (const name of APPEARANCE_MEMBERS) {
    const member = contract.members[name];
    for (const axis of ['tone', 'variant', 'size']) {
      assert.ok(
        contract.axes[axis].includes(member.defaults[axis]),
        `${name} defaults ${axis} outside the axis`,
      );
    }
  }
});

test('gives every member a root part and names the parts it renders', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.parts]),
    ),
    {
      button: ['root', 'start', 'label', 'end', 'indicator'],
      buttonLink: ['root', 'start', 'label', 'end'],
      iconButton: ['root', 'icon', 'indicator'],
      iconButtonLink: ['root', 'icon'],
      toggleButton: ['root', 'start', 'label', 'end', 'indicator'],
    },
  );
});

/**
 * A momentary action may not acquire persistent state by passing one more
 * prop: the guide reserves `pressed` for a toggle, and a label that changes
 * with the state is the mistake the APG names.
 */
test('keeps pressed away from the momentary action', () => {
  assert.ok(!contract.members.button.capabilities.includes('pressed'));
  assert.ok(!contract.members.buttonLink.capabilities.includes('pressed'));
  assert.ok(!contract.members.iconButtonLink.capabilities.includes('pressed'));
  assert.ok(contract.members.toggleButton.capabilities.includes('pressed'));
  assert.ok(contract.members.iconButton.capabilities.includes('pressed'));
});

/**
 * Only an action that can be waited on carries loading; navigation cannot. A
 * toggle can: "Follow" and "Subscribe" persist to a server, and Fluent's
 * ToggleButton and Chakra's pressed Button both wait on one.
 */
test('gives loading to every member that performs work', () => {
  assert.ok(contract.members.button.capabilities.includes('loading'));
  assert.ok(contract.members.iconButton.capabilities.includes('loading'));
  assert.ok(contract.members.toggleButton.capabilities.includes('loading'));
  assert.ok(!contract.members.buttonLink.capabilities.includes('loading'));
});

/**
 * A spinner shown for ninety milliseconds is a flash, not a status, so the
 * indicator can be delayed while the activation is refused from the first
 * millisecond. Ant Design is the one surveyed library that separates the two;
 * the rest tie the wait to the picture and flash.
 */
test('lets the indicator wait without letting the action through', () => {
  for (const name of ['button', 'iconButton', 'toggleButton']) {
    assert.equal(contract.members[name].defaults.loadingDelay, 0, name);
  }
});

/**
 * A disabled control leaves the tab sequence, and a disabled control in a
 * toolbar that leaves the tab sequence is one a keyboard user cannot discover
 * or read a tooltip from. Fluent ships `disabledFocusable`, React Aria keeps a
 * pending button focusable and Primer ships `inactive` for the same reason.
 * It is the shape of `disabled` rather than a capability of its own.
 */
test('lets a disabled control keep its place in the tab sequence', () => {
  for (const name of ['button', 'iconButton', 'toggleButton']) {
    assert.equal(contract.members[name].defaults.focusableWhenDisabled, false, name);
    assert.ok(contract.members[name].capabilities.includes('disabled'), name);
  }
  /**
   * ButtonLink has no such choice to offer: a disabled anchor renders no
   * `href`, which drops it from the tab sequence unless the family puts it
   * back, and the family always does.
   */
  assert.ok(!('focusableWhenDisabled' in contract.members.buttonLink.defaults));
});

test('declares every state the stylesheet paints, with its attribute', () => {
  assert.deepEqual(contract.stateAttributes, {
    disabled: 'data-disabled',
    loading: 'data-loading',
    pressed: 'data-pressed',
  });
  assert.deepEqual(contract.members.button.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'disabled',
    'loading',
  ]);
  assert.deepEqual(contract.members.iconButton.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'disabled',
    'loading',
    'pressed',
  ]);
  assert.deepEqual(contract.members.toggleButton.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'disabled',
    'loading',
    'pressed',
  ]);
});

/**
 * A boolean cannot say whether a toggle moved under a pointer or under Space,
 * and a native button fires the same `click` for both.
 */
test('models pressed in both modes and names the reasons it can carry', () => {
  const model = contract.stateModel.pressed;
  assert.equal(model.controlled, 'pressed');
  assert.equal(model.uncontrolled, 'defaultPressed');
  assert.equal(model.request, 'onPressedChange');
  assert.deepEqual(model.reasons, ['pointer', 'keyboard']);
  for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason));
});

/** ButtonGroup is the next invocation, in mode `novo`, and no longer lives here. */
test('no longer describes a grouping element', () => {
  assert.ok(!('buttonGroup' in contract.members));
  assert.ok(!('orientations' in contract));
  assert.ok(!('buttonGroup' in contract.scenarios));
});

test('provides uniquely named scenarios for every page', () => {
  assert.deepEqual(Object.keys(contract.scenarios), [
    'overview',
    'button',
    'buttonLink',
    'iconButton',
    'iconButtonLink',
    'toggleButton',
  ]);

  /**
   * Two of the reference pages exist because of the integration table rather
   * than the visual one: substituting the rendered element, and setting the
   * family's defaults once for an application.
   */
  assert.ok(contract.scenarios.button.includes('composition'));
  assert.ok(contract.scenarios.button.includes('defaults'));
  assert.ok(contract.scenarios.toggleButton.includes('loading'));

  for (const [page, ids] of Object.entries(contract.scenarios)) {
    assert.ok(Array.isArray(ids) && ids.length > 0, page);
    assert.equal(new Set(ids).size, ids.length, page);
    for (const id of ids) assert.match(id, /^[a-z][a-zA-Z]+$/, `${page}: ${id}`);
  }
});

/**
 * One ring, drawn once. The indeterminate wait every family shows the same
 * way — this one working, a select or combobox whose options are still on
 * their way — was drawn by this family in its own sheet, as a border with one
 * transparent side, which is where the second family would have copied it
 * from. It is a shared stylesheet and an identifier rather than a family: the
 * element that carries it is this family's `indicator` part, which owns its
 * name, its role and its place. The sheet draws the ring itself, in
 * gradients over the host's ink; it was a Lucide glyph for a while, and a
 * glyph is one shape turned, which is not what a wait looks like.
 */
test('names the shared ring its indicator carries', () => {
  assert.deepEqual(contract.spinner, {
    ui: 'spinner',
    part: 'indicator',
    stylesheet: 'spinner/spinner.css',
  });
  assert.ok(contract.members.button.parts.includes(contract.spinner.part));
  assert.ok(contract.members.iconButton.parts.includes(contract.spinner.part));
});
