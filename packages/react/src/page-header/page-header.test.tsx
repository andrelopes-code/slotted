import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/page-header/contract.json';
import { SlottedProvider } from '../i18n';
import { Page, PageBody } from '../page';
import { PageHeader } from './page-header';
import { PageHeaderDefaultsProvider } from './page-header-defaults';
import {
  PageHeaderActions,
  PageHeaderArea,
  PageHeaderBack,
  PageHeaderBreadcrumbs,
  PageHeaderContent,
  PageHeaderControls,
  PageHeaderDescription,
  PageHeaderFigure,
  PageHeaderHeading,
  PageHeaderMarks,
  PageHeaderNav,
  PageHeaderNavigation,
  PageHeaderPin,
  PageHeaderProgress,
  PageHeaderSubheading,
  PageHeaderTabs,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
  PageHeaderToggle,
  PageHeaderVisual,
} from './page-header-parts';
import type { PageHeaderHandle, PageHeaderProps } from './page-header.types';

/**
 * The observers are stubs the test drives by hand: what is under test is the
 * binding's routing — the request, the reason, the attributes — and the
 * engine's rules are tested in `@slotted/core/sticky-header`.
 */
class FakeIntersectionObserver {
  static last: FakeIntersectionObserver | undefined;
  readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.last = this;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  report(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as never);
  }
}

