import type { DescriptionTermProps } from './description-list.types';

export function DescriptionTerm(props: DescriptionTermProps) {
  return <dt {...props} data-part="term" />;
}
