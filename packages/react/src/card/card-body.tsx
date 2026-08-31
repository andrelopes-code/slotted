import type { CardRegionProps } from './card.types';

export function CardBody(props: CardRegionProps) {
  return <div {...props} data-part="body" />;
}
