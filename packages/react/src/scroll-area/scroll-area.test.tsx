import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/scroll-area/contract.json';
import { SlottedProvider } from '../i18n';
import { ScrollArea } from './scroll-area';
import { ScrollAreaDefaultsProvider } from './scroll-area-defaults';
import type { ScrollAreaHandle, ScrollAreaProps } from './scroll-area.types';

/**
 * jsdom performs no layout, so a scrollport here never overflows unless it is
 * told its sizes. The viewport is the element the family measures, and these
 * give it a box and a content size before the first measurement runs.
 */
function measure(node: HTMLElement | null, sizes: Record<string, number>) {
  if (node === null) return;
  for (const [name, value] of Object.entries(sizes)) {
    Object.defineProperty(node, name, { value, configurable: true, writable: true });
  }
}

const TALL = { clientHeight: 200, scrollHeight: 800, clientWidth: 300, scrollWidth: 300 };
const FITS = { clientHeight: 200, scrollHeight: 200, clientWidth: 300, scrollWidth: 300 };

function Area({
  sizes = TALL,
  ...props
}: Omit<ScrollAreaProps, 'ref'> & {
  sizes?: Record<string, number>;
  ref?: ScrollAreaProps['ref'];
}) {
  const consumerRef = props.viewportProps?.ref;
  return (
    <ScrollArea
      {...props}
      viewportProps={{
        ...props.viewportProps,
        ref: (node) => {
          measure(node, sizes);
          if (typeof consumerRef === 'function') consumerRef(node);
          else if (consumerRef !== null && consumerRef !== undefined) consumerRef.current = node;
        },
      }}
    >
      <ScrollArea.Content>
        <p>An invoice issued before September 1 keeps the old tax lines.</p>
      </ScrollArea.Content>
    </ScrollArea>
  );
}

const root = () => document.querySelector("[data-ui='scroll-area']") as HTMLElement;
const viewport = () => document.querySelector("[data-part='viewport']") as HTMLElement;

describe('identity', () => {
  it('is selected by the identifier the contract declares, with the three parts', () => {
    render(<Area />);

    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(viewport()).toBeInTheDocument();
    expect(document.querySelector("[data-part='content']")).toBeInTheDocument();
  });

  it('writes every axis at its declared default', () => {
    render(<Area />);
    const defaults = contract.members.scrollArea.defaults;

    expect(root()).toHaveAttribute('data-axis', defaults.axis);
    expect(root()).toHaveAttribute('data-scrollbars', defaults.scrollbars);
    expect(root()).toHaveAttribute('data-gutter', defaults.gutter);
    expect(root()).toHaveAttribute('data-fade', defaults.fade);
    expect(root()).toHaveAttribute('data-overscroll', defaults.overscroll);
  });

  it('takes a default from the provider, and lets the instance win over it', () => {
    render(
      <ScrollAreaDefaultsProvider axis="both" fade="end">
        <Area fade="none" />
      </ScrollAreaDefaultsProvider>,
    );

    expect(root()).toHaveAttribute('data-axis', 'both');
    expect(root()).toHaveAttribute('data-fade', 'none');
  });

  it('writes the maximum as a style on the frame and keeps the consumer’s own', () => {
    render(<Area maxBlockSize="20rem" style={{ color: 'red' }} />);

    expect(root().style.maxBlockSize).toBe('20rem');
    expect(root().style.color).toBe('red');
  });
});

