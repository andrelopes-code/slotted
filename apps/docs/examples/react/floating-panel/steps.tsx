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

export default function FloatingPanelSteps() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open pallet tracker</Button>

      <FloatingPanel
        defaultPlace="top-end"
        largeStep={64}
        onOpenChange={setOpen}
        open={open}
        step={16}
      >
        <FloatingPanelHandle>
          <FloatingPanelTitle>Pallet tracker</FloatingPanelTitle>
          <FloatingPanelClose />
        </FloatingPanelHandle>
        <FloatingPanelBody>
          <Text size="sm">Focus Move, then press an arrow key: 16 px, or 64 px with Shift.</Text>
        </FloatingPanelBody>
      </FloatingPanel>
    </>
  );
}
