import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, TONES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const rating = contract.members.rating;
const display = contract.members.ratingDisplay;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'rating');
  assert.equal(contract.ui, 'rating');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * Two members, as Fluent ships `Rating` and `RatingDisplay`: a value the reader
 * sets is a radio group, and a value the page reports is one image. Forty
 * product cards drawn with the first would be two hundred tab stops and two
 * hundred radios announcing a choice nobody can make.
 */
test('holds an input member and a display member under one identifier', () => {
  assert.deepEqual(Object.keys(contract.members), ['rating', 'ratingDisplay', 'ratingSummary']);
  assert.equal(contract.rootRole.rating, 'radiogroup');
  assert.equal(contract.rootRole.ratingDisplay, 'img');
  assert.equal(contract.rootRole.ratingSummary, 'region');
  assert.deepEqual(rating.parts, ['root', 'symbols', 'item', 'input', 'symbol', 'fill', 'value']);
  assert.deepEqual(display.parts, [
    'root',
    'symbols',
    'item',
    'symbol',
    'fill',
    'value',
    'histogram',
    'bar',
    'count',
  ]);
});

/**
 * One native radio per value the reader can pick, so the form, `name`,
 * `required`, Tab-into-the-checked-item and Space are the platform's. A half
 * step is a second radio over the inline-start half of the same symbol — the
 * shape Fluent and MUI give a precision of one half.
 */
test('builds each value the reader can pick on a native radio', () => {
  assert.equal(contract.controlPart, 'input');
  assert.equal(contract.controlElement, 'input[type=radio]');
  assert.equal(contract.grouping, 'name');
  assert.deepEqual(contract.steps, [1, 0.5]);
  assert.equal(contract.halfAttribute, 'data-half');
  assert.equal(contract.hitArea, 'input');
});

test('reads its value through a controlled and an uncontrolled pair, and can clear it', () => {
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'clear'],
  });
  assert.equal(contract.emptyValue, null);
  assert.equal(rating.defaults.clearable, true);
  assert.ok(rating.capabilities.includes('value'));
  assert.ok(!display.capabilities.includes('value'));
  assert.ok(display.capabilities.includes('measurement'));
});

/**
 * The APG rating radio group wraps from the last star to the first; the APG
 * rating slider does not, and neither do Ark, MUI or Mantine. A rating that
 * falls from five to one on one keystroke too many is the defect, so the family
 * owns the arrows and stops at both ends, and adds the slider's Home and End.
 */
test('owns the arrows, stops at both ends and reaches both ends in one key', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  assert.deepEqual(keys, [
    'Tab',
    'Space',
    'ArrowRight',
    'ArrowUp',
    'ArrowLeft',
    'ArrowDown',
    'Home',
    'End',
    'Backspace',
    'Delete',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(['platform', 'family'].includes(entry.source), `${entry.key} source`);
    assert.ok(entry.focus.length > 0, `${entry.key} names no focus destination`);
  }
  const platform = contract.keyboard.filter((entry) => entry.source === 'platform');
  assert.deepEqual(
    platform.map((entry) => entry.key),
    ['Tab', 'Space'],
  );
  assert.match(contract.keyboard.find((e) => e.key === 'ArrowRight').effect, /no wrap/);
  assert.match(contract.keyboard.find((e) => e.key === 'ArrowRight').effect, /right-to-left/);
  assert.match(contract.keyboard.find((e) => e.key === 'Delete').effect, /clearable/);
  assert.equal(contract.wraps, false);
  assert.ok(contract.declined.PageUp, 'PageUp and PageDown are declined with a reason');
});

test('announces each value by a message of the language in force', () => {
  assert.equal(contract.itemLabel.message, 'itemLabel');
  assert.equal(contract.displayLabel.message, 'displayLabel');
  assert.deepEqual(contract.provides.ratingDefaults, [
    'size',
    'tone',
    'max',
    'clearable',
    'insightThresholds',
  ]);
});

test('paints the reader’s pick with a tone and a size from the shared vocabulary', () => {
  /* Every tone but secondary, whose solid step is a ground and lights nothing. */
  assert.deepEqual(
    contract.axes.tone,
    TONES.filter((tone) => tone !== 'secondary'),
  );
  assert.ok(contract.declined.secondaryTone);
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(rating.defaults.tone, 'warning');
  assert.equal(display.defaults.tone, 'warning');
  assert.deepEqual(contract.resolution.size, ['prop', 'field', 'defaults', 'md']);
});

