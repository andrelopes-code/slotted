import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useEffect, useState } from 'react';
import { DASHBOARD_SUBROWS } from '@slotted/core/dashboard-grid';
import { describe, expect, it, vi } from 'vitest';

import { SlottedProvider } from '../i18n';
import { Page, PageBody } from '../page';
import { Section, SectionBody, SectionHeader, SectionTitle } from '../section';
import { DashboardGrid } from './dashboard-grid';
import { DashboardGridDefaultsProvider } from './dashboard-grid-defaults';
import { DashboardWidget } from './dashboard-widget';
import type {
  DashboardEditingRequest,
  DashboardGridHandle,
  DashboardGridProps,
  DashboardLayout,
  DashboardLayoutRequest,
} from './dashboard-grid.types';
import { usePersistedDashboardLayout } from './use-persisted-dashboard-layout';

type LayoutSpy = ReturnType<
  typeof vi.fn<(layout: DashboardLayout, request: DashboardLayoutRequest) => void>
>;
type EditingSpy = ReturnType<
  typeof vi.fn<(editing: boolean, request: DashboardEditingRequest) => void>
>;

/* Revenue and Orders side by side on the first row, the trend under them. */
/**
 * A widget title follows the heading outline, as a section's does: `h2`
 * directly in a page body, one deeper inside a section. The default was 3,
 * which skipped a rank under a page heading of level 1.
 */
describe('DashboardGrid heading outline', () => {
  it('titles its widgets one rank under the page heading', () => {
    render(
      <Page>
        <PageBody>
          <DashboardGrid aria-label="Sales">
            <DashboardWidget value="a" title="A" />
          </DashboardGrid>
        </PageBody>
      </Page>,
    );
    expect(screen.getByRole('heading', { name: 'A' }).tagName).toBe('H2');
  });

  it('goes one rank deeper inside a section', () => {
    render(
      <Page>
        <PageBody>
          <Section>
            <SectionHeader>
              <SectionTitle>Sales</SectionTitle>
            </SectionHeader>
            <SectionBody>
              <DashboardGrid aria-label="Sales">
                <DashboardWidget value="a" title="A" />
              </DashboardGrid>
            </SectionBody>
          </Section>
        </PageBody>
      </Page>,
    );
    expect(screen.getByRole('heading', { name: 'A' }).tagName).toBe('H3');
  });
});

/**
 * The corner link of a widget navigates through the application's router.
 * The family drew a plain anchor, so every press loaded the document again.
 */
describe('DashboardWidget renderDetail', () => {
  it('renders the detail link the application gives, with every attribute', () => {
    const navigate = vi.fn();
    render(
      <DashboardGrid aria-label="Sales">
        <DashboardWidget
          value="revenue"
          title="Revenue"
          detailHref="/revenue"
          renderDetail={(props) => (
            <a
              {...props}
              data-router-link=""
              onClick={(event) => {
                event.preventDefault();
                navigate(props.href);
              }}
            />
          )}
        />
      </DashboardGrid>,
    );
    const link = screen.getByRole('link', { name: /Revenue/ });
    expect(link).toHaveAttribute('data-router-link');
    expect(link).toHaveAttribute('data-part', 'detail');
    expect(link).toHaveAttribute('href', '/revenue');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/revenue');
  });
});

function widgets() {
  return [
    <DashboardWidget
      key="revenue"
      value="revenue"
      title="Revenue"
      defaultColumns={3}
      detailHref="/revenue"
    >
      <p>€ 482,190</p>
    </DashboardWidget>,
    <DashboardWidget key="orders" value="orders" title="Orders" defaultColumns={3}>
      <p>3,914</p>
    </DashboardWidget>,
    <DashboardWidget
      key="trend"
      value="trend"
      title="Revenue by week"
      defaultColumns={12}
      defaultRows={3}
      minColumns={6}
    >
      <p>chart</p>
    </DashboardWidget>,
  ];
}

