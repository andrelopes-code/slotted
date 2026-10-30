/**
 * A specimen: the computed styles of one page, written as evidence a design
 * decision can cite.
 *
 * The scenario is fixed: one page — a family's harness page (`--family`) or a
 * reference page on the web (`--url`) — at one scheme, width, motion and colour
 * preference. It writes a full-page picture, a JSON record of the computed
 * styles of every part the page renders, and, for the elements `--states`
 * names, the computed delta and a clipped picture of hover, press and
 * keyboard focus. Both sides of a comparison are read with the same property
 * list, so a value in a design document is a number either side can reproduce.
 *
 * Exit status 1 when a reference url does not answer 200, when `--missing-text`
 * appears on the page, when `--ready` never matches after one reload, when a
 * `--click` selector matches nothing, or when `--states` matches no rendered
 * element.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DENSITIES, DIRECTIONS, SCHEMES, WIDTHS, parseScenes } from './build.mjs';
import { READY_EXPRESSION, captureUrl, launch } from './shoot.mjs';

const OUT = fileURLToPath(new URL('out/specimen/', import.meta.url));
const READY_TIMEOUT = 20000;
/* The harness draws one cell per stage width and pads it with this much chrome. */
const HARNESS_CHROME = 80;

const PROPERTIES = [
  'display',
  'width',
  'height',
  'min-height',
  'padding-block-start',
  'padding-inline-end',
  'padding-block-end',
  'padding-inline-start',
  'gap',
  'column-gap',
  'row-gap',
  'border-top-width',
  'border-bottom-width',
  'border-inline-start-width',
  'border-inline-end-width',
  'border-top-style',
  'border-top-color',
  'border-bottom-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'color',
  'background-color',
  'background-image',
  'box-shadow',
  'opacity',
  'transform',
  'rotate',
  'translate',
  'scale',
  'filter',
  'backdrop-filter',
  'outline-style',
  'outline-width',
  'outline-color',
  'outline-offset',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-decoration-line',
  'text-decoration-color',
  'text-decoration-thickness',
  'text-underline-offset',
  'font-variant-numeric',
  'cursor',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'content',
  'inset',
];

const STATES = {
  hover: ['hover'],
  active: ['hover', 'active'],
  focus: ['focus', 'focus-visible'],
};

const PARTS =
  '[data-slot], [data-ui], [data-part], :is([data-slot], [data-ui], [data-part]) > *, svg, a, button, input, select, textarea, [role], [tabindex]';

const USAGE =
  'usage: node tools/harness/specimen.mjs (--family <family> | --url <http url> [--ready <selector>] [--missing-text <text>] [--name <name>]) [--theme light|dark|high-contrast] [--width px] [--density comfortable|compact|dense] [--dir ltr|rtl] [--motion no-preference|reduce] [--forced-colors none|active] [--click <selector>]... [--states <selector>] [--limit n] [--out dir]';

const CHOICES = {
  theme: SCHEMES,
  density: DENSITIES,
  dir: DIRECTIONS,
  motion: ['no-preference', 'reduce'],
  'forced-colors': ['none', 'active'],
};

/** A selector shortened for reading and hashed for uniqueness. */
function slug(text) {
  const readable = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
    .replace(/-+$/, '');
  return `${readable}-${createHash('sha1').update(text).digest('hex').slice(0, 6)}`;
}

