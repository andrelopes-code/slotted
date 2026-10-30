import { scanCssText } from './css-scan';
import { COMPONENT_TOKENS, contract } from './generated/contract';
import hooks from './generated/hooks.json';
import { SEED_NAMES } from './seeds';

/**
 * What a theme rule may select and read (design §10.2, ADR 0004). A rule
 * selects only what a binding renders on purpose — a family by `data-ui`, its
 * parts by `data-part`, and the `data-*` attributes a family or the theme
 * axes set — and reads only tokens. Everything else is an implementation
 * detail of a family stylesheet, which changes without notice.
 *
 * `defineTheme` (every rule given as text) and `slotted-build-theme` (every
 * rule, after lightningcss has parsed it) both call `ruleErrors`, so the two
 * paths hold one policy.
 */

/** One violation: the 1-based line in the rule text, the selector of the rule it sits in, and why. */
export interface RuleError {
  readonly line: number;
  readonly selector: string;
  readonly message: string;
}

const UI: Readonly<Record<string, readonly string[]>> = hooks.ui;
const ATTRIBUTES = new Set<string>([
  ...hooks.attributes,
  'data-ui',
  'data-part',
  'data-slotted-theme',
  'data-slotted-scheme',
  'data-slotted-density',
  'data-slotted-corners',
  'data-slotted-seeds',
]);
const TOKENS = new Set<string>([
  ...contract.tokens.map((token) => token.name),
  ...COMPONENT_TOKENS,
  ...SEED_NAMES.map((seed) => `--slotted-seed-${seed}`),
]);

/**
 * The attributes that narrow the theme's root to one of its axes. Outside a
 * style rule `&` is that root, and it may carry these alone: the root holds the
 * theme's own scheme, which `[data-slotted-scheme] …` cannot reach, since that
 * asks for a descendant of the root.
 */
const ROOT_AXES = new Set([
  'data-slotted-scheme',
  'data-slotted-density',
  'data-slotted-corners',
  'data-slotted-seeds',
]);
/** A theme's variant axes, `data-slotted-variant-<axis>`: theme axes like the corners. */
const VARIANT_AXIS = /^data-slotted-variant-[a-z][a-z0-9-]*$/;
/** Pseudo-classes that select by place in the document instead of by a public hook. */
const ROOTS = new Set(['root', 'scope', 'host', 'host-context']);
/** Pseudo-classes whose argument is a selector list matching the same element. */
const SAME_ELEMENT = new Set(['is', 'where', 'matches', '-webkit-any', '-moz-any']);
/** At-rules whose block holds no style rule: their preludes are not selectors. */
const NOT_STYLE =
  /^@(?:-[a-z]+-)?(keyframes|font-face|property|page|counter-style|font-feature-values|font-palette-values|view-transition|position-try)\b/i;

type Component =
  | {
      readonly type: 'attribute';
      readonly raw: string;
      /** Lower-cased: an HTML attribute name matches without regard to case. */
      readonly name: string;
      readonly operator: string | undefined;
      readonly value: string | undefined;
    }
  | {
      readonly type: 'class' | 'id' | 'type' | 'universal' | 'nesting' | 'combinator';
      readonly raw: string;
    }
  | {
      readonly type: 'pseudo-class' | 'pseudo-element';
      readonly raw: string;
      readonly name: string;
      readonly argument: string | undefined;
    };

const isNameChar = (char: string) => /[\w-]/.test(char) || char.charCodeAt(0) >= 0x80;

/**
 * The identifier that starts at `index`, with its escapes decoded (CSS Syntax
 * § 4.3.7), and the index after it. `--\5f x` and `--_x` are one name, as are
 * `v\61r` and `var`. Throws on a `\` that ends the text.
 */
function readIdent(text: string, index: number): { name: string; end: number } {
  let name = '';
  while (index < text.length) {
    const char = text[index]!;
    if (char === '\\') {
      const hex = /^[0-9a-fA-F]{1,6}\s?/.exec(text.slice(index + 1));
      if (hex) {
        name += String.fromCodePoint(Number.parseInt(hex[0].trim(), 16));
        index += 1 + hex[0].length;
      } else if (index + 1 < text.length) {
        name += text[index + 1];
        index += 2;
      } else throw new Error('a dangling escape');
    } else if (isNameChar(char)) {
      name += char;
      index += 1;
    } else break;
  }
  return { name, end: index };
}

