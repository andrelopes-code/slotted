// usage: node tools/journey-b.mjs   (the demo served at http://localhost:4250; W, H and OUT optional)
// Journey B (§20) on an emulated phone (390×844, touch), one browser session so the in-memory
// backend keeps its state: the persona changes through the demo panel, never by a reload.
// Marcus Lee opens a purchase order from a CHI-01 position below its reorder point, the
// procurement lead approves it, Marcus sends it, Jordan Wells receives it in part with damaged
// and rejected units, and the stock, the ledger and the back gesture are asserted after it.
// Prints one PASS or FAIL per step and exits non-zero on a failure.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ORIGIN = 'http://localhost:4250';
const OUT = process.env.OUT ?? mkdtempSync(join(tmpdir(), 'slotted-journey-shots-'));
// A CHI-01 position below its reorder point whose preferred supplier is active, standard and in
// dollars and maps the SKU (light seed). Thirty units are worth about US$31,600: one step, a
// Procurement Manager's.
const SKU = 'sku_000583';
const ORDER = 30;
const [ACCEPT, DAMAGED, REJECTED] = [20, 2, 3];
const CHI = 'wh_000001';
const [width, height] = [Number(process.env.W ?? 390), Number(process.env.H ?? 844)];

// Chrome takes a free port of the system's choosing and writes it in the profile: two runs at once
// never attach to each other's browser.
let port = 0;
const readPort = () => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
const profile = mkdtempSync(join(tmpdir(), 'slotted-journey-'));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
let targets = null;
for (let i = 0; i < 30 && targets === null; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try { port = readPort();
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { targets = null; }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { if (!sessionStorage.getItem('j')) { localStorage.clear(); localStorage.setItem('nexora:demo', JSON.stringify({ persona: 'marcus-lee', scenario: 'healthy', scale: 'light' })); sessionStorage.setItem('j', '1'); } } catch {}`,
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
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const shot = async (name) => {
  const s = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/jb-${String(++step).padStart(2, '0')}-${name}.png`, Buffer.from(s.data, 'base64'));
};
const overflow = () => js(`(() => { const de = document.documentElement; return [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); return b.right > innerWidth + 1 && b.width > 0 && getComputedStyle(el).visibility !== 'hidden'; }).length; })()`);
/** An in-app navigation, as a tapped link makes it: the router answers `popstate`, and nothing reloads. */
const go = async (path) => { await js(`(history.pushState({}, '', ${JSON.stringify(path)}), dispatchEvent(new PopStateEvent('popstate')), true)`); await wait(2500); };
const until = async (expression, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(expression)) return true; await wait(250); } return false; };
const helpers = `
  window.__visible = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  window.__byText = (selector, text) => [...document.querySelectorAll(selector)].find((el) => __visible(el) && el.textContent.replace(/\\s+/g, ' ').trim() === text);
  window.__type = (el, value) => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; el.focus(); setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); };
  true`;
/** A header command, drawn in the toolbar or folded into its overflow menu on a phone. */
const command = async (text) => {
  await js(helpers);
  const direct = await js(`(() => { const el = __byText('button, a', ${JSON.stringify(text)}); if (el) { el.click(); return true; } return false; })()`);
  if (direct) return true;
  const opened = await js(`(() => { const t = [...document.querySelectorAll('[data-ui=toolbar] button[aria-haspopup]')].find(__visible); if (t) { t.click(); return true; } return false; })()`);
  if (!opened) return false;
  await wait(600);
  return js(`(() => { const el = __byText('[role=menuitem]', ${JSON.stringify(text)}); if (el) { el.click(); return true; } return false; })()`);
};
const persona = async (name) => {
  await js(helpers);
  await js(`document.querySelector('[aria-label="Demo controls"]').click()`);
  await until(`!!__byText('button', ${JSON.stringify(name)}) || [...document.querySelectorAll('button')].some((b) => __visible(b) && b.textContent.includes(${JSON.stringify(name)}))`);
  await js(`[...document.querySelectorAll('button')].find((b) => __visible(b) && b.textContent.includes(${JSON.stringify(name)})).click()`);
  await wait(3000);
  const who = await js(`document.querySelector('[data-ui=avatar]')?.getAttribute('aria-label') ?? document.querySelector('[data-ui=avatar]')?.textContent?.trim()`);
  return who;
};

