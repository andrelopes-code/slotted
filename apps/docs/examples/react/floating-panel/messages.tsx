import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelClose,
  FloatingPanelHandle,
  FloatingPanelTitle,
} from '@slotted/react/floating-panel';
import { Text } from '@slotted/react/typography';

export default function FloatingPanelMessages() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open packing timer</Button>

      <FloatingPanel
        defaultPlace="top-start"
        messages={{ close: 'Dismiss the timer', move: 'Reposition the timer' }}
        onOpenChange={setOpen}
        open={open}
      >
        <FloatingPanelHandle>
          <FloatingPanelTitle>Packing timer</FloatingPanelTitle>
          <FloatingPanelClose />
        </FloatingPanelHandle>
        <FloatingPanelBody>
          <Text size="sm">Order 48213: 04:12 elapsed.</Text>
        </FloatingPanelBody>
      </FloatingPanel>
    </>
  );
}
