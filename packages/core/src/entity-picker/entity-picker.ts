/**
 * The model of a field that chooses records from a remote collection.
 *
 * `entity-picker` holds ids and draws records. Everything between the two —
 * the shape of a record, the cache of every record seen, a local list that
 * answers like a server, the sections a popup is built from and the name a
 * record is announced by — is the same in React and Angular, so it is here,
 * tested once. Nothing in this file touches the DOM or a framework.
 */

import { createFilter } from '../collection/filter';

/** The face beside a record. Omitted, the avatar shows the initials of `label`. */
export interface EntityAvatar {
  readonly src?: string | undefined;
  /** The name the initials are taken from, when it is not `label`. */
  readonly name?: string | undefined;
  readonly shape?: 'circle' | 'square' | undefined;
  /** The ground behind the face, as `avatar` names it: `plate` for a logo made for a white ground. */
  readonly surface?: 'tone' | 'none' | 'plate' | undefined;
}

/**
 * A record, normalised. `description` is the identifier that tells two
 * records of one name apart — an address, an account number — and `meta` a
 * short fact read with the name: a type, a status.
 */
export interface Entity {
  readonly id: string;
  readonly label: string;
  readonly description?: string | undefined;
  readonly meta?: string | undefined;
  /** `null` takes the face away from this record. */
  readonly avatar?: EntityAvatar | null | undefined;
  /** The heading the record is grouped under in the results. */
  readonly group?: string | undefined;
  /** The scope the record belongs to, for favorites and recent. */
  readonly scope?: string | undefined;
  readonly disabled?: boolean | undefined;
}

export interface EntitySearchRequest {
  readonly query: string;
  readonly scope: string | null;
  /** Nought for the first page. */
  readonly page: number;
  /** What the previous page returned as `cursor`, for a source that pages by cursor. */
  readonly cursor: string | null;
  /** The ids already chosen, for a source that prefers to leave them out. */
  readonly selected: readonly string[];
}

export interface EntitySearchResult {
  readonly items: readonly Entity[];
  /** The size of the whole answer, when the source knows it. */
  readonly total?: number | undefined;
  /** Whether a page after this one exists. */
  readonly hasMore?: boolean | undefined;
  readonly cursor?: string | null | undefined;
}

/**
 * The adapter the family calls. `search` is `DataGridDataSource.getRows`'s
 * shape; `resolve` answers ids the family has not seen, and without it an
 * unknown id is unresolved at once.
 */
export interface EntitySource {
  search(
    request: EntitySearchRequest,
    options: { readonly signal: AbortSignal },
  ): Promise<EntitySearchResult>;
  resolve?(
    ids: readonly string[],
    options: { readonly signal: AbortSignal },
  ): Promise<readonly Entity[]>;
}

// ── The cache ───────────────────────────────────────────────────────────────

export interface EntityCache {
  /** Keeps every record given, by id; a later copy replaces an earlier one. */
  remember(entities: readonly Entity[]): void;
  get(id: string): Entity | undefined;
  has(id: string): boolean;
  /** The records of `ids` the cache holds, in the order of `ids`. */
  pick(ids: readonly string[]): Entity[];
}

/**
 * Every record the family has seen, by id. A chip is drawn from here and not
 * from the list in the popup, so a new search never erases the name of a
 * value.
 */
export function createEntityCache(seed: readonly Entity[] = []): EntityCache {
  const known = new Map<string, Entity>();
  const cache: EntityCache = {
    remember(entities) {
      for (const entity of entities) known.set(entity.id, entity);
    },
    get: (id) => known.get(id),
    has: (id) => known.has(id),
    pick: (ids) =>
      ids.map((id) => known.get(id)).filter((entity): entity is Entity => entity !== undefined),
  };
  cache.remember(seed);
  return cache;
}

// ── A local list as a source ────────────────────────────────────────────────

export interface LocalEntitySourceOptions {
  /** BCP 47, for the comparison the filter makes. */
  readonly locale?: string | undefined;
}

