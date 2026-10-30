import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  MUTABLE_CAPABILITIES,
  STATE_ATTRIBUTES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.upload;
/** The glyph names the theme generates: a token's name without `--slotted-icon-`. */
const GLYPH_NAMES = new Set(
  Object.keys(
    JSON.parse(
      await readFile(
        new URL('../../../packages/themes/src/default/glyphs.json', import.meta.url),
        'utf8',
      ),
    ),
  ).map((token) => token.replace('--slotted-icon-', '')),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'upload');
  assert.equal(contract.ui, 'upload');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The APG index carries no upload, no dropzone and no drag-and-drop pattern, so
 * the contract says so and cites the four official sources that do apply
 * instead. A family that wrote "checked against APG" here would be citing a
 * page that does not exist.
 */
test('states that no pattern exists, and cites what it answers instead', () => {
  assert.equal(contract.pattern, null);
  assert.match(contract.patternStatus, /no upload/i);
  assert.match(contract.patternStatus, /apg\/patterns/i);

  const urls = contract.sources.map((source) => source.url);
  assert.ok(
    urls.some((url) => url.includes('/input/file')),
    'the platform control',
  );
  assert.ok(
    urls.some((url) => url.includes('apg/patterns/button')),
    'the item controls',
  );
  assert.ok(
    urls.some((url) => url.includes('dragging-movements')),
    'SC 2.5.7',
  );
  assert.ok(
    urls.some((url) => url.includes('status-messages')),
    'SC 4.1.3',
  );
  for (const source of contract.sources) {
    assert.ok(source.settles.length > 0, `${source.url} does not say what it settles`);
  }
});

/**
 * WCAG 2.2 SC 2.5.7: every action reachable by dragging is reachable by a
 * single pointer action that is not a drag. Drag and drop is pointer-only and
 * cannot be made otherwise, so the trigger inside the region is the whole of
 * the answer and the contract states it rather than implying it.
 */
test('keeps a non-drag route to every file, and says which part is it', () => {
  assert.equal(contract.dragging.alternative, 'trigger');
  assert.ok(member.parts.includes('trigger'));
  assert.ok(contract.dragging.alternativeReason.length > 0);
  assert.equal(contract.dragging.depthCounted, true);
  assert.equal(contract.dragging.cancelsDragOver, true);
});

/**
 * `DataTransfer.items` exposes each item's `kind` and `type` during a drag and
 * neither its name nor its size. Three of the five rules are answerable before
 * the drop and two are not, and a region that painted a refusal on a maybe
 * would teach the reader that the red edge means nothing.
 */
test('paints a verdict only for the rules a drag can answer', () => {
  assert.deepEqual(contract.dragging.judgedBeforeDrop.sort(), ['count', 'kind', 'type']);
  assert.deepEqual(contract.dragging.judgedAfterDrop.sort(), ['extension', 'size']);
  assert.equal(contract.dragging.unknownVerdict, 'drop-target');
  assert.ok(contract.dragging.unknownVerdictReason.length > 0);
});

/**
 * The word is new to the vocabulary. `docs/component-features.md` §2.5 names
 * the drag-and-drop set as three and the schema held two; this is the family
 * that added the third, so the contract has to be the thing that uses it.
 */
test('declares all three drag-and-drop states', () => {
  for (const state of ['dragging', 'drop-target', 'drop-invalid']) {
    assert.ok(member.states.includes(state), `${state} is not declared`);
    assert.equal(contract.stateAttributes[state], STATE_ATTRIBUTES[state]);
  }
});

/**
 * The accessible name comes from a `<label>` around the trigger rather than
 * around the whole region, so the guidance text can be as long as the product
 * needs without being read before the control is identified.
 */
test('puts the label around the trigger and the control inside it', () => {
  assert.equal(contract.anatomy.labelledBy, 'trigger');
  assert.equal(contract.anatomy.trigger, 'label');
  assert.equal(contract.anatomy.control, 'input');
  assert.equal(contract.anatomy.describedBy, 'description');
  assert.equal(contract.anatomy.hidden, 'clip');
  assert.ok(contract.anatomy.hiddenReason.includes('tab order'));
  assert.ok(contract.anatomy.reason.length > 0);
});

