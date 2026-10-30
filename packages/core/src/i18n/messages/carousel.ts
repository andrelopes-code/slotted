import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `carousel` writes on its own. */
export interface CarouselMessages {
  readonly announce: Message<{ page: number; count: number }>;
  readonly indicator: Message<{ page: number; count: number }>;
  readonly indicators: Message;
  readonly next: Message;
  readonly previous: Message;
  readonly roleDescription: Message;
  readonly slide: Message<{ index: number; count: number }>;
  readonly slideRoleDescription: Message;
  readonly start: Message;
  readonly stop: Message;
  readonly viewport: Message;
}

export const en: CarouselMessages = {
  announce: 'Slide {page} of {count}',
  indicator: 'Slide {page} of {count}',
  indicators: 'Choose slide',
  next: 'Next slide',
  previous: 'Previous slide',
  roleDescription: 'carousel',
  slide: '{index} of {count}',
  slideRoleDescription: 'slide',
  start: 'Resume rotation',
  stop: 'Stop rotation',
  viewport: 'Slides',
};

export const carouselMessages: MessageFamily<'carousel', CarouselMessages> = {
  name: 'carousel',
  base: en,
};
