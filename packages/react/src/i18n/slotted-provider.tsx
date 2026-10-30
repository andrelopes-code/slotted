import {
  BASE_LOCALE,
  createTranslator,
  type FamilyTranslator,
  type MessageFamily,
  type PartialCatalog,
  type PartialMessages,
  type SlottedMessages,
  type Translator,
  type TranslatorOptions,
} from '@slotted/core/i18n';
import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';

interface SlottedContextValue {
  readonly locale: string;
  readonly catalogs: Readonly<Record<string, PartialCatalog>>;
  readonly resolve: TranslatorOptions<SlottedMessages>['resolve'];
  readonly translator: Translator<SlottedMessages>;
}

const ROOT: SlottedContextValue = {
  locale: BASE_LOCALE,
  catalogs: {},
  resolve: undefined,
  translator: createTranslator({ locale: BASE_LOCALE }),
};

const SlottedContext = createContext<SlottedContextValue>(ROOT);

export interface SlottedProviderProps {
  /** The locale the subtree speaks and formats in, BCP 47. Inherited when absent. */
  locale?: string | undefined;
  /**
   * Catalogs by locale. They add to the catalogs of an enclosing provider, a
   * locale named in both taking these.
   */
  catalogs?: Readonly<Record<string, PartialCatalog>> | undefined;
  /** The application's own i18n, asked before any catalog. Inherited when absent. */
  resolve?: TranslatorOptions<SlottedMessages>['resolve'];
  children?: ReactNode;
}

/**
 * The language of everything the library writes below it. One at the root of
 * an application is enough; another inside it gives a subtree its own locale
 * and keeps the catalogs and the `resolve` of the one around it.
 */
export function SlottedProvider({ locale, catalogs, resolve, children }: SlottedProviderProps) {
  const outer = useContext(SlottedContext);
  const nextLocale = locale ?? outer.locale;
  /*
   * `catalogs={{ 'pt-BR': PT_BR }}` is a new object on every render of the
   * application. The same catalog under the same locale is the same catalog,
   * so it is compared by what it holds, and the subtree keeps its words.
   */
  const ownCatalogs = useStableRecord(catalogs);
  const nextCatalogs = useMemo(
    () => (ownCatalogs === undefined ? outer.catalogs : { ...outer.catalogs, ...ownCatalogs }),
    [outer.catalogs, ownCatalogs],
  );
  /* A `resolve` written inline is read through a ref, so a new function does not redraw the subtree. */
  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;
  const hasResolve = resolve !== undefined;
  const nextResolve = useMemo<SlottedContextValue['resolve']>(
    () =>
      hasResolve
        ? (path, slots, locale) => resolveRef.current?.(path, slots, locale)
        : outer.resolve,
    [hasResolve, outer.resolve],
  );
  const value = useMemo<SlottedContextValue>(
    () => ({
      locale: nextLocale,
      catalogs: nextCatalogs,
      resolve: nextResolve,
      translator: createTranslator({
        locale: nextLocale,
        catalogs: nextCatalogs,
        resolve: nextResolve,
      }),
    }),
    [nextLocale, nextCatalogs, nextResolve],
  );
  return <SlottedContext.Provider value={value}>{children}</SlottedContext.Provider>;
}

/** The same record while every entry holds the same reference. */
function useStableRecord<T extends object>(
  record: Readonly<Record<string, T>> | undefined,
): Readonly<Record<string, T>> | undefined {
  const kept = useRef(record);
  const previous = kept.current;
  const same =
    previous === record ||
    (previous !== undefined &&
      record !== undefined &&
      Object.keys(previous).length === Object.keys(record).length &&
      Object.entries(record).every(([key, value]) => previous[key] === value));
  if (!same) kept.current = record;
  return kept.current;
}

/** The locale this subtree formats numbers and dates in; `en-US` with no provider. */
export function useLocale(): string {
  return useContext(SlottedContext).locale;
}

/** The translator in force here. */
export function useTranslator(): Translator<SlottedMessages> {
  return useContext(SlottedContext).translator;
}

/**
 * A family's messages in the language in force, an instance's `messages`
 * prop laid over the catalog key by key.
 *
 * The translator answers to what the override says, not to the object it is
 * written in: `messages` written inline is a new object on every render of
 * its parent, and a new translator re-rendered every row of a data grid on a
 * selection change. Its texts are compared by value; a function is called
 * through the latest override, so a new closure is not a new translator.
 */
export function useMessages<F extends keyof SlottedMessages & string>(
  family: MessageFamily<F, SlottedMessages[F]>,
  override?: PartialMessages<SlottedMessages[F]>,
): FamilyTranslator<SlottedMessages[F]> {
  const translator = useTranslator();
  const latest = useRef(override);
  latest.current = override;
  const shape =
    override === undefined
      ? ''
      : JSON.stringify(
          Object.entries(override).map(([key, value]) => [
            key,
            typeof value === 'function' ? null : value,
          ]),
        );
  return useMemo(() => {
    const current = latest.current;
    if (current === undefined) return translator.family(family);
    const calls = Object.fromEntries(
      Object.entries(current).map(([key, value]) => [
        key,
        typeof value === 'function'
          ? (...args: unknown[]) =>
              (latest.current as Record<string, (...args: unknown[]) => unknown>)[key]!(...args)
          : value,
      ]),
    ) as PartialMessages<SlottedMessages[F]>;
    return translator.family(family, calls);
    /* `shape` stands for the override: the latest one is read through `latest`. */
  }, [translator, family, shape]);
}
