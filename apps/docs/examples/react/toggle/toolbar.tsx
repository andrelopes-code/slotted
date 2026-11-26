import { Glyph } from '@slotted/react/icon';
import { Toggle } from '@slotted/react/toggle';
import { Toolbar, ToolbarSeparator } from '@slotted/react/toolbar';

export default function ToggleToolbar() {
  return (
    <Toolbar aria-label="Order table view">
      <Toggle defaultPressed icon={<Glyph name="pin" />} variant="ghost">
        Pin header
      </Toggle>
      <Toggle icon={<Glyph name="star" />} variant="ghost">
        Starred only
      </Toggle>
      <ToolbarSeparator />
      <Toggle icon={<Glyph name="text-wrap" />} variant="ghost">
        Wrap lines
      </Toggle>
    </Toolbar>
  );
}
