import { buildReactPage } from '../react-page.mjs';
import { launch } from '../shoot.mjs';

/**
 * Opening a React popup family, measured in Chrome: from the click on its
 * trigger to the frame where the layer carries `data-open`, the entrance
 * animation's state in each frame, and how many style recalculations script
 * forced in the click's task chain.
 *
 * The request came from an application whose 62-option select set
 * `data-open` some 600 milliseconds after a 16-millisecond click event: the
 * attribute waited for a promise and a render, behind a chain of passive
 * effects whose reads each forced a style recalculation.
 *
 * The page is the binding from source (`tools/harness/react-page.mjs`): the
 * select with 62 options, every other family its documentation site's `basic`
 * example. The
 * click is a real input event through the DevTools protocol, so the event and
 * the frames after it are the browser's own. Each frame after the click is
 * recorded by a `requestAnimationFrame` loop that reads the positioner's
 * attributes and its computed opacity.
 *
 * Run: node tools/harness/scenarios/popup-open.mjs [--family select] [--mode development] [--assert]
 * With `--assert`, exits non-zero unless the first frame after the click
 * shows the popup open with its entrance animation running, and the click's
 * chain forces at most one style recalculation. The opacity is reported and
 * not asserted: the entrance is a keyframe animation from nought on the
 * compositor, and Chrome holds its current time at nought until the
 * compositor reports it started, two or three frames after the one that
 * created it, whatever the binding does.
 */

const mode = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1]
  : 'production';
const strict = process.argv.includes('--assert');
const family = process.argv.includes('--family')
  ? process.argv[process.argv.indexOf('--family') + 1]
  : 'select';
const examples = new URL('../../../apps/docs/examples/react/', import.meta.url).pathname;

/**
 * The trigger is the element whose `aria-expanded` the open changes — inside
 * the family's root, or, for a family whose trigger is the consumer's own
 * element, the first popup trigger on the page; the layer is the family's.
 */
const TRIGGER = `[data-ui="${family}"] [aria-expanded], [data-ui="${family}"][aria-expanded]`;
const LAYER = `[data-ui="${family}"]:is([data-part="positioner"], [data-part="root"]):not(:has([aria-expanded]))`;

const OPTIONS = 62;
const selectEntry = `
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@slotted/react/select';

const options = Array.from({ length: ${OPTIONS} }, (_, index) => ({
  value: 'v' + index,
  label: 'Option number ' + (index + 1),
}));

function App() {
  return h(
    'div',
    { style: { padding: '40px', inlineSize: '320px' } },
    h(
      Select,
      { 'aria-label': 'Warehouse' },
      h(SelectTrigger, null, h(SelectValue, { placeholder: 'Choose' })),
      h(
        SelectContent,
        null,
        options.map((option) => h(SelectItem, { key: option.value, value: option.value }, option.label)),
      ),
    ),
  );
}

createRoot(document.getElementById('root')).render(h(App));
`;

const exampleEntry = `
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import Example from '${examples}${family}/basic.tsx';

createRoot(document.getElementById('root')).render(
  h('div', { style: { padding: '40px', inlineSize: '420px' } }, h(Example)),
);
`;

const url = await buildReactPage(
  `${family}-open-${mode}`,
  family === 'select' ? selectEntry : exampleEntry,
  { mode },
);

const ARM = `(() => {
  const frames = [];
  let clicked = null;
  const positioner = () => document.querySelector(${JSON.stringify(LAYER)});
  document.addEventListener('click', (event) => { clicked = { at: event.timeStamp, now: performance.now() }; }, true);
  const loop = (time) => {
    if (clicked !== null) {
      const node = positioner();
      frames.push({
        time,
        open: node?.hasAttribute('data-open') ?? false,
        positioned: node?.hasAttribute('data-positioned') ?? false,
        opacity: node ? Number(getComputedStyle(node).opacity) : 0,
        animation: node
          ? node
              .getAnimations()
              .map((animation) => animation.animationName + ':' + animation.playState + ':' + Math.round(animation.currentTime ?? -1))
              .join(' ')
          : '',
      });
    }
    if (frames.length < 120) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__popup = () => ({ clicked, frames });
  const trigger =
    document.querySelector(${JSON.stringify(TRIGGER)}) ??
    document.querySelector('[aria-haspopup][aria-expanded]');
  const box = trigger.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
})()`;

const { devtools, close } = await launch();
let report;

