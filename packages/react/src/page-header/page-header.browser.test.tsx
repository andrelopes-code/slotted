import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { cdp, page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from '../button';
import { MenuItem } from '../menu';
import { Tab, TabList, Tabs } from '../tabs';
import { Toolbar, ToolbarItem, ToolbarOverflow } from '../toolbar';
import { PageHeader } from './page-header';
import {
  PageHeaderActions,
  PageHeaderBack,
  PageHeaderControls,
  PageHeaderHeading,
  PageHeaderNav,
  PageHeaderProgress,
  PageHeaderSubheading,
  PageHeaderTabs,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
  PageHeaderToggle,
} from './page-header-parts';

const strip = (
  <PageHeaderTabs>
    <Tabs defaultValue="a">
      <TabList aria-label="Sections">
        <Tab value="a">A</Tab>
        <Tab value="b">B</Tab>
      </TabList>
    </Tabs>
  </PageHeaderTabs>
);

function placed(children: ReactNode) {
  const { unmount } = render(<PageHeader>{children}</PageHeader>);
  const root = document.querySelector('[data-ui="page-header"]') as HTMLElement;
  const frame = root.querySelector('[data-part="progress"]') as HTMLElement;
  const controls = root.querySelector('[data-part="controls"]');
  const position = {
    frame: frame.getBoundingClientRect().bottom,
    root: root.getBoundingClientRect().bottom,
    controls: controls?.getBoundingClientRect().top ?? null,
  };
  unmount();
  return position;
}

/**
 * The bar's frame ends where the line ends: the bar stands on the line where the chrome ends, wherever it is written
 * among the parts. With a pill over the tabs that line is the one the pill
 * straddles; without one it is the root's own hairline, under the tabs.
 * Written before the tabs with no pill, the bar was a row of its own between
 * the title and the strip, over no line at all.
 */
describe('the refresh bar of a header with tabs', () => {
  const title = (
    <PageHeaderTitleArea>
      <PageHeaderHeading>Contracts</PageHeaderHeading>
    </PageHeaderTitleArea>
  );
  const bar = <PageHeaderProgress delay={0} loading />;

  it('stands on the root’s closing line without a pill, in either order', () => {
    const before = placed(
      <>
        {title}
        {bar}
        {strip}
      </>,
    );
    const after = placed(
      <>
        {title}
        {strip}
        {bar}
      </>,
    );

    expect(after.frame).toBeCloseTo(after.root, 0);
    expect(before.frame).toBeCloseTo(before.root, 0);
  });

  it('stands on the line the pill straddles, in either order', () => {
    const controls = (
      <PageHeaderControls>
        <PageHeaderToggle />
      </PageHeaderControls>
    );
    const documented = placed(
      <>
        {title}
        {controls}
        {bar}
        {strip}
      </>,
    );
    const last = placed(
      <>
        {title}
        {controls}
        {strip}
        {bar}
      </>,
    );

    /* The pill's line is drawn one hairline down from the controls row's top. */
    expect(documented.frame).toBeCloseTo(documented.controls! + 1, 0);
    expect(last.frame).toBeCloseTo(last.controls! + 1, 0);
  });
});

/**
 * A material header: once content passes under it, the ground is the theme's
 * material surface and the backdrop is the theme's material filter. The tokens
 * here stand in for a theme's, including its reduced-transparency block, which
 * makes the material opaque.
 */
describe('a material header', () => {
  const theme = `
    :root { --slotted-surface-material: rgb(10 20 30 / 0.5); --slotted-material-backdrop: blur(7px); }
    @media (prefers-reduced-transparency: reduce) {
      :root { --slotted-surface-material: rgb(10 20 30); --slotted-material-backdrop: none; }
    }`;

  async function stuck(props: { material?: boolean }) {
    /* A phone's frame is compact, and nothing sticks there. */
    await page.viewport(1024, 915);
    const style = document.createElement('style');
    style.textContent = theme;
    document.head.append(style);
    render(
      <div data-testid="scroller" style={{ blockSize: 300, overflow: 'auto' }}>
        <PageHeader variant="plain" {...props}>
          <PageHeaderTitleArea>
            <PageHeaderHeading>Contracts</PageHeaderHeading>
          </PageHeaderTitleArea>
        </PageHeader>
        <div style={{ blockSize: 2000 }} />
      </div>,
    );
    const scroller = document.querySelector('[data-testid="scroller"]') as HTMLElement;
    const root = document.querySelector('[data-ui="page-header"]') as HTMLElement;
    scroller.scrollTop = 400;
    for (let frame = 0; frame < 60 && !root.hasAttribute('data-stuck'); frame += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    expect(root.hasAttribute('data-stuck')).toBe(true);
    const computed = getComputedStyle(root);
    const read = { background: computed.backgroundColor, filter: computed.backdropFilter };
    style.remove();
    return read;
  }

  afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
    await page.viewport(412, 915);
  });

  it('paints the material surface and filter while stuck', async () => {
    expect(await stuck({ material: true })).toEqual({
      background: 'rgba(10, 20, 30, 0.5)',
      filter: 'blur(7px)',
    });
  });

  it('is opaque and unfiltered for a reader who asked for less transparency', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    expect(await stuck({ material: true })).toEqual({
      background: 'rgb(10, 20, 30)',
      filter: 'none',
    });
  });
});

