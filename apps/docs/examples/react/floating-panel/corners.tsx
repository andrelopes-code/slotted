import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelClose,
  FloatingPanelHandle,
  FloatingPanelTitle,
} from '@slotted/react/floating-panel';
import type { FloatingCorner } from '@slotted/react/floating-panel';
import { Text } from '@slotted/react/typography';

const DOCKS: readonly { corner: FloatingCorner; name: string; status: string }[] = [
  { corner: 'top-start', name: 'Inbound dock', status: 'Door 3 free' },
  { corner: 'top-end', name: 'Outbound dock', status: '2 trucks waiting' },
  { corner: 'bottom-start', name: 'Cold storage', status: '3.8 °C' },
  { corner: 'bottom-end', name: 'Returns', status: '11 parcels to sort' },
];

export default function FloatingPanelCorners() {
  const [closed, setClosed] = useState<readonly FloatingCorner[]>(DOCKS.map((dock) => dock.corner));

  return (
    <>
      <Button onClick={() => setClosed([])}>Show all docks</Button>

      {DOCKS.map((dock) => (
        <FloatingPanel
          defaultPlace={dock.corner}
          key={dock.corner}
          onOpenChange={() => setClosed([...closed, dock.corner])}
          open={!closed.includes(dock.corner)}
        >
          <FloatingPanelHandle>
            <FloatingPanelTitle>{dock.name}</FloatingPanelTitle>
            <FloatingPanelClose />
          </FloatingPanelHandle>
          <FloatingPanelBody>
            <Text size="sm">{dock.status}</Text>
          </FloatingPanelBody>
        </FloatingPanel>
      ))}
    </>
  );
}