test('declares a state model for the one value a consumer can own', () => {
  assert.ok(member.capabilities.includes('files'));
  assert.ok(MUTABLE_CAPABILITIES.includes('files'));
  assert.deepEqual(contract.stateModel.files, {
    controlled: 'files',
    uncontrolled: 'defaultFiles',
    request: 'onFilesChange',
    reasons: ['select', 'pointer', 'keyboard', 'remove', 'clear', 'programmatic'],
  });
  for (const reason of contract.stateModel.files.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason), `${reason} is outside the vocabulary`);
  }
});

/**
 * `docs/component-features.md` §14 asks for the flow by name. The three
 * failures are kept apart because every surveyed implementation paints one red
 * row for all three, and the reader cannot then tell whether to try again,
 * choose another file, or do nothing.
 */
test('names every status a file passes through, and keeps three failures apart', () => {
  assert.deepEqual(contract.statuses, [
    'rejected',
    'ready',
    'queued',
    'uploading',
    'paused',
    'stalled',
    'success',
    'error',
    'canceled',
  ]);
  for (const failure of ['rejected', 'error', 'canceled']) {
    const actions = contract.statusActions[failure];
    assert.ok(Array.isArray(actions) && actions.length > 0, `${failure} offers nothing`);
    for (const action of actions) {
      assert.ok(member.parts.includes(action), `${failure} offers a part that does not exist`);
    }
  }
  assert.deepEqual(contract.statusActions.rejected, ['remove']);
  assert.deepEqual(contract.statusActions.error, ['retry', 'remove']);
  assert.deepEqual(contract.statusActions.canceled, ['start', 'remove']);
  /* The primary action first, `view` in the middle, and the one that takes the
     row away last. Three is the most any row offers, and the actions group
     reserves exactly that so the column of sizes stays a column. */
  const widest = Math.max(...Object.values(contract.statusActions).map((a) => a.length));
  assert.equal(widest, 2, 'a row offers more controls than it has room for');
  assert.ok(contract.statusActionsReason.length > 0);
  assert.ok(contract.statusReason.length > 0);
});

/**
 * The family calls an adapter and reports what it says. It holds no URL, no
 * method, no header and no credential, which is the boundary the removed
 * wave-2 family drew and this one keeps while gaining the transfer.
 */
test('transfers through an adapter and owns no connection', () => {
  assert.deepEqual(Object.keys(contract.adapter.context).sort(), [
    'progress',
    'signal',
    'whenResumed',
  ]);
  assert.equal(contract.adapter.cancellation, 'AbortSignal');
  assert.equal(contract.adapter.builtIn, 'createXhrUpload');
  assert.match(contract.adapter.builtInReason, /progress/i);
  assert.deepEqual(contract.adapter.holds, []);
  assert.ok(contract.adapter.reason.length > 0);
});

/**
 * A pause control drawn over a sender that cannot suspend is a control that
 * lies, so the adapter declares the handshake and the part exists only when it
 * does. One of the nine surveyed implementations pauses at all.
 */
test('offers pause only where the adapter honors it', () => {
  assert.equal(contract.adapter.pausableFlag, 'pausable');
  assert.equal(contract.adapter.pausableDefault, false);
  assert.equal(contract.parts.pause.presentWhen, 'the running adapter declares pausable');
  assert.ok(contract.adapter.pausableReason.length > 0);
});

/**
 * An upload is a POST, and a POST that succeeded on the server and failed on
 * the response is duplicated by a retry. A library may not choose that for an
 * application, so the capability ships and the default is off.
 */
test('ships automatic retry and leaves it off', () => {
  assert.equal(member.defaults.retries, 0);
  assert.match(contract.retry.reason, /idempotent|POST/i);
  assert.ok(member.parts.includes('retry'));
});

