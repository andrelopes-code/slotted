export function scenario(id: string) {
  return { slotted: { scenarioId: id } } as const;
}

/**
 * Whether a story is on its own page. A layer a story opens for the picture —
 * a tooltip with `defaultOpen`, a menu that mounts open — opens only there: on
 * a reference page (`viewMode: 'docs'`) nine demonstrations share one page,
 * and every layer open on it is a layer the reader did not ask for (TT1).
 * Storybook hands the view mode to `render` in its context; a story rendered
 * with no context at all — a test, a screenshot tool — is treated as isolated.
 */
export function isolated(context: { viewMode?: string } | undefined) {
  return context?.viewMode !== 'docs';
}

/** The scenario a story declares through `scenario()`, or nothing. */
function scenarioIdOf(value: unknown) {
  if (typeof value !== 'object' || value === null) return undefined;
  const parameters = Reflect.get(value, 'parameters');
  const slotted =
    typeof parameters === 'object' && parameters !== null
      ? Reflect.get(parameters, 'slotted')
      : undefined;
  const id =
    typeof slotted === 'object' && slotted !== null
      ? Reflect.get(slotted, 'scenarioId')
      : undefined;
  return typeof id === 'string' ? id : undefined;
}

export function storyScenarioIds(storyModule: Record<string, unknown>) {
  return Object.entries(storyModule)
    .filter(([name]) => name !== 'default')
    .flatMap(([, value]) => {
      const id = scenarioIdOf(value);
      return id === undefined ? [] : [id];
    });
}

export function scenarioCoverageErrors(
  expected: readonly string[],
  storyModule: Record<string, unknown>,
) {
  const actual = storyScenarioIds(storyModule);
  const duplicates = [
    ...new Set(
      actual.filter(
        (id) => expected.includes(id) && actual.filter((actualId) => actualId === id).length > 1,
      ),
    ),
  ];
  return [
    ...expected.filter((id) => !actual.includes(id)).map((id) => `missing ${id}`),
    ...actual.filter((id) => !expected.includes(id)).map((id) => `unknown ${id}`),
    ...duplicates.map((id) => `duplicate ${id}`),
  ];
}

interface ContractMember {
  capabilities: readonly string[];
  /**
   * A default is whatever the contract declares, and two shapes the first
   * version of this type refused are both honest.
   *
   * `null` is the default for a value whose absence is the behaviour:
   * `multi-select` has no limit until a consumer sets `max`, and writing `0` or
   * `Infinity` there would be inventing a number to avoid saying so.
   *
   * A **list** is the default for a setting that is plural: the same family's
   * `delimiters` is the comma alone today and two characters tomorrow, and a
   * string holding `","` would be one value pretending not to be a list.
   *
   * Both reach the table through `String(value)`, which is what the page prints
   * and what the check below compares against.
   */
  defaults: Record<string, boolean | number | string | null | readonly (number | string)[]>;
}

/**
 * What a capability obliges a reference page to document, beyond the member's
 * own defaults — which are already required row by row below. The axes that
 * paint a family are named by its contract, not by this table, and hard-coding
 * `variant` and `fill` here made the table the authority on an axis it cannot
 * see. Button renames `fill` to `variant` and `variant` to `tone`, and both
 * still reach the page through its declared defaults.
 *
 * `appearance` asks for nothing at all, for the same reason one step further
 * on. It used to ask for `size`, which held only while every family that
 * paints itself also scales itself. Link paints three variants and takes its
 * type from the text around it, because `typography` owns the type scale — and
 * the table demanded a row for a prop the contract does not declare. A family
 * that does ship a size step still documents it, because the step is in its
 * declared defaults and every default is required row by row below.
 */
