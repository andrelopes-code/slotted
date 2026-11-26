import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Toggle } from '@slotted/react/toggle';

export default function ToggleSizes() {
  return (
    <Inline align="center" gap={2}>
      <Toggle icon={<Glyph name="text-wrap" />} size="sm">
        Dense rows
      </Toggle>
      <Toggle icon={<Glyph name="text-wrap" />} size="md">
        Default rows
      </Toggle>
      <Toggle icon={<Glyph name="text-wrap" />} size="lg">
        Roomy rows
      </Toggle>
    </Inline>
  );
}
