import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS, stateModels } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.appShell;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'app-shell');
  assert.equal(contract.ui, 'app-shell');
  assert.equal(contract.schemaVersion, 5);
});

test('cites both practices rather than claiming to have checked them', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/');
  assert.equal(contract.control, 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/');
});

/**
 * Five regions, five landmarks, and no ARIA written: every one of them is an
 * HTML sectioning element in the context of the body. The root being a `div`
 * is what keeps that true — a `main` inside an `article` is not a landmark.
 */
test('earns its five landmarks from the elements rather than from ARIA', () => {
  assert.deepEqual(contract.landmarks, {
    banner: 'header',
    navigation: 'nav',
    main: 'main',
    complementary: 'aside',
    contentinfo: 'footer',
    reason: contract.landmarks.reason,
  });
  assert.equal(member.nativeElement, 'div');
  assert.match(contract.landmarks.reason, /context of the body/);
  for (const part of ['banner', 'nav', 'main', 'aside', 'footer']) {
    assert.ok(member.parts.includes(part), `${part} is not a part`);
  }
});

/** Without the tabindex the skip link moves the scroll and leaves focus behind. */
test('makes the skip link land somewhere focusable', () => {
  assert.match(contract.anatomy.main, /tabindex=-1/);
  assert.deepEqual(contract.skip.targets, ['main', 'nav', 'aside']);
  assert.match(contract.skip.reason, /region that exists and is open/);
  assert.match(contract.anatomy.skip, /Not a landmark/);
});

/** The rail is the same element at another width, which is what keeps focus. */
test('keeps one element across the three navigation modes', () => {
  assert.deepEqual(contract.axes.navMode, ['inline', 'overlay', 'auto']);
  assert.equal(contract.navMode.default, 'auto');
  assert.equal(member.defaults.navMode, 'auto');
  assert.match(contract.anatomy.nav, /One element across all three modes/);
  for (const mode of ['inline', 'overlay', 'auto']) {
    assert.ok(contract.navMode[mode].length > 0, `${mode} says nothing`);
  }
});

/**
 * The number the stylesheet needs literal and the script needs to know which
 * mode it is in. `app-shell.styles.test.mjs` compares the two.
 */
test('states the width the modes change at, once', () => {
  assert.equal(contract.overlayAt, 600);
  assert.match(contract.overlayAtReason, /inline size of the shell/);
  assert.match(contract.overlayAtReason, /@container \(min-width: var\(--x\)\) is invalid/);
});

/** A server render and the frame before hydration draw the narrow shell closed. */
test('says what the first paint shows before the script has decided', () => {
  assert.match(contract.navMode.firstPaint, /\[data-nav-mode=overlay\]\[data-open\]/);
  assert.match(contract.navMode.firstPaint, /server render/);
});

/** A boolean that only says the navigation exists loses the rail. */
test('names what a closed inline navigation leaves behind', () => {
  assert.deepEqual(contract.axes.collapsedTo, ['rail', 'hidden']);
  assert.equal(member.defaults.collapsedTo, 'rail');
  assert.match(contract.collapsedTo.rail, /tab order/);
  assert.match(
    contract.collapsedTo.hidden,
    /leaves the layout, the tab order and the accessibility tree/,
  );
});

/**
 * The first arrangement was flush and read as a wireframe: in the light scheme
 * the two page surfaces are two per cent apart, so every boundary was a
 * one-pixel rule and nothing had a plane.
 */
test('gives the content a plane instead of a hairline, and keeps the other answers', () => {
  assert.deepEqual(contract.axes.canvas, ['inset', 'flush', 'floating', 'panel']);
  assert.equal(contract.canvas.default, 'inset');
  assert.equal(member.defaults.canvas, 'inset');
  assert.match(contract.canvas.reason, /two per cent/);
  assert.match(contract.canvas.inset, /no rule is drawn between two regions/);
  assert.match(contract.canvas.floating, /the navigation is a card/);
  assert.match(contract.canvas.panel, /one card/);
  assert.match(contract.canvas.regionPlanes, /no combination without a design of its own/);
});

/**
 * A card over two regions is one box. Two boxes with half a card each draw the
 * shadow of one over the other at the seam.
 */
test('paints a card that spans two regions as one box', () => {
  assert.match(contract.canvas.spanningCard, /::before/);
  assert.match(contract.canvas.frameImage, /--slotted-app-shell-frame-image/);
});

/**
 * Without a rule the two page surfaces were two per cent apart and the
 * arrangement read as nothing. The tone is measured, and the controls inside a
 * toned region are recalibrated to it.
 */