const capabilityApi = {
  appearance: [],
  /**
   * Nothing, for the reason `appearance` and `placement` ask for nothing: the
   * table cannot see what a family's arrangement *is*. `stack` arranges
   * children along one axis and names the distance between them `gap`;
   * `description-list` arranges pairs into columns and names them `layout` and
   * `columns`, and declined an alignment axis in writing — so the table
   * demanded three rows for props the contract does not declare, and the
   * family that had the other shape would have had to document props it does
   * not have. A family that does ship `gap`, `align` or `justify` still
   * documents each one, because it is in its declared defaults and every
   * default is required row by row below.
   */
  arrangement: [],
  /**
   * Nothing, for the reason `arrangement` asks for nothing: the table cannot
   * see *what* a family sizes. A control has one measure and calls it `size`;
   * `app-shell` sizes two regions and calls them `navSize` and `asideSize`,
   * because a shell has no single size and a prop called `size` on it would
   * have to mean one of the two. A family that does ship `size` still documents
   * it, because it is in its declared defaults and every default is required
   * row by row below — so nothing is lost by not demanding the word here.
   */
  size: [],
  shape: ['shape'],
  /**
   * A measured quantity is one number or a series of them. `progress-indicator`
   * states one and calls it `value`; `sparkline` states a series and calls it
   * `data`, which is what every surveyed implementation of a sparkline calls
   * it, and a `value` that held an array would be the one prop in the family
   * named for what it is not. Either word answers, and `max` is required of
   * both because both draw against an extent.
   *
   * `aspect-ratio` states a proportion and calls it `ratio`, which is what
   * every surveyed implementation calls it. A proportion is a quantity the
   * consumer states and the family draws, and it has no extent: there is no
   * `max` a ratio is measured against, so a page for it is not asked for one.
   *
   * `rating`'s summary states a distribution — how many readings each level
   * has — and calls it `counts`. It is not one value, and a `data` that held a
   * count per level would be the one prop in the family named for nothing it
   * holds; the summary draws it against its levels, so `max` is still asked.
   */
  measurement: [['value', 'data', 'ratio', 'counts']],
  /**
   * Nothing, for the reason `content` asks for nothing. `alert` names the axis
   * `live` because the box itself becomes a live region; `toast` names it
   * `priority`, per message, because the box deliberately never becomes one and
   * a prop called `live` would say the opposite of what the family does.
   */
  live: [],
  /**
   * Nothing, for the reason `selection` and `placement` ask for nothing: the
   * table cannot see what a family calls the thing the reader is currently on.
   * `pagination` calls it `page`, `stepper` calls it `step`, and `select` and
   * `combobox` call it `highlightedValue` — the option the highlight is on,
   * which is not the option that is chosen. Requiring the literal word made the
   * table the authority on a prop it cannot know, and every declared default is
   * already required row by row below.
   */
  current: [],
  open: ['open'],
  /**
   * Nothing, for the reason `selection` asks for nothing: the table cannot see
   * what a family's placement *is*. An overlay places itself relative to a
   * trigger and names it `placement`; a field places its label relative to its
   * control and names it `labelPlacement`, because a field has two things that
   * could be placed and the shorter word says neither. Requiring one name here
   * made the table the authority on a prop it cannot know, and every declared
   * default is already required row by row below.
   */
  placement: [],
  status: ['status'],
  /**
   * Nothing, for the reason `appearance` and `arrangement` ask for nothing: the
   * table cannot see what a family's content *is*. A control has something
   * before its label and something after it, and names them `start` and `end`;
   * a message has a name and a sentence, and names them `title` and
   * `description`. Requiring the first pair made the table the authority on
   * slots the second family does not have — `toast` would have had to document
   * two props it never accepts — and every declared default is already
   * required row by row below.
   */
  content: [],
  fullWidth: ['fullWidth'],
  disabled: ['disabled'],
  loading: ['loading'],
  pressed: ['pressed'],
  orientation: ['orientation'],
  invalid: ['invalid'],
  required: ['required'],
  readOnly: ['readOnly'],
  wiring: [],
  /**
   * Nothing, for the same reason. A family that lets a consumer decide whether
   * a part can hold focus ships `focusable` and documents it as a declared
   * default; one whose parts are always reachable — `toast`, whose region and
   * messages carry `tabindex="-1"` so a hotkey has somewhere to land — has no
   * such prop, and the table cannot tell the two apart.
   */
  focusable: [],
  decorative: ['decorative'],
  underline: ['underline'],
  external: ['external'],
  activation: ['activation'],
  /**
   * Nothing, for the reason `appearance` asks for nothing: the table cannot
   * see what a family's selection *is*. Tabs selects one of a set and names it
   * `value`; a tag holds its own selection and names it `selected`. Naming one
   * of the two here made the table the authority on a prop it cannot know, and
   * the family with the other shape had to document a prop it does not have.
   * Every declared default is already required row by row below, so both
   * families still document their own.
   */
  selection: [],
  /**
   * Nothing, for the reason `selection` and `placement` ask for nothing: the
   * table cannot see what a family calls the control that takes an item away.
   * A chip is removed and names its label `removeLabel`; a tab is dismissed —
   * the APG's own word for closing one — and names it `dismissLabel`. Naming
   * one of the two here made the table the authority on a prop it cannot know,
   * and the family with the other word had to document a prop it does not have.
   * Every declared default is still required row by row below.
   */
  removable: [],
  /**
   * The row height and the buffer, and not the count. `itemCount` was a prop of
   * `virtual-list`, the family `docs/process/build-order.md` retired in wave 6 when
   * windowing became a capability of the collection engine: a family that
   * windows now holds a collection and the count is the collection's, so the
   * table demanded a prop no such family can declare.
   */
  /**
   * `itemSize` is a list's word and `rowHeight` a grid's: `data-grid` windows
   * rows and columns and names the row's height the way AG Grid and MUI X
   * do, so either answers.
   */
  virtualization: [['itemSize', 'rowHeight'], 'overscan'],
  files: ['accept', 'files', 'maxSize', 'multiple'],
  checked: ['checked'],
  /**
   * The text a control holds. Unlike `selection` and `placement`, there is
   * nothing here the table cannot know: a family that holds a value has one
   * value, `docs/state-and-events.md` names the pair `value` and
   * `defaultValue`, and a page that documents neither has documented a control
   * a reader cannot fill in.
   */
  value: ['value', 'defaultValue'],
  revealed: ['revealed'],
  /**
   * The errors a form holds. Like `value`, there is nothing here the table
   * cannot know: `docs/state-and-events.md` names the pair, and a form page
   * that documented neither would leave a reader unable to hand a server's
   * answer back to the component that has to show it.
   */
  validity: ['errors', 'defaultErrors'],
} as const;

