import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `detail-panel` writes on its own. */
export interface DetailPanelMessages {
  readonly aside: Message;
  readonly loading: Message;
}

export const en: DetailPanelMessages = {
  aside: 'Details',
  loading: 'Loading the record',
};

export const detailPanelMessages: MessageFamily<'detailPanel', DetailPanelMessages> = {
  name: 'detailPanel',
  base: en,
};