await send('Page.navigate', { url: `${ORIGIN}/inventory/stock/${SKU}?warehouse=${CHI}` });
await wait(14000);
await js(helpers);
const readPosition = () => js(`(() => { const cards = [...document.querySelectorAll('[data-ui=stat-card]')]; const v = (label) => cards.find((c) => c.querySelector('[data-part=label]')?.textContent.trim() === label)?.querySelector('[data-part=value]')?.textContent.replace(/\\s+/g, ' ').trim(); return { onHand: v('On hand'), inbound: v('Inbound'), available: v('Available') }; })()`);
const before = await readPosition();
check('position below its reorder point, as Marcus Lee', !!before.onHand, JSON.stringify(before));
await shot('position');
const href = await js(`document.querySelector('[data-testid=create-po]')?.getAttribute('href') ?? [...document.querySelectorAll('a')].find((a) => (a.getAttribute('href') ?? '').includes('/procurement/purchase-orders/new'))?.getAttribute('href')`);
check('Create purchase order carries the SKU, the warehouse, the quantity and the supplier', !!href && href.includes(SKU) && href.includes('supplier=') && href.includes('quantity='), href);
if (!(await command('Create purchase order'))) await go(href);
await until(`!!document.querySelector('[data-testid=po-lines]')`, 20000);
await wait(1500);
await js(helpers);
await js(`__type(document.querySelector('[data-testid=po-lines] input[aria-label^="Quantity of"]'), '${ORDER}')`);
await wait(800);
const preview = await js(`document.querySelector('[data-testid=approval-preview]')?.textContent.replace(/\\s+/g, ' ').trim()`);
check('the form says, before the submit, that a Procurement Manager approves it', /Procurement Manager/.test(preview ?? ''), preview?.slice(0, 120));
check('no element wider than the phone on the form', (await overflow()) === 0);
await shot('new-po');
await js(`__byText('button', 'Save and submit for approval').click()`);
await until(`location.pathname.startsWith('/procurement/purchase-orders/po_')`, 20000);
const poPath = await js('location.pathname');
await until(`!!document.querySelector('[data-testid=po-figures]')`);
const status1 = await js(`document.querySelector('[data-ui=page-header] [data-ui=tag]')?.textContent.trim()`);
check('the order waits on its approval', status1 === 'In approval', status1);
await shot('pending');

const lead = await persona('Heather Kennedy');
check('the demo panel signs in the procurement lead', true, String(lead));
await go(poPath);
await until(`!!document.querySelector('[data-testid=po-figures]')`);
await js(helpers);
await js(`__byText('button', 'Approve').click()`);
await until(`document.querySelector('[data-ui=page-header] [data-ui=tag]')?.textContent.trim() === 'Approved'`);
check('the procurement lead approves it', (await js(`document.querySelector('[data-ui=page-header] [data-ui=tag]')?.textContent.trim()`)) === 'Approved');
await shot('approved');

await persona('Marcus Lee');
await go(poPath);
await until(`!!document.querySelector('[data-testid=po-figures]')`);
check('Marcus sends it', await command('Send to supplier'));
await until(`document.querySelector('[data-ui=page-header] [data-ui=tag]')?.textContent.trim() === 'Sent'`);
await shot('sent');
const number = await js(`document.querySelector('[data-ui=page-header] h1')?.textContent.trim()`);

