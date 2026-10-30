import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `app-shell` writes on its own. */
export interface AppShellMessages {
  readonly aside: Message;
  readonly close: Message;
  readonly closeAside: Message;
  readonly nav: Message;
  readonly open: Message;
  readonly openAside: Message;
  /** The name of the bar drawn on the content's edge while the next page loads. */
  readonly progress: Message;
  readonly resizeAside: Message;
  readonly skipToAside: Message;
  readonly skipToMain: Message;
  readonly skipToNav: Message;
}

export const en: AppShellMessages = {
  aside: 'Side panel',
  close: 'Close navigation',
  closeAside: 'Close side panel',
  nav: 'Main navigation',
  open: 'Open navigation',
  openAside: 'Open side panel',
  progress: 'Loading page',
  resizeAside: 'Resize panel',
  skipToAside: 'Skip to side panel',
  skipToMain: 'Skip to content',
  skipToNav: 'Skip to navigation',
};

export const appShellMessages: MessageFamily<'appShell', AppShellMessages> = {
  name: 'appShell',
  base: en,
};
