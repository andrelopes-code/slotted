import type { ReactNode } from 'react';

import { Card, CardBody, CardHeader, CardMedia } from '../card';
import { Image } from '../image';
import { Heading, Text } from '../typography';
import { CarouselSlide } from './carousel-parts';
import type { Piece } from './carousel-catalogue';

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story composes this
 * rather than laying itself out.
 */
export function Scene({
  children,
  label,
  layout = 'block',
  note,
}: {
  children: ReactNode;
  label: string;
  layout?: 'block' | 'row' | 'stack' | 'prose';
  note: ReactNode;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

export function Grid({ children, columns }: { children: ReactNode; columns: 1 | 2 | 3 }) {
  return (
    <div className="slotted-demo-grid" data-columns={String(columns)}>
      {children}
    </div>
  );
}

/** A piece as a photograph filling the slide. */
export function PhotoSlide({
  piece,
  ratio = 'landscape',
}: {
  piece: Piece;
  ratio?: 'landscape' | 'wide' | 'square';
}) {
  return (
    <CarouselSlide>
      <Image alt={`${piece.name}, ${piece.glaze}`} ratio={ratio} src={piece.image} />
    </CarouselSlide>
  );
}

/** A piece as the card a shop lists it on. */
export function ProductSlide({ piece }: { piece: Piece }) {
  return (
    <CarouselSlide aria-label={piece.name}>
      <Card>
        <CardMedia>
          <Image alt="" ratio="square" src={piece.image} />
        </CardMedia>
        <CardHeader>
          <Heading level={3} size="md">
            {piece.name}
          </Heading>
        </CardHeader>
        <CardBody>
          <Text size="sm" tone="muted">
            {piece.glaze} · {piece.price}
          </Text>
        </CardBody>
      </Card>
    </CarouselSlide>
  );
}
