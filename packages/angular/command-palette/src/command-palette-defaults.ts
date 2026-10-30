import { inject, InjectionToken } from '@angular/core';
import type { Provider, TemplateRef } from '@angular/core';

import type { CommandItem } from '@slotted/core/commands';
import type { DialogDismissPolicy } from '@slotted/angular/dialog';

export type { CommandGroup, CommandRanker } from '@slotted/core/commands';

/**
 * Where the panel stands. `dialog` composes the dialog family; `inline` draws
 * the panel where it was written — the filtered menu `menu` refused.
 */
export type CommandPalettePresentation = 'dialog' | 'inline';
export type CommandPaletteSize = 'sm' | 'md' | 'lg';

export type CommandPaletteOpenReason =
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select' | 'dismiss' | 'programmatic';
export type CommandPaletteQueryReason = 'keyboard' | 'clear' | 'select' | 'programmatic';
export type CommandPaletteHighlightReason = 'pointer' | 'keyboard' | 'programmatic';
export type CommandPalettePagesReason = 'select' | 'keyboard' | 'pointer' | 'programmatic';
export type CommandPaletteSelectReason = 'pointer' | 'keyboard';

/**
 * What an executed item is handed. `keepOpen()` holds the palette open after
 * the handler returns.
 */
export interface CommandPaletteSelectRequest<Item extends CommandPaletteItem = CommandPaletteItem> {
  readonly item: Item;
  readonly reason: CommandPaletteSelectReason;
  readonly source: Event | undefined;
  keepOpen: () => void;
}

/**
 * One command. `id`, `label` and `keywords` are what the ranker reads; the rest
 * is what the row draws. `children` opens a page; `href` is a destination.
 * The mark in the first column comes from the item template, which is where
 * an Angular consumer writes an icon.
 */
export interface CommandPaletteItem extends CommandItem {
  readonly meta?: string | undefined;
  /** In the library's notation, `mod+shift+p`; drawn by `kbd` and announced. */
  readonly shortcut?: string | undefined;
  readonly href?: string | undefined;
  readonly target?: string | undefined;
  /** Runs before the root's `select` output. A promise keeps the palette open. */
  readonly onSelect?:
    ((request: CommandPaletteSelectRequest) => void | Promise<unknown>) | undefined;
  readonly children?: readonly CommandPaletteItem[] | undefined;
}

/** What the item template receives. */
export interface CommandPaletteItemContext<Item extends CommandPaletteItem = CommandPaletteItem> {
  $implicit: Item;
  current: boolean;
  disabled: boolean;
  pending: boolean;
  query: string;
  /** The label's runs, marked where the query matched. */
  runs: readonly { text: string; matched: boolean }[];
}

export type CommandPaletteItemTemplate<Item extends CommandPaletteItem = CommandPaletteItem> =
  TemplateRef<CommandPaletteItemContext<Item>>;

export interface CommandPaletteDefaults {
  presentation: CommandPalettePresentation;
  size: CommandPaletteSize;
  outsidePress: DialogDismissPolicy;
  loop: boolean;
  autoHighlight: boolean;
  closeOnSelect: boolean;
  clearOnClose: boolean;
  highlightMatch: boolean;
  /** The chord that opens the palette anywhere in the document; `null` for none. */
  hotkey: string | null;
  recentLimit: number;
}

/**
 * The numbers, and why they are these numbers: the React binding's
 * `COMMAND_PALETTE_FALLBACK` records them, and the two lists are one list.
 */
export const COMMAND_PALETTE_FALLBACK: CommandPaletteDefaults = {
  presentation: 'dialog',
  size: 'md',
  outsidePress: 'close',
  loop: true,
  autoHighlight: true,
  closeOnSelect: true,
  clearOnClose: true,
  highlightMatch: true,
  hotkey: 'mod+k',
  recentLimit: 5,
};

export const COMMAND_PALETTE_DEFAULTS = new InjectionToken<CommandPaletteDefaults>(
  'COMMAND_PALETTE_DEFAULTS',
  { providedIn: 'root', factory: () => COMMAND_PALETTE_FALLBACK },
);

/**
 * The decisions an application takes once. The sentences the family speaks
 * come from the language in force (`provideSlotted`).
 */
export function provideCommandPaletteDefaults(defaults: Partial<CommandPaletteDefaults>): Provider {
  return {
    provide: COMMAND_PALETTE_DEFAULTS,
    useValue: { ...COMMAND_PALETTE_FALLBACK, ...defaults },
  };
}

export function injectCommandPaletteDefaults(): CommandPaletteDefaults {
  return inject(COMMAND_PALETTE_DEFAULTS);
}