/**
 * A list the application already holds, answering like a server: the family
 * then has one path, and `items` is a source like any other. The query is
 * compared with the collator of `@slotted/core/collection` against the name
 * and the identifier, so `Ä` finds `a` and an address finds its owner.
 */
export function localEntitySource(
  items: readonly Entity[],
  { locale }: LocalEntitySourceOptions = {},
): EntitySource {
  const filter = createFilter({ locale });
  return {
    search: ({ query, scope }) => {
      const matched = items.filter(
        (entity) =>
          (scope === null || entity.scope === undefined || entity.scope === scope) &&
          (filter.contains(entity.label, query) ||
            (entity.description !== undefined && filter.contains(entity.description, query))),
      );
      return Promise.resolve({ items: matched, total: matched.length, hasMore: false });
    },
    resolve: (ids) => {
      const wanted = new Set(ids);
      return Promise.resolve(items.filter((entity) => wanted.has(entity.id)));
    },
  };
}

// ── Sections ────────────────────────────────────────────────────────────────

export type EntitySectionKind = 'chosen' | 'favorites' | 'recent' | 'results' | 'group';

export interface EntitySection {
  /** Stable across renders: the kind, or `group:<name>` for a group of results. */
  readonly key: string;
  readonly kind: EntitySectionKind;
  /** The heading; drawn only when `EntitySections.headings` is true. */
  readonly label: string;
  readonly entities: readonly Entity[];
}

export interface EntitySections {
  readonly sections: readonly EntitySection[];
  /** A heading is drawn only when more than one section is showing. */
  readonly headings: boolean;
}

export interface EntitySectionsInput {
  readonly query: string;
  readonly scope: string | null;
  /** In `multiple`, the chosen records; empty in `single`. */
  readonly chosen?: readonly Entity[];
  readonly favorites?: readonly Entity[];
  readonly recent?: readonly Entity[];
  readonly results: readonly Entity[];
  /** Whether the empty query was searched, so its results belong in the list. */
  readonly searchedEmpty?: boolean;
  readonly labels: {
    readonly chosen: string;
    readonly favorites: string;
    readonly recent: string;
    readonly results: string;
  };
}

/**
 * The popup's sections, without an id twice.
 *
 * An empty query shows what the reader already knows: in `multiple` the
 * chosen records first — where a value the "+N" chip stands for is reached —
 * then favorites, then recent, then what the empty query returned. With a
 * scope chosen, favorites and recent keep only records of that scope or of
 * none. A typed query shows only the results, grouped by `group` in the order
 * each group first appears.
 */
export function entitySections({
  query,
  scope,
  chosen = [],
  favorites = [],
  recent = [],
  results,
  searchedEmpty = true,
  labels,
}: EntitySectionsInput): EntitySections {
  const seen = new Set<string>();
  const fresh = (entities: readonly Entity[]) =>
    entities.filter((entity) => {
      if (seen.has(entity.id)) return false;
      seen.add(entity.id);
      return true;
    });
  const inScope = (entities: readonly Entity[]) =>
    scope === null
      ? entities
      : entities.filter((entity) => entity.scope === undefined || entity.scope === scope);

  const sections: EntitySection[] = [];
  const push = (key: string, kind: EntitySectionKind, label: string, entities: Entity[]) => {
    if (entities.length > 0) sections.push({ key, kind, label, entities });
  };

  if (query === '') {
    push('chosen', 'chosen', labels.chosen, fresh(chosen));
    push('favorites', 'favorites', labels.favorites, fresh(inScope(favorites)));
    push('recent', 'recent', labels.recent, fresh(inScope(recent)));
    if (searchedEmpty) pushResults(fresh(results));
  } else {
    pushResults(fresh(results));
  }

  function pushResults(entities: Entity[]) {
    const order: string[] = [];
    const groups = new Map<string, Entity[]>();
    for (const entity of entities) {
      const name = entity.group ?? '';
      if (!groups.has(name)) {
        groups.set(name, []);
        order.push(name);
      }
      groups.get(name)!.push(entity);
    }
    for (const name of order) {
      if (name === '') push('results', 'results', labels.results, groups.get(name)!);
      else push(`group:${name}`, 'group', name, groups.get(name)!);
    }
  }

  return { sections, headings: sections.length > 1 };
}

