import { Glyph } from '@slotted/react/icon';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';

export default function ToggleGroupIcons() {
  return (
    <ToggleGroup aria-label="Listing visibility" defaultValue={['shown']}>
      <ToggleGroupItem icon={<Glyph name="eye" />} value="shown">
        Shown
      </ToggleGroupItem>
      <ToggleGroupItem icon={<Glyph name="eye-off" />} value="hidden">
        Hidden
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