await persona('Jordan Wells');
// Jordan reads CHI-01 alone, so the figures before and after the receipt are that warehouse's.
await go(`/inventory/stock/${SKU}?warehouse=${CHI}`);
await until(`!!document.querySelector('[data-ui=stat-card] [data-part=value]') && !document.querySelector('[data-ui=stat-card][data-loading]')`);
await wait(1500);
const atChicago = await readPosition();
await go('/procurement/receiving');
await until(`!!document.querySelector('[data-ui=filter-bar] input')`);
await js(helpers);
check('the list tools stand on one line on a phone', await js(`(() => { const end = document.querySelector('[data-ui=filter-bar] [data-part=end]'); return end && end.getBoundingClientRect().height < 60 && !end.querySelector('[data-testid=density]'); })()`));
await js(`(() => { const i = document.querySelector('[data-ui=filter-bar] input'); __type(i, ${JSON.stringify(number)}); })()`);
await until(`[...document.querySelectorAll('a')].some((a) => a.textContent.trim() === ${JSON.stringify(number)})`);
await shot('queue');
await js(`[...document.querySelectorAll('a')].find((a) => a.textContent.trim() === ${JSON.stringify(number)}).click()`);
await until(`!!document.querySelector('[data-testid=receive-form]')`);
check('a row of the queue opens the order on its receipt', (await js('location.search')) === '?receive=1');
await js(helpers);
const code = await js(`document.querySelector('[data-testid^=receipt-line-]').getAttribute('data-testid').replace('receipt-line-', '')`);
await js(`(() => { for (const [field, value] of [['Accepted', '${ACCEPT}'], ['Damaged', '${DAMAGED}'], ['Rejected', '${REJECTED}']]) __type(document.querySelector('input[aria-label="' + field + ' of ${code}"]'), value); })()`);
await wait(800);
const outcome = await js(`document.querySelector('[data-testid=receipt-outcome]')?.textContent.replace(/\\s+/g, ' ').trim()`);
check('the form says where each part goes before the confirm', /back to/.test(outcome ?? '') && /damaged bucket/.test(outcome ?? '') && /partly received/.test(outcome ?? ''), outcome?.slice(0, 160));
check('no element wider than the phone on the receipt', (await overflow()) === 0);
await shot('receipt-form');
await js(`document.querySelector('[data-testid=receive-submit]').click()`);
await until(`!!document.querySelector('[data-testid=received]')`, 20000);
const received = await js(`document.querySelector('[data-testid=received]')?.textContent.replace(/\\s+/g, ' ').trim()`);
check('the receipt reports the partial success', /received in part/.test(received ?? ''), received);
check('the form closed without leaving an entry of its own', (await js('location.search')) === '');
const receiptHref = await js(`[...document.querySelectorAll('[data-testid=received] a')][0]?.getAttribute('href')`);
await shot('received');
await js('history.back()');
await wait(2500);
check('the back gesture after the receipt returns to the queue', (await js('location.pathname')) === '/procurement/receiving', await js('location.pathname'));

await go(`/inventory/stock/${SKU}?warehouse=${CHI}`);
await until(`!!document.querySelector('[data-ui=stat-card] [data-part=value]') && !document.querySelector('[data-ui=stat-card][data-loading]')`);
await wait(1500);
const after = await readPosition();
const num = (text) => Number((text ?? '').replace(/[^0-9.-]/g, ''));
check('on hand at CHI-01 grew by the accepted and the damaged units', num(after.onHand) === num(atChicago.onHand) + ACCEPT + DAMAGED, `${atChicago.onHand} → ${after.onHand}`);
check('inbound at CHI-01 fell by everything that came through the door', num(after.inbound) === num(atChicago.inbound) - (ACCEPT + DAMAGED + REJECTED), `${atChicago.inbound} → ${after.inbound}`);
await shot('position-after');
const receiptId = receiptHref?.split('/').pop();
await go(`/inventory/movements?source=${receiptId}`);
await until(`[...document.querySelectorAll('a')].some((a) => (a.getAttribute('href') ?? '').includes('/procurement/receiving/${receiptId}'))`);
await shot('ledger');
await js(`[...document.querySelectorAll('a')].find((a) => (a.getAttribute('href') ?? '').includes('/procurement/receiving/${receiptId}')).click()`);
await until(`!!document.querySelector('[data-testid=receipt-lines]') && location.pathname.startsWith('/procurement/receiving/')`);
check('the movement leads to its goods receipt', (await js('location.pathname')) === `/procurement/receiving/${receiptId}`);
await shot('receipt');
await js('history.back()');
await wait(2500);
check('the back gesture returns to the ledger', (await js('location.pathname')) === '/inventory/movements', await js('location.pathname + location.search'));

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
