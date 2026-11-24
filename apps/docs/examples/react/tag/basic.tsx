import { Tag, TagGroup } from '@slotted/react/tag';

export default function TagBasic() {
  return (
    <TagGroup aria-label="Labels on order SO-10482" role="list">
      <Tag>Wholesale</Tag>
      <Tag>Fragile</Tag>
      <Tag>Priority shipping</Tag>
    </TagGroup>
  );
}
