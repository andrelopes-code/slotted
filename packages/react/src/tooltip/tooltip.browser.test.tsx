import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Tooltip } from './tooltip';
import { TooltipArrow, TooltipContent, TooltipLayer, TooltipTrigger } from './tooltip-parts';
import type { TooltipSide, TooltipVariant } from './tooltip.types';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/* The fade was the content's alone: the arrow stood opaque on the first frame of an open and the last of a close. */
describe('the arrow of a tooltip', () => {
  /* The theme's motion tokens, which the test document does not load. */
  beforeEach(() => {
    document.documentElement.style.setProperty('--slotted-duration-medium', '200ms');
    document.documentElement.style.setProperty('--slotted-easing-enter', 'ease-out');
  });
  afterEach(() => {
    document.documentElement.removeAttribute('style');
  });

  it('fades with the content', async () => {
    const { rerender } = render(<Arrowed open={false} />);
    const part = (name: string) =>
      document.querySelector(`[data-ui="tooltip"] [data-part="${name}"]`)!;

    expect(getComputedStyle(part('arrow')).opacity).toBe(getComputedStyle(part('content')).opacity);
    expect(getComputedStyle(part('content')).opacity).toBe('0');

    rerender(<Arrowed open />);
    for (let index = 0; index < 5; index += 1) await frame();

    expect(getComputedStyle(part('content')).animationName).toBe('slotted-tooltip-fade');
    expect(getComputedStyle(part('arrow')).animationName).toBe('slotted-tooltip-fade');
  });
});

/* Half of the arrow's square lies over the content. While both fade, that half composited twice and
   the diamond showed through the content. The fade is held at one half and the pixels are read. */
describe('the arrow over a content that is fading', () => {
  it.each(
    (['top', 'bottom', 'left', 'right'] as const).flatMap((side) =>
      (['inverse', 'surface'] as const).map((variant) => [side, variant] as const),
    ),
  )('leaves the content its own color on the %s side of the %s variant', async (side, variant) => {
    render(
      <div style={{ display: 'grid', height: 400, placeItems: 'center' }}>
        <style>{HALFWAY}</style>
        <Arrowed open side={side} variant={variant} />
      </div>,
    );
    for (let index = 0; index < 5; index += 1) await frame();
    const arrow = document.querySelector('[data-ui="tooltip"] [data-part="arrow"]')!;
    const content = document.querySelector('[data-ui="tooltip"] [data-part="content"]')!;

    const at = await pixels();
    const { beside, under } = pointsUnder(
      side,
      arrow.getBoundingClientRect(),
      content.getBoundingClientRect(),
    );

    expect(document.querySelector('[data-ui="tooltip"]')?.getAttribute('data-side')).toBe(side);
    expect(at(under)).toEqual(at(beside));
  });
});

/* The page is tinted, so a white surface composited twice differs from one composited once. The
   measure leaves room for a lateral side in a 412-pixel viewport. */
const HALFWAY = `
  :root { --slotted-tooltip-measure: 6rem; background: steelblue; }
  [data-ui="tooltip"] > * {
    animation: none !important;
    color: transparent !important;
    opacity: 0.5 !important;
  }
`;

function Arrowed({
  open,
  side,
  variant,
}: {
  open: boolean;
  side?: TooltipSide;
  variant?: TooltipVariant;
}) {
  return (
    <Tooltip mount="eager" onOpenChange={() => {}} open={open} side={side} variant={variant}>
      <TooltipTrigger>Save draft</TooltipTrigger>
      <TooltipLayer>
        <TooltipContent>Saves without publishing</TooltipContent>
        <TooltipArrow />
      </TooltipLayer>
    </Tooltip>
  );
}

type Point = readonly [x: number, y: number];

/** A point three pixels inside the content, under the center of the arrow's base, and one along the same edge clear of the arrow. */
function pointsUnder(side: TooltipSide, arrow: DOMRect, content: DOMRect) {
  const inside = 3;
  const clear = 12;
  const x = arrow.x + arrow.width / 2;
  const y = arrow.y + arrow.height / 2;

  if (side === 'left' || side === 'right') {
    const edge = side === 'right' ? content.left + inside : content.right - inside;
    return { beside: [edge, y + clear] as Point, under: [edge, y] as Point };
  }

  const edge = side === 'bottom' ? content.top + inside : content.bottom - inside;
  return { beside: [x + clear, edge] as Point, under: [x, edge] as Point };
}

async function pixels() {
  const base64 = await page.screenshot({ element: document.documentElement, save: false });
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const scale = image.width / document.documentElement.clientWidth;

  return ([x, y]: Point) => [
    ...context.getImageData(Math.floor(x * scale), Math.floor(y * scale), 1, 1).data,
  ];
}