try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width: 800,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const loaded = devtools.once('Page.loadEventFired');
  await devtools.send('Page.navigate', { url: url.href });
  await loaded;
  await new Promise((resolve) => setTimeout(resolve, 500));

  const point = (await devtools.send('Runtime.evaluate', { expression: ARM, returnByValue: true }))
    .result.value;

  await devtools.send('Tracing.start', {
    categories:
      'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack',
    transferMode: 'ReturnAsStream',
  });

  /* A press held for a tenth of a second, as a hand holds one: frames run between the two. */
  for (const type of ['mousePressed', 'mouseReleased']) {
    await devtools.send('Input.dispatchMouseEvent', {
      type,
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
    });
    if (type === 'mousePressed') await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const traced = devtools.once('Tracing.tracingComplete');
  await devtools.send('Tracing.end');
  const { stream } = await traced;
  let text = '';
  for (;;) {
    const chunk = await devtools.send('IO.read', { handle: stream });
    text += chunk.base64Encoded ? Buffer.from(chunk.data, 'base64').toString('utf8') : chunk.data;
    if (chunk.eof) break;
  }
  await devtools.send('IO.close', { handle: stream });
  const parsed = JSON.parse(text);
  const events = Array.isArray(parsed) ? parsed : parsed.traceEvents;

  const { clicked, frames } = (
    await devtools.send('Runtime.evaluate', {
      expression: 'window.__popup()',
      returnByValue: true,
    })
  ).result.value;

  /**
   * The click's chain: from its dispatch to the first animation frame after
   * it — the task, its microtasks and any task posted before the frame. A
   * recalculation counts when script forced it, which is when it carries a
   * script stack; the browser's own hit test for the next mouse event and the
   * frame's rendering are the browser's work, and are listed but not counted.
   */
  const dispatch = events.find(
    (event) => event.name === 'EventDispatch' && event.args?.data?.type === 'click',
  );
  const nextFrame = dispatch
    ? events
        .filter((event) => event.name === 'FireAnimationFrame' && event.ts > dispatch.ts)
        .sort((a, b) => a.ts - b.ts)[0]
    : undefined;
  const forced = dispatch
    ? events.filter(
        (event) =>
          event.name === 'UpdateLayoutTree' &&
          event.ts >= dispatch.ts &&
          (nextFrame === undefined || event.ts < nextFrame.ts),
      )
    : [];
  const recalcs = dispatch
    ? forced.filter((event) => (event.args?.beginData?.stackTrace ?? []).length > 0).length
    : -1;
  /* Where each forced recalculation was asked for, by its innermost frames. */
  const causes = forced.map((event) => {
    const stack = (event.args?.beginData?.stackTrace ?? [])
      .slice(0, 4)
      .map((frame) => `${frame.functionName || '(anonymous)'}:${frame.lineNumber}`)
      .join(' < ');
    if (stack !== '') return stack;
    /* No script on the stack: name the work it ran inside. */
    return events
      .filter(
        (outer) =>
          outer.ph === 'X' &&
          outer.tid === event.tid &&
          outer.ts <= event.ts &&
          outer.ts + (outer.dur ?? 0) >= event.ts + (event.dur ?? 0) &&
          outer !== event,
      )
      .sort((a, b) => (a.dur ?? 0) - (b.dur ?? 0))
      .slice(0, 1)
      .map((outer) => {
        const inside = events
          .filter(
            (child) =>
              child.tid === outer.tid &&
              child.ts >= outer.ts &&
              child.ts <= outer.ts + (outer.dur ?? 0) &&
              child !== outer &&
              child.name !== 'UpdateLayoutTree',
          )
          .map((child) => child.name)
          .slice(0, 12)
          .join(',');
        return `${outer.name} [${inside}]`;
      })
      .join(' < ');
  });

  const firstOpen = frames.findIndex((frame) => frame.open);
  const firstOpaque = frames.findIndex((frame) => frame.open && frame.opacity > 0);
  report = {
    family,
    mode,
    firstFrames: frames
      .slice(0, 5)
      .map(
        (frame) =>
          `${Math.round(frame.time - clicked.now)}ms open=${frame.open} positioned=${frame.positioned} opacity=${frame.opacity.toFixed(3)} ${frame.animation}`,
      ),
    openFrame: firstOpen,
    openAfter: firstOpen === -1 ? null : Math.round(frames[firstOpen].time - clicked.now),
    opaqueFrame: firstOpaque,
    opaqueAfter: firstOpaque === -1 ? null : Math.round(frames[firstOpaque].time - clicked.now),
    animatedFirst: frames[0]?.animation.includes(':running:') ?? false,
    forcedRecalcs: recalcs,
    causes,
  };
} finally {
  devtools.close();
  await close();
}

console.log(JSON.stringify(report, null, 2));
if (strict) {
  const failures = [];
  if (report.openFrame !== 0)
    failures.push(`data-open in frame ${report.openFrame}, not the first`);
  if (!report.animatedFirst) failures.push('no entrance animation running in the first frame');
  if (report.forcedRecalcs > 1)
    failures.push(`${report.forcedRecalcs} forced style recalculations in the click's chain`);
  if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log(
    'ok — open and animating in the first frame after the click, one forced recalculation',
  );
}
