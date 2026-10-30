import {
  computed,
  inject,
  InjectionToken,
  isSignal,
  signal,
  type Provider,
  type Signal,
} from '@angular/core';
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

type Resolve = TranslatorOptions<SlottedMessages>['resolve'];

/** The language in force at one injector: the locale, the catalogs, and the translator over them. */
export interface SlottedI18n {
  readonly locale: Signal<string>;
  readonly catalogs: Signal<Readonly<Record<string, PartialCatalog>>>;
  readonly resolve: Signal<Resolve>;
  readonly translator: Signal<Translator<SlottedMessages>>;
}

function rootI18n(): SlottedI18n {
  const locale = signal(BASE_LOCALE).asReadonly();
  const catalogs = signal<Readonly<Record<string, PartialCatalog>>>({}).asReadonly();
  const resolve = signal<Resolve>(undefined).asReadonly();
  const translator = computed(() => createTranslator({ locale: locale() }));
  return { locale, catalogs, resolve, translator };
}

export const SL_I18N = new InjectionToken<SlottedI18n>('slotted i18n', {
  providedIn: 'root',
  factory: rootI18n,
});

export interface SlottedConfig {
  /** The locale the subtree speaks and formats in, BCP 47. A signal changes it in place. */
  readonly locale?: string | Signal<string> | undefined;
  /**
   * Catalogs by locale, laid over those of an enclosing provider. A signal lets
   * a locale imported on demand arrive after bootstrap: set it, then the locale.
   */
  readonly catalogs?:
    | Readonly<Record<string, PartialCatalog>>
    | Signal<Readonly<Record<string, PartialCatalog>>>
    | undefined;
  /** The application's own i18n, asked before any catalog. */
  readonly resolve?: Resolve;
}

/**
 * The language of everything the library writes under this injector. In
 * `app.config.ts` it serves the application; in a component's `providers` it
 * gives that subtree its own locale and keeps the catalogs and the `resolve`
 * of the injector above. A factory runs in an injection context, so it can
 * read the locale from an application service.
 */
export function provideSlotted(config: SlottedConfig | (() => SlottedConfig)): Provider {
  return {
    provide: SL_I18N,
    useFactory: (): SlottedI18n => {
      const outer = inject(SL_I18N, { skipSelf: true, optional: true }) ?? rootI18n();
      const own = typeof config === 'function' ? config() : config;
      const requested = own.locale;
      const locale = isSignal(requested)
        ? requested
        : requested === undefined
          ? outer.locale
          : signal(requested).asReadonly();
      const ownCatalogs = own.catalogs;
      const catalogs = computed(() => {
        const mine = isSignal(ownCatalogs) ? ownCatalogs() : ownCatalogs;
        return mine === undefined ? outer.catalogs() : { ...outer.catalogs(), ...mine };
      });
      const resolve = computed(() => own.resolve ?? outer.resolve());
      const translator = computed(() =>
        createTranslator({ locale: locale(), catalogs: catalogs(), resolve: resolve() }),
      );
      return { locale, catalogs, resolve, translator };
    },
  };
}

/** The locale this injector formats numbers and dates in; `en-US` with no provider. */
export function injectLocale(): Signal<string> {
  return inject(SL_I18N).locale;
}

/** The translator in force at this injector. */
export function injectTranslator(): Signal<Translator<SlottedMessages>> {
  return inject(SL_I18N).translator;
}

/**
 * A family's messages in the language in force, an instance's `messages`
 * input laid over the catalog key by key. The function reads the locale on
 * every call, so a template that calls it follows a change of language
 * without the component being created again.
 */
export function injectMessages<F extends keyof SlottedMessages & string>(
  family: MessageFamily<F, SlottedMessages[F]>,
  override?: Signal<PartialMessages<SlottedMessages[F]> | undefined>,
): FamilyTranslator<SlottedMessages[F]> {
  const translator = inject(SL_I18N).translator;
  const messages = computed(() => translator().family(family, override?.()));
  return ((key: string, slots?: Record<string, string | number>) =>
    (messages() as (key: string, slots?: Record<string, string | number>) => string)(
      key,
      slots,
    )) as FamilyTranslator<SlottedMessages[F]>;
}
