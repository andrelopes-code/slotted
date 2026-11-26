import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Toggle } from '@slotted/react/toggle';

export default function ToggleIconOnly() {
  return (
    <Inline gap={2}>
      <Toggle aria-label="Pin header" icon={<Glyph name="pin" />} />
      <Toggle aria-label="Starred only" defaultPressed icon={<Glyph name="star" />} />
      <Toggle aria-label="Notify me" icon={<Glyph name="bell" />} />
    </Inline>
  );
}
