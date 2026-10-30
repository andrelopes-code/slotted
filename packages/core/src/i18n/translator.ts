import { formatMessage } from './format';
import { BASE_LOCALE, negotiateLocale } from './negotiate';
import type {
  Message,
  MessageAt,
  MessageKey,
  MessageSlots,
  PartialMessages,
  SlotsOf,
} from './types';

/** Every family's messages, by catalog name. */
export type CatalogShape = object;

/** A catalog that names any subset of the families and keys. */
export type PartialCatalogOf<C extends CatalogShape> = {
  readonly [F in keyof C]?: PartialMessages<C[F]>;
};

export interface TranslatorOptions<C extends CatalogShape> {
  /** The locale the application asks for, BCP 47. */
  readonly locale: string;
  /** Catalogs by locale. The base (`en-US`) is always present underneath them. */
  readonly catalogs?: Readonly<Record<string, PartialCatalogOf<C>>> | undefined;
  /**
   * The application's own i18n, asked first for every message. `path` is
   * `<family>.<key>` (`dataGrid.filterOperators.contains`); `undefined` falls
   * through to the catalogs.
   */
  readonly resolve?:
    ((path: string, slots: MessageSlots, locale: string) => string | undefined) | undefined;
}

/** A family's messages, written with their slots: `t('groupCount', { count })`. */
export interface FamilyTranslator<M> {
  <P extends MessageKey<M>>(key: P, slots?: SlotsOf<MessageAt<M, P>>): string;
}

/**
 * A family's messages: the name the catalogs key them under and the English
 * every lookup ends on. A family imports its own definition, so a bundle holds
 * the English of the families it renders and no other.
 */
export interface MessageFamily<N extends string = string, M = object> {
  readonly name: N;
  readonly base: M;
}

export interface Translator<C extends CatalogShape> {
  /** The locale requested: what numbers and dates outside messages are written in. */
  readonly locale: string;
  /** The locale of the catalog messages come from: what a message's digits are written in. */
  readonly messageLocale: string;
  family<F extends keyof C & string>(
    definition: MessageFamily<F, C[F]>,
    override?: PartialMessages<C[F]>,
  ): FamilyTranslator<C[F]>;
}

function at(source: unknown, path: readonly string[]): unknown {
  let value = source;
  for (const segment of path) {
    if (value === null || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

/** The locales the lookup chain of `requested` reaches, nearest first, among `available`. */
function chain(requested: string, available: readonly string[]): string[] {
  const out: string[] = [];
  let tag = requested;
  for (;;) {
    const match = negotiateLocale(tag, available);
    if (match === BASE_LOCALE && !available.includes(BASE_LOCALE)) break;
    if (out.includes(match)) break;
    out.push(match);
    const dropped = match.split('-').slice(0, -1);
    if (dropped.length > 0 && dropped[dropped.length - 1]!.length === 1) dropped.pop();
    if (dropped.length === 0) break;
    tag = dropped.join('-');
  }
  return out;
}

/** A translator: the application's `resolve`, an instance's override, the catalogs, then English. */
export function createTranslator<C extends CatalogShape>(
  options: TranslatorOptions<C>,
): Translator<C> {
  const catalogs = options.catalogs ?? {};
  const sources = chain(options.locale, Object.keys(catalogs)).map((tag) => ({
    tag,
    catalog: catalogs[tag]!,
  }));
  const messageLocale = sources[0]?.tag ?? BASE_LOCALE;

  return {
    locale: options.locale,
    messageLocale,
    family({ name, base }, override) {
      const translate = (key: string, slots: MessageSlots = {}): string => {
        const path = key.split('.');
        const resolved = options.resolve?.(`${name}.${key}`, slots, options.locale);
        if (resolved !== undefined) return resolved;

        let message = at(override, path) as Message | undefined;
        let locale = messageLocale;
        if (message === undefined) {
          for (const source of sources) {
            const found = at(source.catalog[name], path);
            if (found !== undefined) {
              message = found as Message;
              locale = source.tag;
              break;
            }
          }
        }
        if (message === undefined) {
          message = at(base, path) as Message | undefined;
          locale = BASE_LOCALE;
        }
        if (message === undefined) return `${name}.${key}`;
        return typeof message === 'function'
          ? message(slots, locale)
          : formatMessage(message, slots, locale);
      };
      return translate as FamilyTranslator<C[typeof name]>;
    },
  };
}
