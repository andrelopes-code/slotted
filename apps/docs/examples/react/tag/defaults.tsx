import { Inline } from '@slotted/react/inline';
import { Tag, TagDefaultsProvider } from '@slotted/react/tag';

export default function TagDefaults() {
  return (
    <TagDefaultsProvider shape="square" size="sm">
      <Inline gap={2}>
        <Tag>Inbound</Tag>
        <Tag>Cross-dock</Tag>
        <Tag shape="pill" size="md">
          Cold chain
        </Tag>
      </Inline>
    </TagDefaultsProvider>
  );
}
