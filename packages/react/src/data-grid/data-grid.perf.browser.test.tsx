import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { cdp, page } from 'vitest/browser';

import { Badge } from '../badge';
import { Button, IconButton } from '../button';
import { Glyph, Icon } from '../icon';
import { DataGrid } from './data-grid';
import type { DataGridColumn } from './data-grid.types';

interface Entry {
  id: string;
  date: string;
  payee: string;
  category: string;
  account: string;
  amount: number;
  status: string;
  note: string;
  city: string;
}

const ROWS: Entry[] = Array.from({ length: 1000 }, (_, index) => ({
  id: `E${String(index)}`,
  date: `2026-10-${String((index % 28) + 1).padStart(2, '0')}`,
  payee: `Payee number ${String(index)}`,
  category: `Category ${String(index % 9)}`,
  account: `Account ${String(index % 4)}`,
  amount: index * 13.5,
  status: ['paid', 'pending', 'failed'][index % 3]!,
  note: index % 3 === 0 ? '' : 'Recurring transfer',
  city: ['Lisboa', 'Porto', 'Braga'][index % 3]!,
}));

const COLUMNS: DataGridColumn<Entry>[] = [
  { id: 'date', label: 'Date', kind: 'date' },
  { id: 'payee', label: 'Payee', rowHeader: true },
  { id: 'category', label: 'Category' },
  { id: 'account', label: 'Account' },
  { id: 'amount', label: 'Amount', kind: 'number' },
  { id: 'status', label: 'Status' },
  { id: 'note', label: 'Note' },
  { id: 'city', label: 'City' },
  { id: 'actions', label: 'Actions', kind: 'actions' },
];

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

interface TraceEvent {
  name: string;
  ph: string;
  dur?: number;
  args?: { elementCount?: number };
}

/** How the trace in flight reports its end, with the stream that holds it; the listener is registered once. */
let finished: (stream: string) => void = () => {};
let listening = false;

/**
 * The style and layout events of a run, read from a Chrome trace. The trace
 * is read back as a stream: delivered as `Tracing.dataCollected` events, a
 * run's trace arrived empty in about one browser session in four, while
 * `Tracing.tracingComplete` still did; read as a stream, one run in
 * seventeen still lost that event.
 */
async function traced(run: () => Promise<void>): Promise<TraceEvent[]> {
  const session = cdp();
  if (!listening) {
    session.on('Tracing.tracingComplete', (payload) => finished(String(payload.stream)));
    listening = true;
  }
  const complete = new Promise<string>((resolve) => {
    finished = resolve;
  });
  await session.send('Tracing.start', {
    categories: 'devtools.timeline',
    transferMode: 'ReturnAsStream',
  });
  await run();
  await session.send('Tracing.end');
  /* shortcut: a browser session whose CDP events stop reaching the test fails here, named; retry the run. */
  const handle = await Promise.race([
    complete,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tracing.tracingComplete never arrived')), 10000),
    ),
  ]);
  let text = '';
  for (;;) {
    const chunk = await session.send('IO.read', { handle });
    text += chunk.base64Encoded ? atob(chunk.data) : chunk.data;
    if (chunk.eof) break;
  }
  await session.send('IO.close', { handle });
  const parsed = JSON.parse(text) as TraceEvent[] | { traceEvents: TraceEvent[] };
  const events = Array.isArray(parsed) ? parsed : parsed.traceEvents;
  return events.filter((event) => event.ph === 'X');
}

const total = (events: TraceEvent[], name: string) =>
  events.filter((event) => event.name === name).reduce((sum, event) => sum + (event.dur ?? 0), 0);

/**
 * A scroll step of a windowed grid lays out and restyles the rows it mounted,
 * not the grid. The scroller was a size container, and the browser laid out
 * everything inside it whenever a row entered — 45 ms per step on 29 mounted
 * rows, as much as the grid's first layout; and the body wrote the window's
 * offset as an inherited custom property, which restyled every row and cell
 * on every step. Both are measured against the grid's own first render in the
 * same run, so a slower runner moves both sides.
 */
