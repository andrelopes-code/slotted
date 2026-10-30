import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  CHANGE_REASONS,
  GROUPS,
  KNOWN_CAPABILITIES,
  LEGACY_FAMILIES,
  LEGACY_SCHEMA_VERSION,
  MUTABLE_CAPABILITIES,
  STATE_ATTRIBUTES,
  STATE_PRECEDENCE,
  SUMMARY_MAX,
  assertContractShape,
  strongestState,
} from './contract.schema.mjs';

const valid = {
  schemaVersion: 5,
  family: 'example',
  ui: 'example',
  catalog: { group: 'Actions', summary: 'An example family.' },
  stateAttributes: { disabled: 'data-disabled' },
  members: {
    example: {
      nativeElement: 'div',
      defaults: {},
      capabilities: ['disabled'],
      states: ['default', 'disabled'],
      parts: ['root'],
    },
  },
  scenarios: { example: ['playground'] },
};

test('accepts a contract without appearance axes', () => {
  assert.doesNotThrow(() => assertContractShape(valid));
});

test('rejects an attribute-driven state with no declared attribute', () => {
  const contract = structuredClone(valid);
  contract.members.example.states.push('invalid');
  assert.throws(() => assertContractShape(contract), /invalid/);
});

test('rejects a pseudo-class state given an attribute', () => {
  const contract = structuredClone(valid);
  contract.stateAttributes.hover = 'data-hover';
  assert.throws(() => assertContractShape(contract), /hover/);
});

test('rejects a state attribute that disagrees with the shared vocabulary', () => {
  const contract = structuredClone(valid);
  contract.stateAttributes.disabled = 'data-off';
  assert.throws(() => assertContractShape(contract), /disabled/);
});

test('rejects a scenario page that names no member', () => {
  const contract = structuredClone(valid);
  contract.scenarios.ghost = ['playground'];
  assert.throws(() => assertContractShape(contract), /ghost/);
});

test('rejects duplicate scenario ids within a page', () => {
  const contract = structuredClone(valid);
  contract.scenarios.example = ['playground', 'playground'];
  assert.throws(() => assertContractShape(contract), /playground/);
});

test('carries the states Field introduces', () => {
  assert.equal(STATE_ATTRIBUTES.invalid, 'data-invalid');
  assert.equal(STATE_ATTRIBUTES.required, 'data-required');
  assert.equal(STATE_ATTRIBUTES.readonly, 'data-readonly');
});

test('carries the disclosure states an overlay introduces', () => {
  assert.equal(STATE_ATTRIBUTES.open, 'data-open');
  assert.equal(STATE_ATTRIBUTES.expanded, 'data-expanded');
});

/**
 * A step that is done is neither checked nor selected: a checkbox is checked by
 * the reader and a row is selected by the reader, while a step is completed by
 * the flow. The vocabulary held no word for it, and
 * `docs/component-features.md` section 7 already spells the one it was missing
 * — "estados pending/current/complete/error/disabled".
 */
test('carries the completion state a stepped flow introduces', () => {
  assert.equal(STATE_ATTRIBUTES.complete, 'data-complete');
});

/**
 * `text-field` reveals a value by swapping the input's `type`, so it never
 * needed a selector. A value clamped in CSS does: the rule that releases the
 * clamp has to name the state that released it.
 */
test('carries the revealed state a clamped value introduces', () => {
  assert.equal(STATE_ATTRIBUTES.revealed, 'data-revealed');
});

/**
 * Copying is an action the platform completes, not a value a consumer owns:
 * there is no controlled form of a clipboard and nothing to cancel. Filing it
 * under the mutable list would oblige every family that copies to declare a
 * state model for state it does not hold.
 */
test('holds copying as a capability and not as state', () => {
  assert.ok(KNOWN_CAPABILITIES.includes('copyable'));
  assert.ok(!MUTABLE_CAPABILITIES.includes('copyable'));
});

/**
 * The order a set of rows is in is a value a consumer owns: a server sorts, a
 * query string carries the descriptor, and a saved view restores it. So it is
 * mutable, and a family that sorts declares the model rather than emitting a
 * callback with no controlled form.
 */
test('holds the order of a set of rows as state a consumer can own', () => {
  assert.ok(KNOWN_CAPABILITIES.includes('sort'));
  assert.ok(MUTABLE_CAPABILITIES.includes('sort'));
});

/**
 * Which values of a column a reader keeps is a second value a consumer owns,
 * and it is not the first: a table holds a selection of records and a filter of
 * values at once, and the two mean opposite things — one names rows to act on,
 * the other names rows to see.
 */
