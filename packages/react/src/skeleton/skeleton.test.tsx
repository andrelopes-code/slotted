import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SlottedProvider } from '../i18n';
import { Skeleton, SkeletonDefaultsProvider, SkeletonRegion, SkeletonText } from './index';

const box = () => document.querySelector('[data-ui="skeleton"][data-part="root"]')!;
const rows = () => document.querySelectorAll('[data-part="line"]');
const region = () => document.querySelector('[data-part="region"]')!;

describe('Skeleton', () => {
  it('is selected in public by the family identifier, never by a class', () => {
    render(<Skeleton className="app-placeholder" />);

    expect(box()).toHaveAttribute('data-ui', 'skeleton');
    expect(box()).toHaveAttribute('data-part', 'root');
    expect(box()).toHaveClass('app-placeholder');
    expect(box().className).toBe('app-placeholder');
  });

  it('is a line of text at the middle avatar step until told otherwise', () => {
    render(<Skeleton />);

    expect(box()).toHaveAttribute('data-shape', 'text');
    expect(box()).toHaveAttribute('data-size', 'md');
    expect(box()).toHaveAttribute('data-animation', 'shimmer');
  });

  /**
   * A placeholder that was never told anything is a placeholder. Nothing else
   * would make sense: the component exists to stand in for absent content, so
   * the absent answer is the loading one.
   */
  it('paints itself when nothing has said whether the data arrived', () => {
    render(<Skeleton />);

    expect(box()).toHaveAttribute('data-loading');
    expect(box()).toHaveAttribute('aria-hidden', 'true');
    expect(box()).toHaveAttribute('inert');
  });

  it('stops hiding and stops blocking focus once the content has arrived', () => {
    render(
      <Skeleton loading={false}>
        <button type="button">Retry</button>
      </Skeleton>,
    );

    expect(box()).not.toHaveAttribute('data-loading');
    expect(box()).not.toHaveAttribute('aria-hidden');
    expect(box()).not.toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  /**
   * The escape hatch this family established in August: React reads an
   * `undefined`-valued prop as absent, so the way to remove a defaulted ARIA
   * attribute has to be an explicit value.
   */
  it('lets a consumer overrule the hiding with an explicit value', () => {
    render(<Skeleton aria-hidden="false" />);

    expect(box()).toHaveAttribute('aria-hidden', 'false');
  });

  it('reaches the stylesheet through logical custom properties, never width', () => {
    render(<Skeleton blockSize="3rem" inlineSize={120} shape="block" />);

    expect(box().getAttribute('style')).toContain('--slotted-skeleton-inline-size: 120px');
    expect(box().getAttribute('style')).toContain('--slotted-skeleton-block-size: 3rem');
    expect(box().getAttribute('style')).not.toContain('width');
  });

  it('passes native attributes and a ref through to the element that owns them', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Skeleton id="row-placeholder" ref={ref} title="Loading a row" />);

    expect(ref.current).toBe(box());
    expect(box()).toHaveAttribute('id', 'row-placeholder');
    expect(box()).toHaveAttribute('title', 'Loading a row');
  });

  /**
   * The one thing a consumer reconciles when they substitute a different
   * element: the ref is typed for the span this part renders by default.
   * Everything else — the identifiers, the axes and the geometry style —
   * reaches the new element unchanged.
   */
  it('substitutes the rendered element and hands it every attribute', () => {
    render(
      <Skeleton
        inlineSize="4rem"
        render={(props) => <div {...props} ref={props.ref as Ref<HTMLDivElement>} />}
        shape="block"
      />,
    );

    expect(box().tagName).toBe('DIV');
    expect(box()).toHaveAttribute('data-shape', 'block');
    expect(box()).toHaveAttribute('data-loading');
    expect(box().getAttribute('style')).toContain('--slotted-skeleton-inline-size: 4rem');
  });
});

describe('SkeletonText', () => {
  it('reserves three rows by default, and as many as it is asked for', () => {
    const { rerender } = render(<SkeletonText />);
    expect(rows()).toHaveLength(3);

    rerender(<SkeletonText lines={7} />);
    expect(rows()).toHaveLength(7);
  });

  /** A paragraph of no rows is not a paragraph, whatever arithmetic produced it. */
  it('never reserves fewer than one row', () => {
    render(<SkeletonText lines={0} />);

    expect(rows()).toHaveLength(1);
  });

  it('draws no rows at all once the paragraph has arrived', () => {
    render(<SkeletonText loading={false} />);

    expect(rows()).toHaveLength(0);
    expect(document.querySelector('[data-part="text"]')).not.toHaveAttribute('data-loading');
  });

  it('hands the last row’s width to the stylesheet rather than to a row', () => {
    render(<SkeletonText lastLineSize="40%" />);

    const text = document.querySelector('[data-part="text"]')!;
    expect(text.getAttribute('style')).toContain('--slotted-skeleton-last-line-size: 40%');
  });
});

