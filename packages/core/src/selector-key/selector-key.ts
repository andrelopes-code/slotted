/**
 * The selector key: an attribute whose name carries a part or a family.
 *
 * Blink and WebKit file an attribute selector under the attribute's name, not
 * its value. With every rule written against `[data-part=…]`, an element that
 * carried `data-part` was matched against every part rule of every family on
 * each style recalculation — 4 800 selectors, and a full recalculation of a
 * 1 900-element page cost 451 ms against 90 ms with no stylesheet. The
 * stylesheet keys each rule on `[data-part-cell]` or `[data-ui-data-grid]`
 * instead, whose name is a bucket of a handful of rules, and every element
 * that carries `data-part="cell"` also carries `data-part-cell`.
 *
 * `data-part` and `data-ui` stay the public hooks a consumer and a test select
 * by; the key is what the stylesheet matches.
 */

export type SelectorKeyKind = 'part' | 'ui';

/**
 * A props object with no member whose value is `undefined`: an absent state is
 * an absent key. A member that could be `undefined` is optional and does not
 * admit it, so the object spreads onto a component typed under
 * `exactOptionalPropertyTypes` — a router's link declares `href?: string`.
 */
export type DefinedProps<Props> = {
  [Name in keyof Props as undefined extends Props[Name] ? never : Name]: Props[Name];
} & {
  [Name in keyof Props as undefined extends Props[Name] ? Name : never]?: Exclude<
    Props[Name],
    undefined
  >;
};

/**
 * The props a `render` callback receives, without the members whose value is
 * `undefined`. A link family hands them to a router's link, which spreads them
 * onto a component that may not admit `undefined` for an optional member.
 */
export function definedProps<Props extends object>(props: Props): DefinedProps<Props> {
  const next: Record<string, unknown> = {};
  for (const [name, entry] of Object.entries(props)) {
    if (entry !== undefined) next[name] = entry;
  }
  return next as DefinedProps<Props>;
}

const PREFIX: Record<SelectorKeyKind, string> = { part: 'data-part-', ui: 'data-ui-' };
const SOURCE: Record<SelectorKeyKind, string> = { part: 'data-part', ui: 'data-ui' };

/** The key attribute's name for a value: `cell` → `data-part-cell`. */
export function selectorKey(kind: SelectorKeyKind, value: string): string {
  return `${PREFIX[kind]}${value.toLowerCase()}`;
}

/** `{ 'data-part-cell': '' }`, spread beside the attribute it keys. */
export function selectorKeyProps(
  kind: SelectorKeyKind,
  value: string | null | undefined,
): Record<string, string> {
  return value === null || value === undefined || value === ''
    ? {}
    : { [selectorKey(kind, value)]: '' };
}

/**
 * A props object renamed to another part or family: the value and its key are
 * written, and the key the props carried for their previous value is dropped.
 * It is how a family names a `Button` it renders through `render` without the
 * button's own `data-part-root` staying on the element.
 */
export function withSelectorKey<Props extends object>(
  props: Props | undefined,
  kind: SelectorKeyKind,
  value: string,
): Props {
  const next: Record<string, unknown> = {};
  for (const [name, entry] of Object.entries(props ?? {})) {
    if (!name.startsWith(PREFIX[kind])) next[name] = entry;
  }
  next[SOURCE[kind]] = value;
  next[selectorKey(kind, value)] = '';
  return next as Props;
}

/**
 * The keys of a merged props object, recomputed from the `data-part` and
 * `data-ui` it ended with: where one side of a merge wrote the value and the
 * other the key, the key that no longer names the value is dropped.
 */
export function keyedProps<Props extends object>(props: Props): Props {
  const next: Record<string, unknown> = {};
  for (const [name, entry] of Object.entries(props)) {
    if (!name.startsWith(PREFIX.part) && !name.startsWith(PREFIX.ui)) next[name] = entry;
  }
  for (const kind of ['part', 'ui'] as const) {
    const value = next[SOURCE[kind]];
    if (typeof value === 'string' && value !== '') next[selectorKey(kind, value)] = '';
  }
  return next as Props;
}

/**
 * Writes `data-part` or `data-ui` and its key, and removes the key of the value
 * it replaces: an element with two keys matches the rules of both.
 */
export function writeSelectorKey(
  element: Element,
  kind: SelectorKeyKind,
  value: string | null | undefined,
): void {
  if (value === null || value === undefined || value === '') element.removeAttribute(SOURCE[kind]);
  else element.setAttribute(SOURCE[kind], value);
  syncSelectorKey(element, kind);
}

/**
 * Writes the key of a value a host binding writes (`[attr.data-part]`), and
 * returns the value for the binding to read. A binding cannot name an
 * attribute from a value, so the key is written beside it.
 */
export function hostSelectorKey<Value extends string | null>(
  element: Element,
  kind: SelectorKeyKind,
  value: Value,
): Value {
  const wanted = value === null || value === '' ? null : selectorKey(kind, value);
  for (const name of element.getAttributeNames()) {
    if (name.startsWith(PREFIX[kind]) && name !== wanted) element.removeAttribute(name);
  }
  if (wanted !== null) element.setAttribute(wanted, '');
  return value;
}

/** Brings the key in line with the attribute a binding has already written. */
export function syncSelectorKey(element: Element, kind: SelectorKeyKind): void {
  const value = element.getAttribute(SOURCE[kind]);
  const wanted = value === null || value === '' ? null : selectorKey(kind, value);
  for (const name of element.getAttributeNames()) {
    if (name.startsWith(PREFIX[kind]) && name !== wanted) element.removeAttribute(name);
  }
  if (wanted !== null && !element.hasAttribute(wanted)) element.setAttribute(wanted, '');
}

/**
 * Every element under `root` whose keys disagree with its `data-part` or
 * `data-ui`: a value without its key, or a key without its value. The test
 * setups of both bindings run it after each test.
 */
export function selectorKeyMismatches(root: ParentNode): string[] {
  const found: string[] = [];
  const all = root.querySelectorAll('*');
  for (const element of all) {
    for (const kind of ['part', 'ui'] as const) {
      const value = element.getAttribute(SOURCE[kind]);
      const wanted = value === null || value === '' ? null : selectorKey(kind, value);
      const keys = element.getAttributeNames().filter((name) => name.startsWith(PREFIX[kind]));
      const valid = wanted === null ? keys.length === 0 : keys.length === 1 && keys[0] === wanted;
      if (!valid) {
        const tag = element.tagName.toLowerCase();
        const ui = element.closest('[data-ui]')?.getAttribute('data-ui') ?? '?';
        found.push(`<${tag} ${SOURCE[kind]}="${value ?? ''}" keys="${keys.join(' ')}"> in ${ui}`);
      }
    }
  }
  return found;
}
