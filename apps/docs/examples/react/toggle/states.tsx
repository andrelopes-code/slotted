import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Toggle } from '@slotted/react/toggle';

export default function ToggleStates() {
  return (
    <Inline gap={2}>
      <Toggle icon={<Glyph name="pin" />}>Pin header</Toggle>
      <Toggle defaultPressed icon={<Glyph name="bell" />}>
        Notify me
      </Toggle>
      <Toggle disabled icon={<Glyph name="star" />}>
        Starred only
      </Toggle>
      <Toggle defaultPressed disabled icon={<Glyph name="funnel" />}>
        Carrier filter
      </Toggle>
    </Inline>
  );
}