/** The two sides of one mutable capability, as the family contract names them. */
interface StateModelEntry {
  controlled: string;
  uncontrolled: string;
}

/**
 * One capability held for more than one thing is a *set* of named models —
 * `app-shell` has a navigation region and a secondary pane, and each of them
 * opens. `specs/contract.schema.mjs` tells the two shapes apart by the
 * presence of `controlled` on the entry itself, and so does this.
 */
type StateModelDeclaration = StateModelEntry | Readonly<Record<string, StateModelEntry>>;

function stateModels(entry: StateModelDeclaration): readonly StateModelEntry[] {
  return 'controlled' in entry && typeof entry.controlled === 'string'
    ? [entry as StateModelEntry]
    : Object.values(entry as Record<string, StateModelEntry>);
}

/**
 * `capabilityApi` guesses a prop name from a capability, and the guess is
 * wrong for every family that holds two values of the same kind or calls its
 * own by another name: pagination holds a page and a page size, and neither of
 * them is `value`; its current page is `page` where a stepper's is `step`.
 *
 * The contract already names both sides of every mutable capability, in its
 * `stateModel`, and `specs/contract.schema.mjs` refuses a mutable capability
 * that declares none. So when a caller hands the model over it is the
 * authority, and the table stays the fallback for a capability the model does
 * not name and for a family that declares no model at all.
 */
/**
 * Whether the page documents this value as a two-way binding, in which case the
 * controlled and uncontrolled halves are one row rather than two.
 *
 * `docs/state-and-events.md` names a pair — `value` and `defaultValue` — and
 * React ships both. Angular's `model()` **is** both: it is read, it is written,
 * and it has no `default` twin to document, so an Angular page asked for one
 * would have to invent a prop the component does not have. Every Angular page
 * escaped this by declining to pass a state model at all, which turned the
 * whole check off for that framework rather than adapting it; a page that
 * passes one and names the type is now checked on the half it actually has.
 */
function twoWay(rows: readonly { name: string; type?: string }[], controlled: string): boolean {
  const row = rows.find((candidate) => candidate.name === controlled);
  return row?.type?.startsWith('model<') === true;
}

