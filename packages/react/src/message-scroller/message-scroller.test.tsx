import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/message-scroller/contract.json';
import { SlottedProvider } from '../i18n';
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerDefaultsProvider,
  MessageScrollerItem,
  MessageScrollerJump,
  MessageScrollerLoader,
  MessageScrollerSeparator,
  MessageScrollerUnread,
  MessageScrollerViewport,
} from './index';
import type { MessageScrollerHandle } from './index';

/**
 * jsdom has no layout. The viewport is given a height and a scroll height,
 * which is all the engine reads to decide which edges it can scroll toward;
 * the engine's own arithmetic is tested in `@slotted/core/message-scroller`.
 */
function layout(viewport: HTMLElement, { client = 300, scroll = 900 } = {}) {
  let top = 0;
  Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: client });
  Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: scroll });
  Object.defineProperty(viewport, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = Math.max(0, Math.min(value, scroll - client));
      viewport.dispatchEvent(new Event('scroll'));
    },
  });
  viewport.scrollTo = ((options: ScrollToOptions) => {
    viewport.scrollTop = options.top ?? 0;
  }) as never;
}

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <MessageScrollerItem anchor={index % 2 === 0} key={index} messageId={`m${index}`}>
      Mensagem {index}
    </MessageScrollerItem>
  ));

afterEach(() => vi.useRealTimers());

describe('MessageScroller', () => {
  it('is selected in public by the family identifier and writes every contract part', () => {
    render(
      <MessageScroller data-testid="root">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <MessageScrollerLoader />
            <MessageScrollerItem>
              <MessageScrollerSeparator sticky>Today</MessageScrollerSeparator>
            </MessageScrollerItem>
            <MessageScrollerItem>
              <MessageScrollerUnread />
            </MessageScrollerItem>
            {rows(2)}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerJump />
      </MessageScroller>,
    );
    expect(screen.getByTestId('root')).toHaveAttribute('data-ui', contract.ui);
    for (const part of contract.members.messageScroller.parts) {
      if (part === 'root' || part === 'jump-count') continue;
      expect(document.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
  });

  it('is a labelled, focusable region around a log that holds back arrivals while busy', () => {
    const { rerender } = render(
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent data-testid="log">{rows(1)}</MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>,
    );
    const region = screen.getByRole('region', { name: 'Messages' });
    expect(region).toHaveAttribute('tabindex', '0');
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-relevant', 'additions');
    expect(log).not.toHaveAttribute('aria-busy');
    rerender(
      <MessageScroller busy>
        <MessageScrollerViewport>
          <MessageScrollerContent>{rows(1)}</MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>,
    );
    expect(screen.getByRole('log')).toHaveAttribute('aria-busy', 'true');
  });

  it('marks rows by id and anchor', () => {
    render(
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <MessageScrollerItem anchor data-testid="q" messageId="q1" />
            <MessageScrollerItem data-testid="a" messageId="a1" />
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>,
    );
    expect(screen.getByTestId('q')).toHaveAttribute('data-message-id', 'q1');
    expect(screen.getByTestId('q')).toHaveAttribute('data-anchor', 'true');
    expect(screen.getByTestId('a')).not.toHaveAttribute('data-anchor');
  });

  it('keeps the jump control inert while there is nowhere to go, and live once there is', async () => {
    const handle = createRef<MessageScrollerHandle>();
    render(
      <MessageScroller defaultPosition="end" ref={handle}>
        <MessageScrollerViewport data-testid="viewport">
          <MessageScrollerContent>{rows(9)}</MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerJump data-testid="jump" />
      </MessageScroller>,
    );
    const viewport = screen.getByTestId('viewport');
    const jump = screen.getByTestId('jump');
    expect(jump).toHaveAttribute('data-active', 'false');
    expect(jump).toHaveAttribute('tabindex', '-1');

    layout(viewport);
    await act(async () => {
      handle.current?.scrollToStart();
    });
    expect(jump).toHaveAttribute('data-active', 'true');
    expect(jump).toHaveAttribute('tabindex', '0');
    expect(jump).toHaveAccessibleName('Go to the latest');

    fireEvent.click(jump);
    expect(viewport.scrollTop).toBe(600);
    expect(jump).toHaveAttribute('data-active', 'false');
  });

  /**
   * Pending hides the content until the opening position is applied. With no
   * item to position, nothing ever applied it, and a notice placed in the
   * content stayed hidden for good.
   */
  it('shows content that holds no item, without a pending state', () => {
    render(
      <MessageScroller defaultPosition="end" data-testid="root">
        <MessageScrollerViewport data-testid="viewport">
          <MessageScrollerContent>
            <p>Notice</p>
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>,
    );
    expect(screen.getByTestId('root')).not.toHaveAttribute('data-pending');
    expect(screen.getByTestId('viewport')).not.toHaveAttribute('data-pending');
    expect(screen.getByText('Notice')).toBeVisible();
  });

  it('exposes the commands and the frame through its ref', () => {
    const handle = createRef<MessageScrollerHandle>();
    render(
      <MessageScroller data-testid="root" ref={handle}>
        <MessageScrollerViewport>
          <MessageScrollerContent>{rows(3)}</MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>,
    );
    expect(handle.current?.root).toBe(screen.getByTestId('root'));
    expect(handle.current?.scrollToMessage('m1')).toBe(true);
    expect(handle.current?.scrollToMessage('nowhere')).toBe(false);
    act(() => handle.current?.focus());
    expect(screen.getByRole('region')).toHaveFocus();
  });

  it('lays its own words over the language in force', () => {
    render(
      <MessageScrollerDefaultsProvider follow>
        <MessageScroller messages={{ label: 'Conversa', unread: 'Por ler' }}>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              <MessageScrollerItem>
                <MessageScrollerUnread />
              </MessageScrollerItem>
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerDefaultsProvider>,
    );
    expect(screen.getByRole('region', { name: 'Conversa' })).toBeInTheDocument();
    expect(screen.getByText('Por ler')).toBeInTheDocument();
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              <MessageScrollerLoader />
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerJump data-testid="jump" />
        </MessageScroller>
      </SlottedProvider>,
    );
    expect(screen.getByRole('region', { name: 'Mensagens' })).toBeInTheDocument();
    expect(screen.getByText('Carregando mensagens anteriores')).toBeInTheDocument();
    // language: pt-BR
    expect(screen.getByTestId('jump')).toHaveAccessibleName('Ir para a mais recente');
    // language: en-US
  });
});
