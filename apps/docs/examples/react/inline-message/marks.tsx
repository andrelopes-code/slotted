import { Glyph, Icon } from '@slotted/react/icon';
import { InlineMessage } from '@slotted/react/inline-message';
import { Stack } from '@slotted/react/stack';

export default function InlineMessageMarks() {
  return (
    <Stack gap={2}>
      <InlineMessage mark="glyph" tone="warning">
        Carrier pickup moved to 14:00.
      </InlineMessage>
      <InlineMessage mark="dot" tone="warning">
        Pallet 118 is missing a label.
      </InlineMessage>
      <InlineMessage mark="none" tone="warning">
        Dock 3 closes at 18:00.
      </InlineMessage>
      <InlineMessage hideIcon tone="warning">
        Two orders share one delivery slot.
      </InlineMessage>
      <InlineMessage
        icon={
          <Icon>
            <Glyph name="clock" />
          </Icon>
        }
        tone="warning"
      >
        Orders placed after 16:00 ship tomorrow.
      </InlineMessage>
    </Stack>
  );
}
