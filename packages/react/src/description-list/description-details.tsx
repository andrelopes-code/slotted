import type { DescriptionDetailsProps } from './description-list.types';

/**
 * A term may be followed by several of these. The stylesheet pins them to one
 * column so they stay under their term rather than displacing the next one.
 */
export function DescriptionDetails(props: DescriptionDetailsProps) {
  return <dd {...props} data-part="details" />;
}
