import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  MUTABLE_CAPABILITIES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.markdown;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'markdown');
  assert.equal(contract.ui, 'markdown');
});

/**
 * `prose` owns `data-ui` on the region, so the family is a second element
 * around it: the empty, error and loading states are drawn outside the
 * region's typography, and the region keeps every rule `prose` wrote for it.
 * The region is `prose`'s root and carries `prose`'s part, not one of these.
 */
test('is a root around a prose region, with the parts only the renderer writes', () => {
  assert.equal(member.nativeElement, 'div');
  assert.deepEqual(member.parts, [
    'root',
    'embed',
    'alert-body',
    'task-list',
    'task',
    'task-body',
    'backref',
    'empty',
    'error',
  ]);
  assert.ok(contract.composes.includes('prose'));
});

/**
 * The parser is an adapter. The input is a tree whose shape is mdast, so
 * remark's output passes through untouched, and nothing in the contract
 * accepts a string of HTML.
 */
test('takes a tree, never HTML', () => {
  assert.equal(contract.input.shape, 'mdast');
  assert.match(contract.input.spec, /^https:\/\/github\.com\/syntax-tree\/mdast/);
  assert.equal(contract.engine, '@slotted/core/markdown');
  assert.ok(!contract.document.kinds.includes('html'), 'html is not a kind the document renders');
});

/**
 * Sanitisation is mandatory, and it is closed by default: raw HTML and types
 * nobody named render nothing, and no executable scheme survives in a link
 * or an image.
 */
test('closes raw HTML, unknown types and executable schemes by default', () => {
  assert.match(contract.sanitisation.html, /^dropped/);
  assert.match(contract.sanitisation.unknownTypes, /^dropped/);
  for (const list of Object.values(contract.sanitisation.urls).filter(Array.isArray)) {
    for (const scheme of ['javascript', 'vbscript', 'data', 'file']) {
      assert.ok(!list.includes(scheme), `${scheme} is allowed`);
    }
  }
});

test('writes heading ids the way GitHub does, through one prefix', () => {
  assert.equal(contract.ids.algorithm, 'github-slugger');
  assert.equal(member.defaults.idPrefix, '');
});

/**
 * The content belongs to the consumer. A task the reader ticks is a request
 * against the consumer's source, and the checkbox moves only when the new
 * tree arrives, so the family declares requests and no state model.
 */
test('holds no value, and asks for every change with a reason', () => {
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(!member.capabilities.includes(capability), `${capability} would need a model`);
  }
  assert.ok(!('stateModel' in contract));
  for (const [name, request] of Object.entries(contract.requests)) {
    assert.ok(request.reasons.length > 0, `${name} carries no reason`);
    for (const reason of request.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
});

test('maps the five GitHub alerts onto the five tones', () => {
  assert.deepEqual(Object.values(contract.alerts.tones).sort(), [
    'accent',
    'danger',
    'secondary',
    'success',
    'warning',
  ]);
});

test('records the absence of an authoring-practices pattern', () => {
  assert.equal(contract.pattern, null);
  assert.ok(contract.patternAbsent.reason.length > 80);
  for (const source of ['platform', 'commonmark', 'gfm', 'footnotes']) {
    assert.match(contract.patternAbsent[source], /^https:\/\//, `${source} is not a URL`);
  }
});

test('declines only with a reason, and names the owner where there is one', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 60, `${name} has no reason`);
  }
});
