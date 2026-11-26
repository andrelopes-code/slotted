import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Toggle } from '@slotted/react/toggle';

export default function ToggleVariants() {
  return (
    <Stack gap={3}>
      <Inline gap={2}>
        <Toggle defaultPressed icon={<Glyph name="pin" />} variant="outline">
          Pin header
        </Toggle>
        <Toggle icon={<Glyph name="text-wrap" />} variant="outline">
          Wrap lines
        </Toggle>
      </Inline>
      <Inline gap={2}>
        <Toggle defaultPressed icon={<Glyph name="bell" />} variant="ghost">
          Notify me
        </Toggle>
        <Toggle icon={<Glyph name="star" />} variant="ghost">
          Starred only
        </Toggle>
      </Inline>
      <Inline gap={2}>
        <Toggle defaultPressed variant="chips">
          Late pickups
        </Toggle>
        <Toggle variant="chips">Low stock</Toggle>
      </Inline>
    </Stack>
  );
}
