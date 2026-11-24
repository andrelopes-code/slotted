import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { IconButton } from '../button';
import { Glyph, Icon } from '../icon';
import { Stack } from '../stack';
import { Table, TableBody, TableCell, TableContent, TableRow } from '../table';
import { Tag } from '../tag';
import { Text } from '../typography';
import { Section } from './section';
import {
  SectionActions,
  SectionBleed,
  SectionBody,
  SectionDescription,
  SectionHeader,
  SectionHeading,
  SectionTags,
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

/**
 * A table that runs edge to edge inside a surface section needed negative
 * margins written by hand, and a grid stopped one inset short of the end edge.
 * A bled body takes back the surface's inset on the sides it touches.
 */
describe('a surface section whose body bleeds', () => {
  const scene = (bleed: boolean, ground: 'none' | 'surface' = 'surface') => {
    const { container } = render(
      <div style={{ inlineSize: 360 }}>
        <Section ground={ground} size="lg">
          <SectionHeader>
            <SectionTitle>
              <SectionHeading>Itens</SectionHeading>
            </SectionTitle>
          </SectionHeader>
          <SectionBody bleed={bleed}>
            <div data-testid="grid" style={{ blockSize: 80 }} />
          </SectionBody>
        </Section>
      </div>,
    );
    const root = container.querySelector<HTMLElement>('[data-ui="section"]')!;

    return {
      body: container.querySelector<HTMLElement>('[data-part="body"]')!,
      edge: parseFloat(getComputedStyle(root).borderTopWidth),
      grid: container.querySelector('[data-testid="grid"]')!.getBoundingClientRect(),
      root,
      section: root.getBoundingClientRect(),
    };
  };

  it('runs a child to the inner edges of the panel and rounds its lower corners', () => {
    const { body, edge, grid, root, section } = scene(true);
    const radius = parseFloat(getComputedStyle(root).borderEndEndRadius);

    expect(grid.left).toBeCloseTo(section.left + edge, 1);
    expect(grid.right).toBeCloseTo(section.right - edge, 1);
    expect(grid.bottom).toBeCloseTo(section.bottom - edge, 1);
    expect(parseFloat(getComputedStyle(body).borderEndEndRadius)).toBeCloseTo(radius - edge, 1);
    expect(parseFloat(getComputedStyle(body).borderEndStartRadius)).toBeCloseTo(radius - edge, 1);
  });

  it('keeps the inset without bleed, and changes nothing without a surface', () => {
    const inset = scene(false);
    const plain = scene(true, 'none');

    expect(inset.grid.left).toBeGreaterThan(inset.section.left + inset.edge);
    expect(plain.grid.left).toBeCloseTo(plain.section.left, 1);
    expect(plain.grid.right).toBeCloseTo(plain.section.right, 1);
  });
});

/* A body that holds a line of text above its table bled whole, and the text lost the inset. */
describe('a child of a surface section body that bleeds alone', () => {
  it.each([
    ['in a stack of the body', true],
    ['as a child of the body', false],
  ])('runs to the panel and follows its lower corners (%s)', (_, stacked) => {
    const children = (
      <>
        <p data-testid="text" style={{ margin: 0 }}>
          Twelve entries
        </p>
        <SectionBleed data-testid="bleed">
          <Table columns={2} variant="ruled">
            <TableContent aria-label="Entries">
              <TableBody>
                <TableRow>
                  <TableCell>Rent</TableCell>
                  <TableCell numeric>1,200.00</TableCell>
                </TableRow>
              </TableBody>
            </TableContent>
          </Table>
        </SectionBleed>
      </>
    );
    const { container } = render(
      <div style={{ inlineSize: 360 }}>
        <Section ground="surface" size="lg">
          <SectionHeader>
            <SectionTitle>
              <SectionHeading>Entries</SectionHeading>
            </SectionTitle>
          </SectionHeader>
          {stacked ? (
            <SectionBody>
              <Stack gap={5}>{children}</Stack>
            </SectionBody>
          ) : (
            <SectionBody style={{ display: 'grid', rowGap: 12 }}>{children}</SectionBody>
          )}
        </Section>
      </div>,
    );
    const root = container.querySelector<HTMLElement>('[data-ui="section"]')!;
    const style = getComputedStyle(root);
    const edge = parseFloat(style.borderTopWidth);
    const panel = root.getBoundingClientRect();
    const text = container.querySelector('[data-testid="text"]')!.getBoundingClientRect();
    const bleed = container.querySelector<HTMLElement>('[data-testid="bleed"]')!;
    const box = bleed.getBoundingClientRect();
    const table = bleed.querySelector('[data-ui="table"]')!.getBoundingClientRect();
    const stack = getComputedStyle(bleed.parentElement!);

    expect(text.left).toBeCloseTo(panel.left + edge + parseFloat(style.paddingLeft), 1);
    expect(text.right).toBeCloseTo(panel.right - edge - parseFloat(style.paddingRight), 1);
    expect(table.left).toBeCloseTo(panel.left + edge, 1);
    expect(table.right).toBeCloseTo(panel.right - edge, 1);
    expect(box.bottom).toBeCloseTo(panel.bottom - edge, 1);
    for (const corner of ['borderEndEndRadius', 'borderEndStartRadius'] as const) {
      expect(parseFloat(getComputedStyle(bleed)[corner])).toBeCloseTo(
        parseFloat(style[corner]) - edge,
        1,
      );
    }
    expect(box.top - text.bottom).toBeCloseTo(parseFloat(stack.rowGap), 1);
  });

  it('keeps its corners square between two children, and stays in a section with no surface', () => {
    const { container } = render(
      <div style={{ inlineSize: 360 }}>
        <Section ground="surface">
          <SectionBody>
            <p>Above</p>
            <SectionBleed data-testid="middle">
              <div style={{ blockSize: 20 }} />
            </SectionBleed>
            <p>Below</p>
          </SectionBody>
        </Section>
        <Section>
          <SectionBody>
            <SectionBleed data-testid="plain">
              <div style={{ blockSize: 20 }} />
            </SectionBleed>
          </SectionBody>
        </Section>
      </div>,
    );
    const [surface, none] = [...container.querySelectorAll('[data-ui="section"]')].map((section) =>
      section.getBoundingClientRect(),
    );
    const middle = container.querySelector('[data-testid="middle"]')!;
    const plain = container.querySelector('[data-testid="plain"]')!.getBoundingClientRect();

    expect(getComputedStyle(middle).borderEndEndRadius).toBe('0px');
    expect(middle.getBoundingClientRect().left).toBeCloseTo(surface!.left + 1, 1);
    expect(plain.left).toBeCloseTo(none!.left, 1);
    expect(plain.right).toBeCloseTo(none!.right, 1);
  });
});

/* A help trigger beside a heading stands where it stands after a word of text. */
describe('an inline icon button in the tags', () => {
  const trigger = (
    <IconButton aria-label="About the criteria" inline tone="secondary" variant="ghost">
      <Icon>
        <Glyph name="circle-question" />
      </Icon>
    </IconButton>
  );

  function distance(words: Element, dir: string) {
    const range = document.createRange();
    range.selectNodeContents(words.firstChild!);
    const text = range.getBoundingClientRect();
    const glyph = document
      .querySelector('[data-ui="button"] [data-ui="icon"]')!
      .getBoundingClientRect();
    const button = document.querySelector('[data-ui="button"]') as HTMLElement;
    const line = parseFloat(getComputedStyle(button).lineHeight);

    expect(button.getBoundingClientRect().width).toBeCloseTo(line, 1);
    expect(button.getBoundingClientRect().height).toBeCloseTo(line, 1);

    return dir === 'rtl' ? text.left - glyph.right : glyph.left - text.right;
  }

  describe.each(['ltr', 'rtl'])('in %s', (dir) => {
    it.each(['sm', 'md', 'lg'] as const)(
      'keeps the distance it keeps after a word (%s)',
      (size) => {
        const section = render(
          <div dir={dir}>
            <Section heading="title" size={size}>
              <SectionHeader>
                <SectionTitle>
                  <SectionHeading>Criteria</SectionHeading>
                  <SectionTags>{trigger}</SectionTags>
                </SectionTitle>
              </SectionHeader>
            </Section>
          </div>,
        );
        const heading = document.querySelector('[data-part="heading"]')!;
        const { fontSize, lineHeight } = getComputedStyle(heading);
        const beside = distance(heading, dir);
        section.unmount();

        render(
          <div dir={dir}>
            <Text style={{ fontSize, lineHeight }}>Criteria{trigger}</Text>
          </div>,
        );
        const after = distance(document.querySelector('[data-ui="typography"]')!, dir);

        expect(Math.abs(beside - after)).toBeLessThanOrEqual(1);
      },
    );
  });

  it('stands after a badge at the distance it keeps after a word', () => {
    render(
      <Section heading="title">
        <SectionHeader>
          <SectionTitle>
            <SectionHeading>Criteria</SectionHeading>
            <SectionTags>
              <Tag size="sm">Draft</Tag>
              {trigger}
            </SectionTags>
          </SectionTitle>
        </SectionHeader>
      </Section>,
    );
    const tag = document.querySelector('[data-ui="tag"]')!.getBoundingClientRect();
    const button = document.querySelector('[data-ui="button"]') as HTMLElement;
    const heading = document.querySelector('[data-part="heading"]')!.getBoundingClientRect();
    const quarter = parseFloat(getComputedStyle(button).fontSize) / 4;

    expect(button.getBoundingClientRect().left - tag.right).toBeCloseTo(quarter, 0);
    expect(tag.left - heading.right).toBeGreaterThan(4);
  });
});