export function apiMetadataErrors(
  member: ContractMember,
  rows: readonly { appliesTo?: string; name: string; type?: string; defaultValue: string }[],
  stateModel?: Readonly<Record<string, StateModelDeclaration>> | undefined,
) {
  const errors: string[] = [];
  const names = rows.map((row) => row.name);
  /**
   * A row is identified by the prop **and the part it is on**, not by the prop
   * alone. A compound family holds the same word twice on purpose — `select`
   * has a `value` on its root and a `value` on each of its options, and a
   * `disabled` on both — and a check that keyed on the name refused a table
   * that documented the second one. Every family before it either had no
   * item-level props or left them undocumented, which is why the narrower rule
   * held for as long as it did.
   */
  const keys = rows.map((row) => `${row.appliesTo ?? ''}.${row.name}`);
  const duplicates = [
    ...new Set(
      rows
        .filter((_, index) => keys.indexOf(keys[index] as string) !== index)
        .map((row) => row.name),
    ),
  ];
  if (duplicates.length > 0) return duplicates.map((name) => `duplicate API ${name}`);
  for (const capability of member.capabilities) {
    const declared = stateModel?.[capability];
    const required = declared
      ? stateModels(declared).flatMap((model) => [
          model.controlled,
          ...(twoWay(rows, model.controlled) ? [] : [model.uncontrolled]),
        ])
      : (capabilityApi[capability as keyof typeof capabilityApi] ?? []);
    for (const name of required) {
      const alternatives = Array.isArray(name) ? name : [name];
      if (!alternatives.some((candidate) => names.includes(candidate))) {
        errors.push(`missing API ${alternatives.join(' or ')}`);
      }
    }
    /* A value or a series is drawn against an extent; a ratio is not. */
    if (capability === 'measurement' && !names.includes('ratio') && !names.includes('max')) {
      errors.push('missing API max');
    }
  }
  for (const [name, value] of Object.entries(member.defaults)) {
    const row = rows.find((candidate) => candidate.name === name);
    if (row === undefined) errors.push(`missing default ${name}`);
    else if (row.defaultValue !== String(value)) {
      errors.push(`default ${name}: expected ${String(value)}, received ${row.defaultValue}`);
    }
  }
  return errors;
}

/**
 * Binds the scenes a docs module declares to the stories that render them. The
 * metadata lives in the docs module so a test can read a page's
 * demonstrations without importing Storybook, and the story objects live in
 * the stories module; this is the one place the two meet, and it refuses a
 * scene with no story rather than rendering a page with a hole in it.
 *
 * `stories` is either the stories module itself or a table keyed by scene id.
 * A key wins where one exists, and a story that declares the scene through
 * `scenario()` answers where none does — so a table that has fallen a scene
 * behind still binds, and a page is not blown up by a name nobody kept in step.
 * That is not a convenience: the table was hand-written, `scenarioCoverageErrors`
 * already proved the story existed, and the only thing left to get wrong was
 * the copy. A whole reference page failed to render over one missing line, and
 * every test passed.
 *
 * The scene type is generic so that it survives. Declaring the parameter as
 * `{ snippet: unknown }` widened every scene's snippet to `unknown` on the way
 * out, and the result was then assignable to nothing — which is why forty
 * stories files ended a call to this function with `as never`. A cast is not a
 * convention; it is a defect wearing one, and every one of those files was
 * silently opting out of the check that the scene it bound is the scene the
 * page declares.
 */
export function bindScenes<
  Scene extends { id: string; title: string; note: string; snippet: unknown },
  Story,
>(scenes: readonly Scene[], stories: Record<string, Story>): (Scene & { of: Story })[] {
  const declared = new Map<string, Story>();
  for (const [name, story] of Object.entries(stories)) {
    if (name === 'default') continue;
    const id = scenarioIdOf(story);
    if (id !== undefined && !declared.has(id)) declared.set(id, story);
  }

  return scenes.map((scene) => {
    const story = stories[scene.id] ?? declared.get(scene.id);
    if (story === undefined) throw new Error(`Scene "${scene.id}" is bound to no story`);
    return { ...scene, of: story };
  });
}