/**
 * The rule none of the nine answers: a form submitted while the bytes are
 * still moving saves a record whose attachment never arrived.
 */
test('makes the control invalid while a transfer is pending', () => {
  assert.equal(member.defaults.pendingBlocksSubmit, true);
  assert.deepEqual(contract.validity.pendingStatuses, [
    'ready',
    'queued',
    'uploading',
    'paused',
    'stalled',
  ]);
  assert.equal(contract.validity.react, 'setCustomValidity');
  assert.equal(contract.validity.angular, 'Validator');
  assert.ok(contract.validity.cost.length > 0);
});

/**
 * Every rejection carries a reason the consumer turns into a message. The
 * catalog holds one sentence per reason, which an upload's `messages`
 * replaces, because only the consumer knows whether a limit is a policy, a
 * plan or a bug.
 */
test('reports each refusal with a reason from a closed set', () => {
  assert.deepEqual(contract.rejectionReasons.sort(), [
    'custom',
    'directory',
    'duplicate',
    'maxFiles',
    'minSize',
    'multiple',
    'size',
    'totalSize',
    'type',
  ]);
  for (const reason of contract.rejectionReasons) {
    assert.ok(contract.messages.includes(`rejection.${reason}`), `${reason} has no sentence`);
  }
  assert.ok(member.parts.includes('message'));
});

/**
 * Announced on transitions, never on progress. WCAG 2.2 SC 4.1.3 asks for the
 * status change to reach assistive technology without taking focus; a bar that
 * speaks every event says nothing.
 */
test('announces transitions through the shared announcer and never progress', () => {
  assert.equal(contract.announcement.channel, 'packages/core/src/live-announcer');
  assert.equal(contract.announcement.liveRegion, false);
  assert.equal(contract.announcement.politeness, 'polite');
  assert.ok(contract.announcement.announces.includes('accepted'));
  assert.ok(contract.announcement.announces.includes('rejected'));
  assert.ok(contract.announcement.silent.includes('progress'));
  assert.ok(contract.composes.includes('live-announcer'));
});

test('answers every key it binds, and says where focus lands', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  assert.deepEqual(keys, ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Ctrl+V / ⌘V']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'family'].includes(entry.source), `${entry.key} source`);
  }
  assert.equal(contract.keyboard.at(-1).source, 'family');
});

/** Focus is never lost when the row holding it leaves the list. */
test('says where focus goes when a row is removed', () => {
  assert.equal(contract.focus.removal.owner, 'packages/core/src/focus/removal-focus');
  assert.ok(contract.focus.removal.destination.length > 0);
  assert.ok(contract.composes.includes('removal-focus'));
});

/**
 * `docs/component-features.md` §17 asks for parts and recipes rather than
 * three families. The three shapes are one axis over one member.
 */
test('consolidates the three families as one axis', () => {
  assert.deepEqual(contract.axes.variant, ['dropzone', 'button', 'field']);
  assert.equal(Object.keys(contract.members).length, 1);
  for (const [variant, replaces] of Object.entries(contract.consolidates)) {
    assert.ok(contract.axes.variant.includes(variant), `${variant} is not a variant`);
    assert.ok(replaces.length > 0, `${variant} does not say what it replaces`);
  }
});

/** Every axis resolves the consumer's value, then the provider, then a default. */
test('resolves every axis in one order', () => {
  for (const [axis, order] of Object.entries(contract.resolution)) {
    assert.ok(axis in contract.axes, `${axis} resolves and is not an axis`);
    assert.equal(order[0], 'prop');
    assert.equal(order[1], 'defaults');
    assert.ok(contract.axes[axis].includes(order[2]), `${axis} default is outside its values`);
    assert.equal(member.defaults[axis], order[2], `${axis} default disagrees with the member`);
  }
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(axis in contract.resolution, `${axis} is an axis and does not resolve`);
  }
});

