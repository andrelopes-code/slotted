import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// usage: node tools/column-scenarios.mjs [origin]
// Deterministic browser scenarios for the column tools on /sales/orders: each one
// states its assertions, prints PASS or FAIL with the reason, and the process exits
// non-zero when any fails. Chrome is driven through the DevTools protocol, as in
// tools/shoot.mjs.
const origin = process.argv[2] ?? 'http://localhost:4250';
const route = `${origin}/sales/orders`;

// Chrome takes a free port of the system's choosing and writes it in the profile: two runs at once
// never attach to each other's browser.
let port = 0;
const readPort = () => Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
const profile = mkdtempSync(join(tmpdir(), 'slotted-scenarios-'));
const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1280,800',
    `--user-data-dir=${profile}`,
    '--remote-debugging-port=0',
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let targets = null;
for (let i = 0; i < 40 && targets === null; i++) {
  await sleep(250);
  try {
    port = readPort();
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  } catch {
    targets = null;
  }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (process.env.DEBUG && message.method === 'Runtime.exceptionThrown') {
    console.log('page exception:', message.params.exceptionDetails.exception?.description?.slice(0, 400));
  }
  if (process.env.DEBUG && message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    console.log('console.error:', JSON.stringify(message.params.args.map((a) => a.value ?? a.description)).slice(0, 400));
  }
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
};
await new Promise((resolve) => (ws.onopen = resolve));
await send('Page.enable');
await send('Runtime.enable');

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'evaluation failed');
  }
  return result.result.value;
}
async function waitFor(expression, what, timeout = 8000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await sleep(100);
  }
  throw new Error(`timed out waiting for ${what}`);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function viewport(width) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: width < 800 ? 860 : 800,
    deviceScaleFactor: 1,
    mobile: width < 800,
  });
}
async function open(url) {
  await send('Page.navigate', { url });
  await waitFor(
    `document.querySelector('[data-ui="data-grid"] [data-part="row"]')`,
    'the grid rows',
    20000,
  );
  await sleep(400);
}
async function freshPage(width = 1280, url = route) {
  await viewport(width);
  await open(url);
  await evaluate('localStorage.clear()');
  await open(url);
}
/** A real pointer press at the center of the first element the expression returns. */
async function press(expression, what, modifiers = 0) {
  await waitFor(expression, what);
  /* A target that is still moving — a toast sliding in, a layer settling —
     is pressed where it stood when it was measured, which is not where it is.
     Two reads a frame apart that agree say it has stopped. */
  const rect = `JSON.stringify((${expression}).getBoundingClientRect())`;
  for (let attempt = 0, last = ''; attempt < 30; attempt++) {
    const now = await evaluate(rect);
    if (now === last) break;
    last = now;
    await sleep(80);
  }
  const box = await evaluate(`(() => {
    const element = ${expression};
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y, modifiers });
  await sleep(60);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type,
      x: box.x,
      y: box.y,
      button: 'left',
      clickCount: 1,
      modifiers,
    });
  }
  await sleep(250);
}
const KEYS = {
  Escape: { code: 'Escape', keyCode: 27 },
  Enter: { code: 'Enter', keyCode: 13 },
  ArrowUp: { code: 'ArrowUp', keyCode: 38 },
};
async function key(name, modifiers = 0) {
  const { code, keyCode } = KEYS[name];
  /* Enter carries its character, or a form's implicit submission never runs. */
  const text = name === 'Enter' ? '\r' : undefined;
  for (const type of [text ? 'keyDown' : 'rawKeyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', {
      type,
      key: name,
      code,
      windowsVirtualKeyCode: keyCode,
      modifiers,
      ...(type === 'keyDown' ? { text } : {}),
    });
  }
  await sleep(250);
}
const ALT = 1;
const q = (selector) => `document.querySelector(${JSON.stringify(selector)})`;
const header = (column) =>
  q(`[data-ui="data-grid"] [data-part="column-header"][data-column="${column}"]`);
const menuItem = (text) =>
  `[...document.querySelectorAll('[role="menuitem"]')].find((item) => item.textContent.trim().startsWith(${JSON.stringify(text)}) && item.getClientRects().length > 0)`;
const managerItem = (column, part) =>
  q(`[data-ui="column-manager"] [data-part="item"][data-column="${column}"] [data-part="${part}"]`);
const headerOrder = () =>
  evaluate(
    `[...document.querySelectorAll('[data-ui="data-grid"] [data-part="column-header"][data-column]')].map((cell) => cell.dataset.column).filter((id) => !id.startsWith('__'))`,
  );
async function hideByMenu(column) {
  await press(header(column), `the ${column} header`);
  await press(`${header(column)}.querySelector('[data-part="column-menu"]')`, 'the column menu');
  await press(menuItem('Hide column'), 'the Hide column item');
  await waitFor(`!${header(column)}`, `${column} to leave the grid`);
}
async function openManager() {
  await press(q('[data-testid="columns-trigger"]'), 'the Columns trigger');
  await waitFor(q('[data-ui="column-manager"] [data-part="item"]'), 'the manager list');
}

let retries = 0;
/** Opens the views panel; a second press is counted and reported, never hidden. */
async function openViews(root) {
  const trigger = `${root}.querySelector('[data-part="trigger"]')`;
  await press(trigger, 'the views trigger');
  try {
    await waitFor(`${trigger}.getAttribute('aria-expanded') === 'true'`, 'the views panel', 1500);
  } catch {
    retries += 1;
    await press(trigger, 'the views trigger');
    await waitFor(`${trigger}.getAttribute('aria-expanded') === 'true'`, 'the views panel');
  }
}

const results = [];
const only = process.env.ONLY;
async function scenario(name, run) {
  if (only && !name.includes(only)) return;
  try {
    await run();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`FAIL  ${name}: ${error.message}`);
  }
}

await scenario('hide by the column menu, then the toast Undo returns the column', async () => {
  await freshPage();
  const before = await headerOrder();
  await hideByMenu('customerName');
  await press(q('[data-testid="undo-hide"]'), 'the Undo action');
  await waitFor(header('customerName'), 'Customer to return');
  const after = await headerOrder();
  assert(JSON.stringify(after) === JSON.stringify(before), `order ${after} is not ${before}`);
});

/* Customers hides no column by default, so the count starts at zero. */
await scenario('hide, the trigger says "1 hidden column", the manager shows it again', async () => {
  await freshPage(1280, `${origin}/crm/customers`);
  /* The second drawn column: the first names the record and may not hide. */
  const column = (await headerOrder())[1];
  await hideByMenu(column);
  const text = await evaluate(`${q('[data-testid="columns-trigger"]')}.textContent`);
  assert(text.includes('1 hidden column'), `trigger reads "${text.trim()}"`);
  await openManager();
  const hidden = await evaluate(
    `${q(`[data-ui="column-manager"] [data-part="item"][data-column="${column}"]`)}.hasAttribute('data-hidden')`,
  );
  assert(hidden, 'the manager row is not marked hidden');
  await press(`${managerItem(column, 'visibility')}.querySelector('input')`, 'the checkbox');
  await waitFor(header(column), `${column} to return`);
  await key('Escape');
});

let reordered = null;
await scenario('reorder and pin in the manager; order, hidden, pinned and density survive a reload', async () => {
  await freshPage();
  await openManager();
  await evaluate(`${managerItem('status', 'handle')}.focus()`);
  await key('ArrowUp', ALT);
  await press(managerItem('total', 'pin'), 'the pin button of Total');
  await press(menuItem('Pin to start'), 'Pin to start');
  await press(`${managerItem('approvalStatus', 'visibility')}.querySelector('input')`, 'the Approval checkbox');
  await key('Escape');
  await press(q('[data-testid="density"] [aria-label="Dense rows"]'), 'the Dense segment');
  reordered = await headerOrder();
  assert(reordered[0] === 'total', `the first column is ${reordered[0]}, not the pinned Total`);
  assert(
    reordered.indexOf('status') < reordered.indexOf('customerName'),
    `Status did not move before Customer: ${reordered}`,
  );
  assert(!reordered.includes('approvalStatus'), 'Approval is still drawn');
  await open(route);
  const after = await headerOrder();
  assert(JSON.stringify(after) === JSON.stringify(reordered), `after reload ${after}, before ${reordered}`);
  const pinned = await evaluate(`${header('total')}.dataset.pinned`);
  assert(pinned === 'start', `Total is pinned "${pinned}" after reload`);
  const density = await evaluate(`${q('[data-ui="data-grid"]')}.getAttribute('data-slotted-density')`);
  assert(density === 'dense', `density is "${density}" after reload`);
});

await scenario('"Restore defaults" returns the initial arrangement', async () => {
  await freshPage();
  const initial = await headerOrder();
  await openManager();
  await evaluate(`${managerItem('status', 'handle')}.focus()`);
  await key('ArrowUp', ALT);
  await press(`${managerItem('customerName', 'visibility')}.querySelector('input')`, 'the Customer checkbox');
  const changed = await headerOrder();
  assert(JSON.stringify(changed) !== JSON.stringify(initial), 'nothing changed before the reset');
  await press(q('[data-ui="column-manager"] [data-part="reset"]'), 'Restore defaults');
  await waitFor(header('customerName'), 'Customer to return');
  const after = await headerOrder();
  assert(JSON.stringify(after) === JSON.stringify(initial), `after reset ${after}, initial ${initial}`);
});

await scenario('the help button opens its popover by pointer; the header is described by the text', async () => {
  await freshPage();
  const description = 'The step of the order cycle the order stands at, and the steps left.';
  const described = await evaluate(`(() => {
    const cell = ${header('status')};
    return (cell.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent.trim()).join(' ');
  })()`);
  assert(described.includes(description), `aria-describedby reads "${described}"`);
  await press(`${header('status')}.querySelector('[data-part="column-help"]')`, 'the help button');
  await waitFor(
    `[...document.querySelectorAll('[data-ui="popover"] [data-part="content"]')].some((panel) => panel.textContent.includes(${JSON.stringify(description)}))`,
    'the help popover',
  );
  const sorted = await evaluate(`${header('status')}.getAttribute('aria-sort')`);
  assert(sorted === null, `the help press sorted the column (${sorted})`);
  await key('Escape');
});

await scenario('at 390 px the lowest-priority columns move into the pop-in', async () => {
  await freshPage(390);
  const count = await evaluate(`${q('[data-ui="data-grid"]')}.getAttribute('data-popin')`);
  assert(Number(count) > 0, `data-popin is "${count}"`);
  const fields = await evaluate(
    `${q('[data-ui="data-grid"] [data-part="popin"]')}?.querySelectorAll('[data-part="popin-field"]').length ?? 0`,
  );
  assert(fields === Number(count), `${fields} fields in the first pop-in, ${count} columns`);
  assert(
    await evaluate(`${q('[data-testid="sort-trigger"]')} !== null`),
    'no Sort menu while the headers of the pop-in columns are gone',
  );
  await openManager();
  const listed = await evaluate(
    `[...document.querySelectorAll('[data-ui="column-manager"] [data-part="item"]')].filter((item) => item.textContent.includes('Shown in row')).length`,
  );
  assert(listed === Number(count), `${listed} rows say Shown in row, ${count} in the pop-in`);
  await key('Escape');
});

await scenario('save a view, change it, see the mark, revert, apply another view', async () => {
  await freshPage();
  const root = q('[data-testid="saved-views"]');
  await openViews(root);
  await press(q('[data-ui="saved-views"][data-part="panel"] [data-save-as]'), 'Save as');
  await evaluate(`${q('[data-ui="saved-views"] [data-part="form"] input')}.focus()`);
  await send('Input.insertText', { text: 'Scenario view' });
  await key('Enter');
  await waitFor(`${root}.textContent.includes('Scenario view')`, 'the trigger to name the view');
  assert(!(await evaluate(`${root}.hasAttribute('data-modified')`)), 'modified right after saving');
  await press(q('[data-testid="density"] [aria-label="Dense rows"]'), 'the Dense segment');
  await waitFor(`${root}.hasAttribute('data-modified')`, 'the modified mark');
  await press(`${root}.querySelector('[data-part="revert"]')`, 'Revert');
  await waitFor(`!${root}.hasAttribute('data-modified')`, 'the mark to clear');
  const density = await evaluate(`${q('[data-ui="data-grid"]')}.getAttribute('data-slotted-density')`);
  assert(density !== 'dense', `density is still "${density}" after revert`);
  await openViews(root);
  await press(
    q('[data-ui="saved-views"][data-part="panel"] [data-part="item"][data-built-in] [data-part="apply"]'),
    'the built-in view',
  );
  await waitFor(`!${root}.textContent.includes('Scenario view')`, 'the built-in view to apply');
});

/* With SHOTS=<dir>: the list, the open manager and the open views, per scheme and width. */
if (process.env.SHOTS) {
  const dir = process.env.SHOTS;
  mkdirSync(dir, { recursive: true });
  const shot = async (name) => {
    await sleep(500);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(dir, `${name}.png`), Buffer.from(data, 'base64'));
    console.log(join(dir, `${name}.png`));
  };
  for (const width of [1280, 390]) {
    for (const scheme of ['light', 'dark']) {
      await freshPage(width);
      await evaluate(`document.documentElement.setAttribute('data-slotted-scheme', '${scheme}')`);
      await shot(`orders-${width}-${scheme}`);
      await openManager();
      await shot(`orders-${width}-${scheme}-manager`);
      await key('Escape');
      await openViews(q('[data-testid="saved-views"]'));
      await shot(`orders-${width}-${scheme}-views`);
      await key('Escape');
      await press(`${header('status')}.querySelector('[data-part="column-help"]')`, 'the help button');
      await shot(`orders-${width}-${scheme}-help`);
      await key('Escape');
    }
  }
}

ws.close();
// The profile is thrown away with the browser: a run leaves nothing in the temporary directory.
// Killed outright, so no helper process flushes its state into the profile after it is removed.
chrome.kill('SIGKILL');
await new Promise((r) => (chrome.exitCode !== null || chrome.signalCode !== null ? r() : chrome.once('exit', r)));
await new Promise((r) => setTimeout(r, 400));
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
/* A profile per run fills the temp directory within a session if it stays. */
await sleep(500);
rmSync(profile, { recursive: true, force: true });
const failed = results.filter((result) => !result.ok).length;
console.log(`\n${results.length - failed}/${results.length} scenarios pass; views panel re-pressed ${retries} time(s)`);
process.exit(failed === 0 ? 0 : 1);