describe('the measurement in the DOM', () => {
  it('names the overflowing axis and the ends that show', () => {
    render(<Area />);

    expect(root()).toHaveAttribute('data-overflowing', 'block');
    expect(root()).toHaveAttribute('data-at-block-start', '');
    expect(root()).not.toHaveAttribute('data-at-block-end');
    expect(root()).toHaveAttribute('data-at-inline-start', '');
    expect(root()).toHaveAttribute('data-at-inline-end', '');
  });

  it('shows every end of content that fits, and names no axis', () => {
    render(<Area sizes={FITS} />);

    expect(root()).not.toHaveAttribute('data-overflowing');
    for (const edge of ['block-start', 'block-end', 'inline-start', 'inline-end']) {
      expect(root()).toHaveAttribute(`data-at-${edge}`, '');
    }
  });

  it('draws its ring for a focus from the keyboard, and not for a click followed by Shift', () => {
    /** A pointer press focuses the nearest focusable ancestor, as a browser does. */
    const press = (target: Element) => {
      fireEvent.pointerDown(target);
      target.closest<HTMLElement>('[tabindex], a[href], button')?.focus();
    };
    render(<Area />);
    expect(viewport()).toHaveAttribute('tabindex', '0');

    press(viewport().firstElementChild ?? viewport());
    fireEvent.keyDown(viewport(), { key: 'Shift' });
    expect(document.activeElement).toBe(viewport());
    expect(viewport()).not.toHaveAttribute('data-focus-origin', 'keyboard');

    viewport().blur();
    fireEvent.keyDown(document.body, { key: 'Tab' });
    viewport().focus();
    expect(viewport()).toHaveAttribute('data-focus-origin', 'keyboard');
  });

  it('follows a scroll to the end', () => {
    render(<Area />);

    viewport().scrollTop = 600;
    fireEvent.scroll(viewport());

    expect(root()).not.toHaveAttribute('data-at-block-start');
    expect(root()).toHaveAttribute('data-at-block-end', '');
  });

  it('reports the measurement once, and only a new one', () => {
    const onOverflowChange = vi.fn();
    render(<Area onOverflowChange={onOverflowChange} />);

    expect(onOverflowChange).toHaveBeenCalledTimes(1);
    expect(onOverflowChange.mock.calls[0]?.[0].block.overflowing).toBe(true);

    fireEvent.scroll(viewport());
    expect(onOverflowChange).toHaveBeenCalledTimes(1);

    viewport().scrollTop = 600;
    fireEvent.scroll(viewport());
    expect(onOverflowChange).toHaveBeenCalledTimes(2);
  });

  it('reports the position as a distance from each logical start, with the event', () => {
    const onScrollChange = vi.fn();
    render(<Area onScrollChange={onScrollChange} />);

    viewport().scrollTop = 120;
    fireEvent.scroll(viewport());

    expect(onScrollChange).toHaveBeenCalledTimes(1);
    expect(onScrollChange.mock.calls[0]?.[0]).toEqual({ block: 120, inline: 0 });
    expect(onScrollChange.mock.calls[0]?.[1].type).toBe('scroll');
  });
});

/**
 * There is no APG pattern. The requirement is SC 2.1.1, tested by the
 * `scrollable-region-focusable` rule, and what the tab stop then owes is a
 * name — SC 4.1.2, which Base UI and Zag both answer with `role="presentation"`.
 */
describe('the region', () => {
  it('is a named region with a tab stop while the content overflows', () => {
    render(<Area messages={{ label: 'Release notes' }} />);

    expect(viewport()).toHaveAttribute('role', 'region');
    expect(viewport()).toHaveAttribute('tabindex', '0');
    expect(viewport()).toHaveAccessibleName('Release notes');
    expect(screen.getByRole('region', { name: 'Release notes' })).toBe(viewport());
  });

  it('is nothing at all while the content fits', () => {
    render(<Area sizes={FITS} messages={{ label: 'Release notes' }} />);

    expect(viewport()).not.toHaveAttribute('role');
    expect(viewport()).not.toHaveAttribute('tabindex');
    expect(viewport()).not.toHaveAttribute('aria-label');
  });

  it('is named by the element the consumer points at before by a string', () => {
    render(
      <>
        <h2 id="notes">Release notes</h2>
        <Area labelledBy="notes" messages={{ label: 'ignored' }} />
      </>,
    );

    expect(viewport()).toHaveAttribute('aria-labelledby', 'notes');
    expect(viewport()).not.toHaveAttribute('aria-label');
    expect(viewport()).toHaveAccessibleName('Release notes');
  });

  it('speaks the language in force, in the words prose already uses', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Area />
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(viewport()).toHaveAccessibleName('Conteúdo rolável');
    // language: en-US
  });

  it('speaks the base catalog when nothing else is set', () => {
    render(<Area />);

    expect(viewport()).toHaveAccessibleName('Scrollable content');
  });

  it('leaves the tab sequence alone when the consumer says the content is reachable', () => {
    render(<Area tabbable={false} />);

    expect(viewport()).not.toHaveAttribute('tabindex');
    expect(viewport()).not.toHaveAttribute('role');
  });

  /**
   * Nine keys are the platform's on a focused scrollport, and the family binds
   * none of them: a key handler here would be the reimplementation the contract
   * refuses key by key.
   */
  it('binds no key of its own', () => {
    const onKeyDown = vi.fn();
    render(<Area viewportProps={{ onKeyDown }} />);

    fireEvent.keyDown(viewport(), { key: 'PageDown' });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onKeyDown.mock.calls[0]?.[0].defaultPrevented).toBe(false);
  });
});

