// usage: node tools/look.mjs <url> <out.png> [width] [height] [persona] [scenario] [desk|phone] [light|dark] [eval-js]
// A screenshot of the demo as one persona in one scenario: the demo state is written to
// localStorage before the first document, so the backend seeds for that persona. `phone`
// emulates touch at device scale 3. Prints the elements wider than the viewport, the
// interactive elements under 44px (phone only) and the page's own scroll. WAIT (ms) tunes
// the load; the optional expression runs before the capture. A control out of the tab order and
// the accessibility tree (a form's validation proxy) is not a target and is not counted.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, out, widthArg = '1280', heightArg = '800', persona = 'maya-chen', scenario = 'healthy', mode = 'desk', scheme = '', pre = ''] =
  process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
const phone = mode === 'phone';
// Chrome takes a free port of the system's choosing and writes it in the profile: two runs at once
// never attach to each other's browser.
let port = 0;
const readPort = () => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
const profile = mkdtempSync(join(tmpdir(), 'slotted-look-'));
const chrome = spawn(
  'google-chrome',
  ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'],
  { stdio: 'ignore' },
);
let targets = null;
for (let i = 0; i < 30 && targets === null; i++) {
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
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Runtime.enable');
const state = JSON.stringify({ persona, scenario, scale: process.env.SCALE ?? 'light' });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { if (!sessionStorage.getItem('look-set')) { localStorage.clear(); localStorage.setItem('nexora:demo', ${JSON.stringify(state)}); sessionStorage.setItem('look-set','1'); } } catch {}`,
});
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: phone ? 3 : 1, mobile: phone, screenWidth: width, screenHeight: height });
if (phone) {
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });
}
if (scheme) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, Number(process.env.WAIT ?? 14000)));
const evalJs = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
if (pre) {
  console.log('pre:', await evalJs(pre));
  await new Promise((r) => setTimeout(r, Number(process.env.POSTWAIT ?? 1500)));
}
console.log(
  await evalJs(`(() => {
  const wide = [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); return b.right > innerWidth + 1 && b.width > 0 && getComputedStyle(el).visibility !== 'hidden'; }).slice(0, 12).map((el) => el.tagName.toLowerCase() + (el.dataset.ui ? '[' + el.dataset.ui + (el.dataset.part ? '/' + el.dataset.part : '') + ']' : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + ' r=' + Math.round(el.getBoundingClientRect().right));
  const de = document.documentElement;
  const small = ${phone} ? [...document.querySelectorAll('button, a[href], input, [role=combobox], [role=tab]')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.height < 43.5 && !el.closest('[data-ui=skeleton]') && !(el.getAttribute('tabindex') === '-1' && el.getAttribute('aria-hidden') === 'true') && getComputedStyle(el).visibility !== 'hidden'; }).slice(0, 12).map((el) => el.tagName.toLowerCase() + (el.dataset.ui ? '[' + el.dataset.ui + (el.dataset.part ? '/' + el.dataset.part : '') + ']' : '') + ' h=' + Math.round(el.getBoundingClientRect().height) + ' "' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24) + '"') : [];
  return JSON.stringify({ innerWidth, docScrollWidth: de.scrollWidth, pageScroll: de.scrollHeight - de.clientHeight, overflowing: wide, under44: small, url: location.pathname + location.search }, null, 1);
})()`),
);
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
ws.close();
// The profile is thrown away with the browser: a run leaves nothing in the temporary directory.
// Killed outright, so no helper process flushes its state into the profile after it is removed.
chrome.kill('SIGKILL');
await new Promise((r) => (chrome.exitCode !== null || chrome.signalCode !== null ? r() : chrome.once('exit', r)));
await new Promise((r) => setTimeout(r, 400));
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
process.exit(0);