describe('a windowed data grid while it scrolls', () => {
  it('restyles and lays out a fraction of the grid per step', async () => {
    await page.viewport(1440, 900);
    const host = document.createElement('div');
    host.style.blockSize = '760px';
    host.style.display = 'flex';
    document.body.append(host);
    const root = createRoot(host);

    const mount = await traced(async () => {
      flushSync(() =>
        root.render(
          <DataGrid<Entry>
            aria-label="Entries"
            cellRenderers={{
              actions: () => (
                <IconButton aria-label="More" size="sm" variant="ghost">
                  <Icon>
                    <Glyph name="ellipsis" />
                  </Icon>
                </IconButton>
              ),
              category: ({ text }) => (
                <Button size="sm" variant="ghost">
                  {text}
                </Button>
              ),
              status: ({ text }) => <Badge size="sm">{text}</Badge>,
            }}
            columns={COLUMNS}
            rowKey="id"
            rows={ROWS}
            selectionMode="multiple"
          />,
        ),
      );
      await frame();
      await frame();
    });
    const elements = host.querySelectorAll('*').length;
    const scroller = host.querySelector<HTMLElement>('[data-part="scroll"]')!;
    const first = () =>
      host.querySelector('[data-part="body"] > [data-row]')?.getAttribute('data-row');
    const before = first();

    const steps = 12;
    const scrolling = await traced(async () => {
      for (let step = 0; step < steps; step += 1) {
        scroller.scrollTop += 120;
        await frame();
        await frame();
      }
    });
    root.unmount();
    host.remove();

    const restyled =
      scrolling
        .filter((event) => event.name === 'UpdateLayoutTree')
        .reduce((sum, event) => sum + (event.args?.elementCount ?? 0), 0) / steps;
    const layoutPerStep = total(scrolling, 'Layout') / steps;

    expect(first()).toBeUndefined();
    expect(before).not.toBeUndefined();
    expect(restyled).toBeLessThan(elements / 3);
    expect(layoutPerStep).toBeLessThan(total(mount, 'Layout') / 4);
  }, 60000);
});

/**
 * A refresh is a veil over the rows the grid has drawn, and its cost is the
 * veil's: a selector that read the busy root above the rows restyled every
 * row and cell on the toggle — 340 ms on a throttled phone for 70 rows. A
 * control in the same run restyles every cell, so a trace that recorded
 * nothing fails instead of passing.
 */
describe('a data grid entering and leaving a refresh', () => {
  it('restyles the root and the veil, not the rows', async () => {
    const host = document.createElement('div');
    host.style.blockSize = '4000px';
    host.style.display = 'flex';
    document.body.append(host);
    const probe = document.createElement('style');
    probe.textContent = '[data-probe] [data-part="cell"] { outline: 1px solid; }';
    document.head.append(probe);
    const root = createRoot(host);
    const grid = (loading: false | 'refresh') => (
      <DataGrid<Entry>
        aria-label="Entries"
        columns={COLUMNS}
        loading={loading}
        rowKey="id"
        rows={ROWS.slice(0, 70)}
      />
    );
    flushSync(() => root.render(grid(false)));
    await frame();
    await frame();

    const restyled = async (change: () => void) =>
      (
        await traced(async () => {
          change();
          await frame();
          await frame();
        })
      )
        .filter((event) => event.name === 'UpdateLayoutTree')
        .reduce((sum, event) => sum + (event.args?.elementCount ?? 0), 0);
    const rows = host.querySelectorAll('[data-part="body"] > [data-row]').length;
    const cells = host.querySelectorAll('[data-part="cell"]').length;
    const control = await restyled(() => host.setAttribute('data-probe', ''));
    const entering = await restyled(() => flushSync(() => root.render(grid('refresh'))));
    const busy = host.querySelector('[data-ui="data-grid"]')?.getAttribute('aria-busy');
    const leaving = await restyled(() => flushSync(() => root.render(grid(false))));
    root.unmount();
    host.remove();
    probe.remove();

    expect(rows).toBe(70);
    expect(control).toBeGreaterThanOrEqual(cells);
    expect(busy).toBe('true');
    expect(entering).toBeLessThan(10);
    expect(leaving).toBeLessThan(10);
  }, 60000);
});
