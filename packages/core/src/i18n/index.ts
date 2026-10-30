import type { SlottedMessages } from './catalog';
import {
  createTranslator as createCatalogTranslator,
  type PartialCatalogOf,
  type Translator,
  type TranslatorOptions,
} from './translator';

export * from './catalog';
export { formatMessage, isWellFormed, messageSlots } from './format';
export { BASE_LOCALE, negotiateLocale } from './negotiate';
export type {
  CatalogShape,
  FamilyTranslator,
  MessageFamily,
  PartialCatalogOf,
  Translator,
  TranslatorOptions,
} from './translator';
export type {
  Message,
  MessageAt,
  MessageFn,
  MessageKey,
  MessageRecord,
  MessageSlots,
  PartialMessages,
  SlotValue,
  SlotsOf,
} from './types';

/** A complete catalog: every family, every key. A published locale has this type. */
export type Catalog = SlottedMessages;

/** A catalog that names any subset of families and keys; the rest falls to the base. */
export type PartialCatalog = PartialCatalogOf<SlottedMessages>;

/** The family names, as the catalog keys them. */
export type FamilyName = keyof SlottedMessages;

/** A translator over the shipped catalog shape, English underneath every locale. */
export function createTranslator(
  options: TranslatorOptions<SlottedMessages>,
): Translator<SlottedMessages> {
  return createCatalogTranslator<SlottedMessages>(options);
}
