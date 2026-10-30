import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Collapsible } from './collapsible';
import { CollapsibleHeader, CollapsiblePanel, CollapsibleTrigger } from './collapsible-parts';
import type { CollapsibleSize } from './collapsible.types';

const center = (element: Element) => {
  const box = element.getBoundingClientRect();
  return box.top + box.height / 2;
};

/* A control height above padding plus one line leaves the trigger free block
   space, which is where the empty description row took its share. */
const tallControls = {
  '--slotted-control-height-sm': '48px',
  '--slotted-control-height-md': '52px',
  '--slotted-control-height-lg': '56px',
} as CSSProperties;

describe('Collapsible trigger without a description', () => {
  it.each<CollapsibleSize>(['sm', 'md', 'lg'])(
    'centers the label and the indicator on the trigger at size %s',
    (size) => {
      render(
        <div style={tallControls}>
          <Collapsible size={size}>
            <CollapsibleHeader>
              <CollapsibleTrigger>Sources: 3</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>Body</CollapsiblePanel>
          </Collapsible>
        </div>,
      );
      const trigger = document.querySelector('[data-part="trigger"]') as HTMLElement;
      const label = trigger.querySelector('[data-part="label"]') as HTMLElement;
      const indicator = trigger.querySelector('[data-part="indicator"]') as HTMLElement;

      expect(trigger.getBoundingClientRect().height).toBeGreaterThan(label.offsetHeight + 12);
      expect(Math.abs(center(label) - center(trigger))).toBeLessThanOrEqual(0.5);
      expect(Math.abs(center(indicator) - center(trigger))).toBeLessThanOrEqual(0.5);
    },
  );
});
