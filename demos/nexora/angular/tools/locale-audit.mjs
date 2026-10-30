// usage: ORIGIN=http://localhost:4251 node tools/locale-audit.mjs   (a running demo; ROUTES optional, comma-separated)
// The language audit: with the library switched to Brazilian Portuguese through the account menu,
// every page of the demo is opened as the administrator and every word a reader meets — visible
// text and the accessible attributes (aria-label, title, placeholder, alt, aria-roledescription,
// aria-valuetext) — is compared with the English catalog. A string that still reads as an English
// catalog message, where Portuguese differs, is printed with the page, the family around it and
// the catalog key. Exits non-zero when anything is found.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { EN_US } = await import(new URL('../node_modules/@slotted/core/dist/i18n.js', import.meta.url));
const { PT_BR } = await import(new URL('../node_modules/@slotted/core/dist/i18n/pt-BR.js', import.meta.url));

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:4250';
const ROUTES = (process.env.ROUTES ?? [
  '/dashboard', '/notifications', '/profile', '/settings/preferences',
  '/crm/customers', '/crm/customers/new', '/crm/contacts', '/crm/imports',
  '/sales/orders', '/sales/approvals', '/sales/quotes', '/sales/quotes/new',
  '/catalog/products', '/catalog/skus', '/catalog/categories', '/catalog/price-lists',
  '/inventory/overview', '/inventory/stock', '/inventory/warehouses', '/inventory/movements',
  '/inventory/transfers', '/inventory/transfers/new', '/inventory/cycle-counts', '/inventory/cycle-counts/new',
  '/procurement/suppliers', '/procurement/suppliers/new', '/procurement/purchase-orders',
  '/procurement/purchase-orders/new', '/procurement/receiving',
  '/finance/overview', '/finance/invoices', '/finance/payments', '/finance/credit-memos', '/finance/reconciliation',
].join(',')).split(',');

/** Every leaf of a catalog as `[path, message]`. */
const leaves = (tree, prefix = '') =>
  Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return value !== null && typeof value === 'object' ? leaves(value, path) : [[path, value]];
  });

/** A message as a pattern: literal text kept, each `{…}` argument any run of characters. */
function pattern(message) {
  let out = '';
  let literal = '';
  for (let i = 0; i < message.length; i++) {
    if (message[i] === '{') {
      let depth = 0;
      let j = i;
      for (; j < message.length; j++) {
        if (message[j] === '{') depth++;
        else if (message[j] === '}' && --depth === 0) break;
      }
      out += '.+?';
      i = j;
    } else {
      out += message[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      literal += message[i];
    }
  }
  return /\p{L}{3,}/u.test(literal) ? new RegExp(`^${out}$`, 'u') : null;
}

const pt = new Map(leaves(PT_BR));
const english = leaves(EN_US)
  .filter(([path, message]) => typeof message === 'string' && pt.get(path) !== message)
  .map(([path, message]) => ({ key: path, message, regex: message.includes('{') ? pattern(message) : null }))
  .filter((entry) => entry.regex !== null || !entry.message.includes('{'));

const profile = mkdtempSync(join(tmpdir(), 'slotted-audit-'));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
let targets = null;
for (let i = 0; i < 30 && targets === null; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const port = Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  } catch {
    targets = null;
  }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { if (!sessionStorage.getItem('a')) { localStorage.clear(); localStorage.setItem('nexora:demo', JSON.stringify({ persona: 'maya-chen', scenario: 'healthy', scale: 'light' })); sessionStorage.setItem('a', '1'); } } catch {}`,
});
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const js = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${JSON.stringify(result.exceptionDetails).slice(0, 300)}`);
  return result.result?.value;
};
const until = async (expression, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(expression)) return true; await wait(250); } return false; };

/** Every string a reader meets on the page, with the family around it. */
const collect = () => js(`(() => {
  const out = [];
  const family = (el) => el?.closest?.('[data-ui]')?.getAttribute('data-ui') ?? '(demo)';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.replace(/\\s+/g, ' ').trim();
    if (text && node.parentElement && !node.parentElement.closest('script,style,template')) out.push({ text, family: family(node.parentElement), how: 'text' });
  }
  for (const el of document.body.querySelectorAll('*')) {
    for (const name of ['aria-label', 'title', 'placeholder', 'alt', 'aria-roledescription', 'aria-valuetext']) {
      const value = el.getAttribute(name);
      if (value) out.push({ text: value.replace(/\\s+/g, ' ').trim(), family: family(el), how: name });
    }
  }
  return out;
})()`);

const findings = new Map();
let exitCode = 1;
try {
  await send('Page.navigate', { url: `${ORIGIN}/dashboard` });
  await until(`[...document.querySelectorAll('[aria-haspopup]')].some((b) => /^(Account|Conta)$/.test(b.getAttribute('aria-label') ?? ''))`, 40000);
  await js(`[...document.querySelectorAll('[aria-haspopup]')].find((b) => /^(Account|Conta)$/.test(b.getAttribute('aria-label') ?? '')).click()`);
  await until(`[...document.querySelectorAll('[role=menuitemradio]')].some((el) => el.textContent.trim() === 'Português (Brasil)')`, 5000);
  await js(`[...document.querySelectorAll('[role=menuitemradio]')].find((el) => el.textContent.trim() === 'Português (Brasil)').click()`);
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await until(`document.documentElement.lang === 'pt-BR'`, 5000);
  console.log(`language: ${await js('document.documentElement.lang')}`);

  for (const route of ROUTES) {
    await js(`(history.pushState({}, '', ${JSON.stringify(route)}), dispatchEvent(new PopStateEvent('popstate')), true)`);
    await wait(4500);
    const strings = await collect();
    /* Every popup the page offers, opened one at a time: menus, popovers, filter panels, the column manager. */
    const triggers = await js(`[...document.querySelectorAll('main [aria-haspopup], main [aria-expanded=false]')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !el.disabled; }).length`);
    for (let index = 0; index < Math.min(triggers, Number(process.env.POPUPS ?? 12)); index++) {
      await js(`(() => { const el = [...document.querySelectorAll('main [aria-haspopup], main [aria-expanded=false]')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !el.disabled; })[${index}]; el?.click(); return true; })()`);
      await wait(700);
      strings.push(...(await collect()));
      await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true`);
      await wait(300);
    }
    for (const { text, family, how } of strings) {
      const hit = english.find((entry) => (entry.regex ? entry.regex.test(text) : entry.message === text));
      if (!hit) continue;
      const key = `${family}|${hit.key}|${text}`;
      if (!findings.has(key)) findings.set(key, { route, family, how, text, catalogKey: hit.key });
    }
  }
  const rows = [...findings.values()].sort((a, b) => a.family.localeCompare(b.family));
  for (const row of rows) console.log(`${row.family}\t${row.catalogKey}\t${row.how}\t${JSON.stringify(row.text)}\t${row.route}`);
  console.log(`${rows.length} English strings under pt-BR on ${ROUTES.length} pages`);
  exitCode = rows.length === 0 ? 0 : 1;
} catch (error) {
  console.log(`FAIL ${error.message}`);
} finally {
  ws.close();
  chrome.kill();
  await new Promise((resolve) => (chrome.exitCode === null ? chrome.once('exit', resolve) : resolve()));
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
process.exit(exitCode);
