// usage: node tools/analytics-drill.mjs   (the demo served at http://localhost:4250; W, H and OUT optional)
// The Analytics drill-down on an emulated phone (390×844, touch), one browser session so the
// in-memory backend keeps its state: the persona changes through the demo panel, never by a reload.
// Evan Brooks opens the executive report, changes its period and its comparison, opens a figure
// on the list it counts — the condition and the period as the bar's pills, the same total — opens
// a record, and returns with the back gesture to the report on the same period; Noah Bennett opens
// the sales report with the margin left out and said; Jordan Wells is refused. Prints one PASS or
// FAIL per step and exits non-zero on a failure.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:4250';
const OUT = process.env.OUT ?? mkdtempSync(join(tmpdir(), 'slotted-journey-shots-'));
const [width, height] = [Number(process.env.W ?? 390), Number(process.env.H ?? 844)];

const profile = mkdtempSync(join(tmpdir(), 'slotted-journey-'));
// Chrome takes a free port of the system's choosing and writes it in the profile.
let port = 0;
const readPort = () => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
let targets = null;
for (let i = 0; i < 30 && targets === null; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try { port = readPort(); targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { targets = null; }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { if (!sessionStorage.getItem('j')) { localStorage.clear(); localStorage.setItem('nexora:demo', JSON.stringify({ persona: 'evan-brooks', scenario: 'healthy', scale: 'light' })); sessionStorage.setItem('j', '1'); } } catch {}`,
});
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 3, mobile: true, screenWidth: width, screenHeight: height });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const js = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${JSON.stringify(result.exceptionDetails).slice(0, 400)}`);
  return result.result?.value;
};
let step = 0;
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const shot = async (name) => {
  const s = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/ad-${String(++step).padStart(2, '0')}-${name}.png`, Buffer.from(s.data, 'base64'));
};
const overflow = () => js(`(() => [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); if (!(b.right > innerWidth + 1 && b.width > 0 && getComputedStyle(el).visibility !== 'hidden')) return false; for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll' || o === 'hidden') && p.getBoundingClientRect().right <= innerWidth + 1) return false; } return true; }).length)()`);
/** An in-app navigation, as a tapped link makes it: the router answers `popstate`, and nothing reloads. */
const go = async (path) => { await js(`(history.pushState({}, '', ${JSON.stringify(path)}), dispatchEvent(new PopStateEvent('popstate')), true)`); await wait(2500); };
const until = async (expression, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(expression)) return true; await wait(250); } return false; };
const helpers = `
  window.__visible = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  window.__byText = (selector, text) => [...document.querySelectorAll(selector)].find((el) => __visible(el) && el.textContent.replace(/\\s+/g, ' ').trim() === text);
  window.__type = (el, value) => { const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; const setter = Object.getOwnPropertyDescriptor(proto, 'value').set; el.focus(); setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); };
  window.__tab = (label) => [...document.querySelectorAll('[role=tab]')].find((el) => __visible(el) && el.textContent.trim().startsWith(label));
  window.__figure = (label) => [...document.querySelectorAll('[data-ui=stat-card]')].find((c) => c.querySelector('[data-part=label]')?.textContent.trim() === label)?.querySelector('[data-part=value]')?.textContent.replace(/\\s+/g, ' ').trim();
  true`;
/** A header command, drawn in the toolbar or folded into its overflow menu on a phone. */
const command = async (text) => {
  await js(helpers);
  const direct = await js(`(() => { const el = __byText('button, a', ${JSON.stringify(text)}); if (el) { el.click(); return true; } return false; })()`);
  if (direct) return true;
  const opened = await js(`(() => { const t = [...document.querySelectorAll('[data-ui=page-header] [data-ui=toolbar] button[aria-haspopup]')].find(__visible); if (t) { t.click(); return true; } return false; })()`);
  if (!opened) return false;
  await wait(600);
  return js(`(() => { const el = __byText('[role=menuitem]', ${JSON.stringify(text)}); if (el) { el.click(); return true; } return false; })()`);
};
const persona = async (name) => {
  await js(helpers);
  await js(`document.querySelector('[aria-label="Demo controls"]').click()`);
  await until(`[...document.querySelectorAll('button')].some((b) => __visible(b) && b.textContent.includes(${JSON.stringify(name)}))`);
  await js(`[...document.querySelectorAll('button')].find((b) => __visible(b) && b.textContent.includes(${JSON.stringify(name)})).click()`);
  await wait(3000);
  return js(`document.querySelector('[data-ui=avatar]')?.getAttribute('aria-label') ?? document.querySelector('[data-ui=avatar]')?.textContent?.trim()`);
};
const money = (text) => Number((text ?? '').replace(/[^0-9.-]/g, ''));


const value = (key) => js(`(() => { const row = document.querySelector('[data-figure=${key}]'); return row ? row.querySelector('[data-part=end]')?.textContent.replace(/\\s+/g, ' ').trim() ?? row.textContent : null; })()`);
/** A select of the report's header: opened, and the option with these words chosen. */
const choose = async (testid, words) => {
  await js(helpers);
  await js(`document.querySelector('[data-testid=${testid}] button, [data-testid=${testid}] [role=combobox]').click()`);
  await until(`!!__byText('[role=option]', ${JSON.stringify(words)})`, 5000);
  await js(`__byText('[role=option]', ${JSON.stringify(words)}).click()`);
  await wait(2500);
};