function mount(props: Partial<DashboardGridProps> = {}) {
  const onLayoutChange: LayoutSpy = vi.fn();
  const onEditingChange: EditingSpy = vi.fn();
  const view = render(
    <DashboardGrid
      aria-label="Sales"
      onLayoutChange={onLayoutChange}
      onEditingChange={onEditingChange}
      {...props}
    >
      {props.children ?? widgets()}
    </DashboardGrid>,
  );
  return { ...view, onLayoutChange, onEditingChange };
}

const root = () => document.querySelector<HTMLElement>('[data-ui="dashboard-grid"]')!;
const order = () =>
  [...document.querySelectorAll<HTMLElement>('[data-part="widget"]')].map(
    (node) => node.dataset['key'],
  );
const widget = (key: string) =>
  document.querySelector<HTMLElement>(`[data-part="widget"][data-key="${key}"]`)!;
const handle = (key: string) =>
  widget(key).querySelector<HTMLButtonElement>('[data-part="handle"]')!;
const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
/* No stylesheet paints a glyph: each one is an `icon` holding the library's `Glyph`. */
const glyphOf = (host: Element | null) =>
  host?.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
/* Rows, read back from the sub-rows the widget is drawn in. */
const place = (key: string) => {
  const style = widget(key).style;
  const [x, top, w, span] = ['--_dg-x', '--_dg-y', '--_dg-w', '--_dg-h'].map((name) =>
    Number(style.getPropertyValue(name)),
  );
  return [x, (top! - 1) / DASHBOARD_SUBROWS + 1, w, span! / DASHBOARD_SUBROWS];
};
/* jsdom lays nothing out: the list gets the width and the row a browser would measure. */
const lay = () => {
  const list = part('grid');
  /* Rows of 80 pixels and gaps of 16, drawn in sub-rows with no gap between them. */
  list.style.gridAutoRows = `${96 / DASHBOARD_SUBROWS}px`;
  list.style.columnGap = '16px';
  list.style.rowGap = '0px';
  Object.defineProperty(list, 'clientWidth', { configurable: true, value: 1200 });
  const frame = { left: 0, top: 0, right: 1200, bottom: 800, width: 1200, height: 800, x: 0, y: 0 };
  Object.defineProperty(list, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ ...frame, toJSON: () => frame }),
  });
};
const itemOf = (layout: DashboardLayout, key: string) => layout.find((item) => item.key === key);

/**
 * A widget is placed by its own props wherever it renders: written directly,
 * inside a fragment, or inside a component of the consumer's that renders it.
 */
describe('DashboardGrid widget discovery', () => {
  function Revenue() {
    return (
      <DashboardWidget value="a" title="A" defaultColumns={6}>
        <p>€ 482,190</p>
      </DashboardWidget>
    );
  }

  it('places a widget a component renders by the widget’s own key, title and size', () => {
    mount({ children: [<Revenue key="revenue" />] });
    expect(order()).toEqual(['a']);
    expect(place('a')[2]).toBe(6);
    expect(screen.getByRole('heading', { name: 'A' })).toBeTruthy();
  });

  it('places a widget inside a fragment', () => {
    mount({
      children: (
        <>
          <DashboardWidget value="a" title="A" defaultColumns={6} />
          <>
            <DashboardWidget value="b" title="B" defaultColumns={3} />
          </>
        </>
      ),
    });
    expect(order()).toEqual(['a', 'b']);
    expect(place('a')[2]).toBe(6);
    expect(place('b')[2]).toBe(3);
  });
});