/**
 * A fraction the display draws is a runtime value: the binding writes how much
 * of each symbol is filled, and no theme could state it.
 */
test('fills a symbol from a runtime property, and the input member from its radios', () => {
  assert.equal(contract.fillProperty, '--slotted-rating-fill');
  assert.equal(contract.fillSource.rating, 'checked radio, or the hovered one');
  assert.equal(contract.fillSource.ratingDisplay, 'fillProperty');
});

test('declares every state it paints', () => {
  assert.deepEqual(rating.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'disabled',
    'readonly',
    'invalid',
    'checked',
  ]);
  assert.deepEqual(display.states, ['default']);
});

/**
 * The summary every surveyed store page draws beside its reviews — ReUI
 * `c-rating-6` and `review-3`, Amazon, Google Play — and the one place a
 * rating is read as many ratings at once: the mean, how many readings it is
 * made of, and one bar per level. A level may filter the list it sits above,
 * so the levels are toggle buttons and the filter is a state model.
 */
test('summarises many ratings as an aggregate and a distribution that can filter', () => {
  const summary = contract.members.ratingSummary;
  assert.equal(summary.nativeElement, 'section');
  assert.deepEqual(
    summary.parts,
    [
      'root',
      'aggregate',
      'value',
      'scale',
      'count',
      'distribution',
      'level',
      'level-label',
      'track',
      'indicator',
      'level-count',
      'plot',
      'field',
      'columns',
      'column',
      'bar',
      'interval',
      'mean',
      'mean-label',
      'axis',
      'tick',
      'tick-label',
      'tick-share',
      'sentiment',
      'bucket',
      'swatch',
    ].toSpliced(4, 0, 'insight'),
  );
  assert.ok(summary.states.includes('pressed'));
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'selectedLevels',
    uncontrolled: 'defaultSelectedLevels',
    request: 'onSelectedLevelsChange',
    reasons: ['pointer', 'keyboard', 'clear'],
  });
  assert.equal(contract.shareProperty, '--slotted-rating-share');
  assert.equal(contract.summaryLabel.empty, 'summaryEmpty');
});

/**
 * The mean hides the shape and the confidence: 3.3 of five may be half ones
 * and half fives, and 4.9 from seven readings is worth less than 4.7 from a
 * thousand. The spectrum draws the distribution on the scale's own axis, the
 * mean on it, the interval of the mean behind it and one conclusion above.
 */
test('draws a spectrum: the distribution, the mean and its interval on one axis', () => {
  assert.deepEqual(contract.axes.summaryVariant, ['bars', 'spectrum']);
  assert.deepEqual(contract.meanProperties, [
    '--slotted-rating-mean',
    '--slotted-rating-low',
    '--slotted-rating-high',
  ]);
  assert.deepEqual(contract.insight.values, ['divided', 'few', 'consensus', 'mixed']);
  assert.deepEqual(contract.insight.thresholds, {
    divided: 0.25,
    few: 30,
    margin: 0.5,
    consensus: 0.8,
  });
  assert.ok(contract.provides.ratingDefaults.includes('insightThresholds'));
});

test('draws a compact display as one star, the figure and the count', () => {
  assert.deepEqual(contract.axes.variant, ['full', 'compact', 'histogram']);
  assert.ok(display.parts.includes('histogram'));
  assert.equal(display.defaults.variant, 'full');
});

/** The half radio used to sit under the whole one and never took a press. */
test('lets the half of a symbol be pressed, and a finger drag along the row', () => {
  assert.match(contract.pointer.halfHit, /stacked above the whole one/);
  assert.match(contract.pointer.drag, /ratingAtPoint/);
  assert.equal(contract.core, '@slotted/core/rating');
});

test('names where the edge comes from in the scheme that needs it', () => {
  assert.equal(contract.edgeToken, '--slotted-rating-edge');
});

test('reports a preview as an event, not as state it holds', () => {
  assert.equal(contract.events.onPreviewChange.carries, 'the value under the pointer, or null');
});

/**
 * One catalog for every default string, and one grammar for both bindings:
 * "1 star" and "1 rating" come from the locale's plural rules, not from
 * a template that said "1 stars" in both.
 */
test('reads every message from the catalog, through the shared grammar', () => {
  assert.ok(contract.messages.includes('levelLabel'));
  assert.ok(contract.messages.includes('summaryCount'));
  assert.equal(contract.messageFormat.startsWith('@slotted/core/i18n'), true);
  assert.equal(contract.insight.shownIn, 'spectrum');
});