test('holds the values a column is filtered to, apart from the records chosen', () => {
  assert.ok(KNOWN_CAPABILITIES.includes('filter'));
  assert.ok(MUTABLE_CAPABILITIES.includes('filter'));
  assert.ok(KNOWN_CAPABILITIES.includes('selection'));
});

/* ------------------------------------------------------------- identity - */

test('rejects a family that does not name its public identifier', () => {
  const contract = structuredClone(valid);
  delete contract.ui;
  assert.throws(() => assertContractShape(contract), /data-ui/);
});

test('rejects an identifier that disagrees with the family name', () => {
  const contract = structuredClone(valid);
  contract.ui = 'sample';
  assert.throws(() => assertContractShape(contract), /data-ui/);
});

test('rejects a member without a root part', () => {
  const contract = structuredClone(valid);
  contract.members.example.parts = ['thumb'];
  assert.throws(() => assertContractShape(contract), /root part/);
});

/* ---------------------------------------------------------- state model - */

function withOpenState(model) {
  const contract = structuredClone(valid);
  contract.members.example.capabilities.push('open');
  contract.members.example.states.push('open');
  contract.stateAttributes.open = 'data-open';
  if (model !== undefined) contract.stateModel = { open: model };
  return contract;
}

const openModel = {
  controlled: 'open',
  uncontrolled: 'defaultOpen',
  request: 'onOpenChange',
  reasons: ['pointer', 'keyboard', 'escape', 'outsidePress'],
};

test('accepts a mutable capability that declares its state model', () => {
  assert.doesNotThrow(() => assertContractShape(withOpenState(openModel)));
});

test('rejects a mutable capability with no state model', () => {
  assert.throws(() => assertContractShape(withOpenState()), /open holds state/);
});

test('rejects a state model that omits the uncontrolled entry point', () => {
  const model = structuredClone(openModel);
  delete model.uncontrolled;
  assert.throws(() => assertContractShape(withOpenState(model)), /uncontrolled/);
});

test('rejects a change reason outside the shared vocabulary', () => {
  const model = structuredClone(openModel);
  model.reasons = ['pointer', 'telepathy'];
  assert.throws(() => assertContractShape(withOpenState(model)), /telepathy/);
});

test('rejects a state model for a capability the family does not hold', () => {
  const contract = structuredClone(valid);
  contract.stateModel = { checked: openModel };
  assert.throws(() => assertContractShape(contract), /checked/);
});

/**
 * A family may hold the same capability for more than one thing: `app-shell`
 * has a navigation region and a secondary pane, and each of them opens. The
 * model is indexed by capability, so the entry for one becomes a *set* of named
 * models — told apart from a single model by the absence of `controlled` on
 * the entry itself — and every member of the set is held to the same shape.
 */
test('accepts a set of named models for one capability held twice', () => {
  const set = {
    nav: { ...openModel, controlled: 'navOpen', uncontrolled: 'defaultNavOpen' },
    aside: { ...openModel, controlled: 'asideOpen', uncontrolled: 'defaultAsideOpen' },
  };
  assert.doesNotThrow(() => assertContractShape(withOpenState(set)));
});

test('holds every member of a set to the shape of a model', () => {
  const set = {
    nav: openModel,
    aside: { controlled: 'asideOpen', request: 'onAsideOpenChange', reasons: ['pointer'] },
  };
  assert.throws(() => assertContractShape(withOpenState(set)), /open\.aside .*uncontrolled/);

  const bad = { nav: openModel, aside: { ...openModel, reasons: ['pointer', 'telepathy'] } };
  assert.throws(() => assertContractShape(withOpenState(bad)), /open\.aside .*telepathy/);
});

test('rejects an empty set, which declares a model and models nothing', () => {
  assert.throws(() => assertContractShape(withOpenState({})), /open .*models nothing/);
});

test('rejects two members of a set that share a prop name', () => {
  const set = { nav: openModel, aside: openModel };
  assert.throws(() => assertContractShape(withOpenState(set)), /open .*repeats/);
});

/**
 * The text a control holds is the most common mutable value in a component
 * library and the vocabulary could not name it, which is why the deleted
 * `input` family declared five capabilities and none of them mutable: the
 * schema had no word for the one thing the control does.
 */
