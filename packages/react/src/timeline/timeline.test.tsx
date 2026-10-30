import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/timeline/contract.json';
import { SlottedProvider } from '../i18n';
import { Timeline } from './timeline';
import { TimelineDefaultsProvider } from './timeline-defaults';
import { TimelineGroup, TimelineItem, TimelineTime } from './timeline-parts';
import type { TimelineProps } from './timeline.types';

const NOW = Date.UTC(2026, 8, 14, 12, 32);

function Invoice(props: Partial<TimelineProps>) {
  return (
    <Timeline label="Invoice activity" locale="en-GB" now={NOW} timeZone="UTC" {...props}>
      <TimelineItem
        description="Draft INV-4821 for Solaris Freight."
        time="2026-09-08T09:12:00Z"
        title="Invoice created"
      />
      <TimelineItem time="2026-09-08T09:15:00Z" title="Sent to client" tone="accent" />
      <TimelineItem current time="2026-09-14T10:32:00Z" title="Paid in full" tone="success" />
      <TimelineItem loading title="Receipt" />
    </Timeline>
  );
}

const root = () => document.querySelector('[data-ui="timeline"]') as HTMLElement;
const items = () => [...root().querySelectorAll('[data-part="item"]')] as HTMLElement[];
const item = (index: number) => items()[index] as HTMLElement;
const part = (element: HTMLElement, name: string) =>
  element.querySelector(`[data-part="${name}"]`) as HTMLElement;