// 1. The executive report, its figures a list of doors on the phone (OV-02).
await send('Page.navigate', { url: `${ORIGIN}/analytics/executive` });
await wait(14000);
await js(helpers);
await until(`/\\d/.test(document.querySelector('[data-figure=orders]')?.textContent ?? '')`, 20000);
check('the executive report opens as Evan Brooks, its figures first', await js(`!!document.querySelector('ul[data-testid=figures] [data-figure=orders]')`), await js('location.pathname + location.search'));
check('no element wider than the phone on the report', (await overflow()) === 0);
await shot('executive');

// 2. The period and the comparison, from the header's filters.
await js(`document.querySelector('[data-ui=page-header] [data-part=toggle]')?.click()`);
await wait(800);
await choose('period', 'Last 7 days');
await choose('compare', 'A year earlier');
await until(`location.search.includes('period=7d') && location.search.includes('compare=year')`);
await until(`/\\d/.test(document.querySelector('[data-figure=orders]')?.textContent ?? '') && !document.querySelector('.report[aria-busy=true]')`, 20000);
const address = await js('location.pathname + location.search');
check('the period and its comparison are the report’s address', address === '/analytics/executive?period=7d&compare=year', address);
const words = await js(`document.querySelector('[data-testid=period-words]')?.textContent.trim()`);
check('the subheading says the period and its base', /Last 7 days · vs a year earlier/.test(words ?? ''), words);
const orders = money(await value('orders'));
check('the orders figure reads a number for the period', orders > 0, String(orders));
await shot('period');

// 3. The figure opens the list it counts, with the condition and the period as pills and the same total.
await js(`document.querySelector('[data-figure=orders] a').click()`);
await until(`location.pathname === '/sales/orders' && /[\\d,]+ of [\\d,]+ orders/.test(document.querySelector('[data-ui=filter-bar]')?.textContent ?? '')`, 20000);
await wait(1500);
const list = await js('location.pathname + location.search');
check('the figure opens the order list with its condition in the address', /orderDate=\d{4}-\d\d-\d\d\.\.\d{4}-\d\d-\d\d/.test(list) && list.includes('status='), list);
const pills = await js(`[...document.querySelectorAll('[data-ui=filter-bar] [data-part=chip], [data-ui=filter-bar] [data-part=pill]')].filter(__visible).map((el) => el.textContent.replace(/\\s+/g, ' ').trim()).join(' | ')`);
check('the period and the status are the bar’s own pills', /Ordered/.test(pills) && /Status/.test(pills), pills);
const countWords = await js(`[...document.querySelectorAll('[data-ui=filter-bar] *')].map((el) => el.textContent.replace(/\\s+/g, ' ').trim()).find((words) => /^[\\d,]+ of [\\d,]+ orders$/.test(words) || /^[\\d,]+ orders$/.test(words)) ?? ''`);
const count = money(countWords.split(' of ')[0]);
check('the list holds the figure’s total', count === orders, `${countWords} against the figure's ${orders}`);
check('no element wider than the phone on the list', (await overflow()) === 0);
await shot('list');

// 4. A record of the list.
await js(`[...document.querySelectorAll('[data-ui=data-grid] a[href^="/sales/orders/"]')].find(__visible).click()`);
await until(`/^\\/sales\\/orders\\/ord_/.test(location.pathname)`, 20000);
await wait(2000);
check('a row opens its order', /^\/sales\/orders\/ord_/.test(await js('location.pathname')), await js('location.pathname'));
await shot('record');

// 5. The back gesture, twice: the list, then the report on the same period.
await js('history.back()');
await until(`location.pathname === '/sales/orders'`);
await wait(1500);
await js('history.back()');
await until(`location.pathname === '/analytics/executive'`);
await until(`/\\d/.test(document.querySelector('[data-figure=orders]')?.textContent ?? '')`, 20000);
await wait(1500);
const back = await js('location.pathname + location.search');
check('the back gesture returns to the report on the same period', back === '/analytics/executive?period=7d&compare=year', back);
check('the report reads the same figure again', money(await value('orders')) === orders);
await shot('back');

// 6. Noah Bennett: the sales report with the margin left out, and said.
const noah = await persona('Noah Bennett');
check('the demo panel signs in Noah Bennett', !!noah, String(noah));
await go('/analytics/sales');
await until(`!!document.querySelector('[data-testid=withheld]') && /\\d/.test(document.querySelector('[data-figure=bookedValue]')?.textContent ?? '')`, 20000);
const withheld = await js(`document.querySelector('[data-testid=withheld]')?.textContent.replace(/\\s+/g, ' ').trim()`);
check('the margin is left out and the page says who reads it', /margins, which cost\.view gives to/.test(withheld ?? '') && !(await js(`!!document.querySelector('[data-figure=bookedMargin]')`)), withheld);
check('no element wider than the phone on the sales report', (await overflow()) === 0);
await shot('noah');

// 7. Jordan Wells is refused the module by name.
const jordan = await persona('Jordan Wells');
check('the demo panel signs in Jordan Wells', !!jordan, String(jordan));
await go('/analytics/executive');
await wait(1500);
const refused = await js(`document.body.textContent.replace(/\\s+/g, ' ')`);
check('Jordan Wells is refused, with the permission named', refused.includes('analytics.view') && !refused.includes('What needs attention'));
await shot('jordan');

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} steps pass`);
ws.close();
// The profile is thrown away with the browser: a run leaves nothing in the temporary directory.
// Killed outright, so no helper process flushes its state into the profile after it is removed.
chrome.kill('SIGKILL');
await new Promise((r) => (chrome.exitCode !== null || chrome.signalCode !== null ? r() : chrome.once('exit', r)));
await new Promise((r) => setTimeout(r, 400));
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
process.exit(failed ? 1 : 0);
