import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { captureUrl, launch } from '../shoot.mjs';

/**
 * A conversation driven through the five things its engine promises: it opens
 * at its last turn, older rows arrive above the reader without moving the row
 * the reader is on, a turn the reader sends stands near the top with a peek of
 * the row above it, rows that arrive while the reader is away are counted on
 * the jump control, and a jump lands on a row and marks it.
 *
 * The scene is `live` in `message-scroller.harness.html`, where a module
 * script connects `@slotted/core/message-scroller` with `follow`, `peek: 48`
 * and `scrollMargin: 8`. A reader's scroll is a `wheel` event followed by a
 * change of `scrollTop`, which is the pair the engine reads as intent.
 *
 * Run: node tools/harness/scenarios/message-scroller-live.mjs
 * Exits non-zero when an assertion fails.
 */

const build = fileURLToPath(new URL('../build.mjs', import.meta.url));
execFileSync(process.execPath, [build, 'message-scroller'], { stdio: 'ignore' });

const url = captureUrl({
  family: 'message-scroller',
  scheme: 'light',
  width: '420',
  density: 'comfortable',
  dir: 'ltr',
  scene: 'live',
});

const HELPERS = `
  const stage = document.querySelector('.cell.shown .stage[data-scene="live"]');
  const root = stage.querySelector('[data-ui="message-scroller"][data-part="root"]');
  const viewport = root.querySelector('[data-part="viewport"]');
  const content = root.querySelector('[data-part="content"]');
  const jump = root.querySelector('[data-part="jump"]');
  const frames = (count) => new Promise(async (resolve) => {
    for (let index = 0; index < count; index += 1) await new Promise((next) => requestAnimationFrame(next));
    resolve();
  });
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const settle = async () => {
    let last = -1;
    for (let frame = 0; frame < 120; frame += 1) {
      await frames(1);
      if (Math.abs(viewport.scrollTop - last) < 0.5 && frame > 3) break;
      last = viewport.scrollTop;
    }
  };
  const readerScroll = async (delta) => {
    viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: delta }));
    viewport.scrollTop += delta;
    await settle();
  };
  const top = (id) => Math.round(content.querySelector('[data-message-id="' + id + '"]').getBoundingClientRect().top - viewport.getBoundingClientRect().top);
  const atEnd = () => viewport.scrollHeight - (parseFloat(content.style.getPropertyValue('--slotted-message-scroller-room')) || 0) - viewport.clientHeight - viewport.scrollTop <= 8;
  const press = async (action) => { stage.querySelector('[data-action="' + action + '"]').click(); await settle(); };
`;

const SCENARIO = `async () => {
  ${HELPERS}
  const out = {};
  await settle();
  out.opened = { pending: viewport.hasAttribute('data-pending'), atEnd: atEnd(), following: root.hasAttribute('data-following') };

  await readerScroll(-160);
  out.away = { following: root.hasAttribute('data-following'), jumpActive: jump.getAttribute('data-active') };
  const before = top('a2');
  await press('older');
  out.prepend = { before, after: top('a2') };

  await press('stream');
  await wait(200);
  await settle();
  out.count = { text: jump.querySelector('[data-part="jump-count"]')?.textContent ?? null, label: jump.getAttribute('aria-label') };

  jump.click();
  await wait(700);
  await settle();
  out.back = { atEnd: atEnd(), jumpActive: jump.getAttribute('data-active'), count: jump.querySelector('[data-part="jump-count"]') === null };
  await wait(2500);
  await settle();

  await press('ask');
  await wait(400);
  await settle();
  const asked = content.querySelector('[data-message-id="live-q2"]') ?? content.querySelector('[data-message-id^="live-q"]');
  out.anchor = { top: Math.round(asked.getBoundingClientRect().top - viewport.getBoundingClientRect().top), room: parseFloat(content.style.getPropertyValue('--slotted-message-scroller-room')) || 0, offset: asked.offsetTop, parent: asked.offsetParent === viewport, scrollTop: viewport.scrollTop, max: viewport.scrollHeight - viewport.clientHeight, client: viewport.clientHeight, id: asked.dataset.messageId };

  await press('jump');
  await wait(700);
  await settle();
  out.jumped = { top: top('q1'), current: content.querySelector('[data-message-id="q1"]').hasAttribute('data-current') };
  return out;
}`;

const { devtools, close } = await launch();
let reading;

try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width: 900,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const loaded = devtools.once('Page.loadEventFired');
  await devtools.send('Page.navigate', { url: url.href });
  await loaded;
  const { result, exceptionDetails } = await devtools.send('Runtime.evaluate', {
    expression: `(${SCENARIO})()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails)
    throw new Error(exceptionDetails.exception?.description ?? 'the scene did not run');
  reading = result.value;
  console.log(JSON.stringify(reading, null, 2));
} finally {
  devtools.close();
  await close();
}

assert.equal(
  reading.opened.pending,
  false,
  'the viewport is shown once the opening position is applied',
);
assert.equal(reading.opened.atEnd, true, 'a conversation whose last turn fits opens at its end');
assert.equal(reading.opened.following, true, 'follow is on at the live edge');
assert.equal(reading.away.following, false, 'a scroll by the reader releases the follow');
assert.equal(
  reading.away.jumpActive,
  'true',
  'the jump control arrives when the end is out of view',
);
assert.ok(
  Math.abs(reading.prepend.after - reading.prepend.before) <= 1,
  `older rows above do not move the reader's row (${reading.prepend.before} → ${reading.prepend.after})`,
);
assert.equal(
  reading.count.text,
  '1 nova',
  'a row that arrives out of view is counted on the jump control',
);
assert.match(reading.count.label, /1 nova/, 'the count is in the control’s name');
assert.equal(reading.back.atEnd, true, 'the jump control takes the reader to the end');
assert.equal(reading.back.jumpActive, 'false', 'and leaves once there');
assert.equal(reading.back.count, true, 'and the count is cleared');
assert.ok(
  reading.anchor.top >= 8 + 48 - 2 && reading.anchor.top <= 8 + 48 + 2,
  `a sent turn stands at the margin plus the peek (${reading.anchor.top})`,
);
assert.ok(
  reading.jumped.top >= 6 && reading.jumped.top <= 10,
  `a jump lands the row at the margin (${reading.jumped.top})`,
);
assert.equal(reading.jumped.current, true, 'and marks it');
console.log('ok — opening, prepend, count, jump back, anchor and jump to a row');