describe('Timeline', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Invoice />);
    expect(root().dataset['ui']).toBe(contract.ui);
    expect(root().dataset['part']).toBe('root');
    for (const name of [
      'list',
      'item',
      'rail',
      'marker',
      'connector',
      'content',
      'title',
      'time',
    ]) {
      expect(root().querySelector(`[data-part="${name}"]`)).not.toBeNull();
    }
  });

  it('is an ordered list by default, with no keyboard of its own', () => {
    render(<Invoice />);
    const list = screen.getByRole('list', { name: 'Invoice activity' });
    expect(list.tagName).toBe('OL');
    expect(item(0).tagName).toBe('LI');
    expect(item(0).hasAttribute('tabindex')).toBe(false);
    expect(item(0).hasAttribute('aria-posinset')).toBe(false);
  });

  it('writes every axis the stylesheet reads', () => {
    render(<Invoice orientation="horizontal" placement="alternate" size="lg" variant="solid" />);
    expect(root().dataset).toMatchObject({
      growing: 'none',
      mode: 'list',
      order: 'oldest-first',
      orientation: 'horizontal',
      placement: 'alternate',
      size: 'lg',
      variant: 'solid',
    });
    expect(item(0).dataset['side']).toBe('end');
    expect(item(1).dataset['side']).toBe('start');
    expect(item(1).dataset['variant']).toBe('solid');
  });

  it('draws no connector after the last event of a list', () => {
    render(<Invoice />);
    expect(part(item(0), 'connector')).not.toBeNull();
    expect(part(item(3), 'connector')).toBeNull();
  });

  it('marks the current event, in the DOM and in ARIA, and reads it after the title', () => {
    render(<Invoice />);
    expect(item(2).getAttribute('aria-current')).toBe('true');
    expect(item(2).dataset['current']).toBe('');
    expect(part(item(2), 'title').textContent).toBe('Paid in full, current');
    expect(item(1).hasAttribute('aria-current')).toBe(false);
  });

  it('claims no completion the consumer did not state', () => {
    render(<Invoice />);
    expect(item(0).hasAttribute('data-complete')).toBe(false);
    expect(item(0).hasAttribute('data-connector')).toBe(false);
  });

  /** The order is what decides where the past is. */
  it('derives completion and the dashed side from the declared order', () => {
    const { unmount } = render(<Invoice autoComplete />);
    expect(item(0).dataset['complete']).toBe('');
    expect(item(1).dataset['complete']).toBe('');
    expect(item(2).hasAttribute('data-complete')).toBe(false);
    expect(item(2).dataset['connector']).toBe('dashed');
    expect(item(3).dataset['connector']).toBe('dashed');
    expect(item(0).hasAttribute('data-connector')).toBe(false);
    unmount();

    render(<Invoice autoComplete order="newest-first" />);
    expect(root().dataset['order']).toBe('newest-first');
    expect(item(3).dataset['complete']).toBe('');
    expect(item(0).hasAttribute('data-complete')).toBe(false);
    expect(item(0).dataset['connector']).toBe('dashed');
    expect(item(2).hasAttribute('data-connector')).toBe(false);
  });

  it('turns the shared ring in a loading marker and says the event is busy', () => {
    render(<Invoice />);
    expect(item(3).dataset['loading']).toBe('');
    expect(item(3).getAttribute('aria-busy')).toBe('true');
    expect(part(item(3), 'marker').querySelector('[data-ui="spinner"]')).not.toBeNull();
  });

  it('writes the timestamp as a time element with the machine value', () => {
    render(<Invoice />);
    const time = part(item(0), 'time') as HTMLTimeElement;
    expect(time.tagName).toBe('TIME');
    expect(time.dateTime).toBe('2026-09-08T09:12:00Z');
    expect(time.textContent).toMatch(/8 Sept 2026, 09:12/);
    expect(time.hasAttribute('title')).toBe(false);
  });

  it('reads a relative time from now and keeps the absolute one in title', () => {
    render(<Invoice locale="en" timeFormat="relative" />);
    const time = part(item(2), 'time');
    expect(time.textContent).toBe('2 hours ago');
    expect(time.getAttribute('title')).toMatch(/10:32/);
  });

  it('formats an instant in the declared zone and a plain value as written', () => {
    render(
      <Timeline label="Zones" locale="en-GB" timeZone="America/Sao_Paulo">
        <TimelineItem time="2026-09-14T10:32:00Z" title="Instant" />
        <TimelineItem time="2026-09-14T10:32" title="Wall clock" />
        <TimelineItem
          time={{
            date: { year: 2026, month: 9, day: 14 },
            time: { hour: 10, minute: 32, second: 0 },
          }}
          title="Plain"
        />
      </Timeline>,
    );
    expect(part(item(0), 'time').textContent).toMatch(/07:32/);
    expect(part(item(1), 'time').textContent).toMatch(/10:32/);
    expect((part(item(2), 'time') as HTMLTimeElement).dateTime).toBe('2026-09-14T10:32:00');
  });

  it('lets the consumer write the visible time and keeps the machine value', () => {
    render(
      <Timeline label="Custom">
        <TimelineItem time="2026-09-14T10:32:00Z" timeLabel="just now" title="Paid" />
      </Timeline>,
    );
    const time = part(item(0), 'time') as HTMLTimeElement;
    expect(time.textContent).toBe('just now');
    expect(time.dateTime).toBe('2026-09-14T10:32:00Z');
  });

  it('renders a time on its own, outside any timeline', () => {
    render(<TimelineTime locale="en-GB" timeZone="UTC" value="2026-09-14T10:32:00Z" />);
    expect(document.querySelector('time')?.textContent).toMatch(/10:32/);
  });

  it('lays out the body in the declared order and writes only the parts given', () => {
    render(
      <Timeline label="Body">
        <TimelineItem
          actions={<button type="button">Retry</button>}
          actor="Ana Ribeiro"
          description="Card declined."
          opposite="Left side"
          time="2026-09-11T08:30:00Z"
          title="Payment failed"
        >
          <p>Extra</p>
        </TimelineItem>
        <TimelineItem title="Bare" />
      </Timeline>,
    );
    const order = [...part(item(0), 'content').children].map((child) =>
      child.getAttribute('data-part') === null ? child.tagName : child.getAttribute('data-part'),
    );
    expect(order).toEqual(['title', 'time', 'actor', 'description', 'P', 'actions']);
    expect(part(item(0), 'opposite').textContent).toBe('Left side');
    expect(part(item(1), 'actor')).toBeNull();
    expect(part(item(1), 'opposite')).toBeNull();
  });

  it('holds the consumer marker in place of the dot', () => {
    render(
      <Timeline label="Marker">
        <TimelineItem marker={<svg data-testid="glyph" />} title="Custom" />
      </Timeline>,
    );
    expect(part(item(0), 'marker').querySelector('[data-testid="glyph"]')).not.toBeNull();
  });

  /**
   * A finished dot holds the family's check, marked so the sheet keeps it a
   * dot; a pending or current dot is empty, and consumer artwork replaces the
   * check.
   */
  it('draws the check glyph in a finished dot and nowhere else', () => {
    const check = (index: number) =>
      part(item(index), 'marker').querySelector('[data-ui="icon"][data-check] > svg[data-glyph]');
    const { unmount } = render(<Invoice autoComplete />);
    expect(check(0)?.getAttribute('data-glyph')).toBe('check');
    expect(check(1)?.getAttribute('data-glyph')).toBe('check');
    expect(part(item(2), 'marker').childElementCount).toBe(0);
    unmount();

    render(
      <Timeline label="Marker">
        <TimelineItem complete marker={<svg data-testid="glyph" />} title="Custom" />
      </Timeline>,
    );
    expect(check(0)).toBeNull();
  });

  it('inherits tone and variant from the root and lets an event override them', () => {
    render(<Invoice tone="accent" variant="subtle" />);
    expect(item(0).dataset['tone']).toBe('accent');
    expect(item(1).dataset['tone']).toBe('accent');
    expect(item(2).dataset['tone']).toBe('success');
    expect(item(0).dataset['variant']).toBe('subtle');
  });

  it('shows the empty part with nothing loaded and hides it while loading', () => {
    const { rerender } = render(<Timeline label="Empty" />);
    expect(part(root(), 'empty').textContent).toBe('No events yet');
    rerender(<Timeline empty={<em>Nothing here</em>} label="Empty" />);
    expect(part(root(), 'empty').textContent).toBe('Nothing here');
    rerender(<Timeline label="Empty" loading />);
    expect(part(root(), 'empty')).toBeNull();
  });
});