/** Every part the contract declares says what it is and when it is drawn. */
test('says what every part is for', () => {
  assert.deepEqual(Object.keys(contract.parts).sort(), [...member.parts].sort());
  for (const [name, part] of Object.entries(contract.parts)) {
    assert.ok(part.element.length > 0, `${name} does not name its element`);
    assert.ok(part.purpose.length > 0, `${name} does not say what it is for`);
    assert.ok(part.presentWhen.length > 0, `${name} does not say when it is drawn`);
  }
  assert.equal(contract.parts.input.element, 'input');
  assert.equal(contract.parts.trigger.element, 'label');
  assert.equal(contract.parts.list.element, 'ul');
  assert.equal(contract.parts.item.element, 'li');
});

/**
 * A long file name truncates in the middle so the extension survives, which
 * CSS cannot do: the split is made in the binding and the extension is a part
 * of its own. Nothing leaves the DOM.
 */
test('truncates a name in the middle and keeps the whole of it', () => {
  assert.ok(member.parts.includes('extension'));
  assert.equal(contract.content.truncation, 'middle');
  assert.equal(contract.content.removesFromDom, false);
  assert.equal(contract.content.direction, 'auto');
  assert.ok(contract.content.reason.length > 0);
});

/** Four hundred files is a scroll region, not four hundred rows on the page. */
test('bounds the list by rows rather than by a disclosure', () => {
  assert.equal(member.defaults.maxRows, 6);
  assert.equal(contract.overflow.mechanism, 'scroll');
  assert.equal(contract.overflow.unlimited, 0);
  assert.ok(member.capabilities.includes('overflow'));
});

/** §14 requires it by name, and two of the nine leave it to the consumer. */
test('revokes the object URL it created', () => {
  assert.equal(contract.preview.source, 'URL.createObjectURL');
  assert.equal(contract.preview.revokedOn, 'item removal and unmount');
  assert.deepEqual(contract.preview.appliesTo, ['image/*']);
});

/** A file dropped beside the region navigates the browser away from the form. */
test('refuses the document its own drop, and publishes the drag', () => {
  assert.equal(member.defaults.preventDocumentDrop, true);
  assert.equal(contract.documentDrop.published, true);
  assert.equal(contract.documentDrop.drawsOverlay, false);
  assert.ok(contract.documentDrop.reason.length > 0);
});

/** The bar and the field shell are composed, never drawn a second time. */
test('composes the families that already own what it needs', () => {
  assert.deepEqual(contract.composesFamilies.sort(), ['dialog', 'field', 'progress-indicator']);
  assert.ok(member.parts.includes('progress'));
  /*
   * And `measurement` is deliberately not a capability of this family. It is a
   * quantity the consumer states and the family draws; upload's is measured
   * from the bytes the adapter reports, and the family that holds the word is
   * the one that draws the bar.
   */
  assert.ok(!member.capabilities.includes('measurement'));
  assert.ok(!member.capabilities.includes('loading'), 'the queue answers that, not a prop');
  assert.ok(contract.capabilitiesReason.length > 0);
  assert.ok(member.states.includes('loading'), 'the state is still in the DOM');
});

/** An application sets its uploads once rather than on every control. */
test('lets an application decide once', () => {
  const provided = contract.provides.uploadDefaults;
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(provided.includes(axis), `${axis} cannot be set for the application`);
  }
  for (const value of ['adapter', 'concurrency', 'retries']) {
    assert.ok(provided.includes(value), `${value} cannot be set for the application`);
  }
});

/** Every decline names the family that owns the capability, or the composition. */
test('says what it does not do, and who does it instead', () => {
  const declined = Object.entries(contract.declined);
  assert.ok(declined.length >= 6);
  for (const [name, entry] of declined) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
    assert.ok(
      typeof entry.deferTo === 'string' || typeof entry.composition === 'string',
      `${name} declines and names neither an owner nor a composition`,
    );
  }
});