test('separates regions that touch by a rule or by a measured tone', () => {
  assert.deepEqual(contract.axes.separation, ['rule', 'tone']);
  assert.equal(member.defaults.separation, 'rule');
  assert.equal('dividers' in contract.axes, false);
  assert.match(contract.separation.tone, /0\.036/);
  assert.match(contract.separation.tone, /subtle-hover/);
  assert.match(contract.separation.forcedColors, /forced-colors/);
  assert.match(contract.separation.seams, /without a gutter/);
});

/** Two columns, one landmark and one open state: the ReUI shape is two of each. */
test('holds a rail of its own inside the one navigation region', () => {
  const parts = member.parts;
  assert.equal(parts.indexOf('nav-rail'), parts.indexOf('nav') + 1);
  assert.equal(parts.indexOf('nav-header'), parts.indexOf('nav-rail') + 1);
  assert.match(contract.anatomy['nav-rail'], /one navigation landmark/);
  assert.match(contract.collapsedTo.rail, /nav-rail/);
  assert.match(contract.navRail.closed, /visibility: hidden/);
  assert.match(contract.navRail.detection, /:has/);
});

/** A top bar is two clusters and the space between them, and the shell owns only that. */
test('says where a banner puts things without owning what they are', () => {
  assert.ok(member.parts.includes('brand'));
  assert.ok(member.parts.includes('actions'));
  assert.match(contract.anatomy.brand, /owns none of what they are/);
  assert.equal(contract.declined.bannerContent.deferTo, 'top-navigation');
});

/** A character is never an icon, and neither is the wrong drawing. */
test('draws the control from the pair that depicts the region it toggles', () => {
  assert.equal(contract.mark.open, 'panel-open');
  assert.equal(contract.mark.close, 'panel-close');
  assert.match(contract.mark.reason, /one artwork with the chevron turned/);
  assert.match(contract.mark.mirrored, /navSide=end/);
});

/** The grid moves where a region is drawn, never where it is written. */
test('keeps one focus order under every primary region', () => {
  assert.deepEqual(contract.axes.primary, ['banner', 'nav', 'main']);
  assert.match(contract.primary.main, /plane of the content/);
  assert.equal(member.defaults.primary, 'banner');
  assert.deepEqual(contract.focusOrder, [
    'skip',
    'banner',
    'nav-toggle',
    'nav',
    'main',
    'aside',
    'aside-toggle',
    'footer',
  ]);
  assert.match(contract.focusOrderReason, /grid-template-areas/);
  assert.match(contract.primary.reason, /never where it is written/);
});

/** Two answers to who scrolls, and the one the other costs. */
test('says who scrolls, and what the second answer costs the banner', () => {
  assert.deepEqual(contract.axes.scroll, ['content', 'document']);
  assert.equal(member.defaults.scroll, 'content');
  assert.match(contract.scroll.cost, /--slotted-page-sticky-top/);
  assert.match(contract.scroll.content, /below the banner/);
});

/** Overlay behaviour is composed from packages/core, never rewritten. */
test('composes the overlay rather than rewriting it', () => {
  for (const module of ['presence', 'dismissable-layer', 'focus', 'portal']) {
    assert.ok(contract.composes.includes(module), `${module} is not composed`);
  }
  assert.match(contract.overlay.dismiss, /capture phase/);
  assert.match(contract.overlay.focus, /returns it to the nav-toggle/);
  assert.match(contract.overlay.inert, /the banner and its toggle included/);
  assert.match(contract.overlay.extent, /stops under the banner/);
});

/**
 * Two regions open, one capability, and a reason on every change. The set form
 * is the schema's answer to a capability held twice; each member carries its
 * own pair and its own reasons.
 */
test('holds two open regions under one capability and says why each change happened', () => {
  assert.deepEqual(Object.keys(contract.stateModel), ['open', 'extent']);
  const set = contract.stateModel.open;
  assert.deepEqual(Object.keys(set), ['nav', 'aside']);
  assert.equal(stateModels(set).length, 2);

  assert.equal(set.nav.controlled, 'navOpen');
  assert.equal(set.nav.uncontrolled, 'defaultNavOpen');
  assert.equal(set.nav.request, 'onNavOpenChange');
  assert.ok(set.nav.reasons.includes('resize'), 'a width that closes the region has no reason');
  assert.ok(set.nav.reasons.includes('select'), 'closeOnNavigate has no reason to emit');

  assert.equal(set.aside.controlled, 'asideOpen');
  assert.equal(set.aside.uncontrolled, 'defaultAsideOpen');
  assert.equal(set.aside.request, 'onAsideOpenChange');
  assert.ok(set.aside.reasons.includes('resize'));
  assert.equal(set.aside.reasons.includes('select'), false, 'a pane has no destinations');

  for (const model of stateModels(set)) {
    for (const reason of model.reasons) {
      assert.ok(CHANGE_REASONS.includes(reason), `unknown reason ${reason}`);
    }
  }
  assert.deepEqual(contract.stateAttributes, { open: 'data-open', dragging: 'data-dragging' });
  /* The root's attribute was the navigation's before the pane had a state, and
     every selector written over it still reads the navigation. */
  assert.equal(set.nav.attributeOn, 'root');
  assert.equal(set.aside.attributeOn, 'aside');
  assert.match(contract.stateModelReason, /fixed width by axis/);
});

