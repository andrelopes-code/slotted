# 0003 — Internationalization

Status: accepted, 2026-10-01.

## Context

Before this decision, 79 families wrote words of their own. The text lived in three places per family: a constant, the family's defaults provider, and an input or prop. The two bindings each kept a copy of the same constants. Thirteen families defaulted to Portuguese and the rest to English. Four shapes of message coexisted: a string with `{slot}`, a string with an ICU plural, a function of a count, and a function of a context. Angular read its defaults once per injector, so a change of language required a new injector.

## Decision

**Chrome text has two places: the catalog and the instance.** Chrome text is a text whose default the library supplies. Each family declares its messages once, in `packages/core/src/i18n/messages/<family>.ts`: the interface, the American English, and the definition `<camel>Messages`. An instance lays its `messages` prop or input over the catalog key by key. A string prop with a library default leaves the component surface; a content prop without a default, a `ReactNode` slot and a native `aria-label` stay.

**One grammar.** A message is a string in a subset of ICU MessageFormat — `{slot}`, `plural` with exact branches and `#`, `select`, apostrophe quoting — or a function `(slots, locale) => string`. A number slot is written in the locale's digits. A translation is data; a language with `few` and `many` needs no code.

**One provider per binding.** `SlottedProvider` (React) and `provideSlotted` (Angular) carry the locale, the catalogs by locale and an optional `resolve` that delegates to the application's own i18n. A nested provider gives a subtree its own locale and inherits the catalogs and `resolve`. In Angular the locale is a `Signal`, read on every call of the function `injectMessages` returns, so a template follows a change of language without the component being created again. The same locale formats numbers and dates; an instance `locale` still wins.

**Resolution order.** The application's `resolve`; the instance override; the catalog of the requested locale, then of its language prefix (RFC 4647 lookup); English. A key is never rendered raw.

**Catalogs are synchronous.** The application imports a locale (`@slotted/core/i18n/pt-BR`) and passes it to the provider. Loading on demand is the application's work; the library holds no loading state, and a server render is deterministic.

**Each family imports only its own English.** The definition object holds the family's base messages, so a bundle carries the English of the families it renders. `EN_US` and `SlottedMessages` exist for typing and for the gate.

**The contract lists keys, not text.** `specs/components/<family>/contract.json` declares `messages`, the ordered list of its keys; `labels` no longer exists.

**A gate holds it.** `pnpm test:i18n` fails on any text written outside the catalog in either binding or in core, on a locale missing a key of `en-US`, on a message whose slots differ from `en-US`, on a message the grammar cannot read, and on a contract whose `messages` differ from the catalog.

## Consequences

- A new family starts with a catalog file and no text of its own; `SlottedMessages` then requires every published locale to translate it before the package compiles.
- A new locale is a directory `packages/core/src/i18n/locales/<tag>/` with one file per family, an assembler `locales/<tag>.ts`, and an entry in `packages/core/vite.config.ts` and `package.json` `exports` (`CONTRIBUTING.md` › Adding a locale).
- `dir` and `lang` stay with the application's document.