/**
 * The decoded name of the identifier that ends right before `end`, such as
 * the function name before a `(`, or `undefined` when none does.
 */
function identBefore(text: string, end: number): string | undefined {
  let start = end;
  while (start > 0) {
    const char = text[start - 1]!;
    if (isNameChar(char) || char === '\\') start -= 1;
    // The whitespace that ends a hex escape belongs to the identifier.
    else if (/\s/.test(char) && /\\[0-9a-fA-F]{1,6}$/.test(text.slice(0, start - 1))) start -= 1;
    else break;
  }
  if (start === end) return undefined;
  // A start inside an escape (`\5f` read back to `5f`) is moved to its backslash.
  try {
    const { name, end: after } = readIdent(text, start);
    return after === end ? name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Reads a selector list into its complex selectors, each a run of components
 * with explicit combinators (a descendant combinator is `' '`). A functional
 * pseudo-class keeps its argument as text; `selectorErrors` reads the ones
 * that hold selectors. Throws on text that is not a selector.
 */
function parseSelectorList(text: string): Component[][] {
  const list: Component[][] = [];
  let current: Component[] = [];
  let index = 0;

  const fail = (reason: string): never => {
    throw new Error(
      `cannot read the selector at ${JSON.stringify(text.slice(index, index + 20))}: ${reason}`,
    );
  };
  /** An identifier with its escapes decoded. */
  const ident = (): string => {
    try {
      const { name, end } = readIdent(text, index);
      index = end;
      return name;
    } catch (error) {
      return fail((error as Error).message);
    }
  };
  const string = (): string => {
    const quote = text[index]!;
    let value = '';
    index += 1;
    while (index < text.length && text[index] !== quote) {
      if (text[index] === '\\') {
        value += text[index + 1] ?? '';
        index += 2;
      } else {
        value += text[index];
        index += 1;
      }
    }
    if (index >= text.length) fail('a string never closed');
    index += 1;
    return value;
  };
  const skipSpace = () => {
    while (/\s/.test(text[index] ?? '')) index += 1;
  };
  /** The text up to the `)` that closes the `(` at `index`, strings and nesting skipped. */
  const argument = (): string => {
    const start = index + 1;
    let depth = 0;
    for (; index < text.length; index += 1) {
      const char = text[index]!;
      if (char === '\\') index += 1;
      else if (char === '"' || char === "'") {
        string();
        index -= 1;
      } else if (char === '(') depth += 1;
      else if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          index += 1;
          return text.slice(start, index - 1);
        }
      }
    }
    return fail('a parenthesis never closed');
  };
  const push = (component: Component) => {
    const last = current[current.length - 1];
    if (component.type === 'combinator' && (last === undefined || last.type === 'combinator')) {
      // A leading combinator is a relative selector (`:has(> x)`); two in a row are not CSS.
      if (last !== undefined) fail('two combinators in a row');
    }
    current.push(component);
  };

  while (index < text.length) {
    const start = index;
    const char = text[index]!;
    if (/\s/.test(char)) {
      skipSpace();
      const next = text[index];
      const last = current[current.length - 1];
      const explicit =
        next === undefined || ',>+~'.includes(next) || (next === '|' && text[index + 1] === '|');
      if (!explicit && last && last.type !== 'combinator') push({ type: 'combinator', raw: ' ' });
      continue;
    }
    if (char === ',') {
      if (current.length === 0 || current[current.length - 1]!.type === 'combinator')
        fail('an empty selector');
      list.push(current);
      current = [];
      index += 1;
      skipSpace();
      continue;
    }
    if (char === '>' || char === '+' || char === '~' || (char === '|' && text[index + 1] === '|')) {
      index += char === '|' ? 2 : 1;
      push({ type: 'combinator', raw: char === '|' ? '||' : char });
      skipSpace();
      continue;
    }
    if (char === '[') {
      index += 1;
      skipSpace();
      if (text[index] === '*' && text[index + 1] === '|') index += 2;
      else if (text[index] === '|' && text[index + 1] !== '=') index += 1;
      let name = ident();
      if (text[index] === '|' && text[index + 1] !== '=') {
        index += 1;
        name = ident();
      }
      if (!name) fail('an attribute without a name');
      skipSpace();
      let value: string | undefined;
      const operator = /^[~|^$*]?=/.exec(text.slice(index));
      if (operator) {
        index += operator[0].length;
        skipSpace();
        value = text[index] === '"' || text[index] === "'" ? string() : ident();
        skipSpace();
        if (/[a-zA-Z]/.test(text[index] ?? '')) ident();
        skipSpace();
      }
      if (text[index] !== ']') fail('an attribute selector never closed');
      index += 1;
      push({
        type: 'attribute',
        raw: text.slice(start, index),
        name: name.toLowerCase(),
        operator: operator?.[0],
        value,
      });
      continue;
    }
    if (char === '.' || char === '#') {
      index += 1;
      if (!ident()) fail(`${char} without a name`);
      push({ type: char === '.' ? 'class' : 'id', raw: text.slice(start, index) });
      continue;
    }
    if (char === '&') {
      index += 1;
      push({ type: 'nesting', raw: '&' });
      continue;
    }
    if (char === ':') {
      const element = text[index + 1] === ':';
      index += element ? 2 : 1;
      const name = ident().toLowerCase();
      if (!name) fail('a pseudo-class without a name');
      const value = text[index] === '(' ? argument() : undefined;
      push({
        type: element ? 'pseudo-element' : 'pseudo-class',
        raw: text.slice(start, index),
        name,
        argument: value,
      });
      continue;
    }
    if (char === '*' || char === '|' || isNameChar(char) || char === '\\') {
      // A type or universal selector, with an optional `namespace|` before it.
      let universal = false;
      if (char === '*') {
        index += 1;
        universal = true;
      } else if (char !== '|') ident();
      if (text[index] === '|' && text[index + 1] !== '|' && text[index + 1] !== '=') {
        index += 1;
        if (text[index] === '*') {
          index += 1;
          universal = true;
        } else {
          universal = false;
          if (!ident()) fail('a namespace without an element');
        }
      }
      push({ type: universal ? 'universal' : 'type', raw: text.slice(start, index) });
      continue;
    }
    fail(`unexpected ${JSON.stringify(char)}`);
  }
  if (current.length === 0 || current[current.length - 1]!.type === 'combinator')
    fail('an empty selector');
  list.push(current);
  return list;
}

