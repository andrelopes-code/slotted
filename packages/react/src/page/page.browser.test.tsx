import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { cdp, page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppShell, AppShellBanner, AppShellBrand, AppShellMain } from '../app-shell';
import { DetailPanel, DetailPanelBody } from '../detail-panel';
import {
  PageHeader,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
} from '../page-header';
import { Section } from '../section';
import { Page, PageBody, PageFooter, usePageSizeClass } from './index';

const THEME = {
  '--slotted-page-footer-background': 'rgb(10 20 30 / 0.5)',
  '--slotted-page-footer-backdrop-filter': 'blur(7px)',
  '--slotted-detail-panel-footer-background': 'rgb(40 50 60 / 0.5)',
  '--slotted-detail-panel-footer-backdrop-filter': 'blur(5px)',
};

function paint(element: Element) {
  const style = getComputedStyle(element);
  return { background: style.backgroundColor, filter: style.backdropFilter };
}

/**
 * A theme draws the bars at the bottom edge as a material: a ground with
 * alpha and a filter behind it, each from the family's own tokens. A reader
 * who asked for less transparency gets no filter whatever the theme set.
 */
describe('a footer drawn as a material', () => {
  afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
  });

  it('paints the page footer’s ground and filter from its tokens', () => {
    render(
      <div style={THEME as React.CSSProperties}>
        <Page footer={<PageFooter>Save</PageFooter>}>
          <PageBody>Content</PageBody>
        </Page>
      </div>,
    );
    expect(paint(document.querySelector('[data-ui="page"] > [data-part="footer"]')!)).toEqual({
      background: 'rgba(10, 20, 30, 0.5)',
      filter: 'blur(7px)',
    });
  });

  it('paints the detail panel footer’s ground and filter from its own tokens', () => {
    render(
      <div style={THEME as React.CSSProperties}>
        <DetailPanel footer="Save">
          <DetailPanelBody>Content</DetailPanelBody>
        </DetailPanel>
      </div>,
    );
    const footer = document.querySelector('[data-ui="detail-panel"] > [data-part="footer"]')!;
    expect(paint(footer)).toEqual({ background: 'rgba(40, 50, 60, 0.5)', filter: 'blur(5px)' });
  });

  /** Chromium draws no backdrop filter on an element whose opacity is below one. */
  it('keeps the footer opaque through its enter and its exit, so the filter is drawn', async () => {
    /* The test document has no theme; without a duration the footer neither enters nor exits. */
    const view = (footer: boolean) => (
      <div style={{ ...THEME, '--slotted-duration-medium': '200ms' } as React.CSSProperties}>
        <Page footer={footer ? <PageFooter>Save</PageFooter> : undefined}>
          <PageBody>Content</PageBody>
        </Page>
      </div>
    );
    const { rerender } = render(view(false));
    rerender(view(true));
    const entering = document.querySelector('[data-ui="page"] > [data-part="footer"]')!;
    await expect.poll(() => entering.getAttribute('data-status')).toBe('entering');
    expect(getComputedStyle(entering).opacity).toBe('1');
    await expect.poll(() => entering.getAttribute('data-status')).toBe('open');
    rerender(view(false));
    const exiting = document.querySelector('[data-ui="page"] > [data-part="footer"]')!;
    await expect.poll(() => exiting.getAttribute('data-status')).toBe('exiting');
    expect(getComputedStyle(exiting).opacity).toBe('1');
    expect(getComputedStyle(exiting).backdropFilter).toBe('blur(7px)');
  });

  it('filters nothing under reduced transparency', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    render(
      <div style={THEME as React.CSSProperties}>
        <Page footer={<PageFooter>Save</PageFooter>}>
          <PageBody>
            <DetailPanel footer="Save">
              <DetailPanelBody>Content</DetailPanelBody>
            </DetailPanel>
          </PageBody>
        </Page>
      </div>,
    );
    for (const footer of document.querySelectorAll('[data-part="footer"]')) {
      expect(getComputedStyle(footer).backdropFilter).toBe('none');
    }
  });
});

/**
 * Under an inset canvas the frame shows above and below the scroller, so the
 * scroller is shorter than the viewport. A sticky element of the consumer's
 * capped by the page's published scroller height ends inside the scroller;
 * capped by `100dvh` it ran past it by the frame.
 */
describe('a consumer’s sticky element under an inset application frame', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('caps itself by the scroller the page publishes, not by the viewport', async () => {
    await page.viewport(1440, 900);
    render(
      <AppShell canvas="inset" navMode="inline" style={{ blockSize: '100dvh' }}>
        <AppShellBanner>
          <AppShellBrand>Ledger</AppShellBrand>
        </AppShellBanner>
        <AppShellMain>
          <Page>
            <PageHeader>
              <PageHeaderTitleArea>
                <PageHeaderTitleRow>
                  <PageHeaderTitle>Orders</PageHeaderTitle>
                </PageHeaderTitleRow>
              </PageHeaderTitleArea>
            </PageHeader>
            <PageBody>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 20rem', alignItems: 'start' }}
              >
                <div style={{ blockSize: 3000 }} />
                <aside
                  data-testid="summary"
                  style={{
                    position: 'sticky',
                    insetBlockStart: 'calc(var(--slotted-page-sticky-top, 0px) + 16px)',
                    maxBlockSize:
                      'calc(var(--slotted-page-scrollport-block-size, 100dvh) - var(--slotted-page-sticky-top, 0px) - var(--slotted-page-sticky-bottom, 0px) - 2 * 16px)',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ blockSize: 2000 }} />
                </aside>
              </div>
            </PageBody>
          </Page>
        </AppShellMain>
      </AppShell>,
    );
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    for (let index = 0; index < 3; index += 1) await frame();
    const summary = document.querySelector<HTMLElement>('[data-testid="summary"]')!;
    let scroller: HTMLElement | null = summary.parentElement;
    while (scroller !== null && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }
    scroller = scroller!;
    expect(scroller.clientHeight).toBeLessThan(window.innerHeight);

    for (const top of [500, 900]) {
      scroller.scrollTop = top;
      for (let index = 0; index < 3; index += 1) await frame();
      expect(summary.getBoundingClientRect().bottom, `${top}`).toBeLessThanOrEqual(
        scroller.getBoundingClientRect().bottom + 0.5,
      );
    }
  });
});

