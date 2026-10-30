import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { press } from '../test/press';
import { Drawer, DrawerBody, DrawerHeader, DrawerPanel, DrawerTitle, DrawerTrigger } from './index';

interface TraceEvent {
  name: string;
  ph: string;
  ts: number;
  dur?: number;
  args?: { beginData?: { stackTrace?: { url: string; functionName: string }[] } };
}

/** The library's own code as the dev server serves it: this package's `src`, and core's. */
const OURS = /\/packages\/core\/src\/|^https?:\/\/[^/]+\/src\//;

/**
 * A Chrome trace of `run`. The trace stays in the browser until `run` is over
 * and is read afterwards: streamed into the page while it ran, its own parsing
 * took the main thread for tens of milliseconds and read as a long frame.
 */
async function trace(run: () => Promise<void>): Promise<TraceEvent[]> {
  const session = cdp();
  let handle = '';
  let done = () => {};
  const complete = new Promise<void>((resolve) => {
    done = resolve;
  });
  const finish = (payload: { stream?: string }) => {
    handle = payload.stream ?? '';
    done();
  };
  session.on('Tracing.tracingComplete', finish);
  await session.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.stack',
    ].join(','),
    transferMode: 'ReturnAsStream',
    streamFormat: 'json',
  });
  await run();
  await session.send('Tracing.end');
  await complete;
  session.off('Tracing.tracingComplete', finish);

  let text = '';
  for (;;) {
    const chunk = (await session.send('IO.read', { handle })) as { data: string; eof: boolean };
    text += chunk.data;
    if (chunk.eof) break;
  }
  await session.send('IO.close', { handle });
  return (JSON.parse(text) as { traceEvents: TraceEvent[] }).traceEvents;
}

/** The longest gap between two animation frames while `during` runs. */
async function longestFrame(during: () => Promise<void>, settle: number): Promise<number> {
  let last = performance.now();
  let longest = 0;
  let running = true;
  const tick = (now: number) => {
    longest = Math.max(longest, now - last);
    last = now;
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  await during();
  await new Promise((resolve) => setTimeout(resolve, settle));
  running = false;
  return longest;
}

const ITEMS = Array.from({ length: 20 }, (_, index) => `Item ${String(index + 1)}`);

/**
 * Opening a sheet lays the page out once. Each forced synchronous layout in
 * the commit that mounts the panel — the extent read before the panel was
 * placed, the scrollbar measured between two writes, a computed style per
 * focusable item — cost hundreds of milliseconds on a throttled phone, and the
 * first frames after the tap took 400–650 ms.
 */
describe('opening a bottom sheet', () => {
  let root: Root | undefined;
  afterEach(async () => {
    await cdp().send('Emulation.setCPUThrottlingRate', { rate: 1 });
    root?.unmount();
    document.body.replaceChildren();
  });

  /* A frame budget on a shared machine meets the odd frame another process
     took; a regression misses it on every try, noise on one. */
  it('forces no layout and drops no frame over 50 ms', { retry: 2 }, async () => {
    const host = document.body.appendChild(document.createElement('div'));
    root = createRoot(host);
    root.render(
      <Drawer side="bottom">
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerPanel>
          <DrawerHeader>
            <DrawerTitle>Actions</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            {ITEMS.map((item) => (
              <button key={item} type="button">
                {item}
              </button>
            ))}
          </DrawerBody>
        </DrawerPanel>
      </Drawer>,
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    const trigger = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Open',
    ) as HTMLElement;
    await cdp().send('Emulation.setCPUThrottlingRate', { rate: 4 });

    let longest = 0;
    const events = await trace(async () => {
      longest = await longestFrame(() => press(trigger, 'touch'), 1000);
    });

    expect(document.querySelector('[data-ui="drawer"][data-open]')).not.toBeNull();
    const forced = events
      .filter((event) => event.name === 'Layout')
      .map((event) => event.args?.beginData?.stackTrace ?? [])
      .filter((stack) => stack.some((frame) => OURS.test(frame.url)))
      .map((stack) =>
        stack
          .filter((frame) => OURS.test(frame.url))
          .map(
            (frame) =>
              `${frame.functionName} ${frame.url.replace(/^.*\/(packages\/core\/)?src\//, '')}`,
          )
          .join(' < '),
      );
    expect(forced).toEqual([]);
    expect(longest).toBeLessThanOrEqual(50);
  });
});
