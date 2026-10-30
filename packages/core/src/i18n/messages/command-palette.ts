import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `command-palette` writes on its own. */
export interface CommandPaletteMessages {
  readonly back: Message;
  readonly clear: Message;
  readonly close: Message;
  readonly count: Message<{ count: number }>;
  readonly empty: Message;
  /** Announced when a command throws; `{message}` is the error's own message. */
  readonly error: Message<{ message: string }>;
  /** The words beside the key caps in the footer. */
  readonly hintBack: Message;
  readonly hintClose: Message;
  readonly hintNavigate: Message;
  readonly hintSelect: Message;
  readonly input: Message;
  readonly label: Message;
  readonly loading: Message;
  readonly placeholder: Message;
  readonly recent: Message;
}

export const en: CommandPaletteMessages = {
  back: 'Back',
  clear: 'Clear',
  close: 'Close',
  count: '{count, plural, one {# result} other {# results}}',
  empty: 'No results',
  error: 'The command failed: {message}',
  hintBack: 'Back',
  hintClose: 'Close',
  hintNavigate: 'Navigate',
  hintSelect: 'Select',
  input: 'Search commands',
  label: 'Command palette',
  loading: 'Loading…',
  placeholder: 'Type a command or search…',
  recent: 'Recent',
};

export const commandPaletteMessages: MessageFamily<'commandPalette', CommandPaletteMessages> = {
  name: 'commandPalette',
  base: en,
};