describe('the blocks of a page body', () => {
  const TOKENS = {
    '--slotted-page-block-gap': '13px',
    '--slotted-page-section-gap': '29px',
    '--slotted-page-inset-compact': '16px',
    inlineSize: 390,
  } as CSSProperties;

  it('stand at the block gap, and a section without a surface at the section gap', () => {
    const { container } = render(
      <div style={{ ...TOKENS, inlineSize: 800 }}>
        <Page>
          <PageBody>
            <div data-testid="one">One</div>
            <div data-testid="two">Two</div>
            <Section data-testid="section" title="Section">
              Body
            </Section>
          </PageBody>
        </Page>
      </div>,
    );
    const box = (id: string) =>
      container.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect();
    const column = container.querySelector('[data-part="body"] > [data-ui="container"]')!;

    expect(getComputedStyle(column).rowGap).toBe('13px');
    expect(box('two').top - box('one').bottom).toBeCloseTo(13, 0);
    expect(box('section').top - box('two').bottom).toBeCloseTo(29, 0);
  });

  it('leave a body of flow none to its own layout', () => {
    const { container } = render(
      <div style={TOKENS}>
        <Page>
          <PageBody flow="none">
            <div>One</div>
          </PageBody>
        </Page>
      </div>,
    );
    const column = container.querySelector('[data-part="body"] > [data-ui="container"]')!;

    expect(getComputedStyle(column).rowGap).toBe('normal');
  });

  it('take the compact inset the theme sets below 600 pixels', () => {
    const { container } = render(
      <div style={TOKENS}>
        <Page>
          <PageBody>
            <div data-testid="one">One</div>
          </PageBody>
        </Page>
      </div>,
    );
    const column = container.querySelector('[data-part="body"] > [data-ui="container"]')!;
    const one = container.querySelector('[data-testid="one"]')!;

    expect(one.getBoundingClientRect().left - column.getBoundingClientRect().left).toBeCloseTo(
      16,
      0,
    );
  });
});

describe('a level-1 detail panel in a page body', () => {
  it('reads as the page itself: one inset to its heading, a hairline across the page', () => {
    const { container } = render(
      <div style={{ inlineSize: 390 }}>
        <Page width="full">
          <PageBody>
            <DetailPanel level="1" scroll="ancestor">
              <PageHeader>
                <PageHeaderTitleArea>
                  <PageHeaderTitleRow>
                    <PageHeaderTitle>Record</PageHeaderTitle>
                  </PageHeaderTitleRow>
                </PageHeaderTitleArea>
              </PageHeader>
              <DetailPanelBody>
                <div data-testid="content">Content</div>
              </DetailPanelBody>
            </DetailPanel>
            <div data-testid="block">A block of the page</div>
          </PageBody>
        </Page>
      </div>,
    );
    const page = container.querySelector('[data-ui="page"]')!.getBoundingClientRect();
    const header = container
      .querySelector('[data-ui="detail-panel"] [data-ui="page-header"]')!
      .getBoundingClientRect();
    const title = container.querySelector('[data-part="title"]')!.getBoundingClientRect();
    const content = container.querySelector('[data-testid="content"]')!.getBoundingClientRect();
    const inset = container.querySelector('[data-testid="block"]')!.getBoundingClientRect().left;

    expect(header.left).toBeCloseTo(page.left, 0);
    expect(header.right).toBeCloseTo(page.right, 0);
    expect(title.left).toBeCloseTo(inset, 0);
    expect(content.left).toBeCloseTo(inset, 0);
  });
});

describe('the size class of a page', () => {
  function Probe() {
    return <span data-testid="class">{usePageSizeClass()}</span>;
  }

  it('follows the page’s own width, not the viewport’s', async () => {
    const view = render(
      <div style={{ inlineSize: 1100 }}>
        <Page>
          <PageBody>
            <Probe />
          </PageBody>
        </Page>
      </div>,
    );
    const read = () => view.container.querySelector('[data-testid="class"]')!.textContent;

    await vi.waitFor(() => expect(read()).toBe('expanded'));
    (view.container.firstElementChild as HTMLElement).style.inlineSize = '700px';
    await vi.waitFor(() => expect(read()).toBe('medium'));
    (view.container.firstElementChild as HTMLElement).style.inlineSize = '390px';
    await vi.waitFor(() => expect(read()).toBe('compact'));
  });

  it('reads the viewport outside a page', () => {
    const { container } = render(<Probe />);

    expect(container.textContent).toBe('compact');
  });
});