describe('Timeline in feed mode', () => {
  it('is a feed of labelled, described, positioned articles', () => {
    render(<Invoice growing="button" mode="feed" />);
    const feed = screen.getByRole('feed', { name: 'Invoice activity' });
    expect(feed.tagName).toBe('DIV');
    const first = item(0);
    expect(first.tagName).toBe('ARTICLE');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('aria-posinset')).toBe('1');
    expect(first.getAttribute('aria-setsize')).toBe('-1');
    const labelled = (first.getAttribute('aria-labelledby') ?? '').split(' ');
    expect(labelled).toHaveLength(2);
    expect(document.getElementById(labelled[0] as string)?.dataset['part']).toBe('title');
    expect(document.getElementById(labelled[1] as string)?.dataset['part']).toBe('time');
    expect(
      document.getElementById(first.getAttribute('aria-describedby') as string)?.textContent,
    ).toBe('Draft INV-4821 for Solaris Freight.');
  });

  it('states the set size it knows, or the loaded count when the feed will not grow', () => {
    const { unmount } = render(<Invoice count={120} growing="scroll" mode="feed" />);
    expect(item(0).getAttribute('aria-setsize')).toBe('120');
    unmount();
    render(<Invoice mode="feed" />);
    expect(item(0).getAttribute('aria-setsize')).toBe('4');
  });

  it('is busy while more is on its way', () => {
    render(<Invoice growing="button" loading mode="feed" />);
    expect(screen.getByRole('feed').getAttribute('aria-busy')).toBe('true');
    expect(root().dataset['loading']).toBe('');
  });

  it('moves focus between articles on PageDown and PageUp', () => {
    render(<Invoice mode="feed" />);
    item(0).focus();
    fireEvent.keyDown(item(0), { key: 'PageDown' });
    expect(document.activeElement).toBe(item(1));
    fireEvent.keyDown(item(1), { key: 'PageDown' });
    expect(document.activeElement).toBe(item(2));
    fireEvent.keyDown(item(2), { key: 'PageUp' });
    expect(document.activeElement).toBe(item(1));
  });

  it('finds the article from a control inside it', () => {
    render(
      <Timeline label="Controls" mode="feed">
        <TimelineItem actions={<button type="button">Retry</button>} title="First" />
        <TimelineItem title="Second" />
      </Timeline>,
    );
    const retry = screen.getByRole('button', { name: 'Retry' });
    retry.focus();
    fireEvent.keyDown(retry, { key: 'PageDown' });
    expect(document.activeElement).toBe(item(1));
  });

  it('leaves the feed on Control+End and Control+Home', () => {
    render(
      <>
        <button type="button">Before</button>
        <Invoice mode="feed" />
        <button type="button">After</button>
      </>,
    );
    item(1).focus();
    fireEvent.keyDown(item(1), { ctrlKey: true, key: 'End' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }));
    item(1).focus();
    fireEvent.keyDown(item(1), { ctrlKey: true, key: 'Home' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Before' }));
  });

  it('runs the consumer keydown first and stops when it refused', () => {
    const onKeyDown = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(<Invoice mode="feed" onKeyDown={onKeyDown} />);
    item(0).focus();
    fireEvent.keyDown(item(0), { key: 'PageDown' });
    expect(onKeyDown).toHaveBeenCalled();
    expect(document.activeElement).toBe(item(0));
  });

  it('asks to load more with the reason the press carries', () => {
    const onLoadMore = vi.fn();
    render(<Invoice growing="button" mode="feed" onLoadMore={onLoadMore} />);
    const more = screen.getByRole('button', { name: 'Load more' });
    expect(more.dataset['part']).toBe('more');
    fireEvent.click(more, { detail: 1 });
    expect(onLoadMore).toHaveBeenLastCalledWith('pointer', expect.anything());
    fireEvent.click(more, { detail: 0 });
    expect(onLoadMore).toHaveBeenLastCalledWith('keyboard', expect.anything());
  });

  it('replaces the more control with the ring while loading', () => {
    render(<Invoice growing="button" loading mode="feed" />);
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    const more = part(root(), 'more');
    expect(more.tagName).toBe('DIV');
    expect(more.querySelector('[data-ui="spinner"]')).not.toBeNull();
    expect(more.textContent).toBe('Loading more events');
  });

  it('holds fresh events behind a pill and asks to reveal them', () => {
    const onReveal = vi.fn();
    const { rerender } = render(<Invoice freshCount={3} mode="feed" onReveal={onReveal} />);
    const fresh = screen.getByRole('button', { name: '3 new events' });
    expect(fresh.dataset['part']).toBe('fresh');
    expect(fresh.nextElementSibling?.getAttribute('role')).toBe('feed');
    fireEvent.click(fresh, { detail: 1 });
    expect(onReveal).toHaveBeenCalledWith('pointer', expect.anything());
    rerender(<Invoice freshCount={0} mode="feed" onReveal={onReveal} />);
    expect(screen.queryByRole('button', { name: /new events/ })).toBeNull();
  });

  it('renders no pill until there is something to hold', () => {
    render(<Invoice mode="feed" />);
    expect(root().querySelector('[data-part="fresh"]')).toBeNull();
  });

  it('keeps the pill mounted and hidden with its last count, so it can leave', () => {
    const { rerender } = render(<Invoice freshCount={3} mode="feed" />);
    rerender(<Invoice freshCount={0} mode="feed" />);
    const fresh = part(root(), 'fresh');
    expect(fresh.hidden).toBe(true);
    expect(fresh.textContent).toBe('3 new events');
    rerender(<Invoice freshCount={2} mode="feed" />);
    expect(fresh.hidden).toBe(false);
    expect(fresh.textContent).toBe('2 new events');
  });

  it('takes the reader to the first revealed event, at the top of a newest-first feed', () => {
    const { rerender } = render(<Invoice freshCount={2} mode="feed" order="newest-first" />);
    part(root(), 'fresh').focus();
    rerender(<Invoice freshCount={0} mode="feed" order="newest-first" />);
    expect(document.activeElement).toBe(root().querySelectorAll('[data-part="item"]')[0]);
  });

  it('takes the reader to the first revealed event after the old ones, oldest-first', () => {
    const { rerender } = render(<Invoice freshCount={2} mode="feed" />);
    part(root(), 'fresh').focus();
    rerender(<Invoice freshCount={0} mode="feed" />);
    const items = root().querySelectorAll('[data-part="item"]');
    expect(document.activeElement).toBe(items[items.length - 2]);
  });

  it('leaves focus alone when the reader was not on the pill', () => {
    const { rerender } = render(<Invoice freshCount={2} mode="feed" />);
    rerender(<Invoice freshCount={0} mode="feed" />);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('TimelineGroup', () => {
  function Grouped(props: {
    collapsible?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    mode?: 'list' | 'feed';
  }) {
    const { mode, ...group } = props;
    return (
      <Timeline label="Grouped" level={2} mode={mode ?? 'list'}>
        <TimelineGroup label="Today" {...group}>
          <TimelineItem title="Paid in full" />
          <TimelineItem title="Receipt sent" />
        </TimelineGroup>
        <TimelineGroup label="Last week" level={4}>
          <TimelineItem current title="Sent to client" />
        </TimelineGroup>
      </Timeline>
    );
  }

  it('is a heading of the declared level over a nested list', () => {
    render(<Grouped />);
    const today = screen.getByRole('heading', { level: 2, name: 'Today' });
    expect(today.dataset['part']).toBe('group-label');
    expect(screen.getByRole('heading', { level: 4, name: 'Last week' })).not.toBeNull();
    const group = today.closest('[data-part="group"]') as HTMLElement;
    expect(group.tagName).toBe('LI');
    expect(part(group, 'group-list').tagName).toBe('OL');
    expect(group.dataset['open']).toBe('');
  });

  it('counts events across groups, in DOM order', () => {
    render(<Grouped mode="feed" />);
    expect(items().map((element) => element.getAttribute('aria-posinset'))).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(item(2).getAttribute('aria-setsize')).toBe('3');
  });

  it('draws no connector after the last event of a group', () => {
    render(<Grouped />);
    expect(part(item(0), 'connector')).not.toBeNull();
    expect(part(item(1), 'connector')).toBeNull();
  });

  it('keeps articles descendants of the feed with no role between', () => {
    render(<Grouped mode="feed" />);
    const group = screen
      .getByRole('heading', { name: 'Today' })
      .closest('[data-part="group"]') as HTMLElement;
    expect(group.tagName).toBe('DIV');
    expect(group.hasAttribute('role')).toBe(false);
    expect(part(group, 'group-list').tagName).toBe('DIV');
  });

  it('folds on its trigger, uncontrolled, and keeps the events in the DOM', () => {
    render(<Grouped collapsible />);
    const trigger = screen.getByRole('button', { name: 'Today, Hide events' });
    expect(trigger.dataset['part']).toBe('group-trigger');
    expect(
      part(trigger, 'group-indicator')
        .querySelector('[data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph'),
    ).toBe('chevron-down');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const list = document.getElementById(
      trigger.getAttribute('aria-controls') as string,
    ) as HTMLElement;
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(list.hidden).toBe(true);
    expect(list.querySelectorAll('[data-part="item"]')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Today, Show events' })).toBe(trigger);
  });

  it('asks before it moves when controlled, with the reason', () => {
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Timeline label="Controlled">
          <TimelineGroup
            collapsible
            label="Today"
            onOpenChange={(next, request) => {
              onOpenChange(next, request.reason);
              setOpen(next);
            }}
            open={open}
          >
            <TimelineItem title="Paid" />
          </TimelineGroup>
        </Timeline>
      );
    }
    render(<Controlled />);
    const trigger = screen.getByRole('button', { name: /Today/ });
    fireEvent.click(trigger, { detail: 0 });
    expect(onOpenChange).toHaveBeenCalledWith(false, 'keyboard');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('skips folded events on the feed keys', () => {
    render(<Grouped collapsible mode="feed" />);
    fireEvent.click(screen.getByRole('button', { name: /Today/ }));
    const open = items().filter((element) => element.closest('[hidden]') === null);
    expect(open).toHaveLength(1);
    open[0]?.focus();
    fireEvent.keyDown(open[0] as HTMLElement, { key: 'PageUp' });
    expect(document.activeElement).toBe(open[0]);
  });
});

describe('TimelineDefaultsProvider', () => {
  it('sets the family defaults once, and an explicit prop still wins', () => {
    render(
      <TimelineDefaultsProvider mode="feed" placement="start" timeFormat="relative" variant="solid">
        <Invoice growing="button" messages={{ loadMore: 'Mais' }} placement="alternate" />
      </TimelineDefaultsProvider>,
    );
    expect(root().dataset['mode']).toBe('feed');
    expect(root().dataset['placement']).toBe('alternate');
    expect(root().dataset['variant']).toBe('solid');
    expect(part(item(2), 'time').textContent).toBe('2 hours ago');
    expect(screen.getByRole('button', { name: 'Mais' })).not.toBeNull();
  });
});

describe('language', () => {
  it('speaks the language in force, a count in its plural', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Timeline freshCount={1} label="Atividade">
          <TimelineItem current time="2026-09-14T10:32:00Z" title="Paga" />
        </Timeline>
      </SlottedProvider>,
    );
    expect(screen.getByRole('button', { name: '1 novo evento' })).not.toBeNull();
    expect(document.querySelector('[data-part="title"]')?.textContent).toBe('Paga, atual');
  });
});

describe('composition', () => {
  it('passes native attributes and a ref to the element that owns them', () => {
    let node: HTMLLIElement | null = null;
    render(
      <Timeline data-testid="tl" label="Native">
        <TimelineItem
          className="mine"
          ref={(element) => {
            node = element;
          }}
          title="Paid"
        />
      </Timeline>,
    );
    expect(screen.getByTestId('tl').dataset['ui']).toBe('timeline');
    expect(item(0).className).toBe('mine');
    expect(node).toBe(item(0));
  });

  it('lets a consumer substitute the rendered element of an event', () => {
    render(
      <Timeline label="Render">
        <TimelineItem render={(props) => <li {...props} data-custom="" />} title="Paid" />
      </Timeline>,
    );
    expect(item(0).hasAttribute('data-custom')).toBe(true);
    expect(part(item(0), 'title').textContent).toBe('Paid');
  });
});
