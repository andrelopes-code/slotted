import { Glyph } from '@slotted/react/icon';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';

export default function ToggleGroupIconOnly() {
  return (
    <ToggleGroup aria-label="Order flags" defaultValue={['starred']} multiple>
      <ToggleGroupItem aria-label="Starred" icon={<Glyph name="star" />} value="starred" />
      <ToggleGroupItem aria-label="Pinned" icon={<Glyph name="pin" />} value="pinned" />
      <ToggleGroupItem aria-label="Watching" icon={<Glyph name="bell" />} value="watching" />
    </ToggleGroup>
  );
}