/**
 * The pane has the pair of modes the navigation has, resolved on the same
 * width, and the two closed states differ: a navigation leaves a rail and a
 * pane leaves nothing.
 */
test('gives the secondary pane the navigation pair of modes and no rail', () => {
  assert.deepEqual(contract.axes.asideMode, ['inline', 'overlay', 'auto']);
  assert.equal(contract.asideMode.default, 'auto');
  assert.equal(member.defaults.asideMode, 'auto');
  assert.match(contract.asideMode.inline, /display: none/);
  assert.match(contract.asideMode.firstPaint, /\[data-aside-mode=overlay\]/);
  assert.match(contract.declined.asideCollapsedTo.reason, /no rail/);
  assert.match(contract.declined.asideSide.reason, /navSide=end puts the pane at the start/);
  assert.equal('asideOpen' in contract.declined, false, 'the pane still defers its state');
  assert.match(contract.overlay.stack, /one stack/);
  assert.match(contract.overlay.aside, /returns focus to the aside-toggle/);
});

/** The pane has the discipline the column has: pinned ends, a middle that scrolls. */
test('gives the secondary pane a header, a body, a footer and a control', () => {
  for (const part of ['aside-header', 'aside-body', 'aside-footer', 'aside-toggle']) {
    assert.ok(member.parts.includes(part), `${part} is not a part`);
    assert.ok(contract.anatomy[part].length > 0, `${part} says nothing`);
  }
  assert.match(contract.anatomy['aside-body'], /only part of it that scrolls/);
  assert.match(contract.anatomy['aside-toggle'], /from the family context/);
  assert.match(contract.mark.aside, /same pair mirrored/);
});

/**
 * The pane's edge is drawer's separator on another box: the Window Splitter
 * pattern, a fraction of the shell, a part whose presence is the capability.
 */
