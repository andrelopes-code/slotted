// usage: node tools/journey-d.mjs   (the demo served at http://localhost:4250; W, H and OUT optional)
// Journey D (§20) on an emulated phone (390×844, touch), one browser session so the in-memory
// backend keeps its state: the persona changes through the demo panel, never by a reload.
// In the Support Incident scenario Aisha Grant opens the inbox and a carrier-incident ticket, reads
// the customer, the related order and the shipment's exception from it, and escalates it; the
// support lead finds it in their own queue, replies to the customer and resolves it; the clock advances past the
// 72 hours after which a resolved ticket closes, and the back gesture returns to the inbox. Prints
// one PASS or FAIL per step and exits non-zero on a failure.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:4250';
const OUT = process.env.OUT ?? mkdtempSync(join(tmpdir(), 'slotted-journey-shots-'));
// The incident's tickets carry this subject; the persona panel names the stand-in by its context.
const INCIDENT = 'hub fire';
const LEAD_CONTEXT = 'Escalations and reopened tickets';
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
  source: `try { if (!sessionStorage.getItem('j')) { localStorage.clear(); localStorage.setItem('nexora:demo', JSON.stringify({ persona: 'aisha-grant', scenario: 'support_incident', scale: 'light' })); sessionStorage.setItem('j', '1'); } } catch {}`,
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
  writeFileSync(`${OUT}/jd-${String(++step).padStart(2, '0')}-${name}.png`, Buffer.from(s.data, 'base64'));
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

const ticketRow = `[...document.querySelectorAll('[data-testid=queue-rows] [data-id]')].find((row) => __visible(row) && !/ · Escalated · /.test(row.textContent))`;

// 1. The inbox, a queue on the phone (WS-01).
await send('Page.navigate', { url: `${ORIGIN}/support/inbox` });
await wait(14000);
await js(helpers);
await until(`document.querySelectorAll('[data-testid=queue-rows] [data-id]').length > 0`, 20000);
check('the inbox opens on its queue, as Aisha Grant', await js(`document.querySelectorAll('[data-testid=queue-rows] [data-id]').length > 0`));
check('no element wider than the phone on the inbox', (await overflow()) === 0);
await shot('inbox');

// 2. A carrier-incident ticket, from the queue's search, at its own address.
await js(`__type(document.querySelector('[data-ui=filter-bar] input'), ${JSON.stringify(INCIDENT)})`);
await until(`!!(${ticketRow})`, 20000);
await wait(800);
await js(`(${ticketRow}).querySelector('a').click()`);
await until(`location.pathname.startsWith('/support/inbox/tkt_') && !!document.querySelector('[data-testid=thread]')`, 20000);
const ticketPath = await js('location.pathname');
await wait(1500);
check('the ticket opens at its own address with its conversation and composer', !!(await js(`document.querySelector('[data-testid=composer]')`)), ticketPath);
check('no element wider than the phone on the ticket', (await overflow()) === 0);
await shot('ticket');

// 3. The customer context, behind the Details tab.
await js(helpers);
await js(`__tab('Details').click()`);
await until(`!!document.querySelector('[data-testid=customer] a[href^="/crm/customers/"]')`);
check('Details holds the clocks, the customer and the linked records', await js(`!!document.querySelector('[data-testid=sla]') && !!document.querySelector('[data-testid=linked-order]') && !!document.querySelector('[data-testid=linked-shipment]')`));
check('no element wider than the phone on the details', (await overflow()) === 0);
await shot('details');
await js(`document.querySelector('[data-testid=customer] a').click()`);
await until(`location.pathname.startsWith('/crm/customers/')`, 20000);
await wait(2000);
check('the customer opens from the ticket', (await js('location.pathname')).startsWith('/crm/customers/'));
await shot('customer');
await js('history.back()');
await until(`location.pathname === ${JSON.stringify(ticketPath)}`);
await wait(2000);

// 4. The related order, then the shipment's exception on the order's shipments.
await js(helpers);
await js(`__tab('Details').click()`);
await until(`!!document.querySelector('[data-testid=linked-order] a')`);
await js(`document.querySelector('[data-testid=linked-order] a').click()`);
await until(`location.pathname.startsWith('/sales/orders/')`, 20000);
await wait(2000);
check('the related order opens from the ticket', (await js('location.pathname')).startsWith('/sales/orders/'));
await shot('order');
await js('history.back()');
await until(`location.pathname === ${JSON.stringify(ticketPath)}`);
await wait(2000);
await js(helpers);
await js(`__tab('Details').click()`);
await until(`!!document.querySelector('[data-testid=linked-shipment] a')`);
const exception = await js(`document.querySelector('[data-testid=linked-shipment]').textContent.replace(/\\s+/g, ' ')`);
check('the shipment reads its exception on the ticket', /Exception/.test(exception), exception.slice(0, 120));
await js(`document.querySelector('[data-testid=linked-shipment] a').click()`);
await until(`location.pathname.startsWith('/sales/orders/') && location.search.includes('view=shipments')`, 20000);
await wait(2500);
const shipments = await js(`document.body.textContent.replace(/\\s+/g, ' ')`);
check('the shipment opens on the order’s shipments', /Exception/i.test(shipments));
await shot('shipment');
await js('history.back()');
await until(`location.pathname === ${JSON.stringify(ticketPath)}`);
await wait(2000);

