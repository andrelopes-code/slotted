// usage: node tools/journey-g.mjs   (the demo served at http://localhost:4250; W, H and OUT optional)
// Journey G (§20) on an emulated phone (390×844 by default, touch), one browser session so the
// in-memory backend keeps its state: the persona changes through the demo panel, never by a reload.
// Maya Chen opens Workflows and writes a `ticket.escalated` workflow — a tree with an `or` group
// inside the `and`, an empty group marked before the save, a notification and a task — saves and
// activates it; Aisha Grant escalates a ticket; Maya Chen opens the history and finds the run
// succeeded on that ticket, opens the ticket from it and returns with the back gesture; Sofia
// Ramirez has the notification; Owen Price reads the workflow with no editor; Jordan Wells is
// refused. Prints one PASS or FAIL per step and exits non-zero on a failure.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:4250';
const OUT = process.env.OUT ?? mkdtempSync(join(tmpdir(), 'slotted-journey-shots-'));
const NAME = 'Tell Sofia of every escalation that is not low priority';
const TITLE = 'Escalation to follow';
const [width, height] = [Number(process.env.W ?? 390), Number(process.env.H ?? 844)];

const profile = mkdtempSync(join(tmpdir(), 'slotted-journey-'));
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
  source: `try { if (!sessionStorage.getItem('j')) { localStorage.clear(); localStorage.setItem('nexora:demo', JSON.stringify({ persona: 'maya-chen', scenario: 'healthy', scale: 'light' })); sessionStorage.setItem('j', '1'); } } catch {}`,
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
  const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${OUT}/jg-${String(++step).padStart(2, '0')}-${name}.png`, Buffer.from(s.data, 'base64'));
};
const overflow = () => js(`(() => [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); if (!(b.right > innerWidth + 1 && b.width > 0 && getComputedStyle(el).visibility !== 'hidden')) return false; for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll' || o === 'hidden') && p.getBoundingClientRect().right <= innerWidth + 1) return false; } return true; }).length)()`);
/** An in-app navigation, as a tapped link makes it: the router answers `popstate`, and nothing reloads. */
const go = async (path) => { await js(`(history.pushState({}, '', ${JSON.stringify(path)}), dispatchEvent(new PopStateEvent('popstate')), true)`); await wait(2500); };
const until = async (expression, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(expression)) return true; await wait(250); } return false; };
const helpers = `
  window.__visible = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  window.__byText = (selector, text) => [...document.querySelectorAll(selector)].find((el) => __visible(el) && el.textContent.replace(/\\s+/g, ' ').trim() === text);
  window.__type = (el, value) => { const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; const setter = Object.getOwnPropertyDescriptor(proto, 'value').set; el.focus(); setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); };
  window.__tid = (id) => document.querySelector('[data-testid="' + id + '"]');
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
/** Opens the `sl-select` with this test id and taps the option whose words are `text`. */
const choose = async (testid, text) => {
  await js(helpers);
  const trigger = `(__tid(${JSON.stringify(testid)})?.querySelector('[role=combobox]') ?? __tid(${JSON.stringify(testid)}))`;
  const option = `[...document.querySelectorAll('[role=option]')].find((el) => __visible(el) && el.textContent.replace(/\\s+/g, ' ').trim().startsWith(${JSON.stringify(text)}))`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!(await js(`!!${trigger}`))) return false;
    await js(`${trigger}.scrollIntoView({ block: 'center' }), true`);
    await wait(300);
    await js(`${trigger}.click(), true`);
    if (await until(`!!(${option})`, 3000)) {
      await js(`(${option}).click(), true`);
      await wait(600);
      return true;
    }
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await wait(400);
  }
  if (process.env.DEBUG)
    console.log('  options:', await js(`JSON.stringify([...document.querySelectorAll('[role=option]')].map((el) => el.textContent.trim() + ':' + __visible(el)))`));
  return false;
};
/** Taps a node's menu, then the item with these words. */
const menuItem = async (menuTestid, text) => {
  await js(helpers);
  await js(`__tid(${JSON.stringify(menuTestid)}).click()`);
  await wait(600);
  const ok = await js(`(() => { const el = [...document.querySelectorAll('[role=menuitem]')].find((item) => __visible(item) && item.textContent.replace(/\\s+/g, ' ').trim().startsWith(${JSON.stringify(text)})); if (!el) return false; el.click(); return true; })()`);
  await wait(500);
  return ok;
};
const persona = async (name) => {
  await js(helpers);
  await js(`document.querySelector('[aria-label="Demo controls"]').click()`);
  await until(`[...document.querySelectorAll('button')].some((b) => __visible(b) && b.textContent.includes(${JSON.stringify(name)}))`);
  await js(`[...document.querySelectorAll('button')].find((b) => __visible(b) && b.textContent.includes(${JSON.stringify(name)})).click()`);
  await wait(3000);
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await wait(600);
  return js(`document.querySelector('[data-ui=avatar]')?.getAttribute('aria-label') ?? document.querySelector('[data-ui=avatar]')?.textContent?.trim()`);
};
const text = () => js(`document.body.textContent.replace(/\\s+/g, ' ')`);

// 1. Workflows, the list on the phone.
await send('Page.navigate', { url: `${ORIGIN}/automations/workflows` });
await wait(14000);
await js(helpers);
await until(`document.querySelectorAll('[data-ui=data-grid] [role=row]').length > 2`, 20000);
check('Workflows opens on the list, as Maya Chen', (await text()).includes('workflow was stopped by a failed run'));
check('no element wider than the phone on the list', (await overflow()) === 0);
await shot('workflows');

// 2. Create a workflow, from the list's header.
check('New workflow stands in the list’s header', await command('New workflow'));
await until(`location.pathname === '/automations/workflows/new' && !!document.querySelector('[data-testid=workflow-name] input, input[data-testid=workflow-name]')`, 20000);
await js(helpers);
await js(`__type(document.querySelector('input[data-testid=workflow-name]'), ${JSON.stringify(NAME)})`);
check('the form opens on its own address', (await js('location.pathname')) === '/automations/workflows/new');

// 3. Configure the trigger.
check('the trigger is chosen: a ticket is escalated', await choose('trigger', 'A ticket is escalated'));
await until(`(__tid('trigger-affects')?.textContent ?? '').includes('about the ticket')`);
await shot('trigger');

// 4. Build the conditions: Priority is not Low, and any of Channel is Email or Channel is not Email.
await js(helpers);
await js(`__tid('add-condition-').click()`);
await wait(500);
check('a first condition stands in the top group', await js(`!!__tid('condition-0')`));
check('its comparison becomes “is not”', await choose('operator-0', 'is not'));
check('its value becomes Low', await choose('value-0', 'Low'));
await js(`__tid('add-group-').click()`);
await wait(600);
check('an or group stands inside the and group', await js(`(__tid('group-1')?.getAttribute('aria-label') ?? '').includes('any of the following, level 2')`));
check('the group’s condition reads the channel', await choose('field-1.0', 'Channel'));
await js(`__tid('add-condition-1').click()`);
await wait(500);
await choose('field-1.1', 'Channel');
check('the second reads “channel is not email”', await choose('operator-1.1', 'is not'));
await shot('conditions');

// 5. An empty group is marked before the save, and the save is refused until it goes.
await js(`__tid('add-group-').click()`);
await wait(500);
check('the new group’s condition is removed from its menu', await menuItem('condition-menu-2.0', 'Remove condition'));
check('the empty group is marked before any save', await js(`!!__tid('empty-2')`), await js(`__tid('empty-2')?.textContent.trim()`));
await js(`__tid('save-draft').click()`);
await wait(1500);
check('a save with an empty group is refused in the browser', (await js('location.pathname')) === '/automations/workflows/new' && (await js(`__tid('group-2')?.classList.contains('invalid') || __tid('empty-2')?.getAttribute('data-tone') === 'danger' || (__tid('empty-2')?.textContent ?? '').length > 0`)));
await shot('empty-group');
check('the empty group is removed from its menu', await menuItem('group-menu-2', 'Remove group'));
check('the tree is a group inside a group, and nothing is marked', await js(`!__tid('group-2') && !!__tid('group-1')`));

// 6. Add the actions: a notification and a task for Sofia Ramirez.
await js(helpers);
await js(`__tid('add-action').click()`);
await wait(600);
await js(`__tid('add-send_notification').click()`);
await wait(600);
check('a notification is sent to Sofia Ramirez', await choose('action-0-recipient', 'Sofia Ramirez'));
await js(`__type(document.querySelector('[data-testid=action-0-title] input'), ${JSON.stringify(TITLE)})`);
await js(`__tid('add-action').click()`);
await wait(600);
await js(`__tid('add-create_task').click()`);
await wait(600);
check('a task is created for Sofia Ramirez', await choose('action-1-assignee', 'Sofia Ramirez'));
await js(`__type(document.querySelector('[data-testid=action-1-title] input'), 'Call the customer about the escalation')`);
await wait(500);
check('the check says it can run', (await js(`__tid('check')?.textContent ?? ''`)).includes('Ready'));
check('no element wider than the phone on the form', (await overflow()) === 0);
await shot('actions');

// 7. Validate, save and activate.
await js(`__tid('save-activate').click()`);
await until(`/^\\/automations\\/workflows\\/wfl_/.test(location.pathname)`, 20000);
await until(`(__tid('workflow-status')?.textContent ?? '').includes('Active')`, 20000);
const workflowPath = await js('location.pathname');
check('the workflow is saved and active, at its own address', (await js(`__tid('workflow-status')?.textContent.trim()`)) === 'Active', workflowPath);
const triggerLine = async () => (await js(`document.querySelector('[data-testid="map-trigger"]')?.textContent.replace(/\\s+/g, ' ').trim() ?? ''`)) ?? '';
check('it reads as a rule before any editor', /^When ?A ticket is escalated/.test(await triggerLine()), await triggerLine());
await shot('activated');

// 8. Aisha Grant escalates a ticket that is not low priority.
check('the demo panel signs in Aisha Grant', !!(await persona('Aisha Grant')));
// The inbox's own door narrows it to the tickets an escalation of this workflow acts on.
await go('/support/inbox?priority=high,urgent&status=new,open');
await js(helpers);
const row = `[...document.querySelectorAll('[data-testid=queue-rows] [data-id]')].find((r) => __visible(r) && !/ · Escalated · /.test(r.textContent))`;
await until(`!!(${row})`, 20000);
await js(`(${row}).querySelector('a').click()`);
await until(`location.pathname.startsWith('/support/inbox/tkt_') && !!document.querySelector('[data-testid=thread]')`, 20000);
const ticketPath = await js('location.pathname');
await wait(1500);
check('Escalate stands in the ticket’s header', await command('Escalate'));
await until(`!!document.querySelector('[data-testid=escalation-reason]')`);
await js(helpers);
await js(`__type(document.querySelector('[data-testid=escalation-reason] textarea, textarea[data-testid=escalation-reason]'), 'The customer’s line is down.')`);
await wait(400);
await js(`document.querySelector('[data-testid=confirm-escalate]').click()`);
await until(`(document.querySelector('[data-testid=status]')?.textContent ?? '').includes('Escalated')`, 20000);
check('the ticket is escalated', (await js(`document.querySelector('[data-testid=status]')?.textContent ?? ''`)).includes('Escalated'), ticketPath);

// 9. Maya Chen opens the history: the run succeeded on that ticket.
check('the demo panel signs in Maya Chen again', !!(await persona('Maya Chen')));
await go(`${workflowPath}/runs`);
await js(helpers);
const ticketId = ticketPath.split('/').pop();
await until(`!!document.querySelector('[data-testid=runs] a[href="/support/inbox/${ticketId}"]')`, 20000);
check('the history lists a run about the escalated ticket', await js(`!!document.querySelector('[data-testid=runs] a[href="/support/inbox/${ticketId}"]')`));
check('the run reads Succeeded', (await text()).includes('Succeeded'));
check('no element wider than the phone on the history', (await overflow()) === 0);
await js(`document.querySelector('[data-testid=runs] a.cell-text').click()`);
await until(`!!document.querySelector('[data-testid=run-results]')`, 15000);
const results1 = await js(`document.querySelector('[data-testid=run-actions]')?.textContent.replace(/\\s+/g, ' ') ?? ''`);
check('the run opens action by action', results1.includes('Notified Sofia Ramirez') && results1.includes('Created the task'), results1.slice(0, 160));
await shot('run');

// 10. The ticket opens from the run, and the back gesture returns to the history.
const historyUrl = await js('location.pathname + location.search');
await js(`document.querySelector('[data-testid=run-affected] a').click()`);
await until(`location.pathname === ${JSON.stringify(ticketPath)}`, 20000);
await wait(2000);
check('the ticket opens at its own address from the run', (await js('location.pathname')) === ticketPath);
await shot('ticket');
await js('history.back()');
await until(`location.pathname.endsWith('/runs')`, 15000);
await wait(1500);
check('the back gesture returns to the history', (await js('location.pathname + location.search')) === historyUrl, historyUrl);

// 11. The notification reached Sofia Ramirez, and opens the ticket.
check('the demo panel signs in Sofia Ramirez', !!(await persona('Sofia Ramirez')));
await go('/notifications');
await until(`document.body.textContent.includes(${JSON.stringify(TITLE)})`, 20000);
check('the notification reached its recipient', (await text()).includes(TITLE));
await shot('notification');

// 12. Owen Price reads the workflow with no editor.
check('the demo panel signs in Owen Price', !!(await persona('Owen Price')));
await go(`${workflowPath}?edit=1`);
await until(`document.body.textContent.includes('Workflows are written')`, 20000);
check('Owen Price reads the rule, with no editor and no command', /^When ?A ticket is escalated/.test(await triggerLine()) && !(await js(`!!__tid('definition-form') || !!__tid('activate') || !!__tid('edit')`)));
check('no element wider than the phone on the workflow', (await overflow()) === 0);
await shot('reader');

// 13. Jordan Wells is refused.
check('the demo panel signs in Jordan Wells', !!(await persona('Jordan Wells')));
await go('/automations/workflows');
await wait(1500);
check('Jordan Wells is told the module needs workflows.view', (await text()).includes('workflows.view'));
await shot('refused');

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} steps pass`);
ws.close();
chrome.kill('SIGKILL');
await new Promise((r) => (chrome.exitCode !== null || chrome.signalCode !== null ? r() : chrome.once('exit', r)));
await new Promise((r) => setTimeout(r, 400));
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
process.exit(failed ? 1 : 0);
