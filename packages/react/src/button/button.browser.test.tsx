import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '../description-list';
import { Glyph, Icon } from '../icon';
import { Table, TableBody, TableCell, TableContent, TableRow } from '../table';
import { Button, IconButton } from './index';

const box = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { height: rect.height, width: rect.width };
};

/**
 * The ring that stands in for a glyph takes the glyph's box: the glyph stays in
 * the DOM and is not drawn, and the control keeps the size it has at rest. An
 * `IconButton` that waited drew the ring beside the icon in a square of one.
 */
describe('a control waiting in its glyph slot', () => {
  it('draws the ring in the icon button’s glyph box, and not the glyph', () => {
    const { rerender } = render(
      <IconButton aria-label="Refresh">
        <Icon>
          <Glyph name="rotate-ccw" />
        </Icon>
      </IconButton>,
    );
    const button = document.querySelector('[data-ui="button"]') as HTMLElement;
    const resting = box(button);

    rerender(
      <IconButton aria-label="Refresh" loading>
        <Icon>
          <Glyph name="rotate-ccw" />
        </Icon>
      </IconButton>,
    );
    const slot = button.querySelector('[data-part="icon"]') as HTMLElement;
    const ring = slot.querySelector('[data-part="indicator"]') as HTMLElement;
    const glyph = slot.querySelector('[data-ui="icon"]') as HTMLElement;

    expect(getComputedStyle(glyph).visibility).toBe('hidden');
    expect(getComputedStyle(ring).visibility).toBe('visible');
    expect(box(button)).toEqual(resting);
    const slotBox = slot.getBoundingClientRect();
    const ringBox = ring.getBoundingClientRect();
    expect(ringBox.left).toBeGreaterThanOrEqual(slotBox.left);
    expect(ringBox.right).toBeLessThanOrEqual(slotBox.right);
  });

  it('draws the ring in a button’s start slot, and not the glyph beside it', () => {
    render(
      <Button
        loading
        start={
          <Icon>
            <Glyph name="rotate-ccw" />
          </Icon>
        }
      >
        Refresh
      </Button>,
    );
    const slot = document.querySelector('[data-part="start"]') as HTMLElement;
    const glyph = slot.querySelector('[data-ui="icon"]') as HTMLElement;
    const ring = slot.querySelector('[data-part="indicator"]') as HTMLElement;

    expect(getComputedStyle(glyph).visibility).toBe('hidden');
    expect(getComputedStyle(ring).visibility).toBe('visible');
  });
});

/**
 * Squeezed in a row, a label broke inside its words — "Corri|gir", "Anul|ar" —
 * because it could break anywhere, which made a button as narrow as one
 * letter. A label is one line at its own width: the row overflows, or a
 * toolbar folds what does not fit.
 */
describe('a row of buttons narrower than their labels', () => {
  it('keeps every label on one line, whole', () => {
    const labels = ['Fix', 'Mark as transfer', 'Record restock', 'Void'];
    render(
      <div style={{ display: 'flex', inlineSize: 300 }}>
        {labels.map((label) => (
          <Button key={label}>{label}</Button>
        ))}
      </div>,
    );
    for (const label of document.querySelectorAll<HTMLElement>('[data-part="label"]')) {
      const range = document.createRange();
      range.selectNodeContents(label);
      expect(range.getClientRects().length, label.textContent ?? '').toBe(1);
      expect(label.scrollWidth, label.textContent ?? '').toBeLessThanOrEqual(label.clientWidth);
    }
  });
});