describe('DashboardGrid', () => {
  it('draws a list of articles named by their titles, in reading order', () => {
    mount();
    expect(screen.getByRole('list', { name: 'Sales' })).toBe(part('grid'));
    expect(order()).toEqual(['revenue', 'orders', 'trend']);
    const article = screen.getByRole('article', { name: 'Revenue' });
    expect(article.getAttribute('data-ui')).toBe('card');
    expect(screen.getByRole('heading', { level: 2, name: 'Revenue' })).toBeTruthy();
    expect(root().hasAttribute('data-editing')).toBe(false);
  });

  it('places every widget at its cell, and draws the DOM by row, then column', () => {
    mount({
      defaultLayout: [
        { key: 'trend', x: 0, y: 0, w: 12, h: 3 },
        { key: 'orders', x: 0, y: 3, w: 3, h: 2 },
        { key: 'revenue', x: 6, y: 3, w: 3, h: 2 },
      ],
    });
    expect(order()).toEqual(['trend', 'orders', 'revenue']);
    expect(place('revenue')).toEqual([7, 4, 3, 2]);
    expect(widget('revenue').style.getPropertyValue('--_dg-span-medium')).toBe('3');
    expect(root().style.getPropertyValue('--_dg-columns-expanded')).toBe('12');
  });

  it('takes the columns and the heading level from a provider, and its own props over it', () => {
    render(
      <DashboardGridDefaultsProvider columns={8} headingLevel={2}>
        <DashboardGrid aria-label="Sales">
          <DashboardWidget value="a" title="A" />
          <DashboardWidget value="b" title="B" headingLevel={4} />
        </DashboardGrid>
      </DashboardGridDefaultsProvider>,
    );
    expect(root().style.getPropertyValue('--_dg-columns-expanded')).toBe('8');
    expect(screen.getByRole('heading', { level: 2, name: 'A' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'B' })).toBeTruthy();
  });

  it('speaks the language in force, and lays its own messages over it', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <DashboardGrid aria-label="Sales" defaultEditing messages={{ done: 'Ready' }}>
          {widgets()}
        </DashboardGrid>
      </SlottedProvider>,
    );
    expect(handle('revenue')).toHaveAccessibleName('Reorganizar Revenue');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ready' })).toBeTruthy();
  });

  it('draws no handle and no resize handle outside editing', () => {
    mount();
    expect(document.querySelector('[data-part="handle"]')).toBeNull();
    expect(document.querySelector('[data-part="resize-handle"]')).toBeNull();
    expect(document.querySelector('[data-part="edit-bar"]')).toBeNull();
  });

  it('stands a handle on each card and the five edges around it while editing', () => {
    mount({ defaultEditing: true });
    expect(root().hasAttribute('data-editing')).toBe(true);
    const button = handle('revenue');
    expect(button.parentElement).toBe(widget('revenue'));
    expect(button.hasAttribute('data-ui')).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Rearrange Revenue');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-describedby')).toBe(part('edit-status').id);
    expect(button.getAttribute('aria-keyshortcuts')).toMatch(/Alt\+ArrowUp.*Delete$/);
    const edges = [...widget('revenue').querySelectorAll('[data-part="resize-handle"]')].map(
      (node) => node.getAttribute('data-edge'),
    );
    expect(edges).toEqual(['start', 'end', 'bottom', 'bottom-start', 'bottom-end']);
  });

  /**
   * A custom property written on the widget in hand restyles everything under
   * it, every frame: on a page carrying a theme, one write cost 12 ms where a
   * `translate` cost 0.3. The pointer moves the widget by its own geometry.
   */
  it('carries a widget by its translate, never by a custom property, and clears it on drop', () => {
    mount({ defaultEditing: true });
    lay();
    const card = widget('revenue').querySelector<HTMLElement>('[data-ui="card"]')!;
    const pointer = (type: string, x: number, y: number) =>
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        clientX: x,
        clientY: y,
      });
    act(() => {
      card.dispatchEvent(pointer('pointerdown', 10, 10));
      document.dispatchEvent(pointer('pointermove', 30, 25));
      document.dispatchEvent(pointer('pointermove', 50, 40));
    });
    const style = widget('revenue').style;
    expect(widget('revenue').hasAttribute('data-dragging')).toBe(true);
    expect(part('grid').hasAttribute('data-gesture')).toBe(true);
    expect(root().hasAttribute('data-gesture')).toBe(false);
    expect(style.translate).toBe('40px 30px');
    expect([...style].filter((name) => name.startsWith('--_dg-lift'))).toEqual([]);
    act(() => {
      document.dispatchEvent(pointer('pointerup', 50, 40));
    });
    expect(widget('revenue').style.translate).toBe('');
    expect(widget('revenue').style.inlineSize).toBe('');
    expect(part('grid').hasAttribute('data-gesture')).toBe(false);
  });

  /**
   * Each cell the pointer crosses previews a layout. A widget the preview
   * leaves where it was is not drawn again: drawing all of them — card, menu,
   * handle and edges — cost 40 ms a crossing on an eleven-widget dashboard.
   */
  it('draws again only the widgets a preview moves', () => {
    let renders = 0;
    let ordersRenders = 0;
    const children = widgets().map((element) =>
      element.key === 'orders' ? (
        <DashboardWidget
          key="orders"
          value="orders"
          title="Orders"
          defaultColumns={3}
          render={(props) => {
            ordersRenders += 1;
            return <li {...props} />;
          }}
        >
          <p>3,914</p>
        </DashboardWidget>
      ) : element.key === 'trend' ? (
        <DashboardWidget
          key="trend"
          value="trend"
          title="Revenue by week"
          defaultColumns={12}
          defaultRows={3}
          render={(props) => {
            renders += 1;
            return <li {...props} />;
          }}
        >
          <p>chart</p>
        </DashboardWidget>
      ) : (
        element
      ),
    );
    mount({ defaultEditing: true, children });
    lay();
    const card = widget('revenue').querySelector<HTMLElement>('[data-ui="card"]')!;
    const pointer = (type: string, x: number, y: number) =>
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        clientX: x,
        clientY: y,
      });
    act(() => {
      card.dispatchEvent(pointer('pointerdown', 10, 10));
      document.dispatchEvent(pointer('pointermove', 30, 10));
    });
    expect(widget('revenue').hasAttribute('data-dragging')).toBe(true);
    const before = renders;
    const ordersBefore = ordersRenders;
    act(() => {
      document.dispatchEvent(pointer('pointermove', 618, 10));
    });
    /* Revenue previews its move past Orders; Orders keeps its cell, and a
       grid of explicit cells has no order to rewrite. */
    expect(place('orders')).toEqual([4, 1, 3, 2]);
    expect(ordersRenders - ordersBefore).toBe(0);
    expect(document.querySelector('[data-part="placeholder"]')).not.toBeNull();
    expect(renders - before).toBe(0);
    act(() => {
      document.dispatchEvent(pointer('pointerup', 618, 10));
    });
  });

  it('pulls a widget by its size, never by a custom property', () => {
    mount({ defaultEditing: true });
    lay();
    const edge = widget('revenue').querySelector<HTMLElement>(
      '[data-part="resize-handle"][data-edge="bottom-end"]',
    )!;
    const pointer = (type: string, x: number, y: number) =>
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        clientX: x,
        clientY: y,
      });
    act(() => {
      edge.dispatchEvent(pointer('pointerdown', 0, 0));
      edge.dispatchEvent(pointer('pointermove', 80, 120));
    });
    const style = widget('revenue').style;
    expect(widget('revenue').hasAttribute('data-resizing')).toBe(true);
    expect(part('grid').hasAttribute('data-gesture')).toBe(true);
    expect(style.inlineSize).toMatch(/px$/);
    expect(style.blockSize).toBe('120px');
    expect([...style].filter((name) => name.startsWith('--_dg-origin'))).toEqual([]);
    act(() => {
      edge.dispatchEvent(pointer('pointerup', 80, 120));
    });
    expect(widget('revenue').style.blockSize).toBe('');
  });

  it('keeps the instructions for the handles when the edit bar is off', () => {
    mount({ defaultEditing: true, editBar: false });
    expect(document.querySelector('[data-part="edit-bar"]')).toBeNull();
    const status = part('edit-status');
    expect(status.dataset['ui']).toBe('visually-hidden');
    expect(handle('orders').getAttribute('aria-describedby')).toBe(status.id);
  });

  it('moves a widget a column on Alt and an arrow, and keeps focus on its handle', () => {
    const { onLayoutChange } = mount({ defaultEditing: true });
    handle('orders').focus();
    fireEvent.keyDown(handle('orders'), { key: 'ArrowRight', altKey: true });
    const [layout, request] = onLayoutChange.mock.calls[0]!;
    expect(itemOf(layout, 'orders')).toMatchObject({ x: 4, y: 0 });
    expect(request.reason).toBe('keyboard');
    expect(request.change).toEqual({ kind: 'move', key: 'orders' });
    expect(place('orders')).toEqual([5, 1, 3, 2]);
    expect(document.activeElement).toBe(handle('orders'));
  });

  it('exchanges places with the widget below on Alt and ArrowDown', () => {
    const { onLayoutChange } = mount({ defaultEditing: true });
    fireEvent.keyDown(handle('revenue'), { key: 'ArrowDown', altKey: true });
    const [layout] = onLayoutChange.mock.calls[0]!;
    expect(itemOf(layout, 'trend')).toMatchObject({ y: 0 });
    expect(itemOf(layout, 'revenue')?.y).toBe(3);
    expect(order()).toEqual(['trend', 'revenue', 'orders']);
  });

  /**
   * A dashboard is usually written as static JSX, with no key on a widget.
   * Drawn by position, a widget that changed places took the content of the
   * one before it: every chart was destroyed and built again on each drop,
   * with its state and its focus.
   */
  it('keeps each widget’s content mounted when the layout changes its order', () => {
    const mounts: string[] = [];
    function Probe({ name }: { name: string }) {
      useEffect(() => {
        mounts.push(name);
      }, [name]);
      return <p>{name}</p>;
    }
    function Board() {
      const [layout, setLayout] = useState<DashboardLayout | undefined>(undefined);
      return (
        <DashboardGrid
          aria-label="Sales"
          defaultEditing
          {...(layout === undefined ? {} : { layout })}
          onLayoutChange={setLayout}
        >
          <DashboardWidget value="revenue" title="Revenue" defaultColumns={3}>
            <Probe name="revenue" />
          </DashboardWidget>
          <DashboardWidget value="orders" title="Orders" defaultColumns={3}>
            <Probe name="orders" />
          </DashboardWidget>
          <DashboardWidget value="trend" title="Trend" defaultColumns={12} defaultRows={3}>
            <section>
              <Probe name="trend" />
            </section>
          </DashboardWidget>
        </DashboardGrid>
      );
    }
    render(<Board />);
    expect(mounts).toEqual(['revenue', 'orders', 'trend']);
    fireEvent.keyDown(handle('revenue'), { key: 'ArrowDown', altKey: true });
    expect(order()).toEqual(['trend', 'revenue', 'orders']);
    expect(mounts).toEqual(['revenue', 'orders', 'trend']);
  });

  it('mirrors the inline arrows in a right-to-left document', () => {
    const { onLayoutChange } = mount({ defaultEditing: true, dir: 'rtl' });
    fireEvent.keyDown(handle('orders'), { key: 'ArrowLeft', altKey: true });
    expect(itemOf(onLayoutChange.mock.calls[0]![0], 'orders')).toMatchObject({ x: 4 });
  });

  it('resizes by the end and the bottom edges on Shift and an arrow, within the limits', () => {
    const { onLayoutChange } = mount({ defaultEditing: true });
    fireEvent.keyDown(handle('trend'), { key: 'ArrowLeft', shiftKey: true });
    expect(itemOf(onLayoutChange.mock.calls[0]![0], 'trend')).toMatchObject({ w: 11 });
    expect(onLayoutChange.mock.calls[0]![1].change).toEqual({ kind: 'resize', key: 'trend' });
    fireEvent.keyDown(handle('revenue'), { key: 'ArrowDown', shiftKey: true });
    expect(itemOf(onLayoutChange.mock.calls[1]![0], 'revenue')).toMatchObject({ h: 3 });
    for (let step = 0; step < 8; step += 1) {
      fireEvent.keyDown(handle('trend'), { key: 'ArrowLeft', shiftKey: true });
    }
    expect(place('trend')[2]).toBe(6);
  });

  it('hides a widget on Delete, with the reason remove, and gives focus to the next', () => {
    const { onLayoutChange } = mount({ defaultEditing: true });
    handle('revenue').focus();
    fireEvent.keyDown(handle('revenue'), { key: 'Delete' });
    const [layout, request] = onLayoutChange.mock.calls[0]!;
    expect(itemOf(layout, 'revenue')?.hidden).toBe(true);
    expect(request.reason).toBe('remove');
    expect(order()).toEqual(['orders', 'trend']);
    expect(document.activeElement).toBe(handle('orders'));
    expect(part('add').textContent).toContain('Add widget');
    expect(glyphOf(part('add'))).toBe('plus');
  });

  it('draws the grip, the detail arrow and the retry mark as glyph elements', () => {
    render(
      <DashboardGrid aria-label="Sales" defaultEditing>
        <DashboardWidget value="a" title="A" detailHref="/a" status="error" onRetry={() => {}} />
      </DashboardGrid>,
    );
    expect(glyphOf(handle('a'))).toBe('grip-horizontal');
    const detail = widget('a').querySelector('[data-part="detail"]');
    expect(glyphOf(detail)).toBe('external');
    /* The arrow points out of the widget, so it turns with the writing direction. */
    expect(detail?.querySelector('[data-ui="icon"]')?.hasAttribute('data-directional')).toBe(true);
    expect(glyphOf(part('retry'))).toBe('rotate-ccw');
  });

  it('refuses a request the consumer cancels, and waits for the consumer when controlled', () => {
    const cancel = vi.fn((_: DashboardLayout, request: DashboardLayoutRequest) => request.cancel());
    const first = mount({ defaultEditing: true, onLayoutChange: cancel });
    fireEvent.keyDown(handle('orders'), { key: 'ArrowRight', altKey: true });
    expect(place('orders')).toEqual([4, 1, 3, 2]);
    first.unmount();
    const { onLayoutChange } = mount({ defaultEditing: true, layout: [] });
    fireEvent.keyDown(handle('orders'), { key: 'ArrowRight', altKey: true });
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(place('orders')).toEqual([4, 1, 3, 2]);
  });

  it('leaves a pinned widget where it is', () => {
    const { onLayoutChange } = mount({
      defaultEditing: true,
      children: [
        <DashboardWidget key="a" value="a" title="A" defaultColumns={3} movable={false} />,
        <DashboardWidget key="b" value="b" title="B" defaultColumns={3} />,
      ],
    });
    fireEvent.keyDown(handle('a'), { key: 'ArrowRight', altKey: true });
    expect(onLayoutChange).not.toHaveBeenCalled();
    fireEvent.keyDown(handle('b'), { key: 'ArrowLeft', altKey: true });
    expect(itemOf(onLayoutChange.mock.calls[0]![0], 'a')).toMatchObject({ x: 0, y: 0 });
  });

  it('cancels back to the layout editing began from, then leaves editing', () => {
    const { onLayoutChange, onEditingChange } = mount({ defaultEditing: true });
    fireEvent.keyDown(handle('revenue'), { key: 'ArrowDown', altKey: true });
    expect(order()).toEqual(['trend', 'revenue', 'orders']);
    fireEvent.click(part('cancel'), { detail: 1 });
    const [layout, request] = onLayoutChange.mock.calls[1]!;
    expect(itemOf(layout, 'revenue')).toMatchObject({ x: 0, y: 0 });
    expect(request.reason).toBe('dismiss');
    expect(request.change).toEqual({ kind: 'cancel', key: null });
    expect(onEditingChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(order()).toEqual(['revenue', 'orders', 'trend']);
    expect(root().hasAttribute('data-editing')).toBe(false);
  });

  it('leaves editing with the reason submit from Done, and keeps it on Escape', () => {
    const { onEditingChange } = mount({ defaultEditing: true });
    fireEvent.keyDown(handle('revenue'), { key: 'Escape' });
    expect(onEditingChange).not.toHaveBeenCalled();
    fireEvent.click(part('done'));
    expect(onEditingChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'submit' }),
    );
  });

  it('resets to the layout the grid was given', () => {
    const { onLayoutChange } = mount({
      defaultEditing: true,
      defaultLayout: [{ key: 'trend', x: 0, y: 0, w: 8, h: 4 }],
    });
    fireEvent.keyDown(handle('trend'), { key: 'ArrowRight', shiftKey: true });
    fireEvent.click(part('reset'), { detail: 1 });
    const [layout, request] = onLayoutChange.mock.calls.at(-1)!;
    expect(itemOf(layout, 'trend')).toEqual({ key: 'trend', x: 0, y: 0, w: 8, h: 4 });
    expect(request.change.kind).toBe('reset');
  });

  it('resets to every widget at its defaults when given no layout', () => {
    const { onLayoutChange } = mount({ defaultEditing: true });
    fireEvent.keyDown(handle('trend'), { key: 'ArrowLeft', shiftKey: true });
    fireEvent.click(part('reset'), { detail: 1 });
    const [layout] = onLayoutChange.mock.calls.at(-1)!;
    expect(layout.map((item) => [item.key, item.x, item.y, item.w])).toEqual([
      ['revenue', 0, 0, 3],
      ['orders', 3, 0, 3],
      ['trend', 0, 2, 12],
    ]);
  });

  it('keeps an entry no widget holds in the value it asks for', () => {
    const { onLayoutChange } = mount({
      defaultEditing: true,
      defaultLayout: [{ key: 'gone', x: 0, y: 0, w: 2, h: 2 }],
    });
    fireEvent.keyDown(handle('orders'), { key: 'ArrowRight', altKey: true });
    expect(onLayoutChange.mock.calls[0]![0].at(-1)).toEqual({
      key: 'gone',
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    });
  });

  it('shows the empty state when every widget is hidden', () => {
    mount({
      defaultLayout: ['revenue', 'orders', 'trend'].map((key) => ({
        key,
        x: 0,
        y: 0,
        w: 3,
        h: 2,
        hidden: true,
      })),
    });
    expect(part('grid').hidden).toBe(true);
    expect(part('empty').textContent).toContain('No widgets');
  });

  it('reaches the imperative actions through its handle', () => {
    const ref = createRef<DashboardGridHandle>();
    const { onEditingChange } = mount({ defaultEditing: true, ref });
    expect(ref.current?.element).toBe(root());
    act(() => ref.current?.focusWidget('orders'));
    expect(document.activeElement).toBe(handle('orders'));
    act(() => ref.current?.commitEditing());
    expect(onEditingChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'programmatic' }),
    );
  });

  it('passes native props to the root and composes its handlers', () => {
    const onKeyDown = vi.fn();
    mount({ id: 'board', className: 'x', onKeyDown });
    expect(root().id).toBe('board');
    fireEvent.keyDown(root(), { key: 'a' });
    expect(onKeyDown).toHaveBeenCalled();
  });
});

