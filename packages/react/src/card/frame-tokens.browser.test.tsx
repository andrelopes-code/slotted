import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Accordion } from '../accordion';
import { Button } from '../button';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '../collapsible';
import { Toolbar } from '../toolbar';
import { Card, CardBody } from './index';

const EDGE = 'rgb(10, 20, 30)';
const SHADOW = 'rgb(255, 255, 255) 0px 1px 0px 0px inset';

/* One theme for every frame on a page: the same hairline and shadow, through tokens alone. */
const THEME = {
  '--slotted-card-border-color': EDGE,
  '--slotted-card-shadow': SHADOW,
  '--slotted-collapsible-border-color': EDGE,
  '--slotted-collapsible-shadow': SHADOW,
  '--slotted-accordion-border-color': EDGE,
  '--slotted-accordion-shadow': SHADOW,
  '--slotted-toolbar-border-color': EDGE,
  '--slotted-toolbar-shadow': SHADOW,
} as CSSProperties;

describe('the frames a theme restyles with the cards', () => {
  it('draw the card’s edge and shadow on a framed collapsible, accordion and outline toolbar', () => {
    const { container } = render(
      <div style={THEME}>
        <Card>
          <CardBody>Card</CardBody>
        </Card>
        <Collapsible variant="framed">
          <CollapsibleHeader>
            <CollapsibleTrigger>More</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>Body</CollapsiblePanel>
        </Collapsible>
        <Accordion variant="framed">
          <Collapsible value="one">
            <CollapsibleHeader>
              <CollapsibleTrigger>One</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>Body</CollapsiblePanel>
          </Collapsible>
        </Accordion>
        <Toolbar aria-label="Tools" variant="outline">
          <Button>Bold</Button>
        </Toolbar>
      </div>,
    );
    const frames = [
      '[data-ui="card"]',
      ':scope > [data-ui="collapsible"]',
      '[data-ui="accordion"]',
      '[data-ui="toolbar"]',
    ].map((selector) => container.firstElementChild!.querySelector<HTMLElement>(selector)!);
    const [card] = frames;

    for (const frame of frames) {
      const box = getComputedStyle(frame);
      const edge = getComputedStyle(frame, '::before');

      expect(box.borderTopWidth, frame.dataset.ui).toBe('0px');
      expect(box.boxShadow, frame.dataset.ui).toBe(SHADOW);
      expect(edge.borderTopColor, frame.dataset.ui).toBe(EDGE);
      expect(edge.borderTopWidth, frame.dataset.ui).toBe(
        getComputedStyle(card!, '::before').borderTopWidth,
      );
      expect(edge.top, frame.dataset.ui).toBe('0px');
    }
  });
});