test('requires a state model from a family that holds a text value', () => {
  const contract = structuredClone(valid);
  contract.members.example.capabilities.push('value');
  assert.throws(() => assertContractShape(contract), /value holds state/);

  contract.stateModel = {
    value: {
      controlled: 'value',
      uncontrolled: 'defaultValue',
      request: 'onValueChange',
      reasons: ['keyboard', 'clear'],
    },
  };
  assert.doesNotThrow(() => assertContractShape(contract));
});

test('requires a state model from a family that reveals a hidden value', () => {
  const contract = structuredClone(valid);
  contract.members.example.capabilities.push('revealed');
  assert.throws(() => assertContractShape(contract), /revealed holds state/);
});

/**
 * A measure the reader moves. `size` is a step on an appearance scale and is
 * not mutable, `measurement` is a quantity the family only draws, and `value`
 * is the text a control holds — so a resizable panel had no word, and would
 * have shipped a mutable value with no model, which is the failure the schema
 * exists to catch. `drawer` found the gap and `splitter` reads the same word.
 */
test('requires a state model from a family whose measure the reader moves', () => {
  const contract = structuredClone(valid);
  contract.members.example.capabilities.push('extent');
  assert.throws(() => assertContractShape(contract), /extent holds state/);

  contract.stateModel = {
    extent: {
      controlled: 'extent',
      uncontrolled: 'defaultExtent',
      request: 'onExtentChange',
      reasons: ['pointer', 'keyboard', 'programmatic'],
    },
  };
  assert.doesNotThrow(() => assertContractShape(contract));
});

/**
 * A chart holds two values the vocabulary had no word for. Which series are
 * drawn is not `selection` — a chart holds a selected point and a hidden
 * series at once, and the two mean opposite things, one naming data to act on
 * and the other naming data to leave out of the picture. The window of the
 * domain in view is not `extent`, which is the share of a layer a panel takes,
 * not a range of data. Both are the reader's to move and a consumer's to own:
 * a saved dashboard restores the series it hid and the range it zoomed to.
 */
test('holds the series a chart draws and the window it shows as state a consumer can own', () => {
  for (const capability of ['visibility', 'zoom']) {
    assert.ok(KNOWN_CAPABILITIES.includes(capability), `${capability} is unknown`);
    assert.ok(MUTABLE_CAPABILITIES.includes(capability), `${capability} is not mutable`);
  }
});

/**
 * A list of named arrangements of a grid, which one is in use and which one a
 * visit opens on. It is not `columns`, which is one arrangement, and not
 * `selection` or `current`: the set itself is edited — saved, renamed,
 * deleted — and a consumer's store owns it.
 */
test('holds the saved views of a grid as state a consumer can own', () => {
  assert.ok(KNOWN_CAPABILITIES.includes('views'), 'views is unknown');
  assert.ok(MUTABLE_CAPABILITIES.includes('views'), 'views is not mutable');
});

/**
 * The reader's own arrangement of a surface of blocks — their order, their
 * size and which are hidden — and the mode in which the reader makes it. A
 * dashboard restores the first from a store and enters the second from a
 * button of the product's own, so a consumer owns both.
 */
test('holds a layout and the mode that edits it as state a consumer can own', () => {
  for (const capability of ['layout', 'editing']) {
    assert.ok(KNOWN_CAPABILITIES.includes(capability), `${capability} is unknown`);
    assert.ok(MUTABLE_CAPABILITIES.includes(capability), `${capability} is not mutable`);
  }
  assert.equal(STATE_ATTRIBUTES.editing, 'data-editing');
});

test('keeps every mutable capability inside the known vocabulary', () => {
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(KNOWN_CAPABILITIES.includes(capability), `${capability} is mutable and unknown`);
  }
});

test('names every reason a request can carry', () => {
  assert.deepEqual(CHANGE_REASONS.includes('programmatic'), true);
  assert.equal(new Set(CHANGE_REASONS).size, CHANGE_REASONS.length);
});

/* ----------------------------------------------------------- precedence - */

test('resolves simultaneous states in one declared order', () => {
  assert.equal(strongestState(['hover', 'disabled']), 'disabled');
  assert.equal(strongestState(['focus-visible', 'hover']), 'hover');
  assert.equal(strongestState(['default']), 'default');
});

test('orders every state the vocabulary can paint', () => {
  assert.equal(new Set(STATE_PRECEDENCE).size, STATE_PRECEDENCE.length);
  assert.equal(STATE_PRECEDENCE.at(0), 'disabled');
  assert.equal(STATE_PRECEDENCE.at(-1), 'default');
});

/**
 * Where the reader is beats what they have already done, and an error beats
 * both. A step that is current and complete reads as current; a step that is
 * complete and in error reads as in error, because `invalid` already sits
 * above the pair.
 */
