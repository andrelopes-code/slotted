import { Inline } from '@slotted/react/inline';
import { Tag, TagButton, TagLink } from '@slotted/react/tag';

export default function TagStates() {
  return (
    <Inline gap={2}>
      <Tag disabled onRemove={() => undefined}>
        Archived
      </Tag>
      <Tag onRemove={() => undefined} removeDisabled>
        Required
      </Tag>
      <TagButton disabled>Assign owner</TagButton>
      <TagLink disabled href="#carrier-portal">
        Carrier portal
      </TagLink>
    </Inline>
  );
}
