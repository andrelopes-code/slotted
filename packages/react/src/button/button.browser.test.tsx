import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { cdp, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '../description-list';
import { Glyph, Icon } from '../icon';
import { Table, TableBody, TableCell, TableContent, TableRow } from '../table';
import { Tooltip, TooltipContent, TooltipLayer, TooltipTrigger } from '../tooltip';
import { ButtonGroup } from '../button-group';
import { Button, ButtonDefaultsProvider, IconButton } from './index';

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

/* A help mark beside a term is secondary: it took the ink of the term, and a ground under the pointer. */
describe('an inline ghost icon button in the secondary tone', () => {
  const MUTED = 'rgb(100, 110, 120)';
  const TEXT = 'rgb(10, 20, 30)';
  const INKS = {
    '--slotted-text': TEXT,
    '--slotted-text-muted': MUTED,
    '--slotted-tone-secondary-subtle-hover': 'rgb(240, 240, 240)',
    '--slotted-tone-secondary-text': TEXT,
  } as CSSProperties;

  function mount() {
    render(
      <p style={INKS}>
        Opening balance{' '}
        <Tooltip openDelay={0}>
          <TooltipTrigger
            render={(props) => (
              <IconButton
                {...props}
                aria-label="About opening balance"
                inline
                size="sm"
                tone="secondary"
                variant="ghost"
              >
                <Icon size="sm">
                  <Glyph name="circle-question" />
                </Icon>
              </IconButton>
            )}
          />
          <TooltipLayer>
            <TooltipContent>Value at the end of the day before the period</TooltipContent>
          </TooltipLayer>
        </Tooltip>
      </p>,
    );
    const button = document.querySelector<HTMLElement>('[data-ui="button"]')!;

    return { button, ink: () => getComputedStyle(button).color };
  }

  it('is muted at rest, and takes the text color under the pointer with no ground', async () => {
    const { button, ink } = mount();

    expect(ink()).toBe(MUTED);

    await userEvent.hover(button);
    await expect.poll(ink).toBe(TEXT);
    expect(getComputedStyle(button).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('takes the text color under the keyboard focus and while its tooltip is open', async () => {
    const { button, ink } = mount();

    await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 400, y: 900 });
    await userEvent.keyboard('{Tab}');
    await expect.poll(ink).toBe(TEXT);
    expect(button.matches('[data-open]')).toBe(true);

    button.blur();
    await expect.poll(ink).toBe(MUTED);

    button.setAttribute('data-open', '');
    await expect.poll(ink).toBe(TEXT);
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

  /* `size` was read and then overruled by the font of the cell. */
  it.each([
    ['sm', '--slotted-font-size-sm'],
    ['md', '--slotted-font-size-md'],
    ['lg', '--slotted-font-size-lg'],
  ] as const)('takes the font step its size names (%s)', (size, token) => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <td style={{ ...STEPS, fontSize: 14 }}>
              <Button inline size={size}>
                Split
              </Button>
              <i style={{ fontSize: `var(${token})` }} />
            </td>
          </tr>
        </tbody>
      </table>,
    );

    const label = getComputedStyle(container.querySelector('[data-part="label"]')!);
    const step = getComputedStyle(container.querySelector('i')!);

    expect(label.fontSize).toBe(step.fontSize);
  });

  it('takes the font of the text around it without a size', () => {
    const { container } = render(
      <p style={{ ...STEPS, fontSize: 17 }}>
        <Button inline>Split</Button>
      </p>,
    );

    expect(getComputedStyle(container.querySelector('button')!).fontSize).toBe('17px');
  });

  it('is not sized by the default of a provider', () => {
    const { container } = render(
      <ButtonDefaultsProvider size="sm">
        <p style={{ ...STEPS, fontSize: 17 }}>
          <Button inline>Split</Button>
        </p>
      </ButtonDefaultsProvider>,
    );

    expect(getComputedStyle(container.querySelector('button')!).fontSize).toBe('17px');
  });

  const STEPS = {
    '--slotted-font-size-lg': '15px',
    '--slotted-font-size-md': '13px',
    '--slotted-font-size-sm': '12px',
  } as CSSProperties;

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

describe('a stepper whose label changes', () => {
  const MONTHS = [
    'January 2026',
    'February 2026',
    'March 2026',
    'April 2026',
    'May 2026',
    'June 2026',
    'July 2026',
    'August 2026',
    'September 2026',
    'October 2026',
    'November 2026',
    'December 2026',
  ];

  it('keeps the next arrow in place and the text centered in the button', () => {
    const view = render(<Stepper month="May 2026" />);
    const next = () => document.querySelector('[aria-label="Next"]')!.getBoundingClientRect().left;
    const at = next();

    for (const month of MONTHS) {
      view.rerender(<Stepper month={month} />);
      expect(next()).toBe(at);
    }

    const button = document.querySelector('[data-testid="month"]')!;
    const text = button.querySelector('[data-part="label"]')!.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    expect(Math.abs(text.top - box.top - (box.bottom - text.bottom))).toBeLessThan(0.5);
    expect(button.textContent).toBe('December 2026');
    expect(button.getAttribute('aria-label')).toBeNull();
  });

  /* The reservation was the label's alone: a mark in `start` either changed the width as it came and
     went, or kept its room while absent and left the label off center. */
  it.each(['sm', 'md', 'lg'] as const)(
    'keeps one width with the mark on and off, and centers what is visible (%s)',
    (size) => {
      const view = render(<Stepper marked month="May 2026" size={size} />);
      const button = () => document.querySelector<HTMLElement>('[data-testid="month"]')!;
      const width = button().getBoundingClientRect().width;

      for (const month of MONTHS) {
        for (const marked of [true, false]) {
          view.rerender(<Stepper marked={marked} month={month} size={size} />);

          expect(button().getBoundingClientRect().width).toBeCloseTo(width, 0);
          expect(visibleCenter(button())).toBeLessThan(0.5);
        }
      }
    },
  );

  it('reserves the mark, its gap and the widest label, and no more', () => {
    const { container } = render(
      <Button
        start={<i style={MARK} />}
        style={{ '--slotted-button-widest-start': '6px' } as CSSProperties}
        widest={MONTHS}
      >
        September 2026
      </Button>,
    );
    const button = container.querySelector('button')!;
    const style = getComputedStyle(button);
    const inset =
      parseFloat(style.paddingInlineStart) +
      parseFloat(style.paddingInlineEnd) +
      parseFloat(style.borderInlineStartWidth) * 2;
    const mark = button.querySelector('[data-part="start"] i')!.getBoundingClientRect();
    const label = button.querySelector('[data-part="label"]')!.getBoundingClientRect();

    expect(button.getBoundingClientRect().width).toBeCloseTo(inset + (label.right - mark.left), 0);
    expect(label.left - mark.right).toBe(8);
  });

  it('keeps the size of a glyph in start', () => {
    const { container } = render(
      <>
        <Button
          start={
            <Icon>
              <Glyph name="calendar" />
            </Icon>
          }
        >
          May 2026
        </Button>
        <Button
          start={
            <Icon>
              <Glyph name="calendar" />
            </Icon>
          }
          widest={['May 2026']}
        >
          May 2026
        </Button>
      </>,
    );
    const [plain, reserved] = [...container.querySelectorAll('[data-part="start"]')];

    expect(box(reserved!)).toEqual(box(plain!));
  });

  it('draws the label at the start and end at the edge under justify between', () => {
    const { container } = render(
      <Button
        end={<i style={MARK} />}
        justify="between"
        style={{ inlineSize: 320 }}
        widest={MONTHS}
      >
        May 2026
      </Button>,
    );
    const button = container.querySelector('button')!.getBoundingClientRect();
    const label = container.querySelector('[data-part="label"]')!.getBoundingClientRect();
    const end = container.querySelector('[data-part="end"]')!.getBoundingClientRect();

    expect(label.left - button.left).toBeLessThan(20);
    expect(button.right - end.right).toBeLessThan(20);
  });

  it('cuts the label with an ellipsis where the container is narrower than it', () => {
    const { container } = render(
      <div style={{ inlineSize: 100 }}>
        <Button start={<i style={MARK} />} style={{ maxInlineSize: '100%' }} widest={MONTHS}>
          September 2026
        </Button>
      </div>,
    );
    const button = container.querySelector('button')!;
    const label = container.querySelector('[data-part="label"]')!;

    expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(100);
    expect(label.getBoundingClientRect().right).toBeLessThan(button.getBoundingClientRect().right);
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  });

  const MARK = {
    background: 'currentcolor',
    blockSize: 6,
    borderRadius: '50%',
    inlineSize: 6,
  } as const;

  /** How far the center of what is drawn (the mark and the label, or the label) is from the button's. */
  function visibleCenter(button: HTMLElement) {
    const outer = button.getBoundingClientRect();
    const label = button.querySelector('[data-part="label"]')!.getBoundingClientRect();
    const mark = button.querySelector('[data-part="start"] i')?.getBoundingClientRect();
    const left = mark?.left ?? label.left;

    return Math.abs((left + label.right) / 2 - (outer.left + outer.right) / 2);
  }

  function Stepper({
    marked,
    month,
    size = 'md',
  }: {
    marked?: boolean;
    month: string;
    size?: 'lg' | 'md' | 'sm';
  }) {
    const mark = marked ? <i style={MARK} /> : null;

    return (
      <ButtonGroup aria-label="Month">
        <IconButton aria-label="Previous">
          <Icon>
            <Glyph name="chevron-left" />
          </Icon>
        </IconButton>
        <Button
          data-testid="month"
          size={size}
          start={marked === undefined ? undefined : mark}
          widest={MONTHS}
        >
          {month}
        </Button>
        <IconButton aria-label="Next">
          <Icon>
            <Glyph name="chevron-right" />
          </Icon>
        </IconButton>
      </ButtonGroup>
    );
  }
});

/* The danger hover took the tone's subtle step, near black in the dark scheme. It is the solid as a
   tint, over whatever ground the control stands on, and the label keeps the tone's ink. */
describe('a bare button in the danger tone', () => {
  const INK = 'rgb(248, 113, 113)';
  const TONE = {
    '--slotted-duration-instant': '0s',
    '--slotted-tone-danger-border': INK,
    '--slotted-tone-danger-solid': '#dc2626',
    '--slotted-tone-danger-subtle-active': '#211414',
    '--slotted-tone-danger-subtle-hover': '#181111',
    '--slotted-tone-danger-text': INK,
  } as CSSProperties;
  const tint = (share: number) => `color-mix(in oklab, #dc2626 ${share}%, transparent)`;

  afterEach(() => cdp().send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...LEFT }));

  it.each(['ghost', 'outline'] as const)(
    'keeps its ink over a tint of the solid, hovered and pressed (%s)',
    async (variant) => {
      const { container } = render(
        <div style={TONE}>
          <Button tone="danger" variant={variant}>
            Remove
          </Button>
          <i style={{ background: tint(12) }} />
          <i style={{ background: tint(20) }} />
        </div>,
      );
      const button = container.querySelector('button')!;
      const [hovered, pressed] = [...container.querySelectorAll('i')].map(
        (sample) => getComputedStyle(sample).backgroundColor,
      );
      const at = center(button);

      await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...at });
      await expect.poll(() => getComputedStyle(button).backgroundColor).toBe(hovered);
      expect(getComputedStyle(button).color).toBe(INK);

      await cdp().send('Input.dispatchMouseEvent', { type: 'mousePressed', ...LEFT, ...at });
      await expect.poll(() => getComputedStyle(button).backgroundColor).toBe(pressed);
      expect(getComputedStyle(button).color).toBe(INK);
    },
  );
});

const LEFT = { button: 'left', clickCount: 1, x: 0, y: 0 } as const;

/** The middle of an element, in the coordinates of the page that holds the test frame. */
function center(element: Element) {
  const frame = window.frameElement?.getBoundingClientRect();
  const rect = element.getBoundingClientRect();

  return {
    x: (frame?.left ?? 0) + rect.x + rect.width / 2,
    y: (frame?.top ?? 0) + rect.y + rect.height / 2,
  };
}
