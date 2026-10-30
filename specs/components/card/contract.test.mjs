import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'card');
  assert.equal(contract.ui, 'card');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A member is a component with a root of its own. A card region exists only
 * inside a card, so the regions are parts and the family is one member — which
 * is also what keeps `data-ui` on exactly one element.
 */
test('is one surface whose regions are parts rather than families', () => {
  assert.deepEqual(Object.keys(contract.members), ['card']);
  assert.deepEqual(contract.members.card.parts, [
    'root',
    'media',
    'header',
    'actions',
    'body',
    'footer',
    'link',
    'selection',
  ]);
});

/**
 * Four of the ten surveyed implementations reserve a place for the control that
 * makes a card a choice — Fluent's `checkbox` slot, PatternFly's
 * `CardSelectableActions`, Cloudscape's `.selection-control`, Spectrum's
 * `slot="selection"`. This family painted `data-selected` and reserved none, so
 * the chooser was a browser-default input dropped beside a heading.
 *
 * The part is the slot, not the glyph: `checkbox radio-group` in wave 3 owns
 * where a check and a dot are drawn, and a card drawing its own would be the
 * second answer to that question.
 */
test('reserves a place for the control that makes the card a choice', () => {
  assert.ok(contract.members.card.parts.includes('selection'));
});

test('renders the element that claims nothing, and lets the page claim more', () => {
  assert.equal(contract.members.card.nativeElement, 'div');
});

test('runs in two directions and defaults to the column a card usually is', () => {
  assert.deepEqual(contract.axes.orientation, ['vertical', 'horizontal']);
  assert.equal(contract.members.card.defaults.orientation, 'vertical');
});

/**
 * A card is bounded by an edge, by elevation or by a fill, and the three are
 * page-level idioms rather than one theme decision: a grid of list cards and a
 * summary card floating over a sunken page appear on the same screen. `fill`
 * is the axis name the library already uses for that distinction, and `variant`
 * stays reserved for tone, which a card does not carry.
 */
test('offers an edge, an elevation and a fill, and no tone', () => {
  assert.deepEqual(contract.axes.fill, ['outline', 'elevated', 'subtle']);
  assert.equal(contract.members.card.defaults.fill, 'outline');
  assert.ok(!('variant' in contract.axes), 'a card carries no tone');
  assert.ok(!('tone' in contract.axes));
});

/** Density is the application's choice; size is this card's. */
test('scales its own inset in three steps and starts in the middle', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(contract.members.card.defaults.size, 'md');
});

/**
 * `active` was absent, so a whole surface that answers a pointer gave no sign
 * it had been hit. Fluent, Material 3, Spectrum and HeroUI all paint a pressed
 * card; none of the ten surveyed implementations omits it while offering a
 * clickable card.
 */
test('answers hover, press and focus, and mirrors the two states a chooser needs', () => {
  assert.deepEqual(contract.members.card.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'selected',
    'disabled',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    selected: 'data-selected',
    disabled: 'data-disabled',
  });
});

/**
 * `selected` and `disabled` are written by the consumer and mirror state that
 * belongs to the control inside the card. A `disabled` capability would claim
 * the card can refuse an interaction, and only the control can; `selection`
 * would claim it holds a value, and it does not.
 */
test('holds no state of its own, and therefore declares no state model', () => {
  assert.deepEqual(contract.members.card.capabilities, ['orientation', 'size']);
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(
      !contract.members.card.capabilities.includes(capability),
      `card claims the mutable capability ${capability}`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

test('starts neither selected nor disabled', () => {
  assert.equal(contract.members.card.defaults.selected, false);
  assert.equal(contract.members.card.defaults.disabled, false);
});

test('names one reference page, covering the whole-card action', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['card']);
  assert.deepEqual(contract.scenarios.card, [
    'playground',
    'anatomy',
    'appearance',
    'orientation',
    'interactive',
    'composition',
  ]);
});
