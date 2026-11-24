import { Avatar } from '@slotted/react/avatar';
import { Badge } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

export default function InlineBasic() {
  return (
    <Inline>
      <Avatar name="Maria Chen" />
      <Text weight="semibold">Maria Chen</Text>
      <Badge tone="success">Approver</Badge>
      <Badge tone="info">Finance</Badge>
    </Inline>
  );
}
