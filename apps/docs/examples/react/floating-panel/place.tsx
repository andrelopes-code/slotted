import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelClose,
  FloatingPanelHandle,
  FloatingPanelTitle,
} from '@slotted/react/floating-panel';
import type { FloatingPlace } from '@slotted/react/floating-panel';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

export default function FloatingPanelPlace() {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<FloatingPlace | undefined>(undefined);

  return (
    <>
      <Inline>
        <Button onClick={() => setOpen(true)}>Open route notes</Button>
        <Button onClick={() => setPlace({ x: 32, y: 96 })} variant="outline">
          Pin to the top left
        </Button>
      </Inline>

      <FloatingPanel onOpenChange={setOpen} onPlaceChange={setPlace} open={open} place={place}>
        <FloatingPanelHandle>
          <FloatingPanelTitle>Route notes</FloatingPanelTitle>
          <FloatingPanelClose />
        </FloatingPanelHandle>
        <FloatingPanelBody>
          <Text size="sm">
            {place === undefined
              ? 'Not moved yet'
              : `Stored at x ${Math.round(place.x)}, y ${Math.round(place.y)}`}
          </Text>
        </FloatingPanelBody>
      </FloatingPanel>
    </>
  );
}
