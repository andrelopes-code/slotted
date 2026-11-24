import { Inline } from '@slotted/react/inline';
import { Shortcut } from '@slotted/react/kbd';
import { Text } from '@slotted/react/typography';

export default function KbdBasic() {
  return (
    <Inline gap={3} align="center">
      <Text>Search orders</Text>
      <Shortcut keys="mod+k" />
    </Inline>
  );
}