/** One demonstration per scenario, and the reference pages are held to it. */
test('declares a scenario for every capability the page must show', () => {
  const scenarios = contract.scenarios.upload;
  for (const required of [
    'playground',
    'variants',
    'restrictions',
    'transfer',
    'retry',
    'cancel',
    'previews',
    'content',
    'in-a-form',
    'states',
    'keyboard',
    'composition',
    'defaults',
  ]) {
    assert.ok(scenarios.includes(required), `${required} has no demonstration`);
  }
  assert.ok(scenarios.length >= 20, 'the page shows a sample rather than the family');
});

/**
 * A reader checking that they attached the right scan should not have to
 * download it. Every type the browser renders on its own opens in a tab from
 * the object URL the family already holds; a type it cannot render has no
 * control, because a control that downloads is not the one that was asked for.
 */
test('previews a file on a surface of its own, opened from the file’s own name', () => {
  assert.equal(
    contract.viewing.trigger,
    "the file's own name, and in the grid layout its tile as well",
  );
  assert.ok(contract.viewing.triggerReason.length > 0);
  assert.ok(!member.parts.includes('view'), 'a third affordance for one action');
  assert.match(contract.viewing.surface, /dialog/);
  assert.ok(contract.composesFamilies.includes('dialog'));

  assert.deepEqual(Object.keys(contract.viewing.types), [
    'image/*',
    'application/pdf',
    'text/*',
    'video/*',
    'audio/*',
  ]);
  for (const [type, how] of Object.entries(contract.viewing.types)) {
    assert.ok(how.length > 0, `${type} does not say what it is rendered as`);
  }
  assert.ok(contract.viewing.unsupported.length > 0, 'a kind it cannot render is left blank');

  for (const part of ['viewer', 'viewerStage', 'viewerTitle', 'viewerClose']) {
    assert.ok(member.parts.includes(part), `${part} is not a part`);
  }
  assert.deepEqual(contract.axes.view, ['auto', 'none']);
  assert.equal(member.defaults.view, 'auto');
});

/**
 * An object URL inherits the origin of the document that created it, so a
 * `text/html` file the reader dropped would run its own script against this
 * application's origin, with its cookies and its storage. The sandbox is not an
 * option the consumer sets; the family writes it always.
 */
test('sandboxes every frame it renders a dropped file in', () => {
  assert.match(contract.viewing.sandbox, /sandbox/);
  assert.match(contract.viewing.sandbox, /neither .*allow-scripts.* nor .*allow-same-origin/);
  assert.match(contract.viewing.sandboxReason, /origin/);
  for (const [type, how] of Object.entries(contract.viewing.types)) {
    if (!how.includes('iframe')) continue;
    assert.match(how, /sandboxed/, `${type} is framed without saying it is sandboxed`);
  }
});

/** The viewer answers its own keys, and says where focus lands for each. */
test('moves through the set it can render, and says how', () => {
  const keys = contract.viewing.keyboard.map((entry) => entry.key);
  assert.deepEqual(keys, ['Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
  for (const entry of contract.viewing.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['dialog', 'family'].includes(entry.source), `${entry.key} source`);
  }
  assert.match(contract.viewing.navigation, /skipping/);
  assert.ok(member.parts.includes('viewerPrevious'));
  assert.ok(member.parts.includes('viewerNext'));
});

/** Which file the reader is looking at is state, and a consumer can own it. */
test('declares a state model for the file the viewer is open on', () => {
  assert.ok(member.capabilities.includes('open'));
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'viewing',
    uncontrolled: 'defaultViewing',
    request: 'onViewingChange',
    reasons: ['pointer', 'keyboard', 'escape', 'outsidePress', 'dismiss', 'programmatic'],
  });
  for (const reason of contract.stateModel.open.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason), `${reason} is outside the vocabulary`);
  }
  assert.ok(contract.stateModelReason.length > 0);
});

/**
 * A reader picking one attachment out of nine reads the silhouette before the
 * words, because at thirty-two pixels the name is truncated and the extension
 * is three characters.
 */
