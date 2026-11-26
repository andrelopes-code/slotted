import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelClose,
  FloatingPanelHandle,
  FloatingPanelTitle,
} from '@slotted/react/floating-panel';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

export default function FloatingPanelNonModal() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(0);

  return (
    <>
      <Inline>
        <Button onClick={() => setPicked(picked + 1)}>Pick one case</Button>
        <Button onClick={() => setOpen(true)} variant="outline">
          Open pick list
        </Button>
      </Inline>

      <FloatingPanel defaultPlace="bottom-start" onOpenChange={setOpen} open={open}>
        <FloatingPanelHandle>
          <FloatingPanelTitle>Pick list</FloatingPanelTitle>
          <FloatingPanelClose />
        </FloatingPanelHandle>
        <FloatingPanelBody>
          <Text size="sm">Cases picked for order 48213: {picked} of 14</Text>
        </FloatingPanelBody>
      </FloatingPanel>
    </>
  );
}