/** The selector list after `of` in an `:nth-child()` argument, or `undefined`. */
const ofSelector = (argument: string) => /\bof\s+([\s\S]+)$/i.exec(argument)?.[1];

/**
 * The reasons one complex selector breaks the policy. `requireHooks` holds a
 * compound to carrying a public hook itself; inside `:not()`, `:has()` and
 * `:nth-child(of)` a selector only filters an element its outer compound
 * already selects, so its compounds need none, but they still may use only
 * public hooks.
 */
function complexErrors(
  components: readonly Component[],
  requireHooks: boolean,
  nested: boolean,
  report: (message: string) => void,
  top = false,
) {
  let compound: Component[] = [];
  let first = true;
  const close = (subject: boolean) => {
    if (compound.length === 0) return;
    compoundErrors(compound, requireHooks, nested, report, { top, first, subject });
    compound = [];
    first = false;
  };
  for (const component of components) {
    if (component.type === 'combinator') close(false);
    else compound.push(component);
  }
  close(true);
}

function listErrors(
  text: string,
  requireHooks: boolean,
  nested: boolean,
  report: (message: string) => void,
  top = false,
) {
  let list: Component[][];
  try {
    list = parseSelectorList(text);
  } catch (error) {
    report((error as Error).message);
    return;
  }
  for (const selector of list) complexErrors(selector, requireHooks, nested, report, top);
}

/**
 * Where a compound stands: in a selector the rule names itself (`top`), not in
 * a pseudo-class's argument; as the selector's first compound; as its subject.
 */
interface Place {
  readonly top: boolean;
  readonly first: boolean;
  readonly subject: boolean;
}

