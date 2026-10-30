import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'list');
  assert.equal(contract.ui, 'list');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A section is a group inside the set, not a family of its own: it exists only
 * within a list and carries no `data-ui`. One member is therefore right, and it
 * is also what keeps `data-ui` on exactly one element.
 */
test('is one set whose groups are parts rather than families', () => {
  assert.deepEqual(Object.keys(contract.members), ['list']);
  assert.deepEqual(contract.members.list.parts, [
    'root',
    'section',
    'section-label',
    'section-end',
    'section-list',
    'empty',
  ]);
});

/**
 * The Authoring Practices publish no pattern for a static list. Recording the
 * absence with the index that proves it is what `patterns.md` requires in place
 * of a citation, and it is what stops the next reader looking for one.
 */
test('records that no authoring pattern exists, and names what governs instead', () => {
  assert.equal(contract.pattern, null);
  assert.equal(contract.patternAbsent.index, 'https://www.w3.org/WAI/ARIA/apg/patterns/');
  assert.match(contract.patternAbsent.platform, /html\.spec\.whatwg\.org/);
  assert.match(contract.patternAbsent.roles, /wai-aria-1\.2/);
});

/**
 * The row is a content box beside its independent targets, and CSS has no
 * `display` that is both `list-item` and a grid, so the native marker is always
 * gone and the family draws its own. Safari and VoiceOver drop list semantics
 * whenever CSS removes the marker, and `role="list"` is the article's own
 * answer. Writing it always is a consequence of the layout; MUI never writes it
 * and loses the semantics, Angular Material writes it and says nothing.
 */
test('restores the semantics its own marker costs, and says what costs them', () => {
  assert.equal(contract.rootRole.value, 'list');
  assert.equal(contract.rootRole.condition, 'always');
  assert.match(contract.rootRole.source, /scottohara/);
  assert.equal(contract.roles.root, 'list');
  assert.equal(contract.roles['section-list'], 'list');
});

/**
 * A character is never an icon, so the bullet is the library's own dot geometry
 * rather than a `•` in a `content` string. The counter is the one name the two
 * families share, and no selector in either stylesheet reaches the other.
 */
test('draws its own marker from the glyph scale and a counter', () => {
  assert.equal(contract.marker.drawnBy, 'list-item');
  assert.equal(contract.marker.counter, 'slotted-list-item');
  assert.match(contract.marker.bullet, /--slotted-icon-dot/);
  assert.deepEqual(contract.provides.toItems, ['variant', 'size', 'marker', 'inset']);
});

/**
 * The reading order of a set and the mark painted beside it are two questions.
 * Every surveyed implementation answers them with one value, which is why a
 * numbered queue that paints its own badges has to give up `ol`.
 */
test('separates the element that carries order from the mark that is painted', () => {
  assert.deepEqual(contract.axes.marker, ['none', 'bullet', 'number']);
  assert.equal(contract.members.list.nativeElement, 'ul');
  assert.equal(contract.members.list.defaults.ordered, false);
  assert.equal(contract.resolution.ordered[0], 'prop');
});

/** The vocabulary is `accordion`'s, so two families cannot mean different things by one word. */
test('tells rows apart with the four words the library already uses', () => {
  assert.deepEqual(contract.axes.variant, ['plain', 'ruled', 'framed', 'separated']);
  assert.equal(contract.members.list.defaults.variant, 'plain');
});

/** Density is the application's choice; size is this list's. */
test('scales its rows in three steps and starts in the middle', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(contract.members.list.defaults.size, 'md');
});

/**
 * A group is an `li` holding a heading and a nested list, which is the grouping
 * HTML already has. The four surveyed implementations that ship groups each
 * leave the heading loose among the rows.
 */
test('nests a group where HTML already nests one', () => {
  assert.equal(contract.section.element, 'li');
  assert.deepEqual(contract.section.holds, ['section-label', 'section-list']);
  assert.equal(contract.roles['section-list'], 'list');
});

/**
 * The message belongs inside the set. Outside it, the reader hears "list, 0
 * items" and then nothing, and the box the family paints ends above the words.
 */
test('says what an empty set holds from inside the set', () => {
  assert.equal(contract.empty.element, 'li');
  assert.ok(contract.members.list.parts.includes('empty'));
});

/**
 * ARIA 1.2 section 5.2.6 requires `aria-busy` on a container whose required
 * owned elements have not arrived. `loading` is that state and nothing more:
 * an empty list is not a loading one.
 */
test('marks a set that is still filling, and does not confuse it with an empty one', () => {
  assert.deepEqual(contract.members.list.states, ['default', 'loading']);
  assert.deepEqual(contract.stateAttributes, { loading: 'data-loading' });
  assert.match(contract.wiring['aria-busy'], /aria-busy|true on the root/i);
});

/**
 * The collection keyboard is deferred rather than invented, and each deferral
 * names the family that owns the capability instead. A decline that names
 * nothing is what `capability.md` refuses.
 */
test('defers every capability that needs a collection, and names who takes it', () => {
  assert.equal(contract.declined.selection.deferTo, 'listbox');
  assert.match(contract.declined.virtualization.deferTo, /collection engine/);
  assert.equal(contract.declined.orientation.deferTo, 'inline');
  assert.ok(contract.declined.landmark.reason.includes('<nav'));
  assert.equal(contract.rovingTabindex, false);
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Tab', 'Shift+Tab'],
  );
  for (const entry of contract.keyboard) assert.equal(entry.source, 'platform');
});

/**
 * The set holds no value a consumer can own. A state model here would have to
 * name a request nothing emits, and the selection that would need one is
 * deferred to `listbox` by name.
 */
test('holds no state of its own, and therefore declares no state model', () => {
  /* `arrangement` is not among them, and the absence is the point: that word
     means gap, alignment and justification as inputs, and the set states none
     of the three. What tells the rows apart is `variant`, which is appearance,
     and the one distance the set spends is the gap `separated` needs. Claiming
     the capability would put three props on the reference page that do not
     exist. */
  assert.deepEqual(contract.members.list.capabilities, ['appearance', 'size', 'loading', 'wiring']);
  assert.ok(!contract.members.list.capabilities.includes('arrangement'));
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(
      !contract.members.list.capabilities.includes(capability),
      `list claims the mutable capability ${capability}`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

/**
 * The set hands the rows the two values that are facts about the set, and
 * nothing that is a fact about one row. The row's own prop still wins.
 */
test('hands rows only what belongs to the set', () => {
  assert.equal(contract.itemFamily, 'list-item');
  for (const [axis, order] of Object.entries(contract.resolution)) {
    assert.equal(order[0], 'prop', `${axis} lets something outrank the consumer`);
  }
});

test('names one reference page, covering the group and the empty set', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['list']);
  assert.deepEqual(contract.scenarios.list, [
    'playground',
    'variant',
    'marker',
    'sections',
    'inset',
    'states',
    'content',
    'composition',
    'accessibility',
  ]);
});
