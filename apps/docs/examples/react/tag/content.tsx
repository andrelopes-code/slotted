import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Tag } from '@slotted/react/tag';

export default function TagContent() {
  return (
    <Inline gap={2}>
      <Tag start={<Glyph name="clock" />} tone="warning">
        Due Friday
      </Tag>
      <Tag end={<Glyph name="lock" />}>Contract price</Tag>
      <Tag end={<Glyph name="circle-check" />} start={<Glyph name="pin" />} tone="success">
        Verified address
      </Tag>
    </Inline>
  );
}
