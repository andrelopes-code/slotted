import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./event-calendar.css', import.meta.url), 'utf8');
const normalized = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');

/** The declarations of every rule whose selector list names `fragment`. */
function rulesNaming(fragment) {
  return [...normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector]) => selector.includes(fragment))
    .map(([, , body]) => body);
}

/**
 * The small texts stack under rules — the weekday header, the column header,
 * a day of the list — and 1.4 × 12 is 16.8: every rule below them landed on a
 * fraction of a pixel. Their line boxes are rounded to a whole pixel.
 */
test('sets the small texts on whole-pixel line boxes', () => {
  assert.ok(
    normalized.includes(
      '--_line-xs:round(nearest,calc(1em*var(--slotted-line-height-xs,1.4)),1px);',
    ),
  );
  assert.ok(
    normalized.includes(
      '--_line-sm:round(nearest,calc(1em*var(--slotted-line-height-sm,1.45)),1px);',
    ),
  );
  assert.doesNotMatch(normalized, /line-height:var\(--slotted-line-height-(xs|sm)/);
});

/** Two lanes stand at least a minimum target apart at every density. */
test('keeps the lane pitch at the minimum target', () => {
  assert.ok(
    normalized.includes(
      '--_event-size:max(var(--slotted-control-inner-size-sm,22px),calc(var(--slotted-target-min,24px)-var(--_air)));',
    ),
  );
});

/** A press is its own state, instant, and never the hover again. */
test('answers the press on every control that answers the hover', () => {
  for (const fragment of [
    '[data-part-day-number]:active',
    '[data-part-event]:not([data-bar]):active',
    '[data-part-more]:active',
    '[data-part-list-events][data-part-event]:active',
    '[data-part-event][data-bar][data-open]:active',
  ]) {
    const bodies = rulesNaming(fragment);
    assert.ok(bodies.length > 0, `no rule for ${fragment}`);
    assert.ok(
      bodies.some((body) => body.includes('transition-duration:var(--slotted-duration-instant)')),
      `${fragment} is not instant`,
    );
  }
});

test('eases the resize grip in and out on the motion curves', () => {
  assert.ok(
    normalized.includes(
      'transition:opacityvar(--slotted-duration-short)var(--slotted-easing-exit);',
    ),
  );
  assert.ok(normalized.includes('transition-timing-function:var(--slotted-easing-enter);'));
});

test('transitions every colour the "+N" hover paints', () => {
  const [body] = [...normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector]) => selector.trim() === '[data-ui-event-calendar][data-part-more]')
    .map(([, , declarations]) => declarations);
  for (const property of ['background-color', 'border-color', 'color']) {
    assert.match(body, new RegExp(`[:,]${property}var\\(--slotted-control-transition-duration`));
  }
});

test('keeps today and the timed lines readable in forced colours', () => {
  const forced = normalized.slice(normalized.indexOf('@media(forced-colors:active)'));
  assert.ok(
    forced.includes('background-color:Highlight;color:HighlightText;forced-color-adjust:none;'),
  );
  assert.ok(forced.includes('border-color:Canvas;'));
});

/**
 * The calendar draws no box of its own: placed on a page's sunken ground, a
 * card or a panel, it takes that ground. A consumer that wants one names it
 * with `--slotted-event-calendar-background`, and that one value is also the
 * ground every event fill is mixed over, so the fills and the ground cannot
 * disagree.
 */
test('takes the ground it is placed on, and mixes its fills over that ground', () => {
  const root = rulesNaming('[data-ui-event-calendar][data-part-root]').join('');
  assert.ok(
    root.includes('background-color:var(--slotted-event-calendar-background,transparent);'),
    'the root paints nothing unless the consumer names a ground',
  );
  assert.ok(
    root.includes(
      '--_base:var(--slotted-event-calendar-background,var(--slotted-surface,#ffffff));',
    ),
    'the ground the fills are mixed over is the named one, else the surface',
  );
  const direct = normalized.match(/var\(--slotted-surface,#ffffff\)/g) ?? [];
  assert.equal(direct.length, 1, 'only `--_base` reads the surface; every fill reads `--_base`');
});
