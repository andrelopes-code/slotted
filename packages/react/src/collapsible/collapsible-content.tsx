import type { CollapsibleContentProps } from './collapsible.types';

export function CollapsibleContent(props: CollapsibleContentProps) {
  return <div {...props} data-part="content" />;
}
