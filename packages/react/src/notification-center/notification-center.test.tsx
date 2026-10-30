import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/notification-center/contract.json';
import { SlottedProvider } from '../i18n';
import { NotificationCenter } from './notification-center';
import { NotificationCenterDefaultsProvider } from './notification-center-defaults';
import type {
  NotificationCenterHandle,
  NotificationCenterProps,
  NotificationItem,
} from './notification-center.types';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  constructor(readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

const NOW = Date.parse('2026-09-17T10:20:00Z');

const ITEMS: NotificationItem[] = [
  {
    description: 'Shipment SHP-009841 left Columbus with 3 packages.',
    href: '#SO-2026-01842',
    key: 'n1',
    read: false,
    time: '2026-09-17T08:20:00Z',
    title: 'SO-2026-01842 partially fulfilled',
    tone: 'warning',
    visual: <span data-testid="avatar">EX</span>,
  },
  {
    key: 'n2',
    read: false,
    time: '2026-09-17T07:05:00Z',
    title: 'Partial payment on INV-2026-02891',
    tone: 'danger',
  },
  {
    key: 'n3',
    read: true,
    time: '2026-09-16T15:12:00Z',
    title: 'SO-2026-01841 approved within the approval limit',
  },
];

function Centre(props: Partial<NotificationCenterProps>) {
  return <NotificationCenter items={ITEMS} now={NOW} {...props} />;
}

const root = () => document.querySelector('[data-ui="notification-center"]') as HTMLElement;
const feed = () => screen.getByRole('feed');
const articles = () => screen.getAllByRole('article');
const article = (index: number) => articles()[index] as HTMLElement;
const press = (element: HTMLElement, key: string, init: Record<string, unknown> = {}) =>
  fireEvent.keyDown(element, { key, ...init });
/** A click with coordinates is a pointer; `detail: 0` is a key. */
const click = (element: HTMLElement) => fireEvent.click(element, { detail: 1 });

describe('NotificationCenter', () => {
  it('renders the region, the feed and one article per item with the pattern wiring', () => {
    render(<Centre />);

    expect(root()).toHaveAttribute('aria-labelledby', screen.getByRole('heading').id);
    expect(screen.getByRole('heading')).toHaveTextContent('Notifications');
    expect(feed()).toHaveAttribute('aria-labelledby', screen.getByRole('heading').id);
    expect(articles()).toHaveLength(3);
    expect(article(0)).toHaveAttribute('tabindex', '0');
    expect(article(0)).toHaveAttribute('aria-posinset', '1');
    expect(article(0)).toHaveAttribute('aria-setsize', '3');
    expect(article(0)).toHaveAccessibleName('SO-2026-01842 partially fulfilled');
    expect(article(0)).toHaveAccessibleDescription(
      'Shipment SHP-009841 left Columbus with 3 packages.',
    );
    expect(article(0)).toHaveAttribute('data-tone', 'warning');
    expect(article(0)).not.toHaveAttribute('data-read');
    expect(article(2)).toHaveAttribute('data-read');
    expect(article(2)).toHaveAttribute('data-tone', 'accent');
  });

  it('declares every axis on the root and the defaults the contract names', () => {
    render(<Centre />);
    const defaults = contract.members.notificationCenter.defaults;

    expect(root()).toHaveAttribute('data-size', defaults.size);
    expect(root()).toHaveAttribute('data-level', defaults.level);
    expect(root()).toHaveAttribute('data-growing', defaults.growing);
    expect(root()).toHaveAttribute('data-arrivals', defaults.arrivals);
    expect(root()).toHaveAttribute('data-time-format', defaults.timeFormat);
    expect(root()).toHaveAttribute('data-view', defaults.view);
    expect(root()).toHaveAttribute('data-controls', defaults.controls);
    expect(root()).not.toHaveAttribute('data-loading');
  });

  it('renders every part the contract declares', () => {
    render(
      <Centre
        actions={<a href="#p">Preferences</a>}
        footer={<a href="#all">See all</a>}
        groupBy={(item) => (item.read ? 'Yesterday' : 'Today')}
        growing="button"
        items={ITEMS.map((item, index) =>
          index === 0 ? { ...item, actions: <button type="button">Ver</button> } : item,
        )}
      />,
    );
    const parts = new Set(
      [...root().querySelectorAll('[data-part]')].map((element) =>
        element.getAttribute('data-part'),
      ),
    );
    /* empty stands in place of a feed that holds nothing; fresh only while arrivals are held. */
    const expected = contract.members.notificationCenter.parts.filter(
      (part) => !['root', 'empty', 'fresh'].includes(part),
    );
    for (const part of expected) expect(parts.has(part), part).toBe(true);
    expect(root().getAttribute('data-part')).toBe('root');
  });

  it('writes the time as a machine value with relative words, and absolute on request', () => {
    const { rerender } = render(<Centre />);
    const time = article(0).querySelector('time') as HTMLElement;
    expect(time).toHaveAttribute('datetime', '2026-09-17T08:20:00Z');
    expect(time).toHaveTextContent(/2 horas|2 hours|2 h/);
    expect(time).toHaveAttribute('title');

    rerender(<Centre timeFormat="absolute" />);
    expect(root()).toHaveAttribute('data-time-format', 'absolute');
    expect(article(0).querySelector('time')).not.toHaveAttribute('title');
  });

  it('draws a visual for a consumer visual or a tone, and none without either', () => {
    render(<Centre />);
    expect(article(0).querySelector('[data-part="visual"]')).toContainElement(
      screen.getByTestId('avatar'),
    );
    expect(article(0).querySelector('[data-part="visual"] [data-glyph]')).toBeNull();
    /* The family's own visual: the tone's glyph, marked as the family's. */
    expect(
      article(1)
        .querySelector('[data-part="visual"] > [data-ui="icon"][data-tone-glyph] > svg')
        ?.getAttribute('data-glyph'),
    ).toBe('circle-x');
    expect(article(2).querySelector('[data-part="visual"]')).toBeNull();
  });

  it('draws check to mark read, dot to mark unread, and x to dismiss', () => {
    render(<Centre />);
    const glyph = (index: number, part: string) =>
      article(index)
        .querySelector(`[data-part="${part}"] > [data-ui="icon"] > svg[data-glyph]`)
        ?.getAttribute('data-glyph');
    expect(glyph(0, 'read-toggle')).toBe('check');
    expect(glyph(2, 'read-toggle')).toBe('dot');
    expect(glyph(0, 'dismiss')).toBe('x');
  });

  it('asks to mark read and never marks itself', () => {
    const onReadChange = vi.fn();
    render(<Centre onReadChange={onReadChange} />);

    click(screen.getAllByRole('button', { name: 'Mark as read' })[0] as HTMLElement);
    expect(onReadChange).toHaveBeenLastCalledWith(
      { keys: ['n1'], read: true },
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(article(0)).not.toHaveAttribute('data-read');

    fireEvent.click(screen.getByRole('button', { name: 'Mark as unread' }), { detail: 0 });
    expect(onReadChange).toHaveBeenLastCalledWith(
      { keys: ['n3'], read: false },
      expect.objectContaining({ reason: 'keyboard' }),
    );

    click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(onReadChange).toHaveBeenLastCalledWith(
      { keys: ['n1', 'n2'], read: true },
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  /**
   * Two glyphs with no words beside them are two controls nobody can tell
   * apart until they are named: each of the family's own controls opens a
   * tooltip with its accessible name, on keyboard focus in the same task.
   */
  it('names its own controls with a tooltip as well as with aria-label', async () => {
    render(<Centre />);

    /* A key first: jsdom, like a browser, shows focus only after the keyboard was the last thing used. */
    fireEvent.keyDown(document.body, { key: 'Tab' });
    const read = screen.getAllByRole('button', { name: 'Mark as read' })[0] as HTMLElement;
    read.focus();
    fireEvent.focus(read);
    await waitFor(() => expect(document.querySelector('[role="tooltip"]')).not.toBeNull());
    expect(document.querySelector('[role="tooltip"]')).toHaveTextContent('Mark as read');
    fireEvent.blur(read);
    await waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeNull());

    const dismiss = screen.getAllByRole('button', { name: 'Dismiss' })[0] as HTMLElement;
    dismiss.focus();
    fireEvent.focus(dismiss);
    await waitFor(() =>
      expect(document.querySelector('[role="tooltip"]')).toHaveTextContent('Dismiss'),
    );
  });

  it('counts the unread in the heading, disables mark-all at zero and reports the count', () => {
    const onUnreadChange = vi.fn();
    const { rerender } = render(<Centre onUnreadChange={onUnreadChange} />);

    expect(screen.getByRole('heading').querySelector('[data-part="count"]')).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeEnabled();
    expect(onUnreadChange).toHaveBeenLastCalledWith(2);

    rerender(
      <Centre
        items={ITEMS.map((item) => ({ ...item, read: true }))}
        onUnreadChange={onUnreadChange}
      />,
    );
    expect(screen.getByRole('heading').querySelector('[data-part="count"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
    expect(onUnreadChange).toHaveBeenLastCalledWith(0);
    expect(onUnreadChange).toHaveBeenCalledTimes(2);
  });

  it('asks to be removed from the control and from Delete, and moves focus to a neighbour', () => {
    const onRemove = vi.fn();
    render(<Centre onRemove={onRemove} />);

    click(screen.getAllByRole('button', { name: 'Dismiss' })[1] as HTMLElement);
    expect(onRemove).toHaveBeenLastCalledWith('n2', expect.objectContaining({ reason: 'pointer' }));

    article(0).focus();
    press(article(0), 'Delete');
    expect(onRemove).toHaveBeenLastCalledWith(
      'n1',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(article(1)).toHaveFocus();
    expect(articles()).toHaveLength(3);

    onRemove.mockImplementation((_key, request) => request.cancel());
    press(article(1), 'Delete');
    expect(article(1)).toHaveFocus();
  });

  it('asks before a title link navigates and keeps the reader here when refused', () => {
    const onOpen = vi.fn();
    render(<Centre onOpen={onOpen} />);
    const link = screen.getByRole('link', { name: 'SO-2026-01842 partially fulfilled' });

    let event = click(link);
    expect(onOpen).toHaveBeenLastCalledWith('n1', expect.objectContaining({ reason: 'pointer' }));
    expect(event).toBe(true);

    onOpen.mockImplementation((_key, request) => request.cancel());
    event = fireEvent.click(link, { detail: 0 });
    expect(onOpen).toHaveBeenLastCalledWith('n1', expect.objectContaining({ reason: 'keyboard' }));
    expect(event).toBe(false);
  });

  it('moves between articles with PageDown and PageUp and out of the feed with Control', () => {
    render(
      <>
        <button type="button">antes</button>
        <Centre />
        <button type="button">depois</button>
      </>,
    );

    article(0).focus();
    press(article(0), 'PageDown');
    expect(article(1)).toHaveFocus();
    press(article(1), 'PageUp');
    expect(article(0)).toHaveFocus();
    press(article(0), 'End', { ctrlKey: true });
    expect(screen.getByRole('button', { name: 'depois' })).toHaveFocus();
    article(0).focus();
    press(article(0), 'Home', { ctrlKey: true });
    expect(screen.getByRole('tab', { selected: true })).toHaveFocus();
  });

  it('offers all and unread as views, filters under unread, and wires the strip to the feed', () => {
    const onViewChange = vi.fn();
    render(<Centre onViewChange={onViewChange} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute('aria-controls', feed().id);
    expect(tabs[1]).toHaveAttribute('aria-controls', feed().id);
    expect(tabs[1]?.querySelector('[data-part="count"]')).toHaveTextContent('2');

    click(tabs[1] as HTMLElement);
    expect(onViewChange).toHaveBeenLastCalledWith(
      'unread',
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(root()).toHaveAttribute('data-view', 'unread');
    expect(articles()).toHaveLength(2);
  });

  it('holds the view when controlled and honours a refusal', () => {
    const onViewChange = vi.fn((_view, request) => request.cancel());
    render(<Centre onViewChange={onViewChange} view="all" />);

    fireEvent.click(screen.getAllByRole('tab')[1] as HTMLElement);
    expect(onViewChange).toHaveBeenCalled();
    expect(root()).toHaveAttribute('data-view', 'all');
    expect(articles()).toHaveLength(3);
  });

  it('takes the consumer views, draws no strip for one, and leaves their items alone', () => {
    const { rerender } = render(
      <Centre
        defaultView="mentions"
        views={[
          { label: 'All', value: 'all' },
          { label: 'Mentions', value: 'mentions' },
        ]}
      />,
    );
    expect(root()).toHaveAttribute('data-view', 'mentions');
    expect(articles()).toHaveLength(3);

    rerender(<Centre views={[{ label: 'Todas', value: 'all' }]} />);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(root().querySelector('[data-part="views"]')).toBeNull();
  });

  it('holds arrivals while the reader reads and shows them when revealed', async () => {
    const onReveal = vi.fn();
    function Live() {
      const [items, setItems] = useState(ITEMS);
      return (
        <>
          <NotificationCenter items={items} now={NOW} onReveal={onReveal} />
          <button
            onClick={() =>
              setItems((previous) => [
                { key: 'n0', read: false, time: '2026-09-17T10:00:00Z', title: 'Nova' },
                ...previous,
              ])
            }
            type="button"
          >
            chega
          </button>
        </>
      );
    }
    render(<Live />);

    article(0).focus();
    fireEvent.click(screen.getByRole('button', { name: 'chega' }));
    expect(articles()).toHaveLength(3);
    const fresh = screen.getByRole('button', { name: '1 new notification' });
    expect(fresh).toHaveAttribute('data-part', 'fresh');

    press(article(0), 'PageUp');
    expect(fresh).toHaveFocus();

    fireEvent.click(fresh, { detail: 0 });
    expect(onReveal).toHaveBeenLastCalledWith(1, expect.objectContaining({ reason: 'keyboard' }));
    expect(articles()).toHaveLength(4);
    expect(article(0)).toHaveAccessibleName('Nova');
    expect(article(0)).toHaveFocus();
    expect(screen.queryByRole('button', { name: /new notification/ })).toBeNull();
  });

  it('shows arrivals at once when nobody is reading, and always under show', () => {
    function Live({ arrivals }: { arrivals: 'hold' | 'show' }) {
      const [items, setItems] = useState(ITEMS);
      return (
        <>
          <NotificationCenter arrivals={arrivals} items={items} now={NOW} />
          <button
            onClick={() =>
              setItems((previous) => [
                { key: 'n0', read: false, time: '2026-09-17T10:00:00Z', title: 'Nova' },
                ...previous,
              ])
            }
            type="button"
          >
            chega
          </button>
        </>
      );
    }
    const { unmount } = render(<Live arrivals="hold" />);
    fireEvent.click(screen.getByRole('button', { name: 'chega' }));
    expect(articles()).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /new notification/ })).toBeNull();
    unmount();

    render(<Live arrivals="show" />);
    article(0).focus();
    fireEvent.click(screen.getByRole('button', { name: 'chega' }));
    expect(articles()).toHaveLength(4);
  });

  it('applies a change to a shown item and a removal at once even while reading', () => {
    function Live() {
      const [items, setItems] = useState(ITEMS);
      return (
        <>
          <NotificationCenter items={items} now={NOW} />
          <button
            onClick={() =>
              setItems((previous) =>
                previous
                  .filter((item) => item.key !== 'n2')
                  .map((item) => ({ ...item, read: true })),
              )
            }
            type="button"
          >
            muda
          </button>
        </>
      );
    }
    render(<Live />);
    article(0).focus();
    fireEvent.click(screen.getByRole('button', { name: 'muda' }));
    expect(articles()).toHaveLength(2);
    expect(article(0)).toHaveAttribute('data-read');
  });

  it('groups the feed under labels one rank below the title', () => {
    render(<Centre groupBy={(item) => (item.read ? 'Yesterday' : 'Today')} level="3" />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Notifications');
    const labels = screen.getAllByRole('heading', { level: 4 });
    expect(labels.map((label) => label.textContent)).toEqual(['Today', 'Yesterday']);
    expect(root().querySelectorAll('[data-part="group"]')).toHaveLength(2);
    expect(article(2)).toHaveAttribute('aria-posinset', '3');
  });

  it('loads a page from the button, from the sentinel, and says so while waiting', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<Centre growing="button" onLoadMore={onLoadMore} />);

    click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenLastCalledWith(expect.objectContaining({ reason: 'pointer' }));
    expect(article(0)).toHaveAttribute('aria-setsize', '-1');

    rerender(<Centre growing="scroll" onLoadMore={onLoadMore} />);
    const sentinel = root().querySelector('div[data-part="more"]') as HTMLElement;
    expect(sentinel).toBeInTheDocument();
    const observer = FakeIntersectionObserver.instances.at(-1) as FakeIntersectionObserver;
    act(() => {
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver,
      );
    });
    expect(onLoadMore).toHaveBeenLastCalledWith(expect.objectContaining({ reason: 'scroll' }));

    rerender(<Centre count={40} growing="scroll" loading onLoadMore={onLoadMore} />);
    expect(feed()).toHaveAttribute('aria-busy', 'true');
    expect(root()).toHaveAttribute('data-loading');
    expect(root().querySelector('[data-part="more"]')).toHaveTextContent('Loading notifications');
    expect(article(0)).toHaveAttribute('aria-setsize', '40');
  });

  it('stands skeleton rows in while nothing has arrived, and the empty page when nothing will', () => {
    const { rerender } = render(<Centre items={[]} loading />);
    expect(feed()).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(root().querySelectorAll('[data-ui="skeleton"]').length).toBeGreaterThan(0);
    expect(root().querySelector('[data-part="empty"]')).toBeNull();

    rerender(<Centre items={[]} />);
    expect(root().querySelector('[data-part="empty"]')).toHaveTextContent('No notifications');

    rerender(<Centre items={ITEMS.map((item) => ({ ...item, read: true }))} view="unread" />);
    expect(root().querySelector('[data-part="empty"]')).toHaveTextContent('All caught up');

    rerender(<Centre empty={<p>Nothing here</p>} items={[]} />);
    expect(root().querySelector('[data-part="empty"]')).toHaveTextContent('Nothing here');
  });

  it('draws the controls the axis names', () => {
    const { rerender } = render(<Centre controls="read" />);
    expect(screen.getAllByRole('button', { name: /Mark as/ })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();

    rerender(<Centre controls="dismiss" />);
    expect(screen.queryByRole('button', { name: /Mark as read/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(3);

    rerender(<Centre controls="none" />);
    expect(article(0).querySelector('[data-part="controls"]')).toBeNull();
  });

  it('substitutes an item content and keeps the article', () => {
    render(
      <Centre
        renderItem={(item, state) => (
          <span data-part="title" data-part-title="" id={state.ids.title}>
            {state.position}. {item.title} · {state.time.dateTime}
          </span>
        )}
      />,
    );
    expect(article(1)).toHaveAccessibleName(
      '2. Partial payment on INV-2026-02891 · 2026-09-17T07:05:00Z',
    );
    expect(article(1).querySelector('[data-part="read-toggle"]')).not.toBeNull();
  });

  it('reads its defaults from the provider and lets a prop win', () => {
    render(
      <NotificationCenterDefaultsProvider controls="none" growing="button" size="sm">
        <Centre level="4" messages={{ title: 'Avisos' }} />
      </NotificationCenterDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-size', 'sm');
    expect(root()).toHaveAttribute('data-growing', 'button');
    expect(root()).toHaveAttribute('data-controls', 'none');
    expect(root()).toHaveAttribute('data-level', '4');
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Avisos');
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Centre />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(screen.getByRole('heading')).toHaveTextContent('Notificações');
    expect(screen.getByRole('button', { name: 'Marcar tudo como lido' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Não lidas/ })).toBeInTheDocument();
    // language: en-US
  });

  it('keeps a consumer name and native props on the root, and renders through render', () => {
    render(
      <Centre
        aria-label="Caixa de entrada"
        data-testid="nc"
        render={(props) => <div {...(props as ComponentPropsWithRef<'div'>)} data-rendered="" />}
      />,
    );
    const element = screen.getByTestId('nc');
    expect(element).toHaveAttribute('data-rendered');
    expect(element).toHaveAttribute('aria-label', 'Caixa de entrada');
    expect(element).not.toHaveAttribute('aria-labelledby');
    expect(element.tagName).toBe('DIV');
  });

  it('exposes the element, focus, reveal and markAllRead on the handle', () => {
    const onReadChange = vi.fn();
    function WithHandle() {
      const handle = useRef<NotificationCenterHandle>(null);
      return (
        <>
          <NotificationCenter items={ITEMS} now={NOW} onReadChange={onReadChange} ref={handle} />
          <button onClick={() => handle.current?.focus()} type="button">
            focus
          </button>
          <button onClick={() => handle.current?.markAllRead()} type="button">
            read
          </button>
        </>
      );
    }
    render(<WithHandle />);

    fireEvent.click(screen.getByRole('button', { name: 'focus' }));
    expect(article(0)).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'read' }));
    expect(onReadChange).toHaveBeenLastCalledWith(
      { keys: ['n1', 'n2'], read: true },
      expect.objectContaining({ reason: 'programmatic' }),
    );
  });
});