/**
 * A plain header takes its ground back once content passes under it, and the
 * ground changes over the family's duration rather than in one frame. The
 * title area paints the same ground over a header area, so it moves with it.
 */
describe('the ground of a plain header', () => {
  /* The theme's motion tokens, which the test document does not load. */
  afterEach(() => {
    document.documentElement.removeAttribute('style');
  });

  it('transitions on the root and on the title area', () => {
    document.documentElement.style.setProperty('--slotted-duration-medium', '200ms');
    document.documentElement.style.setProperty('--slotted-easing-standard', 'linear');
    render(
      <PageHeader variant="plain">
        <PageHeaderTitleArea>
          <PageHeaderHeading>Contracts</PageHeaderHeading>
        </PageHeaderTitleArea>
      </PageHeader>,
    );
    const root = document.querySelector('[data-ui="page-header"]') as HTMLElement;
    const title = root.querySelector('[data-part="title-area"]') as HTMLElement;
    expect(getComputedStyle(root).transitionProperty).toContain('background-color');
    expect(getComputedStyle(title).transitionProperty).toContain('background-color');
  });
});

/**
 * On a phone, a rich title — a subheading under the heading — leaves a whole
 * row free under it, and a toolbar of actions takes that row and folds only
 * what does not fit. Beside the title it had the 40 per cent the title left,
 * and folded every action.
 */
describe('a toolbar of actions under a rich title on a narrow header', () => {
  it('takes a row of its own and shows the actions that fit', async () => {
    const actions = ['Approve', 'Reject', 'Export', 'Archive'];
    render(
      <div style={{ inlineSize: 390 }}>
        <PageHeader>
          <PageHeaderTitleArea>
            <PageHeaderTitleRow>
              <PageHeaderTitle>
                <PageHeaderHeading>Order 4021</PageHeaderHeading>
                <PageHeaderSubheading>Due 12 Nov · R$ 1.240,00 · 3 items</PageHeaderSubheading>
              </PageHeaderTitle>
              <PageHeaderActions>
                <Toolbar aria-label="Order actions" overflow="menu">
                  {actions.map((label) => (
                    <ToolbarItem counterpart={<MenuItem>{label}</MenuItem>} key={label}>
                      <Button size="sm">{label}</Button>
                    </ToolbarItem>
                  ))}
                  <ToolbarOverflow />
                </Toolbar>
              </PageHeaderActions>
            </PageHeaderTitleRow>
          </PageHeaderTitleArea>
        </PageHeader>
      </div>,
    );
    for (let i = 0; i < 6; i += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    const visible = [...document.querySelectorAll('[data-ui="toolbar"] [data-part="item"]')].filter(
      (item) => !item.hasAttribute('hidden'),
    );
    expect(visible.length).toBeGreaterThanOrEqual(2);
  });
});

describe('the way back', () => {
  /* The family's muted colour as the browser resolves it, read off a probe. */
  function muted(within: Element) {
    const probe = document.createElement('span');
    probe.style.color = 'var(--slotted-text-muted, GrayText)';
    within.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }

  it.each([
    ['inside the nav part', true],
    ['directly in the title area', false],
  ])('is styled %s', (_, inNav) => {
    const back = <PageHeaderBack href="#x">Back</PageHeaderBack>;
    render(
      <PageHeader>
        <PageHeaderTitleArea>
          {inNav ? <PageHeaderNav>{back}</PageHeaderNav> : back}
          <PageHeaderTitleRow>
            <PageHeaderTitle>
              <PageHeaderHeading>Settings</PageHeaderHeading>
            </PageHeaderTitle>
          </PageHeaderTitleRow>
        </PageHeaderTitleArea>
      </PageHeader>,
    );
    const element = document.querySelector('[data-part="back"]') as HTMLElement;
    const style = getComputedStyle(element);

    expect(style.color).toBe(muted(element.parentElement as Element));
    expect(style.textDecorationLine).toBe('none');
    expect(element.getBoundingClientRect().width).toBeLessThan(200);
  });
});
