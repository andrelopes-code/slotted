import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelClose,
  FloatingPanelHandle,
  FloatingPanelTitle,
} from '@slotted/react/floating-panel';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function FloatingPanelBasic() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open shipping estimate</Button>

      <FloatingPanel onOpenChange={setOpen} open={open}>
        <FloatingPanelHandle>
          <FloatingPanelTitle>Shipping estimate</FloatingPanelTitle>
          <FloatingPanelClose />
        </FloatingPanelHandle>
        <FloatingPanelBody>
          <Stack gap={2}>
            <Text size="sm">Order 48213, 14 cases</Text>
            <Text size="sm">Freight $86.40</Text>
            <Text size="sm">Total $1,326.40</Text>
          </Stack>
        </FloatingPanelBody>
      </FloatingPanel>
    </>
  );
}