class FakeResizeObserver {
  static all: FakeResizeObserver[] = [];
  readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.all.push(this);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

/** Every size observer's first report, after layout: the engine's first measurement. */
const laidOut = () =>
  act(() => {
    for (const observer of FakeResizeObserver.all) observer.callback([], observer as never);
  });

function Full({
  title = 'Purchase order PC-2026-004521',
  withPin = true,
  refreshing = false,
  ...props
}: Partial<PageHeaderProps> & { title?: string; withPin?: boolean; refreshing?: boolean }) {
  return (
    <PageHeader {...props}>
      <PageHeaderTitleArea>
        <PageHeaderNav>
          <PageHeaderBack href="#orders">Orders</PageHeaderBack>
          <PageHeaderBreadcrumbs>
            <nav aria-label="Breadcrumb" />
          </PageHeaderBreadcrumbs>
        </PageHeaderNav>
        <PageHeaderTitleRow>
          <PageHeaderVisual>AL</PageHeaderVisual>
          <PageHeaderTitle>
            <PageHeaderHeading>{title}</PageHeaderHeading>
            <PageHeaderMarks>Under review</PageHeaderMarks>
            <PageHeaderSubheading>Aurora Logistics</PageHeaderSubheading>
          </PageHeaderTitle>
          <PageHeaderActions>
            <button type="button">Aprovar</button>
          </PageHeaderActions>
          <PageHeaderNavigation>
            <button type="button">Seguinte</button>
          </PageHeaderNavigation>
        </PageHeaderTitleRow>
      </PageHeaderTitleArea>
      <PageHeaderArea>
        <PageHeaderFigure>photo</PageHeaderFigure>
        <PageHeaderContent>
          <PageHeaderDescription>Tire restocking.</PageHeaderDescription>
          <button type="button">Filter</button>
        </PageHeaderContent>
      </PageHeaderArea>
      <PageHeaderControls>
        <PageHeaderToggle />
        {withPin ? <PageHeaderPin /> : null}
      </PageHeaderControls>
      <PageHeaderProgress delay={0} loading={refreshing} />
      <PageHeaderTabs>
        <div role="tablist" aria-label="Sections" />
      </PageHeaderTabs>
    </PageHeader>
  );
}

const root = () => document.querySelector('[data-ui="page-header"]') as HTMLElement;
const pin = () => screen.getByRole('button', { pressed: false });
const area = () => document.querySelector('[data-part="header-area"]') as HTMLElement;

describe('PageHeader', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    FakeResizeObserver.all = [];
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    vi.unstubAllGlobals();
    FakeIntersectionObserver.last = undefined;
  });

  /**
   * A refresh draws one bar on the chrome's edge, named from the catalog, and
   * writes no aria-busy of its own: the region that waits is the consumer's.
   */
  it('draws a refresh on the edge of the chrome, named from the catalog', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Full refreshing />
      </SlottedProvider>,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar.parentElement).toHaveAttribute('data-part', 'progress');
    expect(bar).toHaveAttribute('data-placement', 'edge-end');
    expect(bar).toHaveAttribute('data-size', 'sm');
    // language: pt-BR
    expect(bar).toHaveAccessibleName('Atualizando página');
    // language: en-US
    expect(document.querySelector('[aria-busy]')).toBeNull();
  });

  it('holds the bar back for the delay, so a fast refresh draws nothing', () => {
    vi.useFakeTimers();
    try {
      render(
        <PageHeader>
          <PageHeaderProgress />
        </PageHeader>,
      );
      const bar = document.querySelector('[data-part="progress"] > [data-ui="progress-indicator"]');
      expect(bar).toHaveAttribute('hidden');
      act(() => void vi.advanceTimersByTime(200));
      expect(bar).not.toHaveAttribute('hidden');
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders the anatomy the contract declares', () => {
    render(<Full />);
    for (const part of contract.members.pageHeader.parts) {
      expect(document.querySelector(`[data-part="${part}"]`)).not.toBeNull();
    }
    expect(root().tagName).toBe('HEADER');
    expect(document.querySelector('h1[data-part="heading"]')).not.toBeNull();
  });

  it('writes the disclosure wiring on the toggle and names the region', () => {
    render(<Full />);
    const control = screen.getByRole('button', { name: 'Collapse header' });
    expect(control).toHaveAttribute('aria-expanded', 'true');
    expect(
      control.querySelector('[data-ui="icon"] > svg[data-glyph="chevron-down"]'),
    ).not.toBeNull();
    expect(control.getAttribute('aria-controls')).toBe(area().id);
    /* The way back keeps its name, and draws a mirrored arrow before it. */
    const back = screen.getByRole('link', { name: 'Orders' });
    expect(back.firstElementChild).toHaveAttribute('data-ui', 'icon');
    expect(back.firstElementChild).toHaveAttribute('data-directional');
    expect(back.querySelector('svg[data-glyph="arrow-left"]')).not.toBeNull();
    expect(screen.getByRole('region', { name: 'Page header' })).toBe(area());
    expect(root()).toHaveAttribute('data-expanded');
  });

  it('collapses from the toggle with the reason the device gave, and stays a button', () => {
    const onExpandedChange = vi.fn();
    render(<Full onExpandedChange={onExpandedChange} />);
    const control = screen.getByRole('button', { name: 'Collapse header' });

    fireEvent.click(control, { detail: 1 });
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(root()).not.toHaveAttribute('data-expanded');
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(control).toHaveAccessibleName('Expand header');
    /* Collapsed by the control, the area leaves the tab sequence. */
    expect(area()).toHaveAttribute('inert');
    expect(area()).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(control, { detail: 0 });
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(area()).not.toHaveAttribute('inert');
  });

  /**
   * Started inside the mount, the engine read the boxes of the page just
   * committed and forced a synchronous layout of it on every route. The first
   * measurement waits for the size observer's first report.
   */
  it('reads no box while it mounts, and measures on the first size report', () => {
    const rects = vi.spyOn(Element.prototype, 'getBoundingClientRect');
    const heights = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get');
    render(<Full />);
    expect(rects).not.toHaveBeenCalled();
    expect(heights).not.toHaveBeenCalled();
    expect(FakeIntersectionObserver.last).toBeUndefined();
    expect(root()).toHaveAttribute('data-expanded');

    laidOut();
    expect(FakeIntersectionObserver.last).toBeDefined();
    rects.mockRestore();
    heights.mockRestore();
  });

  it('collapses with the reason scroll when the area leaves the scrollport, and writes the fact', () => {
    const onExpandedChange = vi.fn();
    render(<Full onExpandedChange={onExpandedChange} />);
    laidOut();

    /* The document has scrolled: only then can the area have left. */
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 });
    act(() => FakeIntersectionObserver.last?.report(false));
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'scroll' }),
    );
    expect(root()).toHaveAttribute('data-scrolled');
    expect(root()).not.toHaveAttribute('data-expanded');
    /* Scrolled past, the area stays in the tab sequence. */
    expect(area()).not.toHaveAttribute('inert');

    act(() => FakeIntersectionObserver.last?.report(true));
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'scroll' }),
    );
    expect(root()).not.toHaveAttribute('data-scrolled');
  });

  it('reveals in place when the toggle opens the area after the scroll has passed it', () => {
    render(<Full />);
    laidOut();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 });
    act(() => FakeIntersectionObserver.last?.report(false));
    const control = screen.getByRole('button', { name: 'Expand header' });

    fireEvent.click(control);
    expect(root()).toHaveAttribute('data-expanded');
    expect(root()).toHaveAttribute('data-revealed');
    expect(root()).toHaveAttribute('data-scrolled');
  });

  it('never moves expanded on scroll under manual collapse', () => {
    const onExpandedChange = vi.fn();
    render(<Full collapse="manual" onExpandedChange={onExpandedChange} />);
    expect(FakeIntersectionObserver.last).toBeUndefined();
    expect(root()).toHaveAttribute('data-collapse', 'manual');
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it('pins as a pressed toggle button, and a pin opens a collapsed area', () => {
    const onPinnedChange = vi.fn();
    const onExpandedChange = vi.fn();
    render(
      <Full
        defaultExpanded={false}
        onPinnedChange={onPinnedChange}
        onExpandedChange={onExpandedChange}
      />,
    );
    const control = pin();
    const glyph = () =>
      control.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
    expect(control).toHaveAttribute('aria-pressed', 'false');
    expect(control).toHaveAccessibleName('Pin header');
    expect(glyph()).toBe('pin');

    fireEvent.click(control, { detail: 1 });
    expect(onPinnedChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'programmatic' }),
    );
    expect(control).toHaveAttribute('aria-pressed', 'true');
    expect(control).toHaveAttribute('data-pressed');
    expect(control).toHaveAccessibleName('Unpin header');
    expect(glyph()).toBe('pin-off');
    expect(root()).toHaveAttribute('data-expanded');
  });

  it('lets the pin go before collapsing by the toggle', () => {
    const onPinnedChange = vi.fn();
    render(<Full defaultPinned onPinnedChange={onPinnedChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse header' }));
    expect(onPinnedChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'programmatic' }),
    );
    expect(root()).not.toHaveAttribute('data-expanded');
  });

  it('stays where the consumer puts it while controlled', () => {
    const onExpandedChange = vi.fn();
    render(<Full expanded onExpandedChange={onExpandedChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse header' }));
    expect(onExpandedChange).toHaveBeenCalledTimes(1);
    expect(root()).toHaveAttribute('data-expanded');
  });

  it('follows the consumer once their new value arrives', () => {
    function Owner() {
      const [expanded, setExpanded] = useState(true);
      return <Full expanded={expanded} onExpandedChange={setExpanded} />;
    }
    render(<Owner />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse header' }));
    expect(root()).not.toHaveAttribute('data-expanded');
  });

  it('lets a request be refused before anything commits', () => {
    render(<Full onExpandedChange={(_next, request) => request.cancel()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse header' }));
    expect(root()).toHaveAttribute('data-expanded');
  });

  it("composes with the consumer's own click handler rather than replacing it", () => {
    const onClick = vi.fn();
    render(
      <PageHeader>
        <PageHeaderArea />
        <PageHeaderControls>
          <PageHeaderToggle onClick={onClick} />
        </PageHeaderControls>
      </PageHeader>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(root()).not.toHaveAttribute('data-expanded');
  });

  it('refuses the move when the consumer prevents the click', () => {
    render(
      <PageHeader>
        <PageHeaderArea />
        <PageHeaderControls>
          <PageHeaderToggle onClick={(event) => event.preventDefault()} />
        </PageHeaderControls>
      </PageHeader>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(root()).toHaveAttribute('data-expanded');
  });

  it('moves from the handle with the reason programmatic', () => {
    const ref = createRef<PageHeaderHandle>();
    const onExpandedChange = vi.fn();
    const onPinnedChange = vi.fn();
    render(<Full ref={ref} onExpandedChange={onExpandedChange} onPinnedChange={onPinnedChange} />);
    expect(ref.current?.element).toBe(root());

    act(() => ref.current?.collapse());
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'programmatic' }),
    );
    act(() => ref.current?.pin());
    expect(onPinnedChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'programmatic' }),
    );
    expect(root()).toHaveAttribute('data-expanded');
    act(() => ref.current?.unpin());
    expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument();
  });

  it('renders the heading at the level asked for, with the full text in its title', () => {
    render(<Full level="2" title="A title" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('title', 'A title');
    expect(heading).toHaveAttribute('data-part', 'heading');
  });

  it("stands skeleton's text shape in for the words while loading", () => {
    render(<Full loading />);
    expect(root()).toHaveAttribute('data-loading');
    expect(root()).toHaveAttribute('aria-busy', 'true');
    const heading = document.querySelector('[data-part="heading"]') as HTMLElement;
    expect(heading.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(heading.textContent).toBe('');
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeEnabled();
  });

  it('takes its defaults from the provider, and its own props over them', () => {
    render(
      <PageHeaderDefaultsProvider collapse="manual" level="2" material size="lg" variant="floating">
        <Full messages={{ collapse: 'Close' }} size="sm" />
      </PageHeaderDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-collapse', 'manual');
    expect(root()).toHaveAttribute('data-level', '2');
    expect(root()).toHaveAttribute('data-size', 'sm');
    expect(root()).toHaveAttribute('data-variant', 'floating');
    expect(root()).toHaveAttribute('data-material', '');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Full />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Recolher cabeçalho' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Cabeçalho da página' })).toBe(area());
    // language: en-US
  });

  it('aligns its rows to the page around it', () => {
    render(
      <Page inset={4} width="measure">
        <Full />
      </Page>,
    );
    const container = root().querySelector('[data-ui="container"]');
    expect(container).toHaveAttribute('data-size', 'measure');
    expect(container).toHaveAttribute('data-inset', '4');
  });

  it('passes native props and substitutes the heading through render', () => {
    render(
      <PageHeader data-testid="ph" lang="pt-BR">
        <PageHeaderTitleArea>
          <PageHeaderTitleRow>
            <PageHeaderTitle>
              <PageHeaderHeading
                render={(props) => (
                  <input {...props} aria-label="Title" children={undefined} defaultValue="x" />
                )}
              >
                x
              </PageHeaderHeading>
            </PageHeaderTitle>
          </PageHeaderTitleRow>
        </PageHeaderTitleArea>
      </PageHeader>,
    );
    expect(screen.getByTestId('ph')).toHaveAttribute('lang', 'pt-BR');
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute('data-part', 'heading');
  });
});

