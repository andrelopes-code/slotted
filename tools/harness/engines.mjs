import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, readdirSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

import { launch as launchChrome } from './shoot.mjs';

/**
 * One page in one browser engine, for a scenario that reads values and asserts
 * them: `goto(url)` resolves once the page has loaded, `evaluate(expression)`
 * returns the JSON value of an expression (a promise is awaited).
 *
 * - `chrome`: the DevTools protocol of `shoot.mjs`; `CHROME_BIN` names the
 *   binary (default `google-chrome`).
 * - `firefox`: WebDriver BiDi, which Firefox speaks natively, through the
 *   client below. `FIREFOX` names the binary; without it, the newest
 *   `firefox-<revision>` build in the Playwright cache (`PLAYWRIGHT_BROWSERS_PATH`,
 *   default `~/.cache/ms-playwright`).
 * - `webkit`: `playwright-core` 1.63.0, WebKit 26.6. Linux has no WebKit
 *   automation but Playwright's own protocol, which is tied to the build of
 *   the same release.
 * - `webkit-18`: `playwright-core` 1.53.0 under the alias
 *   `playwright-core-webkit18`, WebKit 18.5, the last release with a WebKit
 *   18. Safari 18 is the published minimum.
 *
 * The published minimums (`docs/product/prd.md` §33) and how to obtain each
 * build; every command was run from an empty `PLAYWRIGHT_BROWSERS_PATH`:
 *
 * - Chrome 125: Chrome for Testing 125.0.6422.141, unzipped from
 *   `https://storage.googleapis.com/chrome-for-testing-public/125.0.6422.141/linux64/chrome-linux64.zip`;
 *   then `CHROME_BIN=<dir>/chrome-linux64/chrome`.
 * - Firefox 146: Playwright's `firefox-1509` (146.0.1), from
 *   `npx playwright-core@1.58.0 install firefox`; then
 *   `FIREFOX=<cache>/firefox-1509/firefox/firefox`. Without `FIREFOX` the
 *   newest cached build runs, and `pnpm --filter @slotted/harness exec
 *   playwright-core install firefox` installs Firefox 155.
 * - Safari 18: WebKit 18.5 (`webkit-2182`), from
 *   `node tools/harness/node_modules/playwright-core-webkit18/cli.js install webkit`;
 *   then `--engine webkit-18`. WebKit 26.6 comes from
 *   `pnpm --filter @slotted/harness exec playwright-core install webkit`.
 *
 * WebKit's system libraries come from `install-deps webkit` (root). Without
 * root, on Ubuntu 24.04, `apt-get download` and `dpkg -x` extract libavif16,
 * libenchant-2-2, libflite1, libgstreamer-plugins-bad1.0-0,
 * libgstreamer-gl1.0-0, libmanette-0.2-0, libwayland-server0, libwebpdemux2,
 * libwebpmux3, libdav1d7, libgav1-1, librav1e0, libsvtav1enc1d1, libyuv0,
 * libvpx9 and libwoff1; their `usr/lib/x86_64-linux-gnu` goes in
 * `LD_LIBRARY_PATH` for WebKit 26.6 and is copied into
 * `webkit-2182/minibrowser-wpe/sys/lib` for WebKit 18.5, whose launcher
 * replaces `LD_LIBRARY_PATH`. Playwright 1.53 also checks for the GTK 4
 * libraries a headless run does not load;
 * `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` skips that check.
 *
 * An engine that cannot start, a browser that exits, a connection that
 * closes and a Firefox command unanswered for 120 s each fail the scenario
 * with the reason (`readPage`).
 */
export const ENGINES = ['chrome', 'firefox', 'webkit', 'webkit-18'];

/** `--engine <name>` from the command line, `chrome` when absent. */
export function engineArgument(argv = process.argv.slice(2)) {
  const at = argv.indexOf('--engine');
  const engine = at === -1 ? 'chrome' : argv[at + 1];
  if (!ENGINES.includes(engine)) {
    throw new Error(`--engine takes one of ${ENGINES.join(', ')}; got ${engine}`);
  }
  return engine;
}

export async function openPage(engine) {
  if (engine === 'chrome') return chromePage();
  if (engine === 'firefox') return firefoxPage(firefoxBinary());
  if (engine === 'webkit') return webkitPage('playwright-core');
  if (engine === 'webkit-18') return webkitPage('playwright-core-webkit18');
  throw new Error(`no engine named ${engine}; one of ${ENGINES.join(', ')}`);
}

