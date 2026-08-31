import type { CardRegionProps } from './card.types';

export function CardFooter(props: CardRegionProps) {
  return <div {...props} data-part="footer" />;
}
