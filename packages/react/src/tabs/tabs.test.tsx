import { act, fireEvent, render, screen } from '@testing-library/react';
import { Suspense, use, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/tabs/contract.json';
import { Tabs } from './tabs';
import { TabsDefaultsProvider } from './tabs-defaults';
import { Tab, TabActions, TabList, TabPanel } from './tabs-parts';
import type { TabsProps } from './tabs.types';

const VALUES = ['a', 'b', 'c'];

function Basic({
  labels = ['Resumo', 'Itens', 'Nota'],
  ...props
}: Partial<TabsProps> & {
  labels?: string[];
}) {
  return (
    <Tabs defaultValue="a" {...props}>
      <TabList aria-label="Order">
        {labels.map((label, index) => (
          <Tab key={label} value={VALUES[index] as string}>
            {label}
          </Tab>
        ))}
      </TabList>
      <TabPanel value="a">panel a</TabPanel>
      <TabPanel value="b">panel b</TabPanel>
      <TabPanel value="c">panel c</TabPanel>
    </Tabs>
  );
}

const tabs = () => screen.getAllByRole('tab');
const tab = (index: number) => tabs()[index] as HTMLElement;
const panels = () => document.querySelectorAll('[data-part="panel"]');
const root = () => document.querySelector('[data-ui="tabs"]') as HTMLElement;
const press = (element: HTMLElement, key: string, init: Record<string, unknown> = {}) =>
  fireEvent.keyDown(element, { key, ...init });

describe('Tabs', () => {
  /**
   * One marker the list draws, measured from the selected tab, rather than a
   * bar per item: one bar can slide between two tabs. `jsdom` lays nothing
   * out, so each tab's box is whatever the test says it is.
   */
  it('draws one marker in the list and moves it to the tab selected', async () => {
    render(<Basic />);
    const list = screen.getByRole('tablist');
    const markers = () => list.querySelectorAll(':scope > [data-part="marker"]');
    expect(markers()).toHaveLength(1);
    const marker = markers()[0] as HTMLElement;
    expect(marker).toHaveAttribute('aria-hidden', 'true');
    expect(marker).not.toHaveAttribute('hidden');

    list.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 40 }) as DOMRect;
    tab(1).getBoundingClientRect = () => ({ left: 120, top: 0, width: 80, height: 40 }) as DOMRect;
    fireEvent.click(tab(1));
    await act(() => Promise.resolve());

    expect(markers()).toHaveLength(1);
    expect(marker.style.getPropertyValue('--_indicator-start')).toBe('120px');
    expect(marker.style.getPropertyValue('--_indicator-length')).toBe('80px');
  });

  it('renders the pattern roles and wires each tab to its panel', () => {
    render(<Basic />);

    expect(screen.getByRole('tablist')).toHaveAccessibleName('Order');
    expect(tab(0)).toHaveAttribute('aria-selected', 'true');
    expect(tab(1)).toHaveAttribute('aria-selected', 'false');
    expect(tab(0)).toHaveAttribute('aria-controls', screen.getByRole('tabpanel').id);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tab(0).id);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
  });

  /**
   * A strip over one region the value filters — a feed, a table — has no
   * panel per tab; every tab names that region, and the family's own id
   * stays out of the DOM.
   */
  it('lets a tab name a region the family does not render', () => {
    render(
      <>
        <Tabs defaultValue="a">
          <TabList aria-label="Vistas">
            <Tab controls="feed" value="a">
              Todas
            </Tab>
            <Tab controls="feed" value="b">
              Unread
            </Tab>
          </TabList>
        </Tabs>
        <div id="feed" role="feed" />
      </>,
    );

    expect(tab(0)).toHaveAttribute('aria-controls', 'feed');
    expect(tab(1)).toHaveAttribute('aria-controls', 'feed');
  });

  it('declares every part the contract names', () => {
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="Order">
          <Tab dismissLabel="Close" dismissible end="3" start="•" value="a">
            A
          </Tab>
        </TabList>
        <TabActions>action</TabActions>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    const drawn = new Set(
      [...root().querySelectorAll('[data-part]')].map((node) => node.getAttribute('data-part')),
    );
    drawn.add(root().getAttribute('data-part'));

    for (const part of contract.members.tabs.parts) {
      /* The paging controls exist only while the list overflows, which needs a
         layout engine; the harness fragment is where they are photographed. */
      if (part === 'scroll') continue;
      expect(drawn).toContain(part);
    }
    expect(
      root().querySelector('[data-part="dismiss"] > [data-ui="icon"] > svg[data-glyph="x"]'),
    ).not.toBeNull();
  });

  /**
   * A list laid out after mount — its stylesheet arriving late, a drawer
   * opening, a panel shown that was hidden — starts to overflow with the
   * selected tab out of sight. The tab is brought into view when the list
   * starts to overflow, not only when the selection moves.
   */
  it('brings the selected tab into view when the list starts to overflow', () => {
    const resized: Array<() => void> = [];
    const Original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resized.push(() => callback([], this as unknown as ResizeObserver));
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;

    try {
      render(<Basic defaultValue="c" />);
      const list = screen.getByRole('tablist');
      const scrollBy = vi.fn();
      Object.assign(list, { scrollBy });
      Object.defineProperty(list, 'clientWidth', { configurable: true, value: 200 });
      Object.defineProperty(list, 'scrollWidth', { configurable: true, value: 480 });
      list.getBoundingClientRect = () => ({ left: 0, right: 200, top: 0, bottom: 30 }) as DOMRect;
      tab(2).getBoundingClientRect = () =>
        ({ left: 400, right: 480, top: 0, bottom: 30 }) as DOMRect;

      act(() => resized.forEach((notify) => notify()));

      expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 280 }));
    } finally {
      globalThis.ResizeObserver = Original;
    }
  });

  /**
   * An icon and a count stand beside the words, inside the control, so the
   * tab's gap spaces them and the label alone is clipped under fit=equal.
   */
  it('places start and end beside the label, inside the tab', () => {
    render(
      <Tabs defaultValue="orders">
        <TabList aria-label="Customer">
          <Tab end={<b>12</b>} start={<i>icon</i>} value="orders">
            Orders
          </Tab>
          <Tab value="files">Files</Tab>
        </TabList>
        <TabPanel value="orders">Orders</TabPanel>
        <TabPanel value="files">Files</TabPanel>
      </Tabs>,
    );

    const parts = [...tab(0).children].map((node) => node.getAttribute('data-part'));
    expect(parts).toEqual(['start', 'label', 'end']);
    expect(tab(0).querySelector('[data-part="label"]')).toHaveTextContent(/^Orders$/);
    expect(tab(0).querySelector('[data-part="start"] > i')).not.toBeNull();
    expect(tab(0).querySelector('[data-part="end"] > b')).toHaveTextContent('12');
    expect([...tab(1).children].map((node) => node.getAttribute('data-part'))).toEqual(['label']);
  });

  /**
   * `mount` decides what a panel holds, not whether it exists: every tab's
   * `aria-controls` names a panel in the document (tabs contract, `wiring`),
   * and `mount="active"`, the default, fills only the selected one.
   */
  const filled = () => [...panels()].filter((panel) => panel.textContent !== '');

  it('builds one panel at a time by default, and every tab names a panel', () => {
    render(<Basic />);

    expect(panels()).toHaveLength(3);
    expect(filled()).toHaveLength(1);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel a');
    for (const control of tabs()) {
      expect(document.getElementById(control.getAttribute('aria-controls') ?? '')).toHaveAttribute(
        'data-part',
        'panel',
      );
    }
  });

  it('keeps every panel once it has been seen, under lazy', () => {
    render(<Basic mount="lazy" />);

    fireEvent.click(tab(1), { detail: 1 });

    expect(filled()).toHaveLength(2);
    expect(filled()[0]).toHaveAttribute('hidden');
    expect(filled()[1]).not.toHaveAttribute('hidden');
  });

  it('builds every panel up front, under eager', () => {
    render(<Basic mount="eager" />);

    expect(filled()).toHaveLength(3);
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });

  /**
   * "When focus moves into the tab list, places focus on the active tab
   * element." One stop for the whole list, and it is the selected tab.
   */
  it('holds one tab stop, on the selected tab', () => {
    render(<Basic defaultValue="b" />);

    expect(tab(0)).toHaveAttribute('tabindex', '-1');
    expect(tab(1)).toHaveAttribute('tabindex', '0');
    expect(tab(2)).toHaveAttribute('tabindex', '-1');
  });

  it('moves and selects with the arrows, and wraps at both ends', () => {
    render(<Basic />);

    tab(0).focus();
    press(tab(0), 'ArrowRight');
    expect(tab(1)).toHaveFocus();
    expect(tab(1)).toHaveAttribute('aria-selected', 'true');

    press(tab(1), 'ArrowLeft');
    press(tab(0), 'ArrowLeft');
    expect(tab(2)).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel c');
  });

  /**
   * "If the tab list is horizontal, it does not listen for Down Arrow or Up
   * Arrow so those keys can provide their normal browser scrolling functions."
   */
  it('leaves the cross axis to the page in a horizontal list', () => {
    render(<Basic />);

    tab(0).focus();
    press(tab(0), 'ArrowDown');

    expect(tab(0)).toHaveFocus();
    expect(tab(0)).toHaveAttribute('aria-selected', 'true');
  });

  it('answers the cross axis instead when the list is vertical', () => {
    render(<Basic orientation="vertical" />);

    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    tab(0).focus();
    press(tab(0), 'ArrowDown');

    expect(tab(1)).toHaveFocus();
  });

  it('reaches both ends with Home and End', () => {
    render(<Basic defaultValue="b" />);

    tab(1).focus();
    press(tab(1), 'End');
    expect(tab(2)).toHaveFocus();

    press(tab(2), 'Home');
    expect(tab(0)).toHaveFocus();
  });

  /**
   * "Space or Enter: Activates the tab if it was not activated automatically on
   * focus." Manual activation moves focus and leaves the panel alone.
   */
  it('separates focus from selection under manual activation', () => {
    render(<Basic activation="manual" />);

    tab(0).focus();
    press(tab(0), 'ArrowRight');
    expect(tab(1)).toHaveFocus();
    expect(tab(1)).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel a');

    /* `Enter` on a button is a click with no detail, which is what the browser
       synthesises and what the family reads the reason from. */
    fireEvent.click(tab(1), { detail: 0 });
    expect(tab(1)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel b');
  });

  it('says why the value moved, and which device asked', () => {
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);

    fireEvent.click(tab(1), { detail: 1 });
    expect(onValueChange.mock.calls[0]?.[0]).toBe('b');
    expect(onValueChange.mock.calls[0]?.[1].reason).toBe('pointer');
    expect(onValueChange.mock.calls[0]?.[1].previous).toBe('a');

    fireEvent.click(tab(2), { detail: 0 });
    expect(onValueChange.mock.calls[1]?.[1].reason).toBe('keyboard');
  });

  /** No surveyed tabs implementation can refuse a change before it commits. */
  it('lets the consumer refuse the change before anything moves', () => {
    render(<Basic onValueChange={(_value, request) => request.cancel()} />);

    fireEvent.click(tab(1), { detail: 1 });

    expect(tab(0)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel a');
  });

  it('waits for the consumer while the value is theirs', () => {
    function Controlled() {
      const [value, setValue] = useState('a');
      return (
        <>
          <Basic onValueChange={setValue} value={value} />
          <p>value: {value}</p>
        </>
      );
    }
    render(<Controlled />);

    fireEvent.click(tab(2), { detail: 1 });

    expect(screen.getByText('value: c')).toBeInTheDocument();
    expect(tab(2)).toHaveAttribute('aria-selected', 'true');
  });

  it('never moves a value the consumer owns on its own', () => {
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} value="a" />);

    fireEvent.click(tab(1), { detail: 1 });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(tab(0)).toHaveAttribute('aria-selected', 'true');
  });

  it('skips a disabled tab with the arrows and refuses its click', () => {
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="a" onValueChange={onValueChange}>
        <TabList aria-label="Order">
          <Tab value="a">A</Tab>
          <Tab disabled value="b">
            B
          </Tab>
          <Tab value="c">C</Tab>
        </TabList>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    tab(0).focus();
    press(tab(0), 'ArrowRight');
    expect(tab(2)).toHaveFocus();

    fireEvent.click(tab(1), { detail: 1 });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]?.[0]).toBe('c');
  });

  it('reaches every tab with the native attribute when the family is out of action', () => {
    render(<Basic disabled />);

    for (const item of tabs()) expect(item).toBeDisabled();
    expect(root()).toHaveAttribute('data-disabled', '');
  });

  /** The APG's own focus rule for `Delete`, applied to the value as well. */
  it('dismisses with Delete and leaves the selection to the neighbour', () => {
    const onTabDismiss = vi.fn();
    const onValueChange = vi.fn();

    render(
      <Tabs defaultValue="a" onTabDismiss={onTabDismiss} onValueChange={onValueChange}>
        <TabList aria-label="Queries">
          <Tab dismissLabel="Close A" dismissible value="a">
            A
          </Tab>
          <Tab dismissLabel="Close B" dismissible value="b">
            B
          </Tab>
        </TabList>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    expect(tab(0)).toHaveAttribute('aria-keyshortcuts', 'Delete');
    tab(0).focus();
    press(tab(0), 'Delete');

    expect(onTabDismiss.mock.calls[0]?.[0]).toBe('a');
    expect(onTabDismiss.mock.calls[0]?.[1].reason).toBe('keyboard');
    expect(onValueChange.mock.calls[0]?.[0]).toBe('b');
    expect(onValueChange.mock.calls[0]?.[1].reason).toBe('remove');
  });

  /** The tab before it, when the dismissed one was last. */
  it('falls back to the preceding tab when the last one is dismissed', () => {
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="b" onValueChange={onValueChange}>
        <TabList aria-label="Queries">
          <Tab dismissLabel="Close A" dismissible value="a">
            A
          </Tab>
          <Tab dismissLabel="Close B" dismissible value="b">
            B
          </Tab>
        </TabList>
        <TabPanel value="b">b</TabPanel>
      </Tabs>,
    );

    tab(1).focus();
    press(tab(1), 'Delete');

    expect(onValueChange.mock.calls[0]?.[0]).toBe('a');
  });

  it('does not repeat a dismissal while the key is held', () => {
    const onTabDismiss = vi.fn();
    render(
      <Tabs defaultValue="a" onTabDismiss={onTabDismiss}>
        <TabList aria-label="Queries">
          <Tab dismissLabel="Close A" dismissible value="a">
            A
          </Tab>
        </TabList>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    tab(0).focus();
    press(tab(0), 'Delete', { repeat: true });

    expect(onTabDismiss).not.toHaveBeenCalled();
  });

  it('dismisses from the control without selecting the tab it closes', () => {
    const onTabDismiss = vi.fn();
    const onValueChange = vi.fn();

    render(
      <Tabs defaultValue="a" onTabDismiss={onTabDismiss} onValueChange={onValueChange}>
        <TabList aria-label="Queries">
          <Tab dismissLabel="Close A" dismissible value="a">
            A
          </Tab>
          <Tab dismissLabel="Close B" dismissible value="b">
            B
          </Tab>
        </TabList>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close B' }), { detail: 1 });

    expect(onTabDismiss.mock.calls[0]?.[0]).toBe('b');
    expect(onTabDismiss.mock.calls[0]?.[1].reason).toBe('pointer');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps the dismiss control out of the arrow ring and inside the tree', () => {
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="Queries">
          <Tab dismissLabel="Close A" dismissible value="a">
            A
          </Tab>
        </TabList>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    const dismiss = screen.getByRole('button', { name: 'Close A' });
    expect(dismiss).toHaveAttribute('tabindex', '-1');
    expect(dismiss).not.toHaveAttribute('aria-hidden');
  });

  it('lets a dismissal be refused', () => {
    const onValueChange = vi.fn();
    render(
      <Tabs
        defaultValue="a"
        onTabDismiss={(_value, request) => request.cancel()}
        onValueChange={onValueChange}
      >
        <TabList aria-label="Queries">
          <Tab dismissLabel="Close A" dismissible value="a">
            A
          </Tab>
          <Tab dismissLabel="Close B" dismissible value="b">
            B
          </Tab>
        </TabList>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close A' }), { detail: 1 });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  /**
   * A modifier click on a link is the reader asking the browser for a new
   * window, and swallowing it is what turns a real destination into a
   * decoration.
   */
  it('makes a tab a link, and leaves a modifier click to the browser', () => {
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="a" onValueChange={onValueChange}>
        <TabList aria-label="Order">
          <Tab href="/summary" value="a">
            A
          </Tab>
          <Tab href="/itens" value="b">
            B
          </Tab>
        </TabList>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    expect(tab(1)).toHaveAttribute('href', '/itens');

    fireEvent.click(tab(1), { detail: 1, metaKey: true });
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.click(tab(1), { detail: 1 });
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('records which way the selection travelled', () => {
    render(<Basic defaultValue="b" />);

    expect(root()).toHaveAttribute('data-activation-direction', 'none');
    fireEvent.click(tab(2), { detail: 1 });
    expect(root()).toHaveAttribute('data-activation-direction', 'forward');
    fireEvent.click(tab(0), { detail: 1 });
    expect(root()).toHaveAttribute('data-activation-direction', 'backward');
  });

  it('composes with a consumer handler rather than replacing it', () => {
    const onClick = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="a" onValueChange={onValueChange}>
        <TabList aria-label="Order">
          <Tab value="a">A</Tab>
          <Tab onClick={onClick} value="b">
            B
          </Tab>
        </TabList>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    fireEvent.click(tab(1), { detail: 1 });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('lets a consumer handler refuse the selection with preventDefault', () => {
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="a" onValueChange={onValueChange}>
        <TabList aria-label="Order">
          <Tab value="a">A</Tab>
          <Tab onClick={(event) => event.preventDefault()} value="b">
            B
          </Tab>
        </TabList>
        <TabPanel value="a">a</TabPanel>
      </Tabs>,
    );

    fireEvent.click(tab(1), { detail: 1 });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('takes the defaults an application sets once', () => {
    render(
      <TabsDefaultsProvider size="sm" variant="contained">
        <Basic />
      </TabsDefaultsProvider>,
    );

    expect(root()).toHaveAttribute('data-size', 'sm');
    expect(root()).toHaveAttribute('data-variant', 'contained');
  });

  it('lets the family state its own axis over the provider', () => {
    render(
      <TabsDefaultsProvider size="sm">
        <Basic size="lg" />
      </TabsDefaultsProvider>,
    );

    expect(root()).toHaveAttribute('data-size', 'lg');
  });

  it('substitutes the element of every part it exposes', () => {
    render(
      <Tabs defaultValue="a" render={(props) => <section {...props} />}>
        <TabList aria-label="Order" render={(props) => <nav {...props} />}>
          <Tab render={(props) => <span {...props} />} value="a">
            A
          </Tab>
        </TabList>
        <TabPanel render={(props) => <article {...props} />} value="a">
          a
        </TabPanel>
        <TabActions render={(props) => <aside {...props} />}>action</TabActions>
      </Tabs>,
    );

    expect(document.querySelector('section[data-ui="tabs"]')).toBeInTheDocument();
    expect(document.querySelector('nav[data-part="list"]')).toBeInTheDocument();
    expect(document.querySelector('span[data-part="item"]')).toBeInTheDocument();
    expect(document.querySelector('article[data-part="panel"]')).toBeInTheDocument();
    expect(document.querySelector('aside[data-part="actions"]')).toBeInTheDocument();
  });

  it('refuses a tab outside a family rather than rendering a dead control', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Tab value="a">A</Tab>)).toThrow(/inside Tabs/);

    quiet.mockRestore();
  });

  /** Two values that differ only in a character an identifier refuses. */
  it('never wires two tabs to one panel', () => {
    render(
      <Tabs defaultValue="a b" mount="eager">
        <TabList aria-label="Order">
          <Tab value="a b">A</Tab>
          <Tab value="a_b">B</Tab>
        </TabList>
        <TabPanel value="a b">primeiro</TabPanel>
        <TabPanel value="a_b">segundo</TabPanel>
      </Tabs>,
    );

    expect(tab(0).getAttribute('aria-controls')).not.toBe(tab(1).getAttribute('aria-controls'));
    expect(screen.getByText('primeiro')).toBeInTheDocument();
  });
});

/**
 * A panel that reads a promise, the way a panel holding a table reads its rows.
 * Suspending stands in for a render slow enough to block the click's frame.
 */
function Ledger({ rows }: { rows: Promise<string> }) {
  return <p>{use(rows)}</p>;
}

/* The boundary is the page's, outside the tabs — a route's own — so a panel
   that suspends reaches a boundary that has already shown its content. */
function Statement({ rows, deferPanels }: { rows: Promise<string>; deferPanels?: boolean }) {
  return (
    <Suspense fallback={<p>Loading</p>}>
      <Tabs defaultValue="summary" {...(deferPanels === undefined ? {} : { deferPanels })}>
        <TabList aria-label="Statement">
          <Tab value="summary">Summary</Tab>
          <Tab value="ledger">Ledger</Tab>
        </TabList>
        <TabPanel value="summary">
          <p>Totals</p>
        </TabPanel>
        <TabPanel value="ledger">
          <Ledger rows={rows} />
        </TabPanel>
      </Tabs>
    </Suspense>
  );
}

/**
 * Selecting a tab never waits for its panel. The tab paints its selection in
 * the click's frame and the panel renders from the deferred value; while the
 * shown panel lags the selected tab it says so, with aria-busy.
 */
describe('Tabs, deferred panels', () => {
  it('selects the tab at once and keeps the shown panel, busy, until the new one renders', async () => {
    let resolve: (value: string) => void = () => undefined;
    const rows = new Promise<string>((done) => {
      resolve = done;
    });
    render(<Statement deferPanels rows={rows} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Ledger' }));
    });

    expect(screen.getByRole('tab', { name: 'Ledger' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Totals')).toBeVisible();
    expect(screen.queryByText('Loading')).toBeNull();
    const shown = screen.getByText('Totals').closest('[role="tabpanel"]');
    expect(shown).toHaveAttribute('aria-busy', 'true');
    expect(shown).toHaveAttribute('data-pending', '');

    await act(async () => {
      resolve('Twelve postings');
      await rows;
    });

    expect(screen.getByText('Twelve postings')).toBeVisible();
    expect(screen.queryByText('Totals')).toBeNull();
    const ledger = screen.getByText('Twelve postings').closest('[role="tabpanel"]');
    expect(ledger).not.toHaveAttribute('aria-busy');
    expect(ledger).not.toHaveAttribute('data-pending');
  });

  it('defers by default under mount="active", and not when the consumer says false', async () => {
    const rows = new Promise<string>(() => undefined);
    const { unmount } = render(<Statement rows={rows} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Ledger' }));
    });
    expect(screen.getByText('Totals')).toBeVisible();
    unmount();

    render(<Statement deferPanels={false} rows={rows} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Ledger' }));
    });
    expect(screen.getByText('Loading')).toBeVisible();
  });
});