/* An inline icon button is one line of the text around it, and keeps a full target. */
describe('an inline icon button inside a description list term', () => {
  function term(withButton: boolean) {
    const { unmount } = render(
      <DescriptionList variant="ruled">
        <DescriptionListItem>
          <DescriptionListTerm>
            Opening balance
            {withButton && (
              <IconButton aria-label="About opening balance" inline size="sm" variant="ghost">
                <Icon size="sm">
                  <Glyph name="circle-question" />
                </Icon>
              </IconButton>
            )}
          </DescriptionListTerm>
          <DescriptionListDescription>1,000.00</DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );
    const dt = document.querySelector('[data-part="term"]') as HTMLElement;
    const button = document.querySelector('[data-ui="button"]') as HTMLElement | null;
    const result = {
      button: button?.getBoundingClientRect(),
      height: dt.getBoundingClientRect().height,
    };
    const hits = button === null ? [] : corners(button);

    unmount();

    return { ...result, hits };
  }

  /* The four points 12px from the centre, which a 24px target covers. */
  function corners(button: HTMLElement) {
    const box = button.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;

    return [
      [x - 11.5, y - 11.5],
      [x + 11.5, y - 11.5],
      [x - 11.5, y + 11.5],
      [x + 11.5, y + 11.5],
    ].map(([px, py]) => button.contains(document.elementFromPoint(px!, py!)));
  }

  it('keeps the term one line tall', () => {
    expect(term(true).height).toBeCloseTo(term(false).height, 1);
  });

  it('answers a press anywhere in a 24 by 24 pixel target', () => {
    expect(term(true).hits).toEqual([true, true, true, true]);
  });
});

/* An inline button is a word of the line it sits in: a dense row keeps its height and baseline. */
describe('an inline button inside a cell of a 28px table row', () => {
  const rows = { '--slotted-table-row-min-block-size': '28px' } as CSSProperties;

  function mount(onClick: () => void) {
    render(
      <div style={rows}>
        <Table columns={2}>
          <TableContent>
            <TableBody>
              <TableRow value="plain">
                <TableCell>Groceries</TableCell>
                <TableCell>120.00</TableCell>
              </TableRow>
              <TableRow value="action">
                <TableCell>Groceries</TableCell>
                <TableCell>
                  <Button inline onClick={onClick}>
                    Split
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </TableContent>
        </Table>
      </div>,
    );
  }

  function textBottom(element: Element) {
    const range = document.createRange();
    range.selectNodeContents(element);

    return range.getBoundingClientRect().bottom;
  }

  it('keeps the row 28px high and the label on the baseline of the cell beside it', () => {
    mount(() => {});
    const [plain, action] = [...document.querySelectorAll('tbody tr')];
    const button = document.querySelector('[data-ui="button"]')!;
    const label = button.querySelector('[data-part="label"]') ?? button;

    /* 28px of row and the 1px rule under it. */
    expect(plain!.getBoundingClientRect().height).toBeCloseTo(29, 0);
    expect(action!.getBoundingClientRect().height).toBeCloseTo(29, 0);
    expect(textBottom(label)).toBeCloseTo(textBottom(action!.firstElementChild!), 0);
  });

  it('is a button that Enter and Space press', async () => {
    const onClick = vi.fn();
    mount(onClick);
    const button = document.querySelector<HTMLElement>('[data-ui="button"]')!;

    expect(button.getAttribute('role') ?? button.tagName.toLowerCase()).toBe('button');
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

/**
 * A ghost button over a line of text kept its inline inset, so its label
 * started further in than the text under it. `flush` pulls the button out by
 * that inset: the label stands on the text's edge and the box extends past it.
 */
describe('a flush ghost button over a line of text', () => {
  it.each(['sm', 'md', 'lg'] as const)(
    'starts its label where the text under it starts at size %s',
    (size) => {
      const { container } = render(
        <div style={{ display: 'grid', justifyItems: 'start', paddingInline: 40 }}>
          <Button flush="start" size={size} tone="secondary" variant="ghost">
            Fixed costs
          </Button>
          <span data-testid="under">target 40%</span>
        </div>,
      );
      const button = container.querySelector('[data-ui="button"]')!.getBoundingClientRect();
      const label = container.querySelector('[data-part="label"]')!.getBoundingClientRect();
      const under = container.querySelector('[data-testid="under"]')!.getBoundingClientRect();

      expect(label.left).toBeCloseTo(under.left, 1);
      expect(button.left).toBeLessThan(under.left);
    },
  );

  it('ends its label where the container ends when flush at the end', () => {
    const { container } = render(
      <div style={{ display: 'grid', justifyItems: 'end', paddingInline: 40 }}>
        <Button flush="end" variant="ghost">
          Fixed costs
        </Button>
        <span data-testid="under">target 40%</span>
      </div>,
    );
    const label = container.querySelector('[data-part="label"]')!.getBoundingClientRect();
    const under = container.querySelector('[data-testid="under"]')!.getBoundingClientRect();

    expect(label.right).toBeCloseTo(under.right, 1);
  });
});