function compoundErrors(
  compound: readonly Component[],
  requireHooks: boolean,
  nested: boolean,
  report: (message: string) => void,
  place: Place = { top: false, first: false, subject: false },
) {
  let hooked = false;
  /** `&` outside a style rule: the theme's root, judged once the whole compound is read. */
  let root = false;
  /** A component already reported: the compound is not reported again for lacking a hook. */
  let refused = false;
  let ui: string | undefined;
  let part: string | undefined;
  const sameElement: string[] = [];
  for (const component of compound) {
    switch (component.type) {
      case 'class':
        report(`${component.raw}: a class is not a public selector`);
        refused = true;
        break;
      case 'id':
        report(`${component.raw}: an id is not a public selector`);
        refused = true;
        break;
      case 'type':
        report(`${component.raw}: an element type is not a public selector`);
        refused = true;
        break;
      case 'universal':
        report(`${component.raw}: the universal selector is not a public selector`);
        refused = true;
        break;
      case 'nesting':
        // Outside a style rule `&` is `:scope`: the theme's root, inside the compiled `@scope`.
        if (nested) hooked = true;
        else root = true;
        break;
      case 'attribute': {
        const { name, operator, value, raw } = component;
        hooked = true;
        if (!name.startsWith('data-'))
          report(`${raw}: an attribute outside data-* is not a public selector`);
        else if ((name === 'data-ui' || name === 'data-part') && operator && operator !== '=') {
          report(
            `${raw}: ${name} matches one ${name === 'data-ui' ? 'family' : 'part'} only with =, not ${operator}`,
          );
          refused = true;
        } else if (name === 'data-ui') {
          if (value !== undefined && !(value in UI)) report(`${raw} names no family`);
          ui = value;
        } else if (name === 'data-part') part = value;
        else if (!ATTRIBUTES.has(name) && !VARIANT_AXIS.test(name))
          report(`${raw} is not an attribute any family sets`);
        break;
      }
      case 'pseudo-class': {
        const { name, argument, raw } = component;
        if (ROOTS.has(name)) {
          report(`${raw}: a document or scoping root is not a public selector`);
          refused = true;
        } else if (argument === undefined) break;
        else if (SAME_ELEMENT.has(name)) sameElement.push(argument);
        else if (name === 'not' || name === 'has') listErrors(argument, false, nested, report);
        else if (/^nth-(last-)?child$/.test(name)) {
          const of = ofSelector(argument);
          if (of !== undefined) listErrors(of, false, nested, report);
        }
        break;
      }
      default:
        break;
    }
  }
  if (root) {
    const raw = compound.map((component) => component.raw).join('');
    const others = compound.filter((component) => component.type !== 'nesting');
    const axes = others.every(
      (component) =>
        component.type === 'attribute' &&
        (ROOT_AXES.has(component.name) || VARIANT_AXIS.test(component.name)),
    );
    refused = true;
    if (others.length === 0 || !place.top) {
      report(
        '&: outside a style rule the nesting selector is the scoping root, which is not a public selector',
      );
    } else if (!axes) {
      report(
        `${raw}: outside a style rule the nesting selector is the theme root, which only a scheme, a density or seeds narrow`,
      );
    } else if (!place.first) {
      report(
        `${raw}: outside a style rule the nesting selector is the theme root, which begins a selector`,
      );
    } else if (place.subject) {
      report(`${raw}: the theme root is reached only ahead of a public hook, not styled itself`);
    } else {
      refused = false;
      hooked = true;
    }
  }
  // The element that carries the scheme is the compiled `@scope` root, which is not its own
  // descendant, and the scope limit stops at any other scheme: `[data-slotted-scheme] x` matches nothing.
  if (
    !nested &&
    place.top &&
    place.first &&
    !place.subject &&
    compound.every(
      (component) => component.type === 'attribute' && component.name === 'data-slotted-scheme',
    )
  ) {
    const raw = compound.map((component) => component.raw).join('');
    report(
      `${raw}: ahead of a public hook the scheme sits on the theme root, which a descendant selector never reaches; write &${raw} …`,
    );
  }
  if (ui !== undefined && part !== undefined && !(UI[ui] ?? []).includes(part))
    report(`[data-part='${part}'] is not a part of ${ui}`);
  // `:is()` and `:where()` match the element itself: a compound with no hook of its own is
  // hooked when every selector in them is.
  for (const argument of sameElement) listErrors(argument, requireHooks && !hooked, nested, report);
  if (requireHooks && !hooked && !refused && sameElement.length === 0) {
    report(
      `${compound.map((component) => component.raw).join('')}: a compound selector without data-ui, data-part or a public attribute matches elements no family owns`,
    );
  }
}

