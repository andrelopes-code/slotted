// usage: node tools/journey-c.mjs   (the demo served at http://localhost:4250; W, H and OUT optional)
// Journey C (§20) on an emulated phone (390×844, touch), one browser session so the in-memory
// backend keeps its state: the persona changes through the demo panel, never by a reload.
// Priya Shah opens the finance overview, its overdue door, the customer, the overdue invoice;
// records a contact attempt, records the customer's payment and allocates it to the invoice; the
// staff accountant reconciles the bank deposit against that payment; Priya reads the customer's
// overdue balance fall, and the back gesture returns to the workspace. Prints one PASS or FAIL
// per step and exits non-zero on a failure.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ORIGIN = 'http://localhost:4250';
const OUT = process.env.OUT ?? mkdtempSync(join(tmpdir(), 'slotted-journey-shots-'));
// The light seed's overdue invoice whose customer's wire is waiting in the bank feed: Calder
// Tooling's INV-2026-13022, US$2,772.29, and the deposit "FED WIRE IN CALDER TOOLING CO" of the
// same amount with the invoice number as its reference.
const INVOICE = 'INV-2026-13022';
// The deposit is found by its reference: Calder Tooling has an older ACH credit in the feed too.
const DEPOSIT = INVOICE;
const ACCOUNTANT = 'Laura Stewart';
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
  source: `try { if (!sessionStorage.getItem('j')) { localStorage.clear(); localStorage.setItem('nexora:demo', JSON.stringify({ persona: 'priya-shah', scenario: 'healthy', scale: 'light' })); sessionStorage.setItem('j', '1'); } } catch {}`,
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
  writeFileSync(`${OUT}/jc-${String(++step).padStart(2, '0')}-${name}.png`, Buffer.from(s.data, 'base64'));
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

// 1. The finance overview, its figures a list of doors on the phone (OV-02).
await send('Page.navigate', { url: `${ORIGIN}/finance/overview` });
await wait(14000);
await js(helpers);
await until(`!!document.querySelector('[data-testid=figures] a[href*="collection=overdue"]')`, 20000);
check('the overview opens with its figures as doors, as Priya Shah', await js(`!!document.querySelector('[data-testid=figures] a[href*="collection=overdue"]')`));
check('no element wider than the phone on the overview', (await overflow()) === 0);
await shot('overview');

// 2. The overdue door opens the list on its condition, as the bar's own pill (OV-01).
await js(`document.querySelector('[data-testid=figures] a[href*="collection=overdue"]').click()`);
await until(`location.pathname === '/finance/invoices' && !!document.querySelector('[data-ui=filter-bar] input')`);
await wait(1500);
const pill = await js(`[...document.querySelectorAll('[data-ui=filter-bar] [data-part=pill], [data-ui=filter-bar] [data-part=chip]')].map((el) => el.textContent.replace(/\\s+/g, ' ').trim()).join(' | ')`);
check('the overdue door opens the invoices with the collection state as a pill', /Overdue/.test(pill ?? ''), pill);
check('the list tools stand on one line on a phone', await js(`(() => { const end = document.querySelector('[data-ui=filter-bar] [data-part=end]'); return !end || (end.getBoundingClientRect().height < 60 && !end.querySelector('[data-testid=density]')); })()`));
await js(`__type(document.querySelector('[data-ui=filter-bar] input'), ${JSON.stringify(INVOICE)})`);
await until(`[...document.querySelectorAll('a')].some((a) => a.textContent.trim() === ${JSON.stringify(INVOICE)})`);
check('no element wider than the phone on the list', (await overflow()) === 0);
await shot('overdue-list');

