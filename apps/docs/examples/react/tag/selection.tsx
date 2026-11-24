import { TagGroup, TagToggle } from '@slotted/react/tag';

export default function TagSelection() {
  return (
    <TagGroup aria-label="Order status">
      <TagToggle defaultSelected tone="accent">
        Open
      </TagToggle>
      <TagToggle tone="accent">Packed</TagToggle>
      <TagToggle tone="accent">Shipped</TagToggle>
      <TagToggle disabled tone="accent">
        Cancelled
      </TagToggle>
    </TagGroup>
  );
}
