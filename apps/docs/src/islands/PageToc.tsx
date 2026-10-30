import { TableOfContents, type TableOfContentsItemData } from '@slotted/react/table-of-contents';

interface Props {
  items: { id: string; label: string }[];
}

/** "On this page", with the section in view marked as the reader scrolls. */
export default function PageToc({ items }: Props) {
  const data: TableOfContentsItemData[] = items;
  return <TableOfContents items={data} label="On this page" size="sm" offset={88} />;
}
