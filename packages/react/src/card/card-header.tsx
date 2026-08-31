import type { CardRegionProps } from './card.types';

export function CardHeader(props: CardRegionProps) {
  return <div {...props} data-part="header" />;
}
