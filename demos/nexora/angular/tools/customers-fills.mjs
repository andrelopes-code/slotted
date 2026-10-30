// usage: node tools/customers-fills.mjs [--engine chrome|firefox|webkit|webkit-18]
//        (after `pnpm build:demo`; PORT optional; ORIGIN=<url> reads a running server)
// The coloured-fills scenario: the customers list, the screen where Firefox 146 drew the solid
// avatar and the "New customer" button with no ground (white text on nothing), the tone badges in
// the page's grey, and the focus ring in no colour, because the theme's bounded colour tokens were
// invalid there. The build is served from `dist` with an SPA fallback. The engine is driven by the
// repository's `tools/harness/engines.mjs`, imported by path, so the scenario runs only inside this
// repository with `tools/harness` installed; FIREFOX, CHROME_BIN, the WebKit drivers and how to
// obtain each minimum build are named there.
// With `html` in light, then in dark, it asserts:
// - every colour token of the standard recipe paints a ground on a probe under `html`: a token the
//   engine cannot parse leaves `background-color` transparent;
// - every solid button and solid avatar paints an opaque ground, and its text holds 4.5:1 on it;
// - every badge and soft avatar of an accent, success, warning or danger tone writes its text in a
//   colour of its own, not the colour it inherits.
// Prints one PASS or FAIL per check and exits non-zero on a failure or when the engine cannot start.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { contrast, fromSrgb, recipes } from '@slotted/theme';

import { engineArgument, openPage } from '../../../../tools/harness/engines.mjs';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)), 'dist/nexora-operations/browser');
const SERVED = process.env.ORIGIN;
if (SERVED === undefined && !existsSync(join(ROOT, 'index.html'))) {
  console.error(`No build at ${ROOT}: run \`pnpm build:demo\` first.`);
  process.exit(2);
}
const engine = engineArgument();
const TONES = ['accent', 'success', 'warning', 'danger'];
const TOKENS = Object.keys(recipes.standard.light);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');
  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  response.end(readFileSync(file));
});

/** A computed colour: `oklch(l c h[ / a])` or `rgb[a](r, g, b[, a])`. */
function parse(text) {
  const oklch = /^oklch\(([\d.e-]+) ([\d.e-]+) ([\d.e-]+|none)(?: \/ ([\d.]+))?\)$/.exec(text);
  if (oklch) {
    return { color: { l: Number(oklch[1]), c: Number(oklch[2]), h: oklch[3] === 'none' ? 0 : Number(oklch[3]) }, alpha: oklch[4] === undefined ? 1 : Number(oklch[4]) };
  }
  const rgb = /^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)$/.exec(text);
  if (rgb) {
    return { color: fromSrgb(Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255), alpha: rgb[4] === undefined ? 1 : Number(rgb[4]) };
  }
  return undefined;
}

const READ = `(() => {
  const probe = document.createElement('i');
  document.body.append(probe);
  const tokens = Object.fromEntries(${JSON.stringify(TOKENS)}.map((token) => {
    probe.style.backgroundColor = 'var(' + token + ')';
    return [token, getComputedStyle(probe).backgroundColor];
  }));
  probe.remove();
  const label = (element) => element.getAttribute('data-ui') + '/' + (element.getAttribute('data-variant') ?? '') + '/' + (element.getAttribute('data-tone') ?? '') + ' "' + element.textContent.trim().slice(0, 20) + '"';
  const paint = (element) => {
    const style = getComputedStyle(element);
    return { label: label(element), ground: style.backgroundColor, ink: style.color, inherited: getComputedStyle(element.parentElement).color };
  };
  return {
    tokens,
    solids: [...document.querySelectorAll('[data-ui="button"][data-variant="solid"], [data-ui="avatar"][data-variant="solid"]')].map(paint),
    tones: [...document.querySelectorAll('[data-ui="badge"], [data-ui="avatar"][data-variant="soft"]')]
      .filter((element) => ${JSON.stringify(TONES)}.includes(element.getAttribute('data-tone')))
      .map(paint),
  };
})()`;

/** No colour transition running, and the same reading a frame apart. */
const SETTLED = `new Promise((resolve) => {
  const read = () => [...document.querySelectorAll('[data-ui="button"][data-variant="solid"]')].map((b) => getComputedStyle(b).backgroundColor).join();
  const first = read();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const running = document.getAnimations().some((a) => a.playState === 'running' && a instanceof CSSTransition);
    resolve(!running && read() === first);
  }));
})`;

let failed = 0;
const check = (ok, text) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${text}`);
  if (!ok) failed += 1;
};

let browser;
try {
  const origin = SERVED ?? (await new Promise((resolve) => server.listen(Number(process.env.PORT ?? 0), '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`))));
  browser = await openPage(engine);
  console.log(`${engine}: ${browser.version}`);
  await browser.goto(`${origin}/crm/customers`);
  const until = async (expression, ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (await browser.evaluate(expression)) return true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  };
  const drawn = await until(`document.documentElement.hasAttribute('data-slotted-theme') && document.querySelector('[data-ui="avatar"][data-variant="solid"]') !== null && document.querySelector('[data-ui="button"][data-variant="solid"]') !== null && document.querySelector('[data-ui="badge"]') !== null`, 30000);
  check(drawn, 'the customers list draws a solid avatar, a solid button and a badge');
  if (drawn) {
    for (const scheme of ['light', 'dark']) {
      await browser.evaluate(`(document.documentElement.setAttribute('data-slotted-scheme', '${scheme}'), true)`);
      check(await until(SETTLED, 5000), `${scheme}: the page settles`);
      const reading = await browser.evaluate(READ);
      const blank = Object.entries(reading.tokens).filter(([, value]) => !(parse(value)?.alpha > 0));
      check(blank.length === 0, `${scheme}: ${TOKENS.length - blank.length}/${TOKENS.length} recipe tokens paint a ground${blank.length ? ` — not: ${blank.map(([token]) => token).join(', ')}` : ''}`);
      check(reading.solids.length > 0, `${scheme}: ${reading.solids.length} solid buttons and avatars`);
      for (const part of reading.solids) {
        const ground = parse(part.ground);
        const ink = parse(part.ink);
        const ratio = ground && ink ? contrast(ground.color, ink.color) : 0;
        check(ground?.alpha === 1 && ratio >= 4.5, `${scheme}: ${part.label} paints ${part.ground}, text ${part.ink} at ${ratio.toFixed(2)}:1`);
      }
      check(reading.tones.length > 0, `${scheme}: ${reading.tones.length} tone badges and soft avatars`);
      for (const part of reading.tones) {
        check(part.ink !== part.inherited, `${scheme}: ${part.label} writes ${part.ink}, not the inherited ${part.inherited}`);
      }
    }
  }
} catch (error) {
  check(false, error.message);
} finally {
  await browser?.close().catch(() => {});
  server.close();
}
console.log(failed === 0 ? 'ok — every coloured fill paints' : `${failed} checks failed`);
process.exit(failed === 0 ? 0 : 1);
