import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `skeleton` writes on its own. */
export interface SkeletonMessages {
  /** The accessible name when the instance gives none. */
  readonly label: Message;
}

export const en: SkeletonMessages = {
  label: 'Loading…',
};

export const skeletonMessages: MessageFamily<'skeleton', SkeletonMessages> = {
  name: 'skeleton',
  base: en,
};