test('says what kind of file a row holds, by color and by shape', () => {
  const kinds = Object.entries(contract.kinds);
  assert.equal(kinds.length, 9, 'eight kinds and the fallback');
  const glyphs = new Set();
  const tiles = new Set();
  for (const [kind, entry] of kinds) {
    /* A glyph name: the binding draws `<Glyph name>` on the tile. */
    assert.ok(GLYPH_NAMES.has(entry.glyph), `${kind} draws no mark`);
    assert.ok(!glyphs.has(entry.glyph), `${entry.glyph} is drawn for two kinds`);
    glyphs.add(entry.glyph);
    assert.ok(Array.isArray(entry.matches), `${kind} matches nothing`);
    /*
     * The tile is a token of the theme's, not a tone the family borrowed. The
     * five tones hold no second blue and no indigo, which is the whole of the
     * argument for the scale existing — `docs/token-foundation.md`, File kind.
     */
    assert.ok(
      entry.tile.startsWith('--slotted-upload-kind-'),
      `${kind} paints itself from something no theme can retune`,
    );
    assert.ok(!tiles.has(entry.tile), `${entry.tile} paints two kinds`);
    tiles.add(entry.tile);
  }
  assert.deepEqual(contract.kinds.other.matches, []);
  /* The pair a reader most often has to tell apart is two kinds, not one. */
  assert.notEqual(contract.kinds.pdf.tile, contract.kinds.document.tile);
  assert.equal(contract.kindsForeground, '--slotted-upload-kind-foreground');
  assert.ok(contract.kindsReason.includes('indigo'), 'the color decision is not written down');
});

/**
 * A field owns the label row, the description and the error slot for every
 * control in this library. An upload inside one that drew its own would put two
 * labels on one control and two messages under it.
 */
test('gives the field back what the field owns', () => {
  assert.deepEqual(contract.inField.suppresses.sort(), ['description', 'label', 'message']);
  assert.deepEqual(contract.inField.inherits.sort(), [
    'disabled',
    'invalid',
    'readOnly',
    'required',
    'size',
  ]);
  assert.ok(contract.inField.reason.length > 0);
  assert.ok(contract.composesFamilies.includes('field'));
  assert.ok(contract.scenarios.upload.includes('in-a-form'));
});

/**
 * The row is a grid so that a sentence a failure carries can span a track of
 * its own. A flex line centerd the chip and the controls on a box whose height
 * a two-line message had decided, which reads as wrong however correct the
 * centering is.
 */
test('lays a row out so its marks are centerd on the block they are about', () => {
  assert.match(contract.row.layout, /grid/);
  assert.equal(contract.row.lines.length, 3);
  assert.ok(contract.row.progress.includes('bottom edge'));
  assert.ok(contract.row.surface.length > 0);
  assert.ok(contract.row.narrow.length > 0);
  assert.ok(contract.row.reason.length > 0);
  assert.ok(member.parts.includes('detail'));
  assert.ok(!member.parts.includes('heading'));
});

/**
 * A region that forwards a click is a target, and a target answers a pointer.
 * `clickToBrowse` is a prop the stylesheet cannot read, so the binding marks
 * the region while the forward is live — and only then, because a hover on a
 * region that does nothing when pressed is a promise the family breaks.
 */
test('marks the region while a click inside it opens the picker', () => {
  assert.match(contract.dataAttributes['data-browsable'], /dropzone/);
  assert.match(contract.dataAttributes['data-browsable'], /clickToBrowse/);
  assert.ok(contract.parts.dropzone.purpose.includes('click forward'));
});

/**
 * Every visible and spoken sentence about the queue is a catalog message, as
 * the control words are. The counts were once English written into both
 * bindings, and Angular never said the queue had finished at all.
 */
test('says every count through the catalog', () => {
  assert.deepEqual(contract.queueMessage.kinds, [
    'summary',
    'summaryRemaining',
    'selection',
    'added',
    'finished',
  ]);
  assert.equal(contract.queueMessage.owner, 'messages');
  for (const kind of contract.queueMessage.kinds) assert.ok(contract.messages.includes(kind));
  assert.ok(contract.announcement.announces.includes('queue finished'));
  assert.ok(contract.queueMessage.reason.length > 0);
});