describe('SkeletonRegion', () => {
  it('reports itself busy and announces the wait exactly once', () => {
    render(
      <SkeletonRegion messages={{ label: 'Loading members' }}>
        <SkeletonText />
      </SkeletonRegion>,
    );

    expect(region()).toHaveAttribute('aria-busy', 'true');
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading members');
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  /**
   * Emptying a live region announces nothing, which is what makes one load one
   * announcement. A completion message is opt-in for the same reason.
   */
  it('falls silent when the content arrives, and speaks again only if asked', () => {
    const { rerender } = render(
      <SkeletonRegion loading={false}>
        <SkeletonText />
      </SkeletonRegion>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('');

    rerender(
      <SkeletonRegion loadedLabel="Members loaded" loading={false}>
        <SkeletonText />
      </SkeletonRegion>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Members loaded');
  });

  it('says nothing at all when an application switches the announcement off', () => {
    render(
      <SkeletonRegion live="off">
        <SkeletonText />
      </SkeletonRegion>,
    );

    expect(screen.queryByRole('status')).toBeNull();
  });

  /**
   * The region is the loading fact for its subtree, so an application writes
   * `loading` once per load rather than once per box — and a box that states
   * its own still wins, as an explicit value does everywhere in this library.
   */
  it('tells every placeholder inside it whether the data arrived', () => {
    render(
      <SkeletonRegion loading={false}>
        <SkeletonText />
        <Skeleton />
        <Skeleton loading data-testid="stubborn" />
      </SkeletonRegion>,
    );

    expect(document.querySelector('[data-part="text"]')).not.toHaveAttribute('data-loading');
    expect(box()).not.toHaveAttribute('data-loading');
    expect(screen.getByTestId('stubborn')).toHaveAttribute('data-loading');
  });

  it('hands its animation down, and yields to a box that names its own', () => {
    render(
      <SkeletonRegion animation="pulse">
        <Skeleton />
        <Skeleton animation="none" data-testid="still" />
      </SkeletonRegion>,
    );

    expect(box()).toHaveAttribute('data-animation', 'pulse');
    expect(screen.getByTestId('still')).toHaveAttribute('data-animation', 'none');
  });

  /** The region is never inert: an inert subtree is never announced. */
  it('keeps itself reachable so the announcement is read', () => {
    render(
      <SkeletonRegion>
        <Skeleton />
      </SkeletonRegion>,
    );

    expect(region()).not.toHaveAttribute('inert');
    expect(box()).toHaveAttribute('inert');
  });
});

describe('SkeletonRegion timing', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('paints nothing while the wait is still shorter than the delay', () => {
    render(
      <SkeletonRegion delay={200}>
        <SkeletonText />
      </SkeletonRegion>,
    );
    expect(region()).not.toHaveAttribute('data-loading');

    act(() => void vi.advanceTimersByTime(200));
    expect(region()).toHaveAttribute('data-loading');
  });

  /** The flash: data that arrives before the delay draws no placeholder at all. */
  it('never paints when the data arrives inside the delay', () => {
    const { rerender } = render(
      <SkeletonRegion delay={200}>
        <SkeletonText />
      </SkeletonRegion>,
    );

    act(() => void vi.advanceTimersByTime(80));
    rerender(
      <SkeletonRegion delay={200} loading={false}>
        <SkeletonText />
      </SkeletonRegion>,
    );
    act(() => void vi.advanceTimersByTime(500));

    expect(region()).not.toHaveAttribute('data-loading');
  });

  it('holds a placeholder that did appear, and announces the withdrawal', () => {
    const onReveal = vi.fn();
    const { rerender } = render(
      <SkeletonRegion minDuration={400} onReveal={onReveal}>
        <SkeletonText />
      </SkeletonRegion>,
    );
    expect(region()).toHaveAttribute('data-loading');

    act(() => void vi.advanceTimersByTime(100));
    rerender(
      <SkeletonRegion loading={false} minDuration={400} onReveal={onReveal}>
        <SkeletonText />
      </SkeletonRegion>,
    );

    expect(region()).toHaveAttribute('data-loading');
    expect(onReveal).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(300));
    expect(region()).not.toHaveAttribute('data-loading');
    expect(onReveal).toHaveBeenCalledTimes(1);
  });
});

describe('SkeletonDefaultsProvider', () => {
  it('sets the animation and the measure once for an application, in the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <SkeletonDefaultsProvider animation="pulse" lastLineSize="45%">
          <SkeletonRegion>
            <SkeletonText />
          </SkeletonRegion>
        </SkeletonDefaultsProvider>
      </SlottedProvider>,
    );

    expect(region()).toHaveAttribute('data-animation', 'pulse');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
    expect(document.querySelector('[data-part="text"]')?.getAttribute('style')).toContain(
      '--slotted-skeleton-last-line-size: 45%',
    );
  });

  it('is overruled by anything that states a value of its own', () => {
    render(
      <SkeletonDefaultsProvider animation="pulse">
        <Skeleton animation="shimmer" />
      </SkeletonDefaultsProvider>,
    );

    expect(box()).toHaveAttribute('data-animation', 'shimmer');
  });
});
