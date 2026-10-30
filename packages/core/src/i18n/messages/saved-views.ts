import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `saved-views` writes on its own. */
export interface SavedViewsMessages {
  readonly actions: Message<{ name: string }>;
  readonly applied: Message<{ name: string }>;
  readonly builtIn: Message;
  readonly cancel: Message;
  readonly confirmDelete: Message<{ name: string }>;
  readonly create: Message;
  readonly defaultChanged: Message<{ name: string }>;
  readonly delete: Message;
  readonly deleted: Message<{ name: string }>;
  readonly duplicate: Message;
  readonly empty: Message;
  readonly isDefault: Message;
  readonly label: Message;
  readonly modified: Message;
  readonly name: Message;
  readonly rename: Message;
  /** The name of the rename form for one view. */
  readonly renameView: Message<{ name: string }>;
  readonly renamed: Message<{ name: string }>;
  readonly revert: Message;
  readonly save: Message;
  readonly saveAs: Message;
  readonly saved: Message<{ name: string }>;
  readonly setDefault: Message;
}

export const en: SavedViewsMessages = {
  actions: 'Actions for {name}',
  applied: 'View {name} applied',
  builtIn: 'Default',
  cancel: 'Cancel',
  confirmDelete: 'Delete “{name}”?',
  create: 'Save view',
  defaultChanged: '{name} is now the default view',
  delete: 'Delete',
  deleted: 'View {name} deleted',
  duplicate: 'A view with this name already exists',
  empty: 'Enter a name for the view',
  isDefault: 'default',
  label: 'Views',
  modified: 'Modified',
  name: 'View name',
  rename: 'Rename',
  renameView: 'Rename {name}',
  renamed: 'View renamed to {name}',
  revert: 'Revert',
  save: 'Save',
  saveAs: 'Save as new view…',
  saved: 'View {name} saved',
  setDefault: 'Set as default',
};

export const savedViewsMessages: MessageFamily<'savedViews', SavedViewsMessages> = {
  name: 'savedViews',
  base: en,
};
