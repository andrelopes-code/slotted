// usage: [PERSONA=key] [SCENARIO=id] [TOUCH=1] node tools/jump.mjs <url> '<selector>' [width] [height]
// PERSONA and SCENARIO sign the demo in before the first document (default: the demo's own default);
// TOUCH=1 emulates a phone — touch, device scale 3 — so `pointer: coarse` rules apply.
// Measures one box while the screen is loading and again once it has loaded, and
// prints both. The checklist item it answers is "loaded and loading occupy the
// same boxes": a `top` that moves is the page jumping under the reader, and a
// `height` that shrinks is a reserved box that was too big. A box that grows
// downward is allowed — a section that exists on some records and not on others
// is not reserved.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, selector, widthArg = '1280', heightArg = '900'] = process.argv.slice(2);
if (!url || !selector) {
  console.error("usage: node tools/jump.mjs <url> '<selector>' [width] [height]");
  process.exit(1);
}
// Chrome takes a free port of the system's choosing and writes it in the profile: two runs at once
// never attach to each other's browser.
let port = 0;
const readPort = () => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
// The profile is a fresh directory: with the default one, a Chrome the developer already
// has open holds the lock, the new instance joins it, and `/json` lists that window's tabs
// instead of the one this script opened.
const profile = mkdtempSync(join(tmpdir(), 'slotted-jump-'));
const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    '--remote-debugging-port=0',
    'about:blank',
  ],
  { stdio: 'ignore' },
);
let targets = null;
for (let i = 0; i < 20 && targets === null; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    port = readPort();
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  } catch {
    targets = null;
  }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message.result);
    pending.delete(message.id);
  }
};
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
if (process.env.PERSONA || process.env.SCENARIO)
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { localStorage.setItem('nexora:demo', ${JSON.stringify(
      JSON.stringify({
        ...(process.env.PERSONA ? { persona: process.env.PERSONA } : {}),
        ...(process.env.SCENARIO ? { scenario: process.env.SCENARIO } : {}),
        scale: 'light',
      }),
    )}); } catch {}`,
  });
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(widthArg),
  height: Number(heightArg),
  deviceScaleFactor: process.env.TOUCH ? 3 : 1,
  mobile: !!process.env.TOUCH,
});
if (process.env.TOUCH) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url });

const read = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.value;
/** A screen is waiting while a grid loader or a skeleton region is on it. */
const BUSY = `!!document.querySelector('[data-part="loader"], [data-ui="skeleton"][data-part="region"], [data-ui="skeleton"]')`;
const box = `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return JSON.stringify({ top: Math.round(r.top), height: Math.round(r.height) });
})()`;

let loading = null;
let loaded = null;
for (let i = 0; i < 200; i++) {
  await new Promise((r) => setTimeout(r, 80));
  const busy = await read(BUSY);
  // The web face swaps in after the first frames; a box read in the fallback face moves when the
  // font arrives, which is not the wait this measures.
  const fonts = await read(`document.fonts.status === 'loaded'`);
  if (busy && fonts && loading === null) loading = await read(box);
  if (!busy && loading !== null) {
    loaded = await read(box);
    break;
  }
}
if (loading === null) console.log('no loading state observed');
else {
  const a = JSON.parse(loading ?? 'null');
  const b = JSON.parse(loaded ?? 'null');
  console.log('loading:', loading);
  console.log('loaded: ', loaded);
  if (a && b) {
    const moved = b.top - a.top;
    const shrank = a.height - b.height;
    console.log(
      `top moved ${moved}px${moved === 0 ? '' : ' — a box above it was not reserved'}; ` +
        `height ${shrank > 0 ? `shrank ${shrank}px — the reservation was too big` : `grew ${-shrank}px`}`,
    );
  }
}
ws.close();
// The profile is thrown away with the browser: a run leaves nothing in the temporary directory.
// Killed outright, so no helper process flushes its state into the profile after it is removed.
chrome.kill('SIGKILL');
await new Promise((r) => (chrome.exitCode !== null || chrome.signalCode !== null ? r() : chrome.once('exit', r)));
await new Promise((r) => setTimeout(r, 400));
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
