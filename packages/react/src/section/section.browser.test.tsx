import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Section } from './section';
import {
  SectionActions,
  SectionBody,
  SectionDescription,
  SectionHeader,
  SectionHeading,
  SectionTitle,
} from './section-parts';
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

function Described({ actions }: { actions?: number | undefined }) {
  return (
    <Section>
      <SectionHeader>
        <SectionTitle>
          <SectionHeading>Title</SectionHeading>
          <SectionDescription>One sentence.</SectionDescription>
        </SectionTitle>
        {actions !== undefined && (
          <SectionActions style={{ minBlockSize: actions }}>
            <button type="button">Action</button>
          </SectionActions>
        )}
      </SectionHeader>
      <SectionBody />
    </Section>
  );
}

/* The actions span the header's rows, so their height is not added to the heading's row. */
describe('a section header with actions taller than its heading', () => {
  function distance(actions?: number) {
    const { unmount } = render(<Described actions={actions} />);
    const heading = document.querySelector('[data-part="heading"]') as HTMLElement;
    const description = document.querySelector('[data-part="description"]') as HTMLElement;
    const centre = (box: DOMRect) => box.top + box.height / 2;
    const result =
      centre(description.getBoundingClientRect()) - centre(heading.getBoundingClientRect());

    unmount();

    return result;
  }

  it('keeps the distance from the heading to the description', () => {
    expect(distance(64)).toBeCloseTo(distance(), 1);
  });
});

describe('the gap between the heading and the description', () => {
  it('reads --slotted-section-description-gap', () => {
    render(<Described />);
    const section = document.querySelector('[data-ui="section"]') as HTMLElement;
    const description = section.querySelector('[data-part="description"]') as HTMLElement;

    section.style.setProperty('--slotted-section-description-gap', '0');

    expect(getComputedStyle(description).marginBlockStart).toBe('0px');
  });
});

/**
 * A top-level heading was always a label in small capitals. `heading="title"`
 * draws it in mixed case at a larger step; a nested section keeps the
 * subsection's form either way.
 */
describe('a section whose heading is a title', () => {
  const heading = (container: HTMLElement) =>
    getComputedStyle(container.querySelector('[data-part="heading"]')!);

  it('draws the heading in mixed case with normal tracking, larger than the label', () => {
    const label = heading(render(<Titled size="lg" />).container);
    const title = heading(render(<Titled heading="title" size="lg" />).container);

    expect(label.textTransform).toBe('uppercase');
    expect(title.textTransform).toBe('none');
    expect(title.letterSpacing).toBe('normal');
    expect(parseFloat(title.fontSize)).toBeGreaterThan(parseFloat(label.fontSize));
  });

  it('reads its size from the title token of the section size', () => {
    const { container } = render(
      <Titled
        heading="title"
        style={{ '--slotted-section-title-size-md': '30px' } as CSSProperties}
      />,
    );

    expect(heading(container).fontSize).toBe('30px');
  });
});