describe('PageHeader parts', () => {
  it('throw outside the family rather than rendering a control that does nothing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<PageHeaderToggle />)).toThrow(/inside PageHeader/);
    vi.restoreAllMocks();
  });

  /**
   * Too much of the screen to hold: on a phone the pin is not offered, and a
   * header held when the fact turns true is let go.
   */
  it('writes data-tall in a phone-wide frame and lets a held one go', () => {
    /* The engine publishes on the next frame; every frame runs at once here,
       from the first, or a frame the mount scheduled would still be pending. */
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    FakeResizeObserver.all = [];
    const onPinnedChange = vi.fn();
    render(<Full defaultPinned onPinnedChange={onPinnedChange} />);
    const pin = document.querySelector('[data-part="pin"]') as HTMLElement;
    expect(pin).toHaveAttribute('aria-pressed', 'true');
    expect(root()).not.toHaveAttribute('data-tall');

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    act(() => {
      for (const observer of FakeResizeObserver.all) observer.callback([], {} as ResizeObserver);
    });
    expect(root()).toHaveAttribute('data-tall');
    expect(pin).toHaveAttribute('aria-pressed', 'false');
    expect(onPinnedChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'programmatic' }),
    );
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  });

  /**
   * Below the compact size class the header is in the flow: the stylesheet
   * reads `data-compact` and takes the root out of `sticky`, and nothing is
   * left for another family to stop under.
   */
  it('writes band by default, and data-stuck once the title area holds with the page scrolled', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    render(<Full />);
    laidOut();
    expect(root()).toHaveAttribute('data-variant', 'band');
    expect(root()).not.toHaveAttribute('data-stuck');
    const title = document.querySelector('[data-part="title-area"]') as HTMLElement;
    vi.spyOn(title, 'getBoundingClientRect').mockImplementation(() => ({ top: 0 }) as DOMRect);
    const scrollTo = (top: number) =>
      act(() => {
        Object.defineProperty(window, 'scrollY', { configurable: true, value: top });
        window.dispatchEvent(new Event('scroll'));
      });
    scrollTo(120);
    expect(root()).toHaveAttribute('data-stuck');
    scrollTo(0);
    expect(root()).not.toHaveAttribute('data-stuck');
  });

  it('writes data-compact in a frame below the compact size class, and takes it off above it', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    FakeResizeObserver.all = [];
    render(<Full />);
    expect(root()).not.toHaveAttribute('data-compact');

    const width = { value: 390 };
    Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => width.value });
    const resize = () =>
      act(() => {
        for (const observer of FakeResizeObserver.all) observer.callback([], {} as ResizeObserver);
      });
    resize();
    expect(root()).toHaveAttribute('data-compact');
    expect(document.documentElement.style.getPropertyValue('--slotted-page-sticky-top')).toBe(
      '0px',
    );

    width.value = 1024;
    resize();
    expect(root()).not.toHaveAttribute('data-compact');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  });
});