async function chromePage() {
  let opened;
  try {
    opened = await launchChrome();
  } catch (error) {
    throw new Error(
      `chrome cannot start (${error.message}); CHROME_BIN names the binary, default google-chrome`,
      { cause: error },
    );
  }
  const { devtools, close } = opened;
  try {
    const { product } = await devtools.send('Browser.getVersion');
    await devtools.send('Page.enable');
    await devtools.send('Runtime.enable');
    await devtools.send('Inspector.enable');
    /* A renderer that crashes answers nothing; the command waiting on it fails instead of hanging. */
    const crashed = devtools.once('Inspector.targetCrashed').then(() => {
      throw new Error(`the page crashed in ${product}`);
    });
    crashed.catch(() => {});
    const unlessCrashed = (promise) => Promise.race([promise, crashed]);
    return {
      version: product,
      async goto(url) {
        const loaded = devtools.once('Page.loadEventFired');
        loaded.catch(() => {});
        await unlessCrashed(devtools.send('Page.navigate', { url }));
        await unlessCrashed(loaded);
      },
      async evaluate(expression) {
        const { result, exceptionDetails } = await unlessCrashed(
          devtools.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true,
          }),
        );
        if (exceptionDetails) {
          throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
        }
        return result.value;
      },
      async close() {
        devtools.close();
        await close();
      },
    };
  } catch (error) {
    devtools.close();
    await close();
    throw error;
  }
}

/**
 * Opens `url` in `engine` and returns the engine's version and the value of
 * `expression`. Any failure — an engine that cannot start, a browser that
 * dies, a command that is never answered — prints FAIL with the reason,
 * closes the browser and exits 1.
 */
export async function readPage(engine, url, expression) {
  let browser;
  try {
    browser = await openPage(engine);
    await browser.goto(url);
    return { version: browser.version, value: await browser.evaluate(expression) };
  } catch (error) {
    console.error(`FAIL ${browser?.version ?? engine}: ${error.message}`);
  } finally {
    await browser?.close().catch(() => {});
  }
  process.exit(1);
}

const playwrightCache = () =>
  process.env['PLAYWRIGHT_BROWSERS_PATH'] ?? join(homedir(), '.cache', 'ms-playwright');

function firefoxBinary() {
  const named = process.env['FIREFOX'];
  if (named) {
    if (!existsSync(named)) throw new Error(`FIREFOX names ${named}, which does not exist`);
    return named;
  }
  const cache = playwrightCache();
  const builds = existsSync(cache)
    ? readdirSync(cache)
        .map((entry) => /^firefox-(\d+)$/.exec(entry))
        .filter(Boolean)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .map((match) => join(cache, match[0], 'firefox', 'firefox'))
        .filter((binary) => existsSync(binary))
    : [];
  if (builds.length === 0) {
    throw new Error(
      `firefox is not available: no firefox-<revision> build in ${cache}. Set FIREFOX to a ` +
        'Firefox binary, or run: pnpm --filter @slotted/harness exec playwright-core install firefox',
    );
  }
  return builds[0];
}

/** How long a BiDi command may wait for its answer before it fails the scenario. */
const COMMAND_TIMEOUT = 120000;

/** The JSON a page wrote, or `undefined` when the expression's value was `undefined`. */
export function evaluated(text) {
  return text === undefined ? undefined : JSON.parse(text);
}

/**
 * Commands over a WebDriver BiDi socket. Every command in flight fails, with
 * the reason, when the browser exits, when the socket closes, or when no
 * answer arrives within `timeout`; a command sent after that fails at once.
 * `output()` returns the browser's stderr, whose last lines go into the error.
 */