/**
 * The reasons a selector list breaks the policy, each naming the part of the
 * selector at fault. `nested` is true for a rule inside a style rule, where
 * `&` is that rule's element.
 */
export function selectorErrors(selector: string, nested = false): string[] {
  const errors: string[] = [];
  listErrors(selector, true, nested, (message) => errors.push(message), true);
  return errors;
}

/** The reason a declaration writes a property no theme may write, or `undefined`. */
export function propertyWriteError(name: string): string | undefined {
  if (name.startsWith('--_'))
    return `${name}: a theme rule cannot write a private property of a family`;
  return undefined;
}

/** At-rules the compiler writes around a theme's rules, which a rule cannot carry at any depth. */
const COMPILER_AT_RULES = /^@(scope|import|layer)\b/i;

/**
 * The reason a `var()`, or a `style()` query in a value or in `@container`,
 * reads a property no theme may read, or `undefined`.
 */
export function tokenReadError(name: string, reader: 'var' | 'style' = 'var'): string | undefined {
  if (name.startsWith('--_')) return `${reader}(${name}) reads a private property of a family`;
  if (name.startsWith('--slotted-') && !TOKENS.has(name))
    return `${reader}(${name}) is not a token`;
  return undefined;
}

/**
 * The reason `@property` registers a property no theme may register, or
 * `undefined`. A registration is hoisted out of the theme's scope and holds
 * for the whole page, so a theme registers only properties of its own.
 */
function registrationError(name: string): string | undefined {
  if (name.startsWith('--_')) return 'a theme rule cannot register a private property of a family';
  if (name.startsWith('--slotted-')) return 'a theme rule cannot register a token';
  return undefined;
}

/** The decoded, lower-cased name of the at-rule a prelude opens (`@media` → `media`). */
function atRuleName(text: string): string | undefined {
  try {
    return readIdent(text, 1).name.toLowerCase();
  } catch {
    return undefined;
  }
}

interface Block {
  /** The selector reported for what the block holds: its own, or the nearest enclosing rule's. */
  readonly selector: string;
  /** `false` inside an at-rule whose block holds no style rule, such as `@keyframes`. */
  readonly styles: boolean;
  /** The block holds declarations: a style rule, a group inside one, a keyframe, a font face. */
  readonly declarations: boolean;
  /** A style rule is this block or encloses it, so `&` names that rule's element. */
  readonly inStyleRule: boolean;
  /** Not read: a custom property's `{}` value, or the body of an at-rule already refused. */
  readonly opaque: boolean;
}

/** The text after `index` with leading whitespace and comments skipped. */
function skipBlank(text: string, index: number): number {
  for (;;) {
    while (/\s/.test(text[index] ?? '')) index += 1;
    if (!text.startsWith('/*', index)) return index;
    const end = text.indexOf('*/', index + 2);
    if (end === -1) return text.length;
    index = end + 2;
  }
}

