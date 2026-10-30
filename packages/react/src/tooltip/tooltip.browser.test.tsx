import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Tooltip } from './tooltip';
import { TooltipArrow, TooltipContent, TooltipLayer, TooltipTrigger } from './tooltip-parts';

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

function Arrowed({ open }: { open: boolean }) {
  return (
    <Tooltip mount="eager" onOpenChange={() => {}} open={open}>
      <TooltipTrigger>Save draft</TooltipTrigger>
      <TooltipLayer>
        <TooltipContent>Saves without publishing</TooltipContent>
        <TooltipArrow />
      </TooltipLayer>
    </Tooltip>
  );
}