// 5. The internal escalation, with its reason (§68.5).
check('Escalate stands in the ticket’s header', await command('Escalate'));
await until(`!!document.querySelector('[data-testid=escalation-reason]')`);
await js(helpers);
await js(`__type(document.querySelector('[data-testid=escalation-reason] textarea, textarea[data-testid=escalation-reason]'), 'Consignment lost in the hub fire; replacement needs a manager.')`);
await wait(400);
await js(`document.querySelector('[data-testid=confirm-escalate]').click()`);
await until(`(document.querySelector('[data-testid=status]')?.textContent ?? '').includes('Escalated')`, 20000);
const holder = await js(`document.querySelector('[data-ui=page-header] [data-part=subheading]')?.textContent.trim()`);
check('the ticket is escalated and held by the support lead', /held by/.test(holder ?? ''), holder);
await shot('escalated');

// 6. The support lead receives it, replies to the customer and resolves it.
const number = (holder ?? '').split(' · ')[0];
const lead = await persona(LEAD_CONTEXT);
check('the demo panel signs in the support lead', !!lead, String(lead));
await go('/support/inbox?queue=mine');
await js(helpers);
const leadRow = `[...document.querySelectorAll('[data-testid=queue-rows] [data-id]')].find((row) => __visible(row) && row.textContent.includes(${JSON.stringify(number)}))`;
await until(`!!(${leadRow})`, 20000);
check('the escalated ticket waits in the support lead’s own queue', await js(`!!(${leadRow})`), number);
await js(`(${leadRow}).querySelector('a').click()`);
await until(`location.pathname === ${JSON.stringify(ticketPath)} && !!document.querySelector('[data-testid=composer]')`, 20000);
await wait(1500);
await js(helpers);
await js(`__type(document.querySelector('[data-testid=composer-input]'), 'A replacement consignment ships today on a dedicated truck; tracking follows within the hour.')`);
await wait(400);
check('Resolve stands in the ticket’s header for the support lead', await command('Resolve'));
await until(`!!document.querySelector('[data-testid=resolution-code]')`);
await js(`document.querySelector('[data-testid=resolution-code] button, [data-testid=resolution-code] [role=combobox]')?.click()`);
await wait(600);
await js(helpers);
await js(`(__byText('[role=option]', 'Replacement sent') ?? [...document.querySelectorAll('[role=option]')].find(__visible))?.click()`);
await wait(400);
await js(`document.querySelector('[data-testid=confirm-resolve]').click()`);
await until(`(document.querySelector('[data-testid=status]')?.textContent ?? '').includes('Resolved')`, 20000);
const replied = await js(`[...document.querySelectorAll('[data-testid=thread] article')].some((a) => a.textContent.includes('dedicated truck'))`);
check('the ticket is resolved and the customer told in a public reply', replied);
await shot('resolved');

// 7. The clock passes the 72 hours after which a resolved ticket closes (§68.5).
await js(`document.querySelector('[aria-label="Demo controls"]').click()`);
await until(`[...document.querySelectorAll('button')].some((b) => __visible(b) && b.textContent.trim() === '+7 days')`);
await js(`[...document.querySelectorAll('button')].find((b) => __visible(b) && b.textContent.trim() === '+7 days').click()`);
await wait(4000);
await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
await wait(800);
await until(`(document.querySelector('[data-testid=status]')?.textContent ?? '').includes('Closed')`, 20000);
check('the ticket reads closed once the clock passes 72 hours', (await js(`document.querySelector('[data-testid=status]')?.textContent ?? ''`)).includes('Closed'));
check('a closed ticket offers no composer', !(await js(`document.querySelector('[data-testid=composer]')`)));
await shot('closed');

// 8. The back gesture returns to the inbox.
await js('history.back()');
await wait(2500);
check('the back gesture returns from the ticket to the inbox', (await js('location.pathname')) === '/support/inbox', await js('location.pathname + location.search'));

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