describe('the handle', () => {
  function Holder(props: Omit<ScrollAreaProps, 'ref'> & { sizes?: Record<string, number> }) {
    const handle = useRef<ScrollAreaHandle>(null);
    return (
      <>
        <Area {...props} ref={handle} />
        <button onClick={() => handle.current?.scrollToEdge('block-end')}>fim</button>
        <button onClick={() => handle.current?.scrollTo({ block: 50 })}>meio</button>
        <button onClick={() => handle.current?.focus()}>foco</button>
        <output>{JSON.stringify(handle.current?.state().block)}</output>
      </>
    );
  }

  it('reaches both elements', () => {
    const handle = { current: null as ScrollAreaHandle | null };
    render(<Area ref={handle} />);

    expect(handle.current?.root).toBe(root());
    expect(handle.current?.viewport).toBe(viewport());
  });

  it('moves the scrollport and only the scrollport', () => {
    render(<Holder />);
    const calls: ScrollToOptions[] = [];
    Object.defineProperty(viewport(), 'scrollTo', {
      value: (options: ScrollToOptions) => calls.push(options),
      configurable: true,
    });

    fireEvent.click(screen.getByText('fim'));
    fireEvent.click(screen.getByText('meio'));

    expect(calls).toEqual([
      expect.objectContaining({ top: 600 }),
      expect.objectContaining({ top: 50 }),
    ]);
  });

  it('focuses the scrollport', () => {
    render(<Holder />);

    act(() => {
      fireEvent.click(screen.getByText('foco'));
    });

    expect(viewport()).toHaveFocus();
  });

  it('answers the measurement', () => {
    const handle = { current: null as ScrollAreaHandle | null };
    render(<Area ref={handle} />);

    expect(handle.current?.state().block).toEqual({
      overflowing: true,
      atStart: true,
      atEnd: false,
    });
    expect(handle.current?.position()).toEqual({ block: 0, inline: 0 });
  });
});

describe('composition', () => {
  it('composes the consumer’s scroll handler rather than replacing it', () => {
    const onScroll = vi.fn();
    const onScrollChange = vi.fn();
    render(<Area viewportProps={{ onScroll }} onScrollChange={onScrollChange} />);

    fireEvent.scroll(viewport());

    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(onScrollChange).toHaveBeenCalledTimes(1);
  });

  it('passes native props through to the element that owns them', () => {
    render(
      <Area
        className="frame"
        data-testid="frame"
        viewportProps={{ className: 'port', id: 'port' }}
      />,
    );

    expect(screen.getByTestId('frame')).toBe(root());
    expect(document.getElementById('port')).toBe(viewport());
    expect(root()).toHaveClass('frame');
    expect(viewport()).toHaveClass('port');
  });

  it('substitutes the frame and the inset', () => {
    render(
      <ScrollArea render={(props) => <section {...props} />}>
        <ScrollArea.Content render={(props) => <article {...props} />}>corpo</ScrollArea.Content>
      </ScrollArea>,
    );

    expect(root().tagName).toBe('SECTION');
    expect(document.querySelector("[data-part='content']")?.tagName).toBe('ARTICLE');
  });

  it('hands the consumer the scrollport through their own ref as well', () => {
    const port = { current: null as HTMLDivElement | null };
    render(<Area viewportProps={{ ref: port }} />);

    expect(port.current).toBe(viewport());
  });
});