/** The property a declaration (`name: value`) sets, decoded, or `undefined` for other text. */
function declaredProperty(text: string): string | undefined {
  try {
    const { name, end } = readIdent(text, 0);
    return name && text[skipBlank(text, end)] === ':' ? name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Every policy violation in a theme's CSS text: each style rule's selector,
 * nested rules and rules in conditional groups included; every `@scope`,
 * `@import` and `@layer`, at any depth; every `@property` naming a private
 * property or a token; every declaration that writes a private property or
 * stands outside a style rule; and every `var()` and `style()` query the text
 * reads, outside strings and comments, with escapes in the function and
 * property names decoded. The
 * text is taken to be balanced; `splitTopLevel` refuses one that is not.
 */
export function ruleErrors(css: string): RuleError[] {
  const errors: RuleError[] = [];
  const lineAt = (index: number) => css.slice(0, index).split('\n').length;
  const comments: [number, number][] = [];
  const stack: Block[] = [];
  let start = 0;

  const prelude = (end: number) => {
    let text = '';
    let at = start;
    for (const [from, to] of comments) {
      if (to <= start || from >= end) continue;
      text += `${css.slice(at, Math.max(at, from))} `;
      at = Math.max(at, to);
    }
    text += css.slice(at, end);
    const leading = text.length - text.trimStart().length;
    return { text: text.trim().replace(/\s+/g, ' '), line: lineAt(start + leading) };
  };
  /** Refuses an at-rule the compiler writes; `true` when it did. */
  const compilerAtRule = (text: string, line: number): boolean => {
    const name = atRuleName(text);
    if (name === undefined || !COMPILER_AT_RULES.test(`@${name}`)) return false;
    errors.push({
      line,
      selector: text,
      message: `@${name} is written by the compiler; a theme rule cannot carry its own`,
    });
    return true;
  };
  /** Refuses `@property` naming a private property or a token. */
  const registration = (text: string, line: number) => {
    if (atRuleName(text) !== 'property') return;
    let name: string;
    try {
      name = readIdent(text, skipBlank(text, readIdent(text, 1).end)).name;
    } catch {
      return;
    }
    const message = registrationError(name);
    if (message !== undefined) errors.push({ line, selector: text, message });
  };
  /**
   * Refuses a declaration, the text before a `;` or a `}`, that writes a
   * private property, or that stands outside a style rule: inside the
   * compiled `@scope` such a declaration applies to the theme's root.
   */
  const declaration = (end: number) => {
    const block = stack[stack.length - 1];
    if (block?.opaque) return;
    const { text, line } = prelude(end);
    const name = text.startsWith('@') ? undefined : declaredProperty(text);
    if (name === undefined) return;
    const message = block?.declarations
      ? propertyWriteError(name)
      : `${name}: a declaration outside a style rule applies to the theme root`;
    if (message !== undefined) errors.push({ line, selector: block?.selector ?? '', message });
  };
  const reads: { index: number; block: Block | undefined; reader: 'var' | 'style' }[] = [];

  scanCssText(css, {
    onComment(from, to) {
      comments.push([from, to]);
    },
    onCodeChar(char, index) {
      const parent = stack[stack.length - 1];
      if (char === '(' && !parent?.opaque) {
        const reader = identBefore(css, index)?.toLowerCase();
        if (reader === 'var' || reader === 'style') reads.push({ index, block: parent, reader });
      }
      if (char === '{') {
        const { text, line } = prelude(index);
        // Only a custom property takes a `{}` value; `a:hover {` in a style rule is a nested rule.
        const declared = parent?.declarations ? declaredProperty(text) : undefined;
        const property = declared?.startsWith('--') ? declared : undefined;
        if (parent && (!parent.styles || parent.opaque)) stack.push(parent);
        else if (text.startsWith('@')) {
          const refused = compilerAtRule(text, line);
          registration(text, line);
          const styles = !NOT_STYLE.test(text);
          stack.push({
            selector: parent?.selector ?? text,
            styles,
            declarations: styles ? (parent?.declarations ?? false) : true,
            inStyleRule: parent?.inStyleRule ?? false,
            opaque: refused,
          });
        } else if (property !== undefined) {
          // A custom property whose value is a `{}` block, inside a block of declarations.
          const message = propertyWriteError(property);
          if (message !== undefined) errors.push({ line, selector: parent!.selector, message });
          stack.push({ ...parent!, styles: false, declarations: false, opaque: true });
        } else {
          for (const message of selectorErrors(text, parent?.inStyleRule ?? false))
            errors.push({ line, selector: text, message });
          stack.push({
            selector: text,
            styles: true,
            declarations: true,
            inStyleRule: true,
            opaque: false,
          });
        }
        start = index + 1;
      } else if (char === '}') {
        declaration(index);
        stack.pop();
        start = index + 1;
      } else if (char === ';') {
        const { text, line } = prelude(index);
        if (text.startsWith('@') && !parent?.opaque) compilerAtRule(text, line);
        else declaration(index);
        start = index + 1;
      }
    },
  });

  // A last declaration with no `;` after it, outside every block.
  declaration(css.length);

  for (const { index, block, reader } of reads) {
    let name: string | undefined;
    try {
      name = readIdent(css, skipBlank(css, index + 1)).name;
    } catch {
      name = undefined;
    }
    const message = name?.startsWith('--') ? tokenReadError(name, reader) : undefined;
    if (message !== undefined)
      errors.push({ line: lineAt(index), selector: block?.selector ?? '', message });
  }
  return errors.sort((a, b) => a.line - b.line);
}
