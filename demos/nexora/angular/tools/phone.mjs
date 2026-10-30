// usage: node tools/phone.mjs <url> <out.png> [width] [height] [pre-eval-js]
// A phone, not a narrow window: device scale 3, touch (so `pointer: coarse` raises every
// control to 44px), a mobile user agent. Prints the value of `pre-eval-js` (an expression,
// may be an async IIFE) and a report of any element wider than the viewport.
// WAIT and POSTWAIT (ms) tune the page load and the post-eval settle.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, out, widthArg, heightArg, pre] = process.argv.slice(2);
const width = Number(widthArg ?? 390);
const height = Number(heightArg ?? 844);
// Chrome takes a free port of the system's choosing and writes it in the profile: two runs at once
// never attach to each other's browser.
let port = 0;
const readPort = () => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
// The profile is a fresh directory: with the default one, a Chrome the developer already
// has open holds the lock, the new instance joins it, and `/json` lists that window's tabs
// instead of the one this script opened.
const profile = mkdtempSync(join(tmpdir(), 'slotted-phone-'));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
let targets = null;
for (let i = 0; i < 20 && targets === null; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try { port = readPort();
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { targets = null; }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 3, mobile: true, screenWidth: width, screenHeight: height });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, Number(process.env.WAIT ?? 12000)));
const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
if (pre) { console.log('pre:', await evalJs(pre)); await new Promise((r) => setTimeout(r, Number(process.env.POSTWAIT ?? 800))); }
console.log(await evalJs(`(() => {
  const wide = [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); return b.right > innerWidth + 1 && b.width > 0; }).slice(0, 12).map((el) => el.tagName.toLowerCase() + (el.dataset.ui ? '[' + el.dataset.ui + (el.dataset.part ? '/' + el.dataset.part : '') + ']' : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + ' r=' + Math.round(el.getBoundingClientRect().right));
  const main = document.querySelector('[data-ui="app-shell"] > [data-part="main"]');
  // The shell scrolls its own main, so the document must not scroll at all. It grows when an
  // out-of-flow box is laid out at a document coordinate and escapes the scroller it sits in.
  const de = document.documentElement;
  const pageScroll = de.scrollHeight - de.clientHeight;
  const below = pageScroll > 0 ? [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); return b.bottom > de.clientHeight + 1 && getComputedStyle(el).position === 'absolute' && !el.offsetParent; }).slice(0, 8).map((el) => el.tagName.toLowerCase() + '[' + (el.dataset.ui ?? '') + '/' + (el.dataset.part ?? '') + '] bottom=' + Math.round(el.getBoundingClientRect().bottom)) : [];
  return JSON.stringify({ innerWidth, docScrollWidth: de.scrollWidth, bodyScrollWidth: document.body.scrollWidth, mainScrollWidth: main?.scrollWidth, mainClientWidth: main?.clientWidth, pageScroll, unanchored: below, overflowing: wide }, null, 1);
})()`));
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
ws.close(); // The profile is thrown away with the browser: a run leaves nothing in the temporary directory.
// Killed outright, so no helper process flushes its state into the profile after it is removed.
chrome.kill('SIGKILL');
await new Promise((r) => (chrome.exitCode !== null || chrome.signalCode !== null ? r() : chrome.once('exit', r)));
await new Promise((r) => setTimeout(r, 400));
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