// 3. The customer, from the invoice's row.
const customerHref = await js(`[...document.querySelectorAll('[data-ui=data-grid] a[href^="/crm/customers/"]')].find(__visible)?.getAttribute('href')`);
check('the overdue invoice’s row leads to its customer', !!customerHref, customerHref);
await js(`[...document.querySelectorAll('[data-ui=data-grid] a[href^="/crm/customers/"]')].find(__visible).click()`);
await until(`location.pathname === ${JSON.stringify(customerHref)} && !!__tab('Invoices')`, 20000);
await until(`!!__figure('Overdue') && !document.querySelector('[data-ui=stat-card][data-loading]')`);
const overdueBefore = await js(`__figure('Overdue')`);
check('Customer 360 states the overdue balance', !!overdueBefore, overdueBefore);
await shot('customer');

// 4. The invoice, from the customer's invoices.
await js(`__tab('Invoices').click()`);
await until(`[...document.querySelectorAll('a')].some((a) => a.textContent.trim() === ${JSON.stringify(INVOICE)})`);
await js(`[...document.querySelectorAll('a')].find((a) => a.textContent.trim() === ${JSON.stringify(INVOICE)}).click()`);
await until(`location.pathname.startsWith('/finance/invoices/inv_') && !!document.querySelector('[data-testid=invoice-figures]')`, 20000);
const invoicePath = await js('location.pathname');
await wait(1000);
const outstanding = await js(`document.querySelector('[data-testid=invoice-outstanding]')?.textContent.trim()`);
check('the invoice opens overdue, with what it owes', /Overdue/.test((await js(`document.querySelector('[data-ui=page-header] [data-ui=tag]')?.textContent.trim()`)) ?? '') && !!outstanding, outstanding);
check('no element wider than the phone on the invoice', (await overflow()) === 0);
await shot('invoice');

// 5. The contact attempt, written in the Collection tab (FM-12, RP-05).
await js(`__tab('Collection').click()`);
await wait(800);
check('Record contact attempt stands in the header while Collection is open', await command('Record contact attempt'));
await until(`!!document.querySelector('[data-testid=contact-form]')`);
check('the contact form is a query parameter of the invoice', (await js('location.search')).includes('contact=1'));
await js(helpers);
await js(`__type(document.querySelector('[data-testid=contact-said]'), 'Spoke to AP: the wire for ${INVOICE} left today.')`);
await wait(400);
await js(`document.querySelector('[data-testid=contact-submit]').click()`);
await until(`!(location.search.includes('contact=1')) && (document.querySelector('[data-testid=invoice-collection]')?.textContent ?? '').includes('the wire for ${INVOICE} left today')`, 20000);
check('the contact attempt is recorded and read back in Collection', (await js(`document.querySelector('[data-testid=invoice-collection]')?.textContent ?? ''`)).includes('left today'));
await shot('contact');

// 6. The payment, recorded and allocated to the invoice (§30 "Record payment").
check('Record payment is offered from the invoice', await command('Record payment'));
await until(`location.pathname === '/finance/payments/new' && !!document.querySelector('[data-testid=payment-amount-input]')`, 20000);
await wait(1500);
await js(helpers);
const amount = await js(`document.querySelector('[data-testid=payment-amount-input]').value`);
check('the form opens on the customer, with what the invoice owes as the amount', money(amount) === money(outstanding), `${amount} for ${outstanding}`);
await js(`__type(document.querySelector('[data-testid=payment-reference]'), ${JSON.stringify(INVOICE)})`);
await wait(500);
check('no element wider than the phone on the payment form', (await overflow()) === 0);
await shot('payment-form');
await js(`document.querySelector('[data-testid=record-submit]').click()`);
await until(`location.pathname.startsWith('/finance/payments/pay_') && !!document.querySelector('[data-testid=payment-figures]')`, 20000);
await wait(1000);
const allocations = await js(`document.querySelector('[data-testid=payment-allocations]')?.textContent.replace(/\\s+/g, ' ') ?? ''`);
const unapplied = await js(`document.querySelector('[data-testid=payment-unapplied]')?.textContent.trim()`);
check('the payment is recorded and allocated to the invoice in full', allocations.includes(INVOICE) && money(unapplied) === 0, `unapplied ${unapplied}`);
await shot('payment');

