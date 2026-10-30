import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DENSITIES, DIRECTIONS, SCHEMES, WIDTHS } from './build.mjs';

const AXES = {
  scheme: { values: SCHEMES, fallback: 'light' },
  width: { values: WIDTHS.map(String), fallback: '420' },
  density: { values: DENSITIES, fallback: 'comfortable' },
  dir: { values: DIRECTIONS, fallback: 'ltr' },
};

/** Room for the cell's own padding and caption around the stage. */
const CHROME_MARGIN = 80;

/**
 * The emulation already renders at twice the device scale, so a clip that asks
 * for scale 2 again photographs the page at four times. Chrome fills the region
 * it never rendered by repeating the top of the document, and the reader sees a
 * ghost of the first scene below the last one — in an image the visual loop is
 * required to read as evidence.
 *
 * `cssContentSize` never falls below the viewport, so a short page was clipped
 * to 900 pixels of which most was background. The height comes from the body
 * instead, and falls back to the layout metric when the measurement fails.
 */
export function captureClip({ width, contentHeight }) {
  return {
    x: 0,
    y: 0,
    width: Number(width) + CHROME_MARGIN,
    height: Math.max(Math.ceil(contentHeight), 1),
    scale: 1,
  };
}

/**
 * One capture per combination rather than one of the whole page: a reader —
 * human or model — judges alignment and rhythm from an image that fills its
 * view, not from a thumbnail of forty cells.
 *
 * The capture is driven through the DevTools protocol rather than through
 * `--screenshot`, which photographs the window and nothing below it. A family
 * with seven scenes ran past the window, so the last scenes were absent from
 * the image the visual loop is required to read, and absent silently.
 */
class Devtools {
  #socket;
  #next = 0;
  #pending = new Map();
  #listeners = new Map();
  #closed = false;
  #closing = false;

