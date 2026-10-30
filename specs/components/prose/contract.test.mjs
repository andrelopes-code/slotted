import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'prose');
  assert.equal(contract.ui, 'prose');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One member and six parts. Five of the six are written by the consumer's
 * renderer on the consumer's own element, which is what makes them reachable
 * from a component map — `components={{ table: ProseScroll }}` — without this
 * library owning a Markdown renderer of its own. Nuxt UI answers the same
 * question with one component per tag; thirty components is a renderer.
 */
test('is one member, and the parts a renderer writes inside it', () => {
  assert.deepEqual(Object.keys(contract.members), ['prose']);
  assert.deepEqual(contract.members.prose.parts, [
    'root',
    'lead',
    'anchor',
    'scroll',
    'exclude',
    'footnotes',
  ]);
});

/**
 * The root is a `div` because a `div` claims nothing. `article` and `section`
 * are claims the page makes, and it makes them through `render` in React and by
 * writing the attribute selector on its own element in Angular — the
 * arrangement `container` already ships.
 */
test('claims no semantics of its own', () => {
  assert.equal(contract.members.prose.nativeElement, 'div');
});

/**
 * Recall is not a survey. The Authoring Practices publish patterns for widgets,
 * and a region of rendered text is not one, so the absence is recorded with the
 * sources that govern in its place rather than left as a silence.
 */
test('records the absence of an authoring-practices pattern', () => {
  assert.equal(contract.pattern, null);
  assert.match(contract.patternAbsent.index, /^https:\/\/www\.w3\.org\/WAI\/ARIA\/apg\/patterns\//);
  assert.ok(contract.patternAbsent.reason.length > 80);
  for (const source of ['platform', 'textSpacing', 'visualPresentation', 'scrollableRegion']) {
    assert.match(contract.patternAbsent[source], /^https:\/\//, `${source} is not a URL`);
  }
});

/**
 * The family holds no mutable value: `size` and `flow` are appearance the
 * consumer states, the scroll part's `tabindex` is a measurement rather than a
 * value anyone could own, and the content belongs to the renderer. The absence
 * is asserted with its reason so it cannot be read as a capability nobody wrote
 * — the shape `result-state` established.
 */
test('declares no state model, because nothing here holds a value', () => {
  const capabilities = new Set(contract.members.prose.capabilities);
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(!capabilities.has(capability), `${capability} would need a model`);
  }
  assert.ok(!('stateModel' in contract), 'a state model here would name a value nothing can move');
});

/**
 * Reading text is not control text. `--slotted-font-size-md` is 0.875rem, the
 * size a button label is set in; the family's default body step is one above
 * it. The axis is named for the scale's own steps, as `typography`'s is, so the
 * offset is a fact a reader can check rather than one hidden behind `sm`.
 */
test('takes its body size from the foundation type scale', () => {
  assert.deepEqual(contract.axes.size, ['md', 'lg', 'xl']);
  assert.equal(contract.members.prose.defaults.size, 'lg');
  assert.deepEqual(contract.sizeSteps, {
    md: '--slotted-font-size-md',
    lg: '--slotted-font-size-lg',
    xl: '--slotted-font-size-xl',
  });
});

/**
 * The one place the family states a literal, and the reason is recorded here
 * because `docs/token-foundation.md` rule 1 grants the exemption only to a
 * token whose reason is written. A heading in editorial content is sized
 * relative to the text it introduces; the foundation scale is a scale of
 * absolute control steps that stops at 1.5rem.
 */
test('states the heading ladder as a ratio, and records why it is a literal', () => {
  assert.deepEqual(Object.keys(contract.headingLadder), ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
  for (const [level, step] of Object.entries(contract.headingLadder)) {
    assert.equal(step.token, `--slotted-prose-${level}-size`);
    assert.match(step.fallback, /em$/, `${level} is not stated relative to the body step`);
  }
  assert.ok(contract.headingLadder.h1.reason.length > 80);
});

/**
 * A Markdown link and a `<Link>` on one page are otherwise two colors for one
 * idea. Reading another family's token is not reaching into that family: the
 * token belongs to the theme, and no selector in this stylesheet names another
 * family's `data-ui` — the rule `accordion` and `collapsible` set.
 */
test('paints a bare element with the token of the family that owns it', () => {
  assert.deepEqual(contract.borrows, {
    a: '--slotted-link-color',
    hr: '--slotted-divider-color',
    kbd: '--slotted-kbd-radius',
  });
});

/**
 * A decline is only complete when it names the family that owns the capability
 * instead, or the composition that replaces it.
 */
test('names an owner for every capability it declines', () => {
  for (const [capability, decision] of Object.entries(contract.declined)) {
    assert.ok(
      typeof decision.deferTo === 'string' || typeof decision.compose === 'string',
      `${capability} declines and names neither an owner nor a composition`,
    );
    assert.ok(decision.reason.length > 60, `${capability} declines without a reason`);
  }
  for (const capability of ['measure', 'density', 'colorTheme', 'sanitisation', 'liveRegion']) {
    assert.ok(capability in contract.declined, `${capability} is undecided`);
  }
  assert.equal(contract.declined.measure.deferTo, 'container');
});

/**
 * CSS forbids a custom property in a container condition, so a reflowing
 * family's breakpoints are literals. Stating them here is what lets the
 * stylesheet be read against a decision instead of against a habit.
 */
test('states its container breakpoints as literals', () => {
  assert.equal(contract.container.name, 'slotted-prose');
  assert.deepEqual(
    contract.container.breakpoints.map(({ maxWidth }) => maxWidth),
    ['34rem', '22rem'],
  );
  for (const breakpoint of contract.container.breakpoints) {
    assert.ok(breakpoint.changes.length > 0, `${breakpoint.maxWidth} changes nothing`);
  }
});

/**
 * Anything that takes focus needs a name and a role or it fails SC 4.1.2, and a
 * scroller that fits needs neither because it is not focusable. The order is
 * what lets a renderer's component map use the part with no arguments at all.
 */
test('resolves the scrolling region name in a stated order', () => {
  assert.deepEqual(contract.scroll.name, ['labelledBy', 'aria-label', 'messages.scroll']);
  assert.equal(contract.scroll.role, 'region');
  assert.equal(contract.scroll.appliesWhen, 'overflowing');
  assert.equal(contract.scroll.measuredBy, '@slotted/core/overflow');
});

/**
 * A page rendering a language model's answer appends blocks continuously, and
 * each of these three selectors changes its own match when one arrives. The
 * stylesheet is held to the list by `prose.styles.test.mjs`; the contract is
 * where the list is decided.
 */
test('names the selectors a growing document forbids', () => {
  assert.deepEqual(contract.streaming.forbiddenSelectors, [':last-child', ':has(', ':empty']);
  assert.equal(contract.streaming.spacingProperty, 'margin-block-start');
});

/**
 * The scenario list is the floor for the two reference pages: one captioned
 * demonstration each. Every axis, every part and the composition the family is
 * meant to sit inside has one.
 */
test('declares a scenario for every axis and every part', () => {
  const scenarios = contract.scenarios.prose;
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(scenarios.includes(axis), `no scenario demonstrates ${axis}`);
  }
  for (const part of contract.members.prose.parts) {
    if (part === 'root' || part === 'footnotes') continue;
    assert.ok(scenarios.includes(part), `no scenario demonstrates the ${part} part`);
  }
  for (const scenario of ['playground', 'elements', 'streaming', 'composition', 'accessibility']) {
    assert.ok(scenarios.includes(scenario), `no ${scenario} scenario`);
  }
});
