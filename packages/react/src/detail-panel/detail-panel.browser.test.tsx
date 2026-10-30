import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { PageHeader, PageHeaderHeading } from '../page-header';
import { DetailPanel, DetailPanelBody, DetailPanelSection } from './index';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Under `scroll="self"` the panel is a pane that scrolls on its own, and its
 * header sticks to the top of it. A pane beside a list is narrower than the
 * compact class in a desktop frame; the header read its own width, took itself
 * out of `sticky` and scrolled away with the record.
 */
describe('a detail panel that scrolls itself in a desktop frame', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('keeps its header at the top of the pane after a scroll', async () => {
    await page.viewport(1440, 900);
    render(
      <div
        style={{
          blockSize: '400px',
          inlineSize: '420px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DetailPanel recordKey="SO-1" scroll="self">
          <PageHeader>
            <PageHeaderHeading>SO-1</PageHeaderHeading>
          </PageHeader>
          <DetailPanelBody>
            <DetailPanelSection name="lines" label="Lines">
              <div style={{ blockSize: '600px' }} />
            </DetailPanelSection>
            <DetailPanelSection name="history" label="History">
              <div style={{ blockSize: '600px' }} />
            </DetailPanelSection>
          </DetailPanelBody>
        </DetailPanel>
      </div>,
    );
    await frame();
    await frame();
    const panel = document.querySelector('[data-ui="detail-panel"]') as HTMLElement;
    const header = panel.querySelector('[data-ui="page-header"]') as HTMLElement;
    expect(panel.scrollHeight).toBeGreaterThan(1000);

    panel.scrollTop = 600;
    await frame();
    await frame();

    expect(header.hasAttribute('data-compact')).toBe(false);
    expect(Math.round(header.getBoundingClientRect().top)).toBe(
      Math.round(panel.getBoundingClientRect().top),
    );
  });
});

/**
 * A stacked section's count sits on the heading's optical axis. Inside the
 * uppercase heading, middle-aligned on a 1.4 line box, the capitals' centre
 * stood above the badge's.
 */
describe('the count of a stacked section', () => {
  it('shares its centre with the capitals of the heading', async () => {
    render(
      <DetailPanel>
        <DetailPanelBody>
          <DetailPanelSection count={3} label="Postings" name="postings">
            Rows
          </DetailPanelSection>
        </DetailPanelBody>
      </DetailPanel>,
    );
    await frame();
    const heading = document.querySelector('[data-part="heading"]') as HTMLElement;
    const badge = document.querySelector('[data-ui="badge"]') as HTMLElement;
    /* The baseline is where a zero-height inline box sits; the capitals rise
       from it by the font's cap height. */
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;block-size:0;inline-size:0';
    heading.append(probe);
    const baseline = probe.getBoundingClientRect().bottom;
    probe.remove();
    const style = getComputedStyle(heading);
    const context = document.createElement('canvas').getContext('2d')!;
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const cap = context.measureText('H').actualBoundingBoxAscent;
    const capitals = baseline - cap / 2;
    const rect = badge.getBoundingClientRect();
    expect(Math.abs(capitals - (rect.top + rect.height / 2))).toBeLessThanOrEqual(0.5);
  });
});
