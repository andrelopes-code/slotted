import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'result-state');
  assert.equal(contract.ui, 'result-state');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One member holding every part, the shape `alert`, `card` and `kbd` all ship.
 * None of the six inner parts means anything outside the box — a
 * `ResultStateTitle` rendered on its own is a `div` — so none of them is a
 * family of its own.
 */
test('is one member, and the parts a consumer writes inside it', () => {
  assert.deepEqual(Object.keys(contract.members), ['resultState']);
  assert.deepEqual(contract.members.resultState.parts, [
    'root',
    'media',
    'content',
    'title',
    'description',
    'actions',
    'footer',
  ]);
});

/**
 * The root is a `section`, so a named result state is a `region` landmark a
 * reader can jump to and an unnamed one is a plain grouping element that costs
 * nothing. The APG's region landmark practice states that "a region landmark
 * must have a label", which is why the binding writes `aria-labelledby` only
 * once a title has said it exists.
 *
 * Chakra, Primer, Polaris and Ant all render an unlabelled `div`.
 */
test('makes the box a landmark rather than a bare div', () => {
  assert.equal(contract.members.resultState.nativeElement, 'section');
});

/**
 * The decision the family shares with `alert`, for the same reason. MDN's
 * `alert` role reference states the role "should only be used for text
 * content, not interactive elements such as links or buttons", and this family
 * has a row of buttons in it.
 *
 * `content` is therefore a part rather than a wrapper: it holds the title and
 * the description and nothing else, it is what carries `role="status"` or
 * `role="alert"`, and `media`, `actions` and `footer` are its siblings outside
 * the region.
 */
test('reserves a part for the text alone, which is what announces', () => {
  const { parts } = contract.members.resultState;
  assert.ok(parts.includes('content'));
  for (const part of ['media', 'actions', 'footer']) {
    assert.ok(parts.includes(part), `${part} has to exist to be outside the region`);
  }
  assert.deepEqual(contract.axes.live, ['off', 'polite', 'assertive']);
  assert.deepEqual(contract.liveRoles, { off: null, polite: 'status', assertive: 'alert' });
});

/**
 * The one place this family and `alert` disagree, and the disagreement is the
 * point. WCAG 2.2's Understanding document for SC 4.1.3 names this family's own
 * text as its example of a status message: "brief text messages displayed about
 * the completion or status of the search, such as 'Searching…', '18 results
 * returned' or 'No results returned' would be status updates if they do not
 * take focus or cause a page refresh."
 *
 * A result state is by definition the outcome of an operation. An alert may be
 * a standing notice that was on the page before it loaded, which is why `alert`
 * defaults to `off`. None of the seven surveyed implementations writes a live
 * role of any kind.
 */
test('announces by default, because a result is the outcome of an operation', () => {
  assert.equal(contract.members.resultState.defaults.live, 'polite');
});

/**
 * Seven semantics rather than one component per semantic, which is the guide's
 * section 17 requirement: `empty-state` and `error-state` become one visual
 * family with distinct semantics. Ant ships the same idea as `status` with
 * seven values and splits `Empty` off into a second family; the other six hold
 * no vocabulary at all and leave the meaning to an illustration.
 */
test('holds the seven things a region can be reporting', () => {
  assert.deepEqual(contract.axes.status, [
    'empty',
    'no-results',
    'not-found',
    'error',
    'forbidden',
    'offline',
    'success',
  ]);
  assert.equal(contract.members.resultState.defaults.status, 'empty');
});

/**
 * `status` is a name and not a picture (RS1).
 *
 * It was a tone and a silhouette per value: a circled exclamation, a tray, a
 * lock, drawn at the title's size above the title. R5's limit is what removed
 * it — a tone glyph alone on an empty surface, with no geometric relation to
 * anything, is the pattern the rule exists to refuse — and what is left is
 * what an empty state is: a title, a description and an action.
 *
 * Nothing about the axis is lost by not painting it. Color was never the only
 * signal, because the words are the signal; and `status` still reaches the
 * page as an attribute, which is what a page keys its own illustration on.
 */
test('paints nothing for the status, and says so', () => {
  assert.equal(contract.statusPaints.what, 'nothing');
  assert.ok(
    !('statusGlyphs' in contract) && !('statusTones' in contract),
    'the family claims a mark or a tone per status again',
  );
  assert.ok(!('tone' in contract.axes), 'tone is not an axis of this family');
  assert.ok(
    !('hideMedia' in contract.members.resultState.defaults),
    'hideMedia hid the mark, and there is no mark to hide',
  );
});