export function parseSpecimenArguments(argv) {
  const options = {
    family: undefined,
    url: undefined,
    ready: undefined,
    missingText: undefined,
    name: undefined,
    theme: 'light',
    width: undefined,
    density: 'comfortable',
    dir: 'ltr',
    motion: 'no-preference',
    'forced-colors': 'none',
    click: [],
    states: undefined,
    limit: '6',
    out: undefined,
  };

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    const key = { '--missing-text': 'missingText' }[flag] ?? flag?.replace(/^--/, '');
    if (!flag?.startsWith('--') || !(key in options))
      throw new Error(`${flag}: unknown flag\n${USAGE}`);
    if (value === undefined) throw new Error(`${flag} needs a value`);
    if (CHOICES[key] && !CHOICES[key].includes(value)) {
      throw new Error(`--${key} must be one of ${CHOICES[key].join(', ')}, received ${value}`);
    }
    if (key === 'click') options.click.push(value);
    else options[key] = value;
  }

  if (!options.family && !options.url) throw new Error(USAGE);
  if (options.family && options.url) throw new Error('read either --family or --url, not both');
  if (options.url && !/^https?:\/\//.test(options.url)) {
    throw new Error(`--url must be an http or https page, received ${options.url}`);
  }
  if (!/^[1-9]\d*$/.test(options.limit)) throw new Error(`--limit must be a positive whole number`);

  if (options.family) {
    options.width ??= '420';
    const widths = stageWidths(options.family);
    if (!widths.includes(Number(options.width))) {
      throw new Error(`--family needs --width in ${widths.join(', ')}, received ${options.width}`);
    }
  } else {
    options.width ??= '1280';
    if (!/^[1-9]\d*$/.test(options.width)) throw new Error(`--width must be whole pixels`);
    const { hostname, pathname } = new URL(options.url);
    options.name ??= `${hostname}${pathname}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return options;
}

/**
 * The widths the harness page draws a stage at: the three every page ships and
 * those a scene of the family declares with `data-widths` (`build.mjs`). The
 * grid scenes of `event-calendar` exist only at 1024, so a list closed to the
 * three left them without a specimen.
 */
function stageWidths(family) {
  const fragment = fileURLToPath(
    new URL(`../../packages/styles/src/${family}/${family}.harness.html`, import.meta.url),
  );
  const declared = existsSync(fragment)
    ? parseScenes(readFileSync(fragment, 'utf8')).flatMap((scene) => scene.widths ?? [])
    : [];
  return [...new Set([...WIDTHS, ...declared])].sort((a, b) => a - b);
}

/** Every axis away from its default enters the name, so two runs never overwrite each other. */
export function specimenStem(options) {
  return [
    options.family ? 'slotted' : options.name,
    options.theme,
    options.width,
    options.density !== 'comfortable' ? options.density : undefined,
    options.dir !== 'ltr' ? options.dir : undefined,
    options.motion !== 'no-preference' ? `motion-${options.motion}` : undefined,
    options['forced-colors'] !== 'none' ? 'forced' : undefined,
    options.click.length > 0 ? `click-${slug(options.click.join(' '))}` : undefined,
    options.states ? slug(options.states) : undefined,
  ]
    .filter(Boolean)
    .join('-');
}

/* Reads the listed properties of every rendered element a selector matches, inside the page. */
const readStyles = (selector) => `(() => {
  const properties = ${JSON.stringify(PROPERTIES)};
  const read = (styles) => Object.fromEntries(properties.map((name) => [name, styles.getPropertyValue(name)]));
  /* Opaque means no alpha channel in the serialisation: rgb(...), or a colour function without ' / α'. */
  const opaque = (colour) => colour && colour !== 'transparent' && !colour.startsWith('rgba(') && !colour.includes(' / ');
  return [...document.querySelectorAll(${JSON.stringify(selector)})].map((element) => {
    const rect = element.getBoundingClientRect();
    let ground = '';
    for (let node = element.parentElement; node && !ground; node = node.parentElement) {
      const colour = getComputedStyle(node).backgroundColor;
      if (opaque(colour)) ground = colour;
    }
    return {
      tag: element.tagName.toLowerCase(),
      slot: element.getAttribute('data-slot'),
      role: element.getAttribute('role'),
      attributes: Object.fromEntries([...element.attributes].filter((a) => a.name.startsWith('aria-') || a.name.startsWith('data-')).map((a) => [a.name, a.value])),
      text: (element.textContent ?? '').trim().replace(/\\s+/g, ' ').slice(0, 60),
      class: typeof element.className === 'string' ? element.className : element.getAttribute('class'),
      /* tabindex="-1" counts: a part focused from script still paints its focus state. */
      focusable: element.matches('a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"]') && !element.matches(':disabled'),
      /* The first opaque background behind the element: what a focus ring or a hover step is read against.
         Without one, the canvas: the page's --background, else the browser's Canvas. */
      ground: ground || getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || 'Canvas',
      rect: { x: Math.round(rect.x * 100) / 100, y: Math.round(rect.y * 100) / 100, width: Math.round(rect.width * 100) / 100, height: Math.round(rect.height * 100) / 100 },
      style: read(getComputedStyle(element)),
      /* A pseudo-element that paints carries a hit area, a halo or an indicator. */
      pseudo: Object.fromEntries(['::before', '::after'].flatMap((pseudo) => {
        const styles = getComputedStyle(element, pseudo);
        return ['none', 'normal'].includes(styles.content) ? [] : [[pseudo, read(styles)]];
      })),
    };
  }).filter((entry) => entry.rect.width > 0 && entry.rect.height > 0);
})()`;

export async function specimen(options) {
  const outDir = options.out ?? join(OUT, options.family ?? options.name);
  const stem = specimenStem(options);
  const width = Number(options.width) + (options.family ? HARNESS_CHROME : 0);
  const url = options.family
    ? captureUrl({
        family: options.family,
        scheme: options.theme,
        width: options.width,
        density: options.density,
        dir: options.dir,
      }).href
    : options.url;

  if (options.url) {
    const response = await fetch(url, { redirect: 'follow' });
    if (response.status !== 200) throw new Error(`${url} answered ${response.status}`);
  }
  await mkdir(outDir, { recursive: true });

  /*
   * Stylesheets built with Tailwind v4 wrap every hover rule in
   * @media (hover: hover), headless Chrome reports hover: none, and
   * Emulation.setEmulatedMedia does not override it. The launcher takes its
   * binary from CHROME_BIN, so a wrapper adds the Blink settings of a mouse.
   */
  const wrapper = join(await mkdtemp(join(tmpdir(), 'slotted-specimen-')), 'chrome.sh');
  await writeFile(
    wrapper,
    `#!/bin/sh\nexec ${process.env['CHROME_BIN'] ?? 'google-chrome'} --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 "$@"\n`,
  );
  await chmod(wrapper, 0o755);
  const previousBinary = process.env['CHROME_BIN'];
  process.env['CHROME_BIN'] = wrapper;
  const { devtools, close } = await launch();
  if (previousBinary === undefined) delete process.env['CHROME_BIN'];
  else process.env['CHROME_BIN'] = previousBinary;

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await devtools.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? expression);
    return result.value;
  };
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const screenshot = async (file, clip) => {
    const { data } = await devtools.send('Page.captureScreenshot', {
      format: 'png',
      ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
    });
    await writeFile(join(outDir, file), Buffer.from(data, 'base64'));
    return join(outDir, file);
  };

  /*
   * A page counts as painted when its node count, svg count and complete
   * images hold for two consecutive 250ms windows, within 5 seconds: icon
   * components swap placeholders for glyphs after the first commit.
   */
  const settle = async () => {
    let previous = '';
    let stable = 0;
    for (let tick = 0; tick < 20 && stable < 2; tick += 1) {
      await wait(250);
      const now = await evaluate(
        `[document.querySelectorAll('*').length, document.querySelectorAll('svg').length, [...document.images].filter((i) => i.complete).length].join()`,
      );
      stable = now === previous ? stable + 1 : 0;
      previous = now;
    }
  };

  try {
    await devtools.send('Page.enable');
    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await devtools.send('Emulation.setEmulatedMedia', {
      media: '',
      features: [
        { name: 'prefers-reduced-motion', value: options.motion },
        { name: 'prefers-color-scheme', value: options.theme === 'dark' ? 'dark' : 'light' },
        { name: 'forced-colors', value: options['forced-colors'] },
      ],
    });

    /* A cold page can miss the first window; one reload is the whole retry policy. */
    let ready = 'timeout';
    for (let attempt = 0; attempt < 2 && ready === 'timeout'; attempt += 1) {
      const loaded = devtools.once('Page.loadEventFired');
      await devtools.send('Page.navigate', { url });
      await loaded;
      if (options.family) {
        ready = (await evaluate(READY_EXPRESSION)) ? 'ready' : 'timeout';
        continue;
      }
      ready = await evaluate(`new Promise((done) => {
        const started = performance.now();
        const ready = ${JSON.stringify(options.ready ?? '')};
        const missing = ${JSON.stringify(options.missingText ?? '')};
        const poll = () => missing && (document.body?.innerText ?? '').includes(missing) ? done('missing')
          : !ready || document.querySelector(ready) ? done('ready')
          : performance.now() - started > ${READY_TIMEOUT} ? done('timeout') : setTimeout(poll, 100);
        poll();
      })`);
    }
    if (ready === 'missing') throw new Error(`${url} shows "${options.missingText}"`);
    if (ready === 'timeout') {
      throw new Error(`${url} never matched ${options.ready} within ${READY_TIMEOUT}ms, twice`);
    }
    await evaluate('document.fonts.ready.then(() => true)');
    await settle();

    /* A state behind an interaction — an open menu, a second step — is reached by real clicks, in order. */
    for (const target of options.click) {
      const point = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(target)});
        if (!element) return null;
        element.scrollIntoView({ block: 'center' });
        const r = element.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      })()`);
      if (!point) throw new Error(`--click ${target}: no element matches`);
      await devtools.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
      for (const type of ['mousePressed', 'mouseReleased']) {
        await devtools.send('Input.dispatchMouseEvent', {
          type,
          ...point,
          button: 'left',
          clickCount: 1,
        });
      }
      await settle();
    }

    const height = await evaluate('Math.ceil(document.documentElement.scrollHeight)');
    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: false,
    });
    const picture = await screenshot(`${stem}.png`);

    const record = {
      url,
      family: options.family,
      name: options.name,
      theme: options.theme,
      width,
      density: options.density,
      dir: options.dir,
      motion: options.motion,
      forcedColors: options['forced-colors'],
      click: options.click,
      picture,
      tokens: await evaluate(`(() => {
        const computed = getComputedStyle(document.documentElement);
        return Object.fromEntries([...computed].filter((name) => name.startsWith('--')).map((name) => [name, computed.getPropertyValue(name).trim()]));
      })()`),
      keyframes: await evaluate(
        `[...document.styleSheets].flatMap((sheet) => { try { return [...sheet.cssRules]; } catch { return []; } }).filter((rule) => rule instanceof CSSKeyframesRule).map((rule) => rule.cssText)`,
      ),
      parts: await evaluate(readStyles(PARTS)),
      states: [],
    };

    if (options.states) {
      const selector = options.states;
      const rest = (await evaluate(readStyles(selector))).slice(0, Number(options.limit));
      if (rest.length === 0) throw new Error(`--states ${selector}: no rendered element matches`);

      /* Final values are read with transitions stopped; the rest entry keeps the declared transitions. */
      await evaluate(`(() => {
        const style = document.createElement('style');
        style.textContent = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important}';
        document.head.append(style);
        [...document.querySelectorAll(${JSON.stringify(selector)})]
          .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
          .forEach((e, i) => e.setAttribute('data-specimen', String(i)));
        return true;
      })()`);
      await devtools.send('DOM.enable');
      await devtools.send('CSS.enable');

      /* A client-rendered page may replace nodes between calls, so each node id is resolved when used. */
      const nodeAt = async (index) => {
        const { root } = await devtools.send('DOM.getDocument', { depth: 0 });
        const { nodeId } = await devtools.send('DOM.querySelector', {
          nodeId: root.nodeId,
          selector: `[data-specimen="${index}"]`,
        });
        if (!nodeId) throw new Error(`--states ${selector}: element ${index} left the page`);
        return nodeId;
      };
      const changed = (before = {}, after = {}, prefix = '') =>
        PROPERTIES.filter(
          (name) => !/^(transition|animation)-/.test(name) && before[name] !== after[name],
        ).map((name) => [`${prefix}${name}`, [before[name], after[name]]]);

      for (const [index, entry] of rest.entries()) {
        const marked = `[data-specimen="${index}"]`;
        const clip = {
          x: Math.max(entry.rect.x - 16, 0),
          y: Math.max(entry.rect.y - 16, 0),
          width: entry.rect.width + 32,
          height: entry.rect.height + 32,
        };
        const state = {
          index,
          rest: entry,
          pictures: { rest: await screenshot(`${stem}-${index}-rest.png`, clip) },
          deltas: {},
        };

        for (const [name, forced] of Object.entries(STATES)) {
          /* Forcing :focus on a span paints a state no reader can reach; it is recorded as absent. */
          if (name === 'focus' && !entry.focusable) {
            state.deltas.focus = null;
            continue;
          }
          if (name === 'focus') {
            for (const type of ['rawKeyDown', 'keyUp']) {
              await devtools.send('Input.dispatchKeyEvent', {
                type,
                key: 'Tab',
                code: 'Tab',
                windowsVirtualKeyCode: 9,
                nativeVirtualKeyCode: 9,
              });
            }
            await evaluate(`(document.querySelector(${JSON.stringify(marked)})?.focus(), true)`);
          }
          await devtools.send('CSS.forcePseudoState', {
            nodeId: await nodeAt(index),
            forcedPseudoClasses: forced,
          });
          await wait(50);
          const [now] = await evaluate(readStyles(marked));
          state.deltas[name] = Object.fromEntries([
            ...changed(entry.style, now.style),
            ...['::before', '::after'].flatMap((pseudo) =>
              entry.pseudo[pseudo] || now.pseudo[pseudo]
                ? changed(entry.pseudo[pseudo], now.pseudo[pseudo], `${pseudo} `)
                : [],
            ),
          ]);
          state.pictures[name] = await screenshot(`${stem}-${index}-${name}.png`, clip);
          await devtools.send('CSS.forcePseudoState', {
            nodeId: await nodeAt(index),
            forcedPseudoClasses: [],
          });
          if (name === 'focus') await evaluate('(document.activeElement?.blur(), true)');
        }
        record.states.push(state);
      }
    }

    const file = join(outDir, `${stem}.json`);
    await writeFile(file, JSON.stringify(record, null, 2));
    return { picture, file, parts: record.parts.length, states: record.states.length };
  } finally {
    await close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const { picture, file, parts, states } = await specimen(
      parseSpecimenArguments(process.argv.slice(2)),
    );
    console.log(`picture  ${picture}\nspecimen ${file}\nparts ${parts}, states ${states}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
