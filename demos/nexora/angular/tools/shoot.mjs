import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// usage: node tools/shoot.mjs <url> <out.png> [light|dark] [width]
const [url, out, scheme, widthArg] = process.argv.slice(2);
const width = Number(widthArg ?? 1280);
// The profile is a fresh directory: with the default one, a Chrome the developer already
// has open holds the lock, the new instance joins it, and `/json` lists that window's tabs
// instead of the one this script opened.
// Chrome takes a free port of the system's choosing and writes it in the profile: two runs at once
// never attach to each other's browser.
let port = 0;
const readPort = () => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
const profile = mkdtempSync(join(tmpdir(), 'slotted-shoot-'));
const chrome = spawn('google-chrome', ['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--window-size=1280,600',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
let targets = null;
for (let i = 0; i < 20 && targets === null; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try { port = readPort(); targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { targets = null; }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height: width < 800 ? 860 : 800, deviceScaleFactor: 1, mobile: width < 800 });
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 12000));
if (scheme) await send('Runtime.evaluate', { expression: `document.documentElement.setAttribute('data-slotted-scheme','${scheme}')` });
await new Promise((r) => setTimeout(r, 800));
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
ws.close(); // The profile is thrown away with the browser: a run leaves nothing in the temporary directory.
// Killed outright, so no helper process flushes its state into the profile after it is removed.
chrome.kill('SIGKILL');
await new Promise((r) => (chrome.exitCode !== null || chrome.signalCode !== null ? r() : chrome.once('exit', r)));
await new Promise((r) => setTimeout(r, 400));
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