/**
 * The picture a page asks the family to draw around its own glyph: a framed
 * tile, three leaning layers, or a stack of cards. R5's third band refuses a
 * tone glyph enlarged on an empty surface and admits "an illustration drawn
 * for the space"; these are drawn for the space, in the neutral surface and
 * border roles, and none of them takes a tone. `none` is the default, so a
 * region that says nothing about its picture draws what RS1 left: the page's
 * own artwork, or nothing.
 *
 * ReUI ships the three as a second component per drawing (`IconStack`,
 * `IconTile`) or as markup written by hand in each example
 *. Here
 * they are one axis on the region, and the glyph is the `media` part that
 * already exists.
 */
test('draws one of three neutral illustrations around the page glyph, and none by default', () => {
  assert.deepEqual(contract.axes.illustration, ['none', 'tile', 'stack', 'cards']);
  assert.equal(contract.members.resultState.defaults.illustration, 'none');
  assert.ok(contract.scenarios.resultState.includes('illustration'));
  assert.equal(contract.illustrationPaints.tone, null);
});

/**
 * The same three words `alert` uses, with the same meaning: which scope the
 * message applies to, with the geometry following from that. A size axis would
 * say the same message can be drawn large or small, which is not the choice a
 * consumer is making.
 *
 * `inline` is what the guide requires for card, panel and cell, and it is what
 * keeps an illustration from dominating a dense operational screen. Primer has
 * half of it in `size` plus `narrow` plus `spacious`; Atlassian has `width`;
 * Polaris has `fullWidth`.
 */
test('carries the reach of the message as an axis, not as three components', () => {
  assert.deepEqual(contract.axes.reach, ['inline', 'section', 'page']);
  assert.equal(contract.members.resultState.defaults.reach, 'section');
  assert.ok(!('size' in contract.axes));
});

/**
 * Carbon left-aligns its empty states inside data-dense views; the other six
 * center unconditionally. Both readings are real and one axis is cheaper than a
 * second family.
 */
test('lets the region start at the inline edge as well as center', () => {
  assert.deepEqual(contract.axes.align, ['center', 'start']);
  assert.equal(contract.members.resultState.defaults.align, 'center');
});

/**
 * The family holds no mutable value, and the absence is a decision. Which
 * status a region is in is a fact about the consumer's own data; a result state
 * that decided it would be deciding whether the fetch failed.
 *
 * It is also why Radix Primitives, Base UI and React Aria ship no such
 * component: there is no behavior to hold. A later reader finds this rather
 * than an omission.
 */
test('holds no state, and says so rather than leaving it unstated', () => {
  assert.ok(!('stateModel' in contract), 'a state model here would name a value nothing can move');
  for (const capability of contract.members.resultState.capabilities) {
    assert.ok(
      !MUTABLE_CAPABILITIES.includes(capability),
      `${capability} holds state, so the family would owe it a model`,
    );
  }
  assert.deepEqual(contract.members.resultState.capabilities, [
    'appearance',
    'arrangement',
    'status',
    'live',
  ]);
});

/**
 * The region reports; it does not accept. `disabled`, `loading`, `invalid` and
 * `selected` would each describe a control it is not — and a region that is
 * loading is a `skeleton`, which the guide's section 9 says in as many words.
 *
 * `focus-visible` is the one state it does paint, because the root carries
 * `tabindex="-1"` so an application that has just emptied a table can send the
 * reader to the message, and a reader who arrives has to see where they are.
 */
test('paints only the states a region can actually be in', () => {
  assert.deepEqual(contract.members.resultState.states, ['default', 'focus-visible']);
  for (const state of ['disabled', 'loading', 'invalid', 'selected', 'open']) {
    assert.ok(!contract.members.resultState.states.includes(state), `result-state claims ${state}`);
  }
  assert.ok(contract.stateAttributes === undefined, 'no attribute state, so no attribute map');
});

test('names one reference page, covering every axis and every part', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['resultState']);
  assert.deepEqual(contract.scenarios.resultState, [
    'playground',
    'statuses',
    'reach',
    'align',
    'media',
    'illustration',
    'actions',
    'live',
    'content',
    'composition',
    'accessibility',
  ]);
});