export function bidiConnection(
  socket,
  browser,
  { timeout = COMMAND_TIMEOUT, output = () => '' } = {},
) {
  let next = 0;
  let broken;
  const pending = new Map();
  const tail = () => {
    const text = output().trim();
    return text ? `:\n${text.split('\n').slice(-20).join('\n')}` : '';
  };
  const fail = (error) => {
    if (broken) return;
    broken = error;
    for (const { reject, timer } of pending.values()) {
      clearTimeout(timer);
      reject(error);
    }
    pending.clear();
  };
  browser.on('exit', (code, signal) =>
    fail(new Error(`firefox exited (${signal ?? `code ${code}`})${tail()}`)),
  );
  socket.addEventListener('close', () =>
    fail(new Error(`the WebDriver BiDi connection closed${tail()}`)),
  );
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(String(data));
    const entry = message.id === undefined ? undefined : pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timer);
    if (message.type === 'error') {
      entry.reject(new Error(`${entry.method}: ${message.error}: ${message.message}`));
    } else entry.resolve(message.result);
  });
  const send = (method, params = {}) =>
    broken
      ? Promise.reject(broken)
      : new Promise((resolve, reject) => {
          const id = (next += 1);
          const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`${method}: no answer from firefox in ${timeout / 1000} s${tail()}`));
          }, timeout);
          pending.set(id, { method, resolve, reject, timer });
          socket.send(JSON.stringify({ id, method, params }));
        });
  return { send };
}

/**
 * Firefox over WebDriver BiDi, which it speaks natively. It prints the port
 * it listens on once it is ready.
 */
async function firefoxPage(binary) {
  const profile = await mkdtemp(join(tmpdir(), 'slotted-firefox-'));
  const firefox = spawn(
    binary,
    ['--headless', '--no-remote', '--profile', profile, '--remote-debugging-port=0', 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  let output = '';
  firefox.stderr.on('data', (chunk) => {
    output = (output + chunk).slice(-16384);
  });
  const stop = async () => {
    if (firefox.exitCode === null && firefox.signalCode === null) {
      firefox.kill();
      await once(firefox, 'exit');
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  };

  let socket;
  try {
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`firefox never opened WebDriver BiDi:\n${output}`)),
        30000,
      );
      firefox.on('error', (error) => {
        clearTimeout(timer);
        reject(new Error(`firefox cannot start (${binary}): ${error.message}`));
      });
      firefox.on('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`firefox exited with ${code}:\n${output}`));
      });
      firefox.stderr.on('data', () => {
        const match = /WebDriver BiDi listening on (ws:\/\/\S+)/.exec(output);
        if (!match) return;
        clearTimeout(timer);
        resolve(match[1]);
      });
    });
    socket = new WebSocket(`${url.replace(/\/$/, '')}/session`);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', () => reject(new Error(`cannot reach ${url}`)), {
        once: true,
      });
    });
  } catch (error) {
    await stop();
    throw error;
  }

  const { send } = bidiConnection(socket, firefox, { output: () => output });
  try {
    const session = await send('session.new', { capabilities: {} });
    const { contexts } = await send('browsingContext.getTree', {});
    const context = contexts[0].context;
    return {
      version: `Firefox ${session.capabilities.browserVersion}`,
      async goto(url) {
        await send('browsingContext.navigate', { context, url, wait: 'complete' });
      },
      async evaluate(expression) {
        const result = await send('script.evaluate', {
          expression: `(async () => JSON.stringify(await (${expression})))()`,
          target: { context },
          awaitPromise: true,
        });
        if (result.type === 'exception') throw new Error(result.exceptionDetails.text);
        return evaluated(result.result.value);
      },
      async close() {
        /* The exit browser.close causes may reject it before its answer arrives. */
        await send('browser.close').catch(() => {});
        socket.close();
        await stop();
      },
    };
  } catch (error) {
    socket.close();
    await stop();
    throw error;
  }
}

async function webkitPage(driver) {
  let browser;
  try {
    const { webkit } = await import(driver);
    browser = await webkit.launch();
  } catch (error) {
    throw new Error(
      `webkit (${driver}) cannot start: ${error.message.split('\n').slice(0, 8).join('\n')}\n` +
        "Install the build with the driver's `install webkit` and its libraries with " +
        '`install-deps webkit`, or name extracted libraries in LD_LIBRARY_PATH.',
      { cause: error },
    );
  }
  try {
    const page = await browser.newPage();
    return {
      version: `WebKit ${browser.version()}`,
      async goto(url) {
        await page.goto(url, { waitUntil: 'load' });
      },
      async evaluate(expression) {
        return evaluated(
          await page.evaluate(`(async () => JSON.stringify(await (${expression})))()`),
        );
      },
      async close() {
        await browser.close();
      },
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
