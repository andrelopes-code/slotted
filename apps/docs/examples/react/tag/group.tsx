import { TagButton, TagGroup } from '@slotted/react/tag';

export default function TagGroupExample() {
  return (
    <TagGroup aria-label="Saved order views" loop={false} orientation="vertical">
      <TagButton>All orders</TagButton>
      <TagButton>Late deliveries</TagButton>
      <TagButton>Awaiting payment</TagButton>
      <TagButton>Returns in transit</TagButton>
    </TagGroup>
  );
}