/**
 * A page that fills does not scroll: a list inside its body does. The header
 * is given the body, so that list moving down past sixteen pixels snaps the
 * area shut and the same list back at its top opens it again.
 */
describe('PageHeader in a page that fills', () => {
  function Filled({
    fill,
    onExpandedChange,
  }: {
    fill: boolean;
    onExpandedChange: PageHeaderProps['onExpandedChange'];
  }) {
    return (
      <Page fill={fill} scroll="self">
        <PageHeader onExpandedChange={onExpandedChange}>
          <PageHeaderArea />
          <PageHeaderControls>
            <PageHeaderToggle />
          </PageHeaderControls>
        </PageHeader>
        <PageBody>
          <div data-testid="list" />
          <textarea data-testid="note" />
        </PageBody>
      </Page>
    );
  }

  const scrollList = (top: number, testId = 'list') => {
    const list = screen.getByTestId(testId);
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: top });
    act(() => {
      list.dispatchEvent(new Event('scroll'));
    });
  };

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('collapses when a scroller in the body passes sixteen pixels, and re-opens at its top', () => {
    const onExpandedChange = vi.fn();
    render(<Filled fill onExpandedChange={onExpandedChange} />);
    laidOut();

    scrollList(10);
    expect(onExpandedChange).not.toHaveBeenCalled();

    scrollList(40);
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'scroll' }),
    );
    expect(root()).not.toHaveAttribute('data-expanded');

    scrollList(0);
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'scroll' }),
    );
    expect(root()).toHaveAttribute('data-expanded');
  });

  /** A note typed into the body scrolls its own text, not the content the header heads. */
  it('leaves the header alone when a textarea in the body scrolls', () => {
    const onExpandedChange = vi.fn();
    render(<Filled fill onExpandedChange={onExpandedChange} />);
    scrollList(40, 'note');
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(root()).toHaveAttribute('data-expanded');
  });

  it('reads the page on every scroll, so a page that stops filling stops the snap', () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(<Filled fill onExpandedChange={onExpandedChange} />);
    rerender(<Filled fill={false} onExpandedChange={onExpandedChange} />);

    scrollList(40);
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(root()).toHaveAttribute('data-expanded');
  });
});
