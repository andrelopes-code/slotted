import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Popover } from './popover';
import {
  PopoverContent,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from './popover-parts';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/* An empty `auto` track keeps its gutter: the close column left one gap at the end. */
describe('a popover header without its close', () => {
  it('gives its title the header’s full content width', async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverLayer>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>
                A title long enough to fill the header of the popover from one edge to the other
              </PopoverTitle>
            </PopoverHeader>
          </PopoverContent>
        </PopoverLayer>
      </Popover>,
    );
    for (let index = 0; index < 5; index += 1) await frame();
    const header = document.querySelector(
      '[data-ui="popover"] [data-part="header"]',
    ) as HTMLElement;
    const title = header.querySelector('[data-part="title"]') as HTMLElement;
    const contentRight =
      header.getBoundingClientRect().right - parseFloat(getComputedStyle(header).paddingRight);

    expect(title.getBoundingClientRect().right).toBeCloseTo(contentRight, 0);
  });
});