// 7. The staff accountant reconciles the deposit against the payment (§66.13).
const who = await persona(ACCOUNTANT);
check('the demo panel signs in the staff accountant', /Laura|Stewart/.test(String(who)), String(who));
await go('/finance/reconciliation');
await until(`!!document.querySelector('[data-ui=filter-bar] input') && document.querySelectorAll('a[href^="/finance/reconciliation/btx_"]').length > 0`, 20000);
await wait(1000);
await js(helpers);
await js(`__type(document.querySelector('[data-ui=filter-bar] input'), ${JSON.stringify(DEPOSIT)})`);
await until(`[...document.querySelectorAll('a[href^="/finance/reconciliation/btx_"]')].some((a) => __visible(a) && a.textContent.toUpperCase().includes(${JSON.stringify(DEPOSIT)}))`, 20000);
await shot('queue');
await js(`[...document.querySelectorAll('a[href^="/finance/reconciliation/btx_"]')].find((a) => __visible(a) && a.textContent.toUpperCase().includes(${JSON.stringify(DEPOSIT)})).click()`);
await until(`!!document.querySelector('[data-testid=candidate][data-payment-id]')`, 20000);
const depositPath = await js('location.pathname');
const band = await js(`document.querySelector('[data-testid=candidate][data-payment-id] [data-testid=band]')?.textContent.trim()`);
const score = await js(`document.querySelector('[data-testid=candidate][data-payment-id] [data-testid=score-total]')?.textContent.replace(/\\s+/g, ' ').trim()`);
check('the recorded payment is the deposit’s candidate, in high confidence, its score explained', /High/.test(band ?? '') && !!score, `${band} · ${score}`);
check('no element wider than the phone on the deposit', (await overflow()) === 0);
await shot('deposit');
await js(`document.querySelector('[data-testid=candidate][data-payment-id] [data-testid=confirm-match]').click()`);
await until(`!!document.querySelector('[data-testid=closed], [data-testid=outcome]')`, 20000);
const closed = await js(`(document.querySelector('[data-testid=closed]') ?? document.querySelector('[data-testid=outcome]'))?.textContent.replace(/\\s+/g, ' ').trim()`);
check('the match is confirmed and the deposit reads matched', /[Mm]atched/.test(closed ?? ''), closed?.slice(0, 140));
await shot('matched');
await js('history.back()');
await wait(2500);
check('the back gesture returns from the deposit to the workspace’s queue', (await js('location.pathname')) === '/finance/reconciliation', await js('location.pathname'));

// 8. Priya reads the customer's balance fall by the payment (§30).
await persona('Priya Shah');
await go(customerHref);
await until(`!!__figure('Overdue') && !document.querySelector('[data-ui=stat-card][data-loading]')`, 20000);
await wait(1000);
const overdueAfter = await js(`__figure('Overdue')`);
// The card states whole dollars: the fall is the payment to the dollar.
check('the customer’s overdue balance fell by the payment', Math.abs(money(overdueBefore) - money(overdueAfter) - money(outstanding)) < 1, `${overdueBefore} → ${overdueAfter}`);
await shot('customer-after');

// 9. The invoice reads paid, and the back gesture returns to the customer.
await js(`__tab('Invoices').click()`);
await wait(1500);
check('the invoice has left the customer’s open invoices', !(await js(`[...document.querySelectorAll('a')].some((a) => __visible(a) && a.textContent.trim() === ${JSON.stringify(INVOICE)})`)));
await go(invoicePath);
await until(`!!document.querySelector('[data-testid=invoice-figures]') && (document.querySelector('[data-ui=page-header] [data-ui=tag]')?.textContent.trim() ?? '') !== ''`);
await wait(1000);
const settled = await js(`document.querySelector('[data-ui=page-header] [data-ui=tag]')?.textContent.trim()`);
check('the invoice reads paid', settled === 'Paid', settled);
await shot('invoice-paid');
await js('history.back()');
await wait(2500);
check('the back gesture returns to the customer', (await js('location.pathname')) === customerHref, await js('location.pathname'));
void depositPath;

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