test('places completion under the step the reader is on and under an error', () => {
  assert.ok(STATE_PRECEDENCE.indexOf('current') < STATE_PRECEDENCE.indexOf('complete'));
  assert.ok(STATE_PRECEDENCE.indexOf('invalid') < STATE_PRECEDENCE.indexOf('complete'));
  assert.ok(STATE_PRECEDENCE.indexOf('complete') < STATE_PRECEDENCE.indexOf('hover'));
  assert.equal(strongestState(['complete', 'current']), 'current');
  assert.equal(strongestState(['complete', 'hover']), 'complete');
});

/* --------------------------------------------------------------- legacy - */

/**
 * The ledger runs down to nothing, and it has: twenty-one families were removed
 * rather than rebuilt, and every family left in the repository satisfies the
 * current schema. So this states the rule from whichever side is real — while a
 * family is listed it is held to the schema it was built against, and once the
 * list is empty no contract may claim that schema at all.
 */
test('holds a listed family to the schema it was built against', () => {
  const family = LEGACY_FAMILIES.at(0);

  if (family === undefined) {
    const contract = { ...structuredClone(valid), schemaVersion: LEGACY_SCHEMA_VERSION };
    assert.throws(() => assertContractShape(contract), /must satisfy schema/);
    return;
  }

  const contract = { ...structuredClone(valid), family, ui: family };
  assert.throws(() => assertContractShape(contract), /legacy/);
});

/**
 * `form` holds one mutable value and the vocabulary had no word for it. The
 * capability is mutable, so a contract that declares it and no model is
 * refused exactly like every other mutable one.
 */
test('requires a model for the error map a form holds', () => {
  const contract = structuredClone(valid);
  contract.members.example.capabilities.push('validity');
  assert.throws(() => assertContractShape(contract), /validity holds state and declares no model/);

  contract.stateModel = {
    validity: {
      controlled: 'errors',
      uncontrolled: 'defaultErrors',
      request: 'onErrorsChange',
      reasons: ['submit', 'keyboard', 'clear', 'programmatic'],
    },
  };
  assert.doesNotThrow(() => assertContractShape(contract));
});

/**
 * A drag carrying something the region will refuse is not the same as a drag it
 * will take, and the difference has to be paintable before the reader lets go.
 * `docs/component-features.md` section 2.5 names the drag-and-drop set as
 * `dragging`, `drop-target` and `drop-invalid`; the vocabulary held the first
 * two, and `upload` is the family that found the third missing.
 */
test('carries the refused-drop state a drop region introduces', () => {
  assert.equal(STATE_ATTRIBUTES['drop-invalid'], 'data-drop-invalid');
});

test('rejects a catalog group outside the shared list', () => {
  const contract = structuredClone(valid);
  contract.catalog.group = 'Widgets';
  assert.throws(() => assertContractShape(contract), /group/);
});

test('rejects a summary that is missing, too long or more than one sentence', () => {
  for (const summary of [
    undefined,
    `${'A'.repeat(SUMMARY_MAX)}.`,
    'Two things. In one field.',
    'no capital.',
    'No period',
  ]) {
    const contract = structuredClone(valid);
    contract.catalog.summary = summary;
    assert.throws(() => assertContractShape(contract), /summary/, String(summary));
  }
});

const componentsRoot = new URL('./components/', import.meta.url);
const contracts = readdirSync(componentsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) =>
    JSON.parse(readFileSync(new URL(`${entry.name}/contract.json`, componentsRoot), 'utf8')),
  );

test('every contract states its catalog group and a one-sentence summary', () => {
  const missing = contracts
    .filter(
      (contract) =>
        !GROUPS.includes(contract.catalog?.group) || typeof contract.catalog?.summary !== 'string',
    )
    .map((contract) => contract.family);
  assert.deepEqual(missing, []);
});

/**
 * The agent index lists one line per family, `- <family>: <summary>`, and an
 * agent reads it whole before writing UI. 8 KB is the size of the index that
 * took Vercel's eval from 53% to 100%; 512 bytes cover its title, its path line
 * and the group headings.
 */
test('the index lines of every family fit the 8 KB index budget', () => {
  const bytes = contracts.reduce(
    (sum, contract) =>
      sum + Buffer.byteLength(`- ${contract.family}: ${contract.catalog.summary}\n`),
    512,
  );
  assert.ok(bytes <= 8192, `index lines total ${bytes} bytes`);
});
