import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * Every family that paints a scrim paints it the same way, and this reads the
 * pair off one family rather than restating it.
 *
 * `dialog` arrived at these two declarations by measurement, and the comment
 * beside them records it: on the entrance curve the scrim was at 57.6 per cent
 * of its ink by the second frame of the transition and 83 by the fourth — a
 * curve written for something that travels, spent on something that only
 * changes ink — and it was reported as a scrim that simply appeared. The
 * standard curve over the long step spends the frames where they can be seen:
 * 10.8 per cent at 25 milliseconds and 55 at 100.
 *
 * `drawer` was not given the correction and kept `--slotted-duration-medium` on
 * the entrance curve in both directions, which is how the same complaint
 * arrived a second time about a different family.
 *
 * Reading rather than restating is the point. A foundation that retunes the
 * motion scale retunes both families at once and this test still passes; a
 * family added later that writes its own pair fails here without anyone having
 * to remember the numbers. The cost is that the two families are coupled
 * through a test: one that ever needs a scrim of its own states the exception
 * in this file rather than simply writing different values.
 */
const REFERENCE = 'dialog';

function stylesheet(family) {
  return readFileSync(join(source, family, `${family}.css`), 'utf8');
}

/** The declaration a `[data-part-backdrop]` rule makes, closed and open. */
function scrimMotion(css, ui) {
  const closed = new RegExp(
    `\\[data-ui-${ui}\\]\\s*>\\s*\\[data-part-backdrop\\]\\s*\\{([\\s\\S]*?)\\}`,
  ).exec(css)?.[1];
  const open = new RegExp(
    `\\[data-ui-${ui}\\]\\[data-open\\]\\s*>\\s*\\[data-part-backdrop\\]\\s*\\{([\\s\\S]*?)\\}`,
  ).exec(css)?.[1];

  const transition = (block) =>
    /transition:\s*([^;]+);/.exec(block ?? '')?.[1]?.replace(/\s+/g, ' ');
  return { enter: transition(open), exit: transition(closed) };
}

/** Every family whose stylesheet paints a scrim of its own. */
function families() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      try {
        return stylesheet(name).includes('[data-part-backdrop]');
      } catch {
        return false;
      }
    });
}

const reference = scrimMotion(stylesheet(REFERENCE), REFERENCE);

test('the family the others are read against states both halves of its scrim', () => {
  assert.ok(reference.enter, `${REFERENCE} declares no transition on its open backdrop`);
  assert.ok(reference.exit, `${REFERENCE} declares no transition on its closed backdrop`);
});

test('every family that paints a scrim arrives and leaves the way dialog does', () => {
  const found = families();
  assert.ok(
    found.length >= 2,
    'fewer than two families paint a scrim; the ratchet has nothing to hold',
  );

  for (const family of found) {
    const motion = scrimMotion(stylesheet(family), family);

    assert.equal(
      motion.enter,
      reference.enter,
      `${family} arrives differently from ${REFERENCE}: a scrim is half of what a layer opening looks like, and two families disagreeing about it is two answers to one question`,
    );
    assert.equal(motion.exit, reference.exit, `${family} leaves differently from ${REFERENCE}`);
  }
});

/**
 * The pair is read from the scale rather than written in milliseconds, so a
 * theme that retunes the scale retunes the scrim. A literal here would be a
 * duration no theme could reach.
 */
test('states the scrim in steps of the motion scale, never in milliseconds', () => {
  for (const half of [reference.enter, reference.exit]) {
    assert.match(half, /var\(--slotted-duration-/, `${half} names no step of the duration scale`);
    assert.match(half, /var\(--slotted-easing-/, `${half} names no curve of the easing scale`);
    assert.doesNotMatch(half, /\d+ms/, `${half} writes a literal duration`);
  }
});
