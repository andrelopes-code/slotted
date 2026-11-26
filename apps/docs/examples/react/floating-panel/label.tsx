import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelClose,
  FloatingPanelHandle,
} from '@slotted/react/floating-panel';
import { Text } from '@slotted/react/typography';

export default function FloatingPanelLabel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dispatch notes</Button>

      <FloatingPanel
        aria-label="Dispatch notes"
        defaultPlace="bottom-start"
        onOpenChange={setOpen}
        open={open}
      >
        <FloatingPanelHandle>
          <FloatingPanelClose />
        </FloatingPanelHandle>
        <FloatingPanelBody>
          <Text size="sm">Carrier pickup moved to 14:30 for order 48213.</Text>
        </FloatingPanelBody>
      </FloatingPanel>
    </>
  );
}