describe('DashboardWidget', () => {
  it('shows the empty message with the consumer’s action', () => {
    render(
      <DashboardGrid aria-label="Sales">
        <DashboardWidget
          value="a"
          title="A"
          status="empty"
          emptyDescription="Nothing yet"
          emptyAction={<button type="button">Create</button>}
        />
      </DashboardGrid>,
    );
    expect(widget('a').dataset['status']).toBe('empty');
    expect(part('message').textContent).toContain('No data');
    expect(part('message').textContent).toContain('Nothing yet');
    expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy();
  });

  it('shows the error message with Try again, which calls onRetry', () => {
    const onRetry = vi.fn();
    render(
      <DashboardGrid aria-label="Sales">
        <DashboardWidget value="a" title="A" status="error" onRetry={onRetry} />
      </DashboardGrid>,
    );
    fireEvent.click(part('retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('keeps the header and waits in the body while loading, with aria-busy', () => {
    render(
      <DashboardGrid aria-label="Sales">
        <DashboardWidget value="a" title="A" loading>
          <p>content</p>
        </DashboardWidget>
      </DashboardGrid>,
    );
    expect(widget('a').hasAttribute('data-loading')).toBe(true);
    expect(screen.getByRole('heading', { name: 'A' })).toBeTruthy();
    expect(part('skeleton').querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(screen.queryByText('content')).toBeNull();
    expect(screen.getByRole('article', { name: 'A' }).getAttribute('aria-busy')).toBe('true');
  });

  it('keeps the content and draws the busy line while refreshing', () => {
    render(
      <DashboardGrid aria-label="Sales">
        <DashboardWidget value="a" title="A" busy>
          <p>content</p>
        </DashboardWidget>
      </DashboardGrid>,
    );
    expect(screen.getByText('content')).toBeTruthy();
    expect(part('busy-indicator').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('article', { name: 'A' }).getAttribute('aria-busy')).toBe('true');
  });

  it('links to the widget’s own page', () => {
    mount();
    const link = screen.getByRole('link', { name: 'Open Revenue' });
    expect(link.getAttribute('href')).toBe('/revenue');
    expect(link.dataset['part']).toBe('detail');
  });
});

describe('usePersistedDashboardLayout', () => {
  function Persisted({
    storage,
    defaultLayout,
  }: {
    storage: Storage;
    defaultLayout?: DashboardLayout;
  }) {
    const persisted = usePersistedDashboardLayout({
      key: 'sales',
      storage,
      ...(defaultLayout === undefined ? {} : { defaultLayout }),
    });
    const [editing] = useState(true);
    return (
      <DashboardGrid aria-label="Sales" editing={editing} {...persisted}>
        {widgets()}
      </DashboardGrid>
    );
  }

  it('reads the stored layout and writes every change', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    } as Storage;
    store.set('sales', '{"v":2,"items":[["trend",0,0,12,3]]}');
    render(<Persisted storage={storage} />);
    expect(order()).toEqual(['trend', 'revenue', 'orders']);
    fireEvent.keyDown(handle('orders'), { key: 'ArrowRight', altKey: true });
    const stored = JSON.parse(store.get('sales')!).items as unknown[][];
    expect(stored.find((item) => item[0] === 'orders')).toEqual(['orders', 4, 3, 3, 2]);
  });

  it('hands the grid its default, which Reset asks for', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    } as Storage;
    render(
      <Persisted storage={storage} defaultLayout={[{ key: 'trend', x: 0, y: 0, w: 8, h: 4 }]} />,
    );
    fireEvent.keyDown(handle('trend'), { key: 'ArrowRight', shiftKey: true });
    fireEvent.click(part('reset'), { detail: 1 });
    const stored = JSON.parse(store.get('sales')!).items as unknown[][];
    expect(stored.find((item) => item[0] === 'trend')).toEqual(['trend', 0, 0, 8, 4]);
  });

  it('starts from the default when the store holds text it cannot read', () => {
    const storage = {
      getItem: () => 'not a layout',
      setItem: () => {},
      removeItem: () => {},
    } as unknown as Storage;
    render(<Persisted storage={storage} />);
    expect(order()).toEqual(['revenue', 'orders', 'trend']);
  });
});