// ── Options ─────────────────────────────────────────────────────────────────

/**
 * The value of the offer to create, as an option key. No id a source returns
 * starts with a NUL, so the two offers cannot collide with a record.
 */
export const CREATE_OPTION = '\u0000create';
/** The value of the offer to search again. */
export const RETRY_OPTION = '\u0000retry';

export interface EntityOption {
  readonly key: string;
  readonly disabled: boolean;
}

export interface EntityOptionsInput {
  readonly sections: readonly EntitySection[];
  /** Whether the offer to create is drawn after the results. */
  readonly create?: boolean;
  /** Whether the offer to search again is drawn. */
  readonly retry?: boolean;
  /** Ids that cannot be chosen now: every unchosen one while `max` is reached. */
  readonly blocked?: ReadonlySet<string>;
}

/**
 * Every option in document order, which is the list a movement key walks and
 * `aria-activedescendant` names. The offers are options like any record, so
 * the arrows reach them through the same arithmetic.
 */
export function entityOptions({
  sections,
  create = false,
  retry = false,
  blocked,
}: EntityOptionsInput): EntityOption[] {
  if (retry) return [{ key: RETRY_OPTION, disabled: false }];
  const options: EntityOption[] = sections.flatMap((section) =>
    section.entities.map((entity) => ({
      key: entity.id,
      disabled: entity.disabled === true || blocked?.has(entity.id) === true,
    })),
  );
  if (create) options.push({ key: CREATE_OPTION, disabled: false });
  return options;
}

/**
 * Whether the offer to create is drawn: `onCreate` is given, something was
 * typed, the search answered, and no result is already called that — under
 * the collator, so "Ana Lima" is not offered twice as "ana lima".
 */
export function offersCreation({
  enabled,
  query,
  answered,
  results,
  locale,
}: {
  readonly enabled: boolean;
  readonly query: string;
  readonly answered: boolean;
  readonly results: readonly Entity[];
  readonly locale?: string | undefined;
}): boolean {
  const typed = query.trim();
  if (!enabled || typed === '' || !answered) return false;
  const filter = createFilter({ locale });
  return !results.some((entity) => filter.equals(entity.label, typed));
}

// ── Names ───────────────────────────────────────────────────────────────────

/**
 * What a record is announced as: its name and its identifier, so two chips
 * for two people of one name are two different things to a screen reader
 * without the list in front of it.
 */
export function entityName(entity: Pick<Entity, 'label' | 'description'>): string {
  return entity.description === undefined || entity.description === ''
    ? entity.label
    : `${entity.label}, ${entity.description}`;
}

/** The initials an avatar falls back to: the first letter of the first and last word. */
export function entityInitials(entity: Pick<Entity, 'label' | 'avatar'>): string {
  const source = (entity.avatar?.name ?? entity.label).trim();
  const words = source.split(/\s+/u).filter((word) => word !== '');
  const first = words[0];
  if (first === undefined) return '';
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  const letter = (word: string) => [...word][0]?.toLocaleUpperCase() ?? '';
  return letter(first) + (last === undefined ? '' : letter(last));
}

// ── Recent ──────────────────────────────────────────────────────────────────

/**
 * The recent list after a choice: the record moves to the front, a copy
 * further down leaves, and the list keeps `limit` records. The list is the
 * application's — it persists it where it persists the reader's other things
 * — and this is the one line every application would otherwise write.
 */
export function rememberRecent(recent: readonly Entity[], entity: Entity, limit = 5): Entity[] {
  return [entity, ...recent.filter((item) => item.id !== entity.id)].slice(0, Math.max(0, limit));
}
