import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.detailPanel;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'detail-panel');
  assert.equal(contract.ui, 'detail-panel');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One record on screen. The top is `page-header`'s, the strip is `tabs`'s,
 * a stacked unit is `section`'s and the waiting shape is `skeleton`'s; what
 * is left for this family is the section model, the two columns, the status
 * of the record and where focus goes when it changes. The parts are what
 * none of the four composed families draws.
 */
test('is one article whose top is a page-header and whose parts are what no composed family draws', () => {
  assert.deepEqual(Object.keys(contract.members), ['detailPanel']);
  assert.equal(member.nativeElement, 'article');
  assert.equal(contract.rootElement, 'article');
  assert.deepEqual(contract.composes, ['page-header', 'tabs', 'section', 'skeleton']);
  assert.deepEqual(member.parts, [
    'root',
    'body',
    'banner',
    'columns',
    'main',
    'section',
    'section-actions',
    'aside',
    'message',
    'footer',
  ]);
  assert.ok(!member.parts.includes('header'), 'the page-header is the header, unwrapped');
  assert.ok(!member.parts.includes('close'), 'the host owns open');
  assert.equal(contract.declined.close.deferTo, 'drawer');
});

/**
 * The one value the reader or the application moves: which section is
 * shown. It is the same value under both layouts, so switching a narrow
 * host from stacked to tabs changes the picture and nothing the application
 * wrote. Under `stacked` no control of the family moves it, so the only
 * reason it can arrive with is `programmatic`; the bar that would send
 * `scroll` is `table-of-contents`'s.
 */
test('holds the current section as one value in both layouts', () => {
  assert.deepEqual(contract.axes.layout, ['stacked', 'tabs']);
  assert.equal(member.defaults.layout, 'stacked');
  assert.ok(member.capabilities.includes('current'));
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'section',
    uncontrolled: 'defaultSection',
    request: 'onSectionChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.equal(contract.stateAttributes.current, 'data-current');
  assert.equal(contract.current.scrollSpy.deferTo, 'table-of-contents');
});

/**
 * The strip is the tabs family's list and nothing more; the panels are this
 * family's sections, wired by the ids the strip returns. Angular's injector
 * is the reason, and it is written where a later family will look for it.
 */
test('wires the tab panels to the strip by id rather than nesting them in it', () => {
  assert.equal(contract.strip.engine, 'tabs');
  assert.equal(contract.strip.holds, 'the list alone');
  assert.match(contract.strip.reason, /Angular/);
  assert.match(contract.wiring['aria-controls'], /identify/);
  assert.match(contract.roles.section, /tabpanel/);
  assert.deepEqual(contract.axes.mount, ['active', 'lazy', 'eager']);
  assert.equal(member.defaults.mount, 'active');
});

/**
 * Focus follows the record. The previous and next controls are the
 * page-header's; what the family adds is the move a screen reader needs when
 * the record under its focus changes.
 */
test('moves focus to the heading when the record changes under it', () => {
  assert.equal(contract.recordKey.attribute, 'data-key');
  assert.match(contract.recordKey.effect, /activeElement is inside the root/);
  assert.match(contract.wiring.tabindex, /-1 on the page-header's heading/);
});

/**
 * A record that is not there keeps its chrome: the header, the back control
 * and the footer stay, so a drawer opened on a deleted record still closes.
 * Not-found and error are two statuses because they need different words
 * and different actions. Loading is a state and not a status, because a
 * record that failed can be reloading.
 */
test('keeps its chrome when the record is missing or failed, and says when it is waiting', () => {
  assert.deepEqual(contract.axes.status, ['ready', 'not-found', 'error']);
  assert.equal(member.defaults.status, 'ready');
  assert.ok(member.parts.includes('message'));
  assert.deepEqual(member.states, ['default', 'loading', 'current']);
  assert.equal(contract.stateAttributes.loading, 'data-loading');
  assert.equal(member.defaults.loading, false);
  assert.match(contract.loading.section, /skeleton/);
  assert.match(contract.loading.header, /page-header/);
});

/**
 * Two columns above 600 pixels of the root's own width, one below, and the
 * aside never hidden: content a desktop has and a phone does not is content
 * a phone reader cannot reach.
 */
test('reflows the aside under the body instead of hiding it', () => {
  assert.deepEqual(contract.axes.aside, ['end', 'start', 'none']);
  assert.equal(member.defaults.aside, 'end');
  assert.equal(contract.responsive.container, 'detail-panel');
  assert.equal(contract.responsive.narrow, '600px');
  assert.equal(contract.responsive.hidden.declined, true);
  assert.equal(contract.sticky.aside.declined, true);
  assert.equal(contract.roles.aside, 'complementary');
  assert.ok(contract.messages.includes('aside'));
});

/**
 * The host supplies the surface and the panel never asks which one it is in.
 * `scroll` is the one thing a host changes.
 */
test('names no host and lets scroll be the one difference', () => {
  assert.ok(!('host' in contract.axes));
  assert.deepEqual(contract.axes.scroll, ['ancestor', 'self']);
  assert.equal(member.defaults.scroll, 'ancestor');
  assert.match(contract.sticky.footer, /--slotted-page-sticky-bottom/);
  assert.match(contract.sticky.header, /--slotted-page-sticky-top/);
});

test('sets the page-header defaults for its subtree from its own level and size', () => {
  assert.deepEqual(contract.axes.level, ['1', '2', '3']);
  assert.equal(member.defaults.level, '2');
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(member.defaults.size, 'md');
  assert.deepEqual(contract.provides.pageHeaderDefaults, ['level', 'size']);
  assert.deepEqual(contract.provides.detailPanelDefaults, [
    'layout',
    'aside',
    'level',
    'size',
    'scroll',
    'mount',
  ]);
});