test('lets the reader move the pane edge, on the column alone', () => {
  assert.equal(contract.resizePattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/');
  assert.ok(contract.composes.includes('extent'));
  assert.equal(member.parts.indexOf('aside-resizer'), member.parts.indexOf('aside') + 1);
  assert.match(contract.anatomy['aside-resizer'], /role separator/);
  assert.match(contract.anatomy['aside-resizer'], /resizeAside/);
  assert.ok(member.capabilities.includes('extent'));
  assert.ok(member.states.includes('dragging'));

  const extent = contract.stateModel.extent;
  assert.equal(extent.controlled, 'asideExtent');
  assert.equal(extent.uncontrolled, 'defaultAsideExtent');
  assert.equal(extent.request, 'onAsideExtentChange');
  assert.deepEqual(extent.reasons, ['pointer', 'keyboard', 'programmatic']);
  assert.equal(member.defaults.minAsideExtent, 0.16);
  assert.equal(member.defaults.maxAsideExtent, 0.6);

  assert.match(contract.asideExtent.property, /--slotted-app-shell-aside-extent/);
  assert.match(contract.asideExtent.property, /cqi/);
  assert.match(contract.asideExtent.modes, /overlay/);
  assert.match(contract.asideExtent.capability, /no resizable prop/);
  assert.deepEqual(
    contract.keyboard.map((row) => row.key),
    ['ArrowLeft', 'ArrowRight', 'Home', 'End'],
  );
  for (const row of contract.keyboard) assert.equal(row.source, '@slotted/core/extent');
});

/** The body stands on the pane inset; content that brings its own says so. */
test('stands the pane body on the row inset, with the opt-out drawer has', () => {
  assert.equal(contract.asideBodyInset.attribute, 'data-inset');
  assert.deepEqual(contract.asideBodyInset.values, ['none']);
  assert.match(contract.anatomy['aside-body'], /data-inset=none/);
});

/** A bar is three clusters: what starts the line, what grows, what ends it. */
test('gives the banner a middle that grows', () => {
  assert.ok(member.parts.includes('centre'));
  assert.equal(member.parts.indexOf('centre'), member.parts.indexOf('brand') + 1);
  assert.equal(member.parts.indexOf('actions'), member.parts.indexOf('centre') + 1);
  assert.match(contract.anatomy.centre, /the one cluster that grows/);
});

/**
 * The rows inside the regions are not this family, and a consumer who brings
 * its own list has nothing to align to unless the shell says what a row is.
 */
test('publishes the geometry of a row, so a consumer list stands on it', () => {
  assert.deepEqual(
    Object.keys(contract.published).filter((key) => key.startsWith('--')),
    [
      '--slotted-app-shell-row-inset',
      '--slotted-app-shell-row-mark',
      '--slotted-app-shell-row-gap',
      '--slotted-app-shell-row-height',
      '--slotted-app-shell-row-font-size',
      '--slotted-app-shell-row-line-height',
      '--slotted-app-shell-row-ring-inset',
    ],
  );
  assert.match(
    contract.published['--slotted-app-shell-row-font-size'],
    /type scale and not the control scale/,
  );
  assert.match(contract.published.reason, /No surveyed implementation publishes/);
});

test('publishes no measured custom property', () => {
  assert.equal('runtime' in contract, false);
  assert.equal('bridge' in contract, false);
  assert.match(contract.declined.runtimeProperties.reason, /grid sizes its own tracks/);
});

/**
 * Axis defaults only. The uncontrolled starting value is the state model's own
 * name, and it exists in one binding and not in the other.
 */
test('keeps the uncontrolled name out of the axis defaults', () => {
  for (const model of stateModels(contract.stateModel.open)) {
    assert.equal(model.uncontrolled in member.defaults, false, model.uncontrolled);
  }
  assert.match(member.defaultsReason, /levelling the two bindings down/);
});

test('lets an application set its defaults once', () => {
  assert.deepEqual(contract.provides.appShellDefaults, Object.keys(contract.axes));
  for (const axis of Object.keys(contract.axes)) {
    assert.deepEqual(contract.resolution[axis].slice(0, 2), ['prop', 'defaults']);
    assert.equal(contract.resolution[axis][2], member.defaults[axis]);
  }
});

test('declines with a reason, never silently', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines without a reason`);
  }
  for (const name of ['navItems', 'bannerContent', 'breadcrumbs', 'contentPadding', 'measure']) {
    assert.ok(contract.declined[name].deferTo, `${name} defers to nobody`);
  }
});

test('says every string it speaks on the reader behalf', () => {
  assert.deepEqual(contract.messages, [
    'aside',
    'close',
    'closeAside',
    'nav',
    'open',
    'openAside',
    'progress',
    'resizeAside',
    'skipToAside',
    'skipToMain',
    'skipToNav',
  ]);
  for (const target of contract.skip.targets) {
    const key = `skipTo${target[0].toUpperCase()}${target.slice(1)}`;
    assert.ok(contract.messages.includes(key), `${target} has no skip-link label`);
  }
});

test('lists every scenario the reference pages have to show', () => {
  assert.deepEqual(contract.scenarios.appShell, [
    'playground',
    'anatomy',
    'regions',
    'banner',
    'canvas',
    'separation',
    'theming',
    'navModes',
    'rail',
    'navRail',
    'aside',
    'overlay',
    'primary',
    'sides',
    'scroll',
    'progress',
    'skipLinks',
    'persistence',
    'defaults',
    'composition',
    'accessibility',
  ]);
});

/**
 * The wait for the next page is drawn on the line between the chrome and the
 * content, and where that line is depends on the arrangement: the top border
 * of the content card, or the banner's lower seam. The shell knows which; a
 * consumer placing a bar by hand would have to know it for every canvas.
 */
test('draws the wait for the next page on the edge of the content', () => {
  assert.equal(member.parts.indexOf('progress'), member.parts.indexOf('main') + 1);
  assert.match(contract.anatomy.progress, /the box of main/);
  assert.match(contract.anatomy.progress, /edge-start/);
  assert.match(contract.progress.edge, /--_seam-width/);
  assert.match(contract.progress.busy, /aria-busy/);
  assert.match(contract.progress.timing, /200/);
  assert.match(contract.progress.timing, /400/);
  assert.ok(member.capabilities.includes('loading'));
  assert.ok(contract.composes.includes('progress-indicator'));
  assert.ok(contract.messages.includes('progress'));
});