  constructor(socket) {
    this.#socket = socket;
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(String(data));
      if (message.id !== undefined) {
        this.#pending.get(message.id)?.(message);
        this.#pending.delete(message.id);
        return;
      }
      this.#listeners.get(message.method)?.forEach(({ resolve }) => resolve(message.params));
      this.#listeners.delete(message.method);
    });
    /* A browser that dies closes the socket; a command waiting on it fails instead of hanging. */
    socket.addEventListener('close', () => {
      this.#closed = true;
      this.#pending.forEach((settle) =>
        settle({ error: { message: 'the DevTools connection closed' } }),
      );
      this.#pending.clear();
      if (this.#closing) return;
      this.#listeners.forEach((waiting, method) =>
        waiting.forEach(({ reject }) =>
          reject(new Error(`${method}: the DevTools connection closed`)),
        ),
      );
      this.#listeners.clear();
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', () => reject(new Error(`cannot reach ${url}`)), {
        once: true,
      });
    });
    return new Devtools(socket);
  }

  send(method, params = {}) {
    if (this.#closed) return Promise.reject(new Error(`${method}: the DevTools connection closed`));
    const id = (this.#next += 1);
    return new Promise((resolve, reject) => {
      this.#pending.set(id, (message) =>
        message.error
          ? reject(new Error(`${method}: ${message.error.message}`))
          : resolve(message.result),
      );
      this.#socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method) {
    return new Promise((resolve, reject) => {
      this.#listeners.set(method, [...(this.#listeners.get(method) ?? []), { resolve, reject }]);
    });
  }

  close() {
    this.#closing = true;
    this.#socket.close();
  }
}

/**
 * `--hide-scrollbars` keeps a page-level bar out of a full-page capture, and
 * every capture this harness has taken was taken with it. It also makes one
 * family unphotographable: `scroll-area` decided that the scrollbar is the
 * platform's, themed through `scrollbar-color` and `scrollbar-width`, and the
 * one tool that judges a picture was configured to hide the thing the family is
 * about.
 *
 * So the flag becomes an axis rather than a constant. It stays on by default,
 * so every existing capture is unchanged, and `--scrollbars show` turns it off
 * for the family that needs to see one.
 */
export async function launch({ scrollbars = 'hide' } = {}) {
  const profile = await mkdtemp(join(tmpdir(), 'slotted-harness-'));
  const chrome = spawn(process.env['CHROME_BIN'] ?? 'google-chrome', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    ...(scrollbars === 'show' ? [] : ['--hide-scrollbars']),
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ]);

  const port = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(
      () => reject(new Error(`Chrome never opened a port:\n${output}`)),
      20000,
    );
    chrome.stderr.on('data', (chunk) => {
      output += chunk;
      const match = /ws:\/\/127\.0\.0\.1:(\d+)\//.exec(output);
      if (!match) return;
      clearTimeout(timer);
      resolve(Number(match[1]));
    });
    chrome.on('exit', (code) => reject(new Error(`Chrome exited with ${code}:\n${output}`)));
    chrome.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Chrome cannot start: ${error.message}`));
    });
  });

  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((target) => target.type === 'page');
  if (!page) throw new Error('Chrome opened no page target');

  return {
    devtools: await Devtools.connect(page.webSocketDebuggerUrl),
    async close() {
      if (chrome.exitCode === null && chrome.signalCode === null) {
        chrome.kill();
        await once(chrome, 'exit');
      }
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    },
  };
}

export function captureUrl({ family, scheme, width, density, dir, scene }) {
  const page = fileURLToPath(new URL(`out/${family}.html`, import.meta.url));
  if (!existsSync(page)) {
    throw new Error(`${page} does not exist — run: node tools/harness/build.mjs ${family}`);
  }

  const url = pathToFileURL(page);
  url.searchParams.set('scheme', scheme);
  url.searchParams.set('width', width);
  url.searchParams.set('density', density);
  url.searchParams.set('dir', dir);
  if (scene) url.searchParams.set('scene', scene);

  return url;
}

/**
 * The promise a page whose picture needs script names on `window`, settled
 * once every stage is drawn. The load event fires when the module has run,
 * not when an engine it started has painted: `chart` draws after its engine's
 * chunks resolve and after a frame, and a capture taken at load showed empty
 * plots. A page that names no promise is photographed at load, as before.
 */
export const READY_EXPRESSION = 'Promise.resolve(window.slottedHarnessReady).then(() => true)';

async function waitUntilDrawn(devtools) {
  const { exceptionDetails } = await devtools.send('Runtime.evaluate', {
    expression: READY_EXPRESSION,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `the page never finished drawing: ${exceptionDetails.exception?.description ?? 'failed'}`,
    );
  }
}

/**
 * A selector is not a file name, so it travels as a slug. Two focus targets in
 * one combination therefore land in two files instead of one overwriting the
 * other, which is the failure a reader cannot see in the image.
 */
export function focusSlug(selector, prefix = 'focus') {
  if (!selector) return undefined;
  const slug = selector
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return `${prefix}-${slug}`;
}

export function captureName({
  family,
  scheme,
  width,
  density,
  dir,
  scene,
  focus,
  hover,
  active,
  zoom,
  at,
  motion,
  scrollbars,
}) {
  /* Every forced state named, not the first one: a capture of a hovered card
     with focus inside it is neither of the two, and overwriting one with the
     other is the failure a reader cannot see in the image. */
  const states = [focusSlug(hover, 'hover'), focusSlug(active, 'active'), focusSlug(focus)].filter(
    Boolean,
  );
  /* A zoom of 100% is the axis's own default, so it stays out of the name and
     every capture taken before the axis existed keeps the name it had. */
  const magnified = zoom === undefined || zoom === '100' ? undefined : `zoom${zoom}`;
  /* Left out when no moment was asked for, so every capture taken before the
     axis existed keeps the name it had. */
  const moment = at === undefined ? undefined : `at${at}ms`;
  const preference = motion === undefined ? undefined : `motion-${motion}`;
  /* Left out when the bars are hidden, which is the axis's own default, so
     every capture taken before the axis existed keeps the name it had. */
  const bars = scrollbars === 'show' ? 'scrollbars' : undefined;
  const parts = [
    family,
    scene,
    ...states,
    scheme,
    density,
    dir,
    width,
    magnified,
    preference,
    moment,
    bars,
  ];
  return `${parts.filter(Boolean).join('-')}.png`;
}

/**
 * A focus ring, and a rule that reveals content only while focus is inside it,
 * exist in no capture the shooter could take before this: the page is loaded
 * and photographed with focus on the document. The Tab press is dispatched
 * first so Chrome counts the last interaction as a keyboard one and
 * `:focus-visible` matches; the script call then puts focus on the element the
 * reader asked for rather than on whatever Tab happened to reach.
 *
 * The selector is resolved inside the shown cell first, because the page holds
 * one cell per scheme and width and only one of them is the capture.
 */
async function focusElement(devtools, selector) {
  for (const type of ['rawKeyDown', 'keyUp']) {
    await devtools.send('Input.dispatchKeyEvent', {
      type,
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
  }

  const expression = `(() => {
    const selector = ${JSON.stringify(selector)};
    const element =
      document.querySelector('.cell.shown ' + selector) ?? document.querySelector(selector);
    if (!element) throw new Error('no element matches ' + selector);
    element.focus();
    return element.tagName;
  })()`;

  const { exceptionDetails } = await devtools.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`--focus ${selector}: ${exceptionDetails.exception?.description ?? 'failed'}`);
  }
}

/**
 * Hover and press are forced through the protocol rather than simulated with a
 * pointer. A moved pointer also scrolls the page, hovers whatever it passes
 * over on the way, and cannot hold `:active` for the length of a capture
 * without a button held down; forcing the pseudo-class states exactly the one
 * thing the reader asked to look at.
 *
 * The selector is resolved inside the shown cell first, for the same reason
 * `--focus` is: the page holds one cell per scheme and width, and only one of
 * them is the capture.
 */
async function forcePseudoState(devtools, selector, pseudoClasses) {
  await devtools.send('DOM.enable');
  await devtools.send('CSS.enable');
  const { root } = await devtools.send('DOM.getDocument', { depth: -1 });

  let nodeId = 0;
  for (const candidate of [`.cell.shown ${selector}`, selector]) {
    ({ nodeId } = await devtools.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: candidate,
    }));
    if (nodeId) break;
  }
  if (!nodeId) {
    throw new Error(`--${pseudoClasses[0]} ${selector}: no element matches ${selector}`);
  }

  await devtools.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: pseudoClasses });
}

async function contentHeight(devtools, cssContentSize) {
  const { result } = await devtools.send('Runtime.evaluate', {
    expression: 'document.body.getBoundingClientRect().height',
    returnByValue: true,
  });
  return typeof result?.value === 'number' && result.value > 0
    ? result.value
    : cssContentSize.height;
}

export async function shoot(options) {
  const { width, outDir, scrollbars } = options;
  const out = join(outDir, captureName(options));
  const { devtools, close } = await launch({ scrollbars });

  try {
    await devtools.send('Page.enable');
    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width: Number(width) + CHROME_MARGIN,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    /**
     * The reader's motion preference, stated rather than inherited.
     *
     * Headless Chrome answers `prefers-reduced-motion: reduce` by default, so
     * every capture this harness has ever taken was taken by a reader who had
     * asked for stillness. A family whose motion is guarded by that query —
     * which the token foundation requires of every infinite animation — was
     * therefore photographed with the motion switched off, and
     * `status-indicator`'s pulse was missing from five captures before anyone
     * asked why. The axis makes both answers reachable and neither of them a
     * default of the browser's.
     */
    const loaded = devtools.once('Page.loadEventFired');
    await devtools.send('Page.navigate', { url: captureUrl(options).href });
    await loaded;
    await waitUntilDrawn(devtools);

    if (options.motion !== undefined) {
      await devtools.send('Emulation.setEmulatedMedia', {
        media: '',
        features: [{ name: 'prefers-reduced-motion', value: options.motion }],
      });
    }

    /**
     * The reader's own zoom, applied the way the browser applies it. A control
     * whose edges are drawn by two coincident borders looks correct at 100% and
     * comes apart at 110%: the browser snaps each border box to device pixels on
     * its own, so one boundary lands on a single column and the next lands
     * across two. That defect reached a human review because no capture could
     * show it — the axis exists so the visual loop can.
     */
    if (options.zoom !== '100') {
      await devtools.send('Runtime.evaluate', {
        expression: `document.documentElement.style.zoom = ${Number(options.zoom) / 100}`,
      });
    }

    if (options.hover) await forcePseudoState(devtools, options.hover, ['hover']);
    /* Press is hover plus the button: a card that paints `:active` without ever
       having been hovered is a state no pointer can reach. */
    if (options.active) await forcePseudoState(devtools, options.active, ['hover', 'active']);
    if (options.focus) await focusElement(devtools, options.focus);

    /**
     * The moment in an animation the picture is taken at.
     *
     * A page is photographed the instant it loads, so every animation on it is
     * at the start of its first cycle — and the start of a cycle is exactly
     * where a pulse, a sweep or an expanding ring looks like nothing at all.
     * `status-indicator`'s pulse was invisible in three captures for that
     * reason and not because it was missing, which is a defect no reader of
     * the image could have told apart from an unimplemented state.
     *
     * Every animation on the page is moved to the same point and paused, so
     * the capture is deterministic: the same millisecond produces the same
     * picture every time, which is what makes two captures of one animation
     * comparable. It runs after the forced states, because a rule that only
     * animates on hover has no animation to move until the hover is forced.
     *
     * An animation that is *already* paused is left where it is, and that is
     * the whole distinction this flag has to make. A paused keyframe scrubbed
     * by a negative delay is not motion: it is a value expressed as an
     * animation, which is how a stylesheet interpolates something CSS has no
     * other way to interpolate — `progress-indicator` ramps a wavy ring's
     * amplitude by morphing `d` that way. Seeking it moves the value rather
     * than the clock, and the capture then shows every ring at full amplitude,
     * including the ones the page had drawn as circles.
     */
    if (options.at !== undefined) {
      await devtools.send('Runtime.evaluate', {
        expression: `for (const animation of document.getAnimations()) {
          if (animation.playState === 'paused') continue;
          animation.currentTime = ${Number(options.at)};
          animation.pause();
        }`,
      });
    }

    const { cssContentSize } = await devtools.send('Page.getLayoutMetrics');
    const { data } = await devtools.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: captureClip({ width, contentHeight: await contentHeight(devtools, cssContentSize) }),
    });

    await writeFile(out, Buffer.from(data, 'base64'));
    devtools.close();
  } finally {
    await close();
  }

  return out;
}

/**
 * `<family> --scheme dark --density dense`. Every axis is named, because four
 * positional arguments in a row are read wrong exactly once and the mistake is
 * invisible in the resulting image.
 */
export function parseArguments(argv) {
  const [family, ...rest] = argv;
  if (!family || family.startsWith('--')) {
    throw new Error(
      'usage: node tools/harness/shoot.mjs <family> [--scheme s] [--width w] [--density d] [--dir ltr|rtl] [--scene name] [--focus selector] [--hover selector] [--active selector] [--zoom percent] [--motion reduce|no-preference] [--scrollbars hide|show] [--at milliseconds] [--out dir]',
    );
  }

  const options = {
    family,
    outDir: process.env['TMPDIR'] ?? '/tmp',
    active: undefined,
    at: undefined,
    focus: undefined,
    hover: undefined,
    motion: undefined,
    scene: undefined,
    scrollbars: 'hide',
    zoom: '100',
  };
  for (const [axis, { fallback }] of Object.entries(AXES)) options[axis] = fallback;

  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index]?.replace(/^--/, '');
    const value = rest[index + 1];
    if (value === undefined) throw new Error(`${rest[index]} needs a value`);

    if (flag === 'out') {
      options.outDir = value;
      continue;
    }
    if (flag === 'scene') {
      options.scene = value;
      continue;
    }
    if (flag === 'focus' || flag === 'hover' || flag === 'active') {
      options[flag] = value;
      continue;
    }
    if (flag === 'motion') {
      if (value !== 'reduce' && value !== 'no-preference') {
        throw new Error(`motion must be one of reduce, no-preference, received ${value}`);
      }
      options.motion = value;
      continue;
    }
    if (flag === 'at') {
      if (!/^\d{1,6}$/.test(value)) {
        throw new Error(`at is a whole number of milliseconds, received ${value}`);
      }
      options.at = value;
      continue;
    }
    if (flag === 'scrollbars') {
      if (value !== 'hide' && value !== 'show') {
        throw new Error(`scrollbars must be one of hide, show, received ${value}`);
      }
      options.scrollbars = value;
      continue;
    }
    if (flag === 'zoom') {
      if (!/^[1-9][0-9]{1,2}$/.test(value)) {
        throw new Error(`zoom is a percentage between 10 and 999, received ${value}`);
      }
      options.zoom = value;
      continue;
    }

    const axis = AXES[flag];
    if (axis === undefined) throw new Error(`unknown option ${rest[index]}`);
    /**
     * A scene may declare widths of its own — see `data-widths` in
     * `build.mjs` — so the width axis is open at the top rather than closed to
     * the three the page ships. What it is not is free-form: a value that is
     * not a positive whole number of pixels can only produce a blank capture,
     * and a blank capture is the failure this check exists to make loud.
     */
    if (flag === 'width') {
      if (!/^[1-9]\d*$/.test(value)) {
        throw new Error(`width must be a whole number of pixels, received ${value}`);
      }
      options[flag] = value;
      continue;
    }
    if (!axis.values.includes(value)) {
      throw new Error(`${flag} must be one of ${axis.values.join(', ')}, received ${value}`);
    }
    options[flag] = value;
  }

  return options;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(await shoot(parseArguments(process.argv.slice(2))));
}
