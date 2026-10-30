import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { chromium } from 'playwright-core';

/**
 * The ring keeps turning while the page's main thread is busy.
 *
 * The request came from an application whose loading buttons froze while a
 * screen rendered: the arc was animated inside an SVG image used as a mask,
 * and that image is rasterised again on the main thread for every frame.
 * Measured here with the main thread blocked for two seconds, that ring gave
 * no frame at all, while a `rotate` animation, which the compositor runs, gave
 * one per vsync.
 *
 * The page is the family's stylesheet and the ring's markup as the harness
 * fragment writes it. Frames are counted from the browser's screencast, which
 * the compositor feeds, and acknowledged from here, so a blocked page does not
 * hold them back.
 *
 * Run: node tools/harness/scenarios/spinner-busy.mjs
 * Exits non-zero when an assertion fails.
 */

const css = readFileSync(
  new URL('../../../packages/styles/src/spinner/spinner.css', import.meta.url),
  'utf8',
);
const fragment = readFileSync(
  new URL('../../../packages/styles/src/spinner/spinner.harness.html', import.meta.url),
  'utf8',
);
const ring = /<span\s[^>]*data-ui-spinner=""[^>]*>[\s\S]*?<\/span>/.exec(fragment)?.[0];
assert.ok(ring, 'the harness fragment holds no ring');

const BUSY = 2000;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
  await page.setContent(
    /* The loop duration is the default theme's, which this page does not load. */
    `<!doctype html><style>${css}</style><div style="color:#000;padding:20px;--slotted-spinner-size:48px;--slotted-duration-loop-slow:1.6s">${ring}</div>`,
  );
  await page.waitForTimeout(300);

  const session = await page.context().newCDPSession(page);
  const frames = [];
  session.on('Page.screencastFrame', ({ data, sessionId, metadata }) => {
    frames.push({ at: metadata.timestamp * 1000, data });
    session.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await session.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  await page.waitForTimeout(300);

  await page.evaluate((busy) => {
    setTimeout(() => {
      const end = performance.now() + busy;
      while (performance.now() < end);
    }, 0);
  }, BUSY);
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, BUSY - 200));
  const during = frames.filter((frame) => frame.at > start + 100 && frame.at < start + BUSY - 200);
  await session.send('Page.stopScreencast');

  const distinct = new Set(during.map((frame) => frame.data)).size;
  const seconds = (BUSY - 300) / 1000;
  console.log(`busy ${seconds}s: ${during.length} frames, ${distinct} distinct`);
  /* Thirty distinct frames a second is half of a 60 Hz vsync. */
  assert.ok(distinct >= 30 * seconds, `the ring drew ${distinct} distinct frames while busy`);
} finally {
  await browser.close();
}
