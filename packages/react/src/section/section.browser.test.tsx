import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Section } from './section';
import { SectionBody, SectionHeader, SectionHeading, SectionTitle } from './section-parts';
import type { SectionProps } from './section.types';

function Titled(props: Partial<SectionProps>) {
  return (
    <Section {...props}>
      <SectionHeader>
        <SectionTitle>
          <SectionHeading>Itens</SectionHeading>
        </SectionTitle>
      </SectionHeader>
      <SectionBody>
        <div style={{ blockSize: 1500 }} />
      </SectionBody>
    </Section>
  );
}

const frames = async (until: () => boolean) => {
  for (let frame = 0; frame < 60 && !until(); frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

/**
 * A sticky header writes `data-stuck` while content passes under it, as a
 * page header does, so a theme whose page ground is translucent can paint
 * the header's ground only then.
 */
describe('the header of a sticky section', () => {
  function scrolled() {
    render(
      <div data-testid="scroller" style={{ blockSize: 300, overflow: 'auto' }}>
        <Titled sticky />
      </div>,
    );
    const scroller = document.querySelector('[data-testid="scroller"]') as HTMLElement;
    const header = document.querySelector('[data-part="header"]') as HTMLElement;
    return { header, scroller };
  }

  it('carries data-stuck while content passes under it and drops it on return', async () => {
    const { header, scroller } = scrolled();
    await frames(() => false);
    expect(header.hasAttribute('data-stuck')).toBe(false);

    scroller.scrollTop = 400;
    await frames(() => header.hasAttribute('data-stuck'));
    expect(header.hasAttribute('data-stuck')).toBe(true);

    scroller.scrollTop = 0;
    await frames(() => !header.hasAttribute('data-stuck'));
    expect(header.hasAttribute('data-stuck')).toBe(false);
  });

  it('paints --slotted-section-header-background in place of the page ground', async () => {
    const { header } = scrolled();
    header.style.setProperty('--slotted-section-header-background', 'rgb(1, 2, 3)');
    expect(getComputedStyle(header).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});

/** On a surface the rule spans the surface edge to edge, not the padding box minus its inset. */
describe('the divider of a section on a surface', () => {
  it('spans the section between its borders', () => {
    render(<Titled ground="surface" divider />);
    const section = document.querySelector('[data-ui="section"]') as HTMLElement;
    const header = section.querySelector('[data-part="header"]') as HTMLElement;
    expect(header.getBoundingClientRect().width).toBe(section.clientWidth);
    expect(header.getBoundingClientRect().left).toBe(
      section.getBoundingClientRect().left + section.clientLeft,
    );
  });
});
