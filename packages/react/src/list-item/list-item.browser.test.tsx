import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { Button, IconButton } from '../button';
import { Checkbox } from '../checkbox';
import { Glyph } from '../icon';
import { List } from '../list';
import { Tag } from '../tag';
import {
  ListItem,
  ListItemActions,
  ListItemBody,
  ListItemContent,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
  ListItemLink,
  ListItemSelect,
} from './index';
import type { ListItemEndPlacement } from './index';

/* A link row selected for a bulk command: the checkbox stands before the link, never inside it. */
describe('a link row with a leading checkbox', () => {
  it('keeps the checkbox outside the anchor, first in order and in the first column', async () => {
    render(
      <ul>
        <ListItem selected>
          <ListItemSelect>
            <Checkbox aria-label="Select line" defaultChecked />
          </ListItemSelect>
          <ListItemLink href="#line-1">
            <ListItemBody>
              <ListItemLabel>Line</ListItemLabel>
            </ListItemBody>
          </ListItemLink>
        </ListItem>
      </ul>,
    );
    const checkbox = document.querySelector<HTMLElement>(
      'input[type="checkbox"], [role="checkbox"]',
    )!;
    const link = document.querySelector<HTMLAnchorElement>('a')!;
    const row = document.querySelector<HTMLElement>('[data-ui="list-item"]')!;
    const select = row.querySelector<HTMLElement>('[data-part="select"]')!;

    expect(link.contains(checkbox)).toBe(false);
    expect(checkbox.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await userEvent.tab();
    expect(document.activeElement).toBe(checkbox);
    await userEvent.tab();
    expect(document.activeElement).toBe(link);

    const rowStart = row.getBoundingClientRect().left;
    const inset = parseFloat(getComputedStyle(select).paddingLeft);

    expect(select.getBoundingClientRect().left).toBeCloseTo(rowStart, 0);
    expect(checkbox.getBoundingClientRect().left).toBeCloseTo(rowStart + inset, 0);
    expect(link.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      select.getBoundingClientRect().right,
    );

    const label = row.querySelector<HTMLElement>('[data-part="label"]')!.getBoundingClientRect();
    const box = checkbox.getBoundingClientRect();

    expect(box.top + box.height / 2).toBeCloseTo(label.top + label.height / 2, 0);
  });
});

describe('the hover wash on a touch screen', () => {
  /* The browser project runs with touch and no hovering pointer. */
  it('leaves a tapped row its rest fill once the finger lifts', async () => {
    render(
      <ul>
        <ListItem>
          <ListItemLink href="#row">
            <ListItemBody>
              <ListItemLabel>Row</ListItemLabel>
            </ListItemBody>
          </ListItemLink>
        </ListItem>
      </ul>,
    );
    const row = document.querySelector<HTMLElement>('[data-ui="list-item"]')!;
    const rest = getComputedStyle(row).getPropertyValue('--_fill');

    expect(matchMedia('(hover: hover)').matches).toBe(false);
    await userEvent.hover(document.querySelector('a')!);
    expect(getComputedStyle(row).getPropertyValue('--_fill')).toBe(rest);
  });
});

describe('a row narrower than 22rem', () => {
  function amountRow(endPlacement?: ListItemEndPlacement) {
    const { container } = render(
      <div style={{ inlineSize: 300 }}>
        <List>
          <ListItem endPlacement={endPlacement}>
            <ListItemContent>
              <ListItemBody>
                <ListItemLabel>Checking</ListItemLabel>
              </ListItemBody>
              <ListItemEnd>$ 8,091.61</ListItemEnd>
            </ListItemContent>
          </ListItem>
        </List>
      </div>,
    );

    return {
      content: container.querySelector('[data-part="content"]')!.getBoundingClientRect(),
      end: container.querySelector('[data-part="end"]')!.getBoundingClientRect(),
      label: container.querySelector('[data-part="label"]')!.getBoundingClientRect(),
    };
  }

  it('keeps the end on the title line, at the row end, with endPlacement beside', () => {
    const { content, end, label } = amountRow('beside');
    const padding = parseFloat(
      getComputedStyle(document.querySelector('[data-part="content"]')!).paddingInlineEnd,
    );

    expect(Math.abs(end.top + end.height / 2 - (label.top + label.height / 2))).toBeLessThan(1);
    expect(end.right).toBeCloseTo(content.right - padding, 0);
  });

  it('moves the end under the title by default', () => {
    const { end, label } = amountRow();

    expect(end.top).toBeGreaterThanOrEqual(label.bottom - 0.5);
  });
});

describe('a truncated row with a long end and actions at 358px', () => {
  function row(label: string, description: string, tag: string) {
    return (
      <ListItem truncate>
        <ListItemContent>
          <ListItemBody>
            <ListItemLabel>{label}</ListItemLabel>
            <ListItemDescription>{description}</ListItemDescription>
          </ListItemBody>
          <ListItemEnd>
            <Tag size="sm">{tag}</Tag>
          </ListItemEnd>
        </ListItemContent>
        <ListItemActions>
          <Button size="sm">Open</Button>
        </ListItemActions>
      </ListItem>
    );
  }

  it('keeps the height of a short row and gives the title a column', () => {
    const { container } = render(
      <div style={{ inlineSize: 358 }}>
        <List>
          {row(
            'Quarterly report for the north region',
            'A description of about sixty characters for this row here',
            'A tag of about thirty letters',
          )}
          {row('Short', 'Short', 'Tag')}
        </List>
      </div>,
    );
    const [long, short] = [...container.querySelectorAll('[data-ui="list-item"]')];

    expect(long!.getBoundingClientRect().height).toBeCloseTo(
      short!.getBoundingClientRect().height,
      0,
    );
    expect(
      long!.querySelector('[data-part="label"]')!.getBoundingClientRect().width,
    ).toBeGreaterThan(120);
  });
});

/* The control of a row stands off both edges of it, whatever the lines of its body. */
describe('the actions of a framed row', () => {
  /** The control heights of the three densities, and of a touch screen, where they are one. */
  const DENSITIES = {
    comfortable: { md: '34px', sm: '30px' },
    compact: { md: '28px', sm: '26px' },
    dense: { md: '26px', sm: '24px' },
    touch: { md: '44px', sm: '44px' },
  } as const;
  const STEP = 6;

  it.each(
    (Object.keys(DENSITIES) as (keyof typeof DENSITIES)[]).flatMap((density) =>
      (
        [
          ['one line', {}],
          ['two lines', { description: true }],
          ['one line at the start', { align: 'start' }],
          ['one line narrower than 22rem', { inlineSize: 240 }],
          ['a glyph narrower than 22rem', { glyph: true, inlineSize: 240 }],
        ] as const
      ).map(([name, scene]) => [name, density, scene] as const),
    ),
  )('keep a step of space above and below the button (%s, %s)', (_, density, scene) => {
    const { bottom, top } = distances({ ...scene, heights: DENSITIES[density] });

    expect(top).toBeGreaterThanOrEqual(STEP);
    expect(bottom).toBeGreaterThanOrEqual(STEP);
  });
});

interface ActionsProps {
  readonly align?: 'start';
  readonly description?: boolean;
  readonly glyph?: boolean;
  readonly heights: { readonly md: string; readonly sm: string };
  readonly inlineSize?: number;
}

function distances({ align, description, glyph, heights, inlineSize = 600 }: ActionsProps) {
  const scale = {
    '--slotted-control-height-md': heights.md,
    '--slotted-control-height-sm': heights.sm,
    inlineSize,
  } as CSSProperties;
  const { container } = render(
    <div style={scale}>
      <List aria-label="Signals" variant="framed" {...(align ? { align } : {})}>
        <ListItem>
          <ListItemContent>
            <ListItemBody>
              <ListItemLabel>One line</ListItemLabel>
              {description && <ListItemDescription>A second line</ListItemDescription>}
            </ListItemBody>
          </ListItemContent>
          <ListItemActions>
            {glyph ? (
              <IconButton aria-label="Remove" size="sm" variant="outline">
                <Glyph name="x" />
              </IconButton>
            ) : (
              <Button size="sm" variant="outline">
                Add
              </Button>
            )}
          </ListItemActions>
        </ListItem>
      </List>
    </div>,
  );
  const row = container.querySelector('[data-ui="list-item"]')!.getBoundingClientRect();
  const button = container.querySelector('[data-ui="button"]')!.getBoundingClientRect();

  return { bottom: row.bottom - button.bottom, top: button.top - row.top };
}
