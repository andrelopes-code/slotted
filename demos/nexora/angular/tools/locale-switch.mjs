// usage: node tools/locale-switch.mjs   (after `pnpm build:demo`; PORT optional; ORIGIN=<url> reads a running server)
// The language scenario (internationalization plan, task 15.4): one browser session on the built
// demo, served from `dist` with an SPA fallback. The stock movements page is read in English, the account
// menu switches the library to Brazilian Portuguese, the same page is read again, and the menu
// switches it back. Words of `data-grid`, `filter-bar` and `pagination` are asserted in both
// languages, `<html lang>` follows, and a marker set on `window` before the first switch proves
// that nothing reloaded. Prints one PASS or FAIL per step and exits non-zero on a failure.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)), 'dist/nexora-operations/browser');
/* `ORIGIN=http://localhost:4250` reads a running dev server instead of the build. */
const SERVED = process.env.ORIGIN;
if (SERVED === undefined && !existsSync(join(ROOT, 'index.html'))) {
  console.error(`No build at ${ROOT}: run \`pnpm build:demo\` first.`);
  process.exit(2);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');
  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  response.end(readFileSync(file));
});
if (SERVED === undefined) {
  await new Promise((resolve) => server.listen(Number(process.env.PORT ?? 0), '127.0.0.1', resolve));
}
const ORIGIN = SERVED ?? `http://127.0.0.1:${server.address().port}`;

const profile = mkdtempSync(join(tmpdir(), 'slotted-locale-'));
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
  source: `try { if (!sessionStorage.getItem('l')) { localStorage.clear(); localStorage.setItem('nexora:demo', JSON.stringify({ persona: 'marcus-lee', scenario: 'healthy', scale: 'light' })); sessionStorage.setItem('l', '1'); } } catch {}`,
});
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const js = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${JSON.stringify(result.exceptionDetails).slice(0, 400)}`);
  return result.result?.value;
};
const until = async (expression, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(expression)) return true; await wait(250); } return false; };
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

/** The words the three families write on the movements page, read from the DOM. */
const read = () => js(`(() => {
  const text = (el) => el?.textContent?.replace(/\\s+/g, ' ').trim() ?? null;
  const grid = document.querySelector('[data-ui=data-grid]');
  const bar = document.querySelector('[data-ui=filter-bar]');
  const pager = document.querySelector('[data-ui=pagination]');
  return {
    lang: document.documentElement.lang,
    marker: window.__localeMarker ?? null,
    gridLabels: [...(grid?.querySelectorAll('[aria-label]') ?? [])].map((el) => el.getAttribute('aria-label')),
    filterCount: text(bar?.querySelector('[data-part=count]')),
    addFilter: [...(bar?.querySelectorAll('button') ?? [])].map((b) => b.getAttribute('aria-label') ?? text(b)).find((t) => /filter|filtro/i.test(t ?? '')) ?? null,
    previous: pager?.querySelector('[data-part=previous]')?.getAttribute('aria-label') ?? null,
    status: text(pager?.querySelector('[data-part=status]')),
  };
})()`);

/** Opens the account menu and chooses a language by its own name. */
const choose = async (name) => {
  await js(`[...document.querySelectorAll('[aria-haspopup]')].find((b) => /^(Account|Conta)$/.test(b.getAttribute('aria-label') ?? '')).click()`);
  await until(`[...document.querySelectorAll('[role=menuitemradio]')].some((el) => el.textContent.trim() === ${JSON.stringify(name)})`, 5000);
  await js(`[...document.querySelectorAll('[role=menuitemradio]')].find((el) => el.textContent.trim() === ${JSON.stringify(name)}).click()`);
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await wait(800);
};

let exitCode = 1;
try {
  await send('Page.navigate', { url: `${ORIGIN}/inventory/movements` });
  const loaded = await until(`!!document.querySelector('[data-ui=data-grid] [role=row]') && !!document.querySelector('[data-ui=pagination] [data-part=previous]')`, 40000);
  check(
    'the movements page loads with a grid, a filter bar and a pager',
    loaded,
    loaded
      ? ''
      : await js(`location.pathname + ' ' + JSON.stringify([...new Set([...document.querySelectorAll('[data-ui]')].map((el) => el.dataset.ui))]) + ' rows ' + document.querySelectorAll('[role=row]').length`),
  );
  await js(`window.__localeMarker = 'kept'`);

  const en = await read();
  check('English: html lang', en.lang === 'en-US', en.lang);
  const columnMenu = (labels, prefix) => labels.find((label) => label?.startsWith(prefix)) ?? null;
  check('English: the grid names a column menu', !!columnMenu(en.gridLabels, 'Column menu, '), columnMenu(en.gridLabels, 'Column menu, ') ?? JSON.stringify(en.gridLabels.slice(0, 6)));
  check('English: the pager names its previous control', en.previous === 'Previous page', en.previous);

  await choose('Português (Brasil)');
  const pt = await read();
  check('pt-BR: html lang follows', pt.lang === 'pt-BR', pt.lang);
  check('pt-BR: the grid speaks Portuguese', !!columnMenu(pt.gridLabels, 'Menu da coluna, ') && !columnMenu(pt.gridLabels, 'Column menu, '), columnMenu(pt.gridLabels, 'Menu da coluna, '));
  // language: pt-BR
  check('pt-BR: the pager speaks Portuguese', pt.previous === 'Página anterior', pt.previous);
  // language: en-US
  check('pt-BR: the filter bar speaks Portuguese', (pt.addFilter ?? '') !== (en.addFilter ?? '') && /filtro/i.test(pt.addFilter ?? ''), `${en.addFilter} → ${pt.addFilter}`);
  check('pt-BR: no reload happened', pt.marker === 'kept');

  await choose('English');
  const back = await read();
  check('back to English: html lang', back.lang === 'en-US', back.lang);
  check('back to English: the pager', back.previous === 'Previous page', back.previous);
  check('back to English: the grid', JSON.stringify(back.gridLabels) === JSON.stringify(en.gridLabels), columnMenu(back.gridLabels, 'Column menu, '));
  check('back to English: no reload happened', back.marker === 'kept');
  exitCode = results.every(Boolean) ? 0 : 1;
} catch (error) {
  console.log(`FAIL ${error.message}`);
} finally {
  ws.close();
  chrome.kill();
  await new Promise((resolve) => (chrome.exitCode === null ? chrome.once('exit', resolve) : resolve()));
  if (SERVED === undefined) server.close();
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
process.exit(exitCode);
