import assert from 'node:assert/strict';
import test from 'node:test';

import { readFileSync } from 'node:fs';

import { validateRules } from '../cli/validate-rules.mjs';
import { defineTheme, recipes } from '../dist/index.js';

const values = JSON.parse(
  readFileSync(new URL('../../themes/src/default/values.json', import.meta.url), 'utf8'),
);
const SEEDS = {
  accent: '#1d4ed8',
  neutral: '#64748b',
  success: '#15803d',
  info: 'oklch(0.6 0.15 255)',
  warning: '#facc15',
  danger: '#dc2626',
};

const ok = (css) => assert.deepEqual(validateRules(css, 'rules.css'), []);
const fails = (css, message) => {
  const errors = validateRules(css, 'rules.css');
  assert.equal(errors.length, 1, errors.join('\n'));
  // Every rule-validation error names its file, the line of the enclosing rule
  // and that rule's selector, ahead of the brief's own message text (spec §10.2).
  assert.match(errors[0], /^rules\.css:\d+ /, errors[0]);
  assert.ok(errors[0].includes(message), errors[0]);
};

test('accepts public hooks, theme axes and tokens', () => {
  ok(
    `[data-ui='button'][data-variant='solid'] [data-part='label'] { font-weight: var(--slotted-font-weight-semibold); }`,
  );
  ok(
    `&[data-slotted-scheme='dark'] [data-ui='text-field'] { border-radius: var(--slotted-text-field-radius, 0); }`,
  );
  ok(`[data-ui='card']:is(:hover, [data-disabled]) { color: var(--slotted-seed-accent); }`);
});

test('names a syntax error the policy does not refuse, with its column', () => {
  const errors = validateRules(`[data-ui='button'] { color red; }`, 'rules.css');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^rules\.css:\d+:\d+ /);
});

/**
 * Text the policy refuses that lightningcss also cannot parse is refused in
 * the policy's words, which are the words `defineTheme` uses at runtime.
 */
test('names what the policy refuses in its own words where lightningcss cannot parse it', () =>
  fails(`[data-ui='button' { color: red; }`, 'an attribute selector never closed'));

test('names a data-ui no family sets', () =>
  fails(`[data-ui='nope'] { color: red; }`, "[data-ui='nope'] names no family"));
test('names a part the family does not have', () =>
  fails(
    `[data-ui='button'][data-part='nope'] { color: red; }`,
    "[data-part='nope'] is not a part of button",
  ));
test('names an attribute no family sets', () =>
  fails(`[data-nope] { color: red; }`, '[data-nope] is not an attribute any family sets'));
test('names a private property', () =>
  fails(
    `[data-ui='card'] { color: var(--_ink); }`,
    'var(--_ink) reads a private property of a family',
  ));
test('names a property that is no token', () =>
  fails(`[data-ui='card'] { color: var(--slotted-nope); }`, 'var(--slotted-nope) is not a token'));
test('names a class selector', () =>
  fails(`.card { color: red; }`, '.card: a class is not a public selector'));

test('names the full selector of the enclosing rule, not just the offending component', () => {
  const errors = validateRules(`[data-ui='button'][data-part='nope'] { color: red; }`, 'rules.css');
  assert.equal(errors.length, 1, errors.join('\n'));
  assert.ok(errors[0].includes("[data-ui='button'][data-part='nope']"), errors[0]);
});

test('names the selector of the enclosing rule for a var() error, not only the filename', () => {
  const errors = validateRules(`[data-ui='card'] { color: var(--_ink); }`, 'rules.css');
  assert.equal(errors.length, 1, errors.join('\n'));
  assert.match(errors[0], /^rules\.css:\d+ /, errors[0]);
  assert.ok(errors[0].includes("[data-ui='card']"), errors[0]);
});

test('attributes a var() after a nested rule to the outer rule that directly contains it, not the nested one', () => {
  const errors = validateRules(
    `[data-ui='card'] {\n  & [data-part='label'] { color: red; }\n  background: var(--_ink);\n}`,
    'order.css',
  );
  assert.equal(errors.length, 1, errors.join('\n'));
  // The declaration sits on line 3, directly inside the outer `[data-ui='card']` rule
  // (lightningcss models the trailing declaration as its own `nested-declarations`
  // block once a sibling rule is nested before it, so the line moves off the outer
  // rule's own opening line, but the selector it reports stays the outer one's).
  assert.match(errors[0], /^order\.css:3 /, errors[0]);
  assert.ok(errors[0].includes("[data-ui='card']"), errors[0]);
  assert.ok(!errors[0].includes("[data-part='label']"), errors[0]);
  assert.ok(errors[0].includes('var(--_ink) reads a private property of a family'), errors[0]);
});

test('names an element type selector, with the file, the line and the selector', () => {
  const errors = validateRules(
    `[data-ui='card'] { gap: 0; }\n[data-ui='text-field'] input { color: red; }`,
    'rules.css',
  );
  assert.deepEqual(errors, [
    "rules.css:2 [data-ui='text-field'] input: input: an element type is not a public selector",
  ]);
});
test('names html and body as element types', () => {
  fails(`html [data-ui='card'] { color: red; }`, 'html: an element type is not a public selector');
  fails(
    `body > [data-ui='card'] { color: red; }`,
    'body: an element type is not a public selector',
  );
});
test('names an id selector', () =>
  fails(`[data-ui='card']#total { color: red; }`, '#total: an id is not a public selector'));
test('names the universal selector', () =>
  fails(
    `[data-ui='card'] > * { margin: 0; }`,
    '*: the universal selector is not a public selector',
  ));
test('names :root and :scope, which select by place in the document', () => {
  fails(`:root { color: red; }`, ':root: a document or scoping root is not a public selector');
  fails(
    `:scope [data-ui='card'] { color: red; }`,
    ':scope: a document or scoping root is not a public selector',
  );
});
test('names an attribute outside data-*', () => {
  fails(
    `[data-ui='text-field'][aria-invalid='true'] { color: red; }`,
    "[aria-invalid='true']: an attribute outside data-* is not a public selector",
  );
  fails(
    `[data-ui='tabs'] [role='tab'] { color: red; }`,
    "[role='tab']: an attribute outside data-* is not a public selector",
  );
});
test('names a compound that carries no public hook', () =>
  fails(
    `[data-ui='card'] :first-child { margin: 0; }`,
    ':first-child: a compound selector without data-ui, data-part or a public attribute matches elements no family owns',
  ));
test('checks the selectors inside :is(), :where(), :not() and :has()', () => {
  fails(`[data-ui='card']:not(.x) { color: red; }`, '.x: a class is not a public selector');
  fails(
    `[data-ui='field']:has(input) { color: red; }`,
    'input: an element type is not a public selector',
  );
  fails(
    `:is([data-ui='card'], div) { color: red; }`,
    'div: an element type is not a public selector',
  );
  fails(`:where([data-ui='nope']) { color: red; }`, "[data-ui='nope'] names no family");
});
test('checks a rule nested in another rule or in a conditional group', () => {
  fails(
    `[data-ui='card'] {\n  & span { color: red; }\n}`,
    'span: an element type is not a public selector',
  );
  fails(
    `@media (width > 40rem) {\n  [data-ui='card'] .x { color: red; }\n}`,
    '.x: a class is not a public selector',
  );
});
test('accepts pseudo-classes, pseudo-elements, nesting, combinators and :is()/:where()/:not()/:has() over public hooks', () => {
  ok(
    `[data-ui='text-field']:has(> [data-part='input']:focus-visible) { outline: 2px solid var(--slotted-focus-ring-color); }`,
  );
  ok(`[data-ui='text-field'][data-invalid] [data-part='input']::placeholder { opacity: 1; }`);
  ok(`:is([data-ui='button'], [data-ui='badge']) > [data-part='label'] { letter-spacing: 0; }`);
  ok(`[data-ui='button']:where(:hover, :focus-visible):not([data-disabled]) { opacity: 1; }`);
  ok(
    `[data-ui='card'] {\n  & + & { margin: 0; }\n  &:hover [data-part='title'] { color: red; }\n}`,
  );
  ok(`@keyframes pulse { from { opacity: 0; } 50% { opacity: 0.5; } to { opacity: 1; } }`);
  ok(`@media (prefers-reduced-motion: reduce) { [data-ui='button'] { transition: none; } }`);
});

const has = (css, ...messages) => {
  const errors = validateRules(css, 'rules.css');
  for (const message of messages)
    assert.ok(
      errors.some((error) => error.includes(message)),
      `${message}\n not in:\n${errors.join('\n')}`,
    );
};

test('checks a prelude that starts with -- as a selector outside a declaration block', () => {
  has(`--x, input { color: red; }`, 'input: an element type is not a public selector');
  has(
    `@media all { --x, input { color: red; } }`,
    'input: an element type is not a public selector',
  );
  ok(`[data-ui='card'] { --slotted-card-radius: { }; }`);
  fails(
    `[data-ui='card'] { input:focus { color: red; } }`,
    'input: an element type is not a public selector',
  );
});

test('refuses @scope, @import and @layer at any depth', () => {
  fails(
    `@scope ([data-ui='card']) { & { color: red; } }`,
    "rules.css:1 @scope ([data-ui='card']): @scope is written by the compiler; a theme rule cannot carry its own",
  );
  fails(
    `@media all {\n  @scope (input) { & { color: red; } }\n}`,
    'rules.css:2 @scope (input): @scope is written by the compiler',
  );
  fails(
    `[data-ui='card'] {\n  @scope (select) { & { color: red; } }\n}`,
    'rules.css:2 @scope (select): @scope is written by the compiler',
  );
  fails(
    `@layer x { [data-ui='card'] { color: red; } }`,
    '@layer x: @layer is written by the compiler',
  );
  fails(`@layer x;`, '@layer x: @layer is written by the compiler');
  fails(`@import url(x.css);`, '@import url(x.css): @import is written by the compiler');
});

test('decodes escapes in a function name and in the property it reads', () => {
  fails(
    `[data-ui='card'] { color: var(--\\5f x); }`,
    'var(--_x) reads a private property of a family',
  );
  fails(
    `[data-ui='card'] { color: v\\61r(--_x); }`,
    'var(--_x) reads a private property of a family',
  );
  fails(
    `[data-ui='card'] { color: var(/* a */ --_x); }`,
    'var(--_x) reads a private property of a family',
  );
});

test('refuses writing a private property', () => {
  fails(
    `[data-ui='card'] { --_card-bg: red; }`,
    "rules.css:1 [data-ui='card']: --_card-bg: a theme rule cannot write a private property of a family",
  );
  fails(
    `[data-ui='card'] { color: red; --\\5f card-bg: red }`,
    '--_card-bg: a theme rule cannot write a private property of a family',
  );
  fails(
    `@keyframes k { to { --_card-bg: red; } }`,
    '--_card-bg: a theme rule cannot write a private property of a family',
  );
});

test('reads an attribute name without regard to case, as HTML does', () => {
  ok(`[DATA-UI='card'] [Data-Part='title'] { color: var(--slotted-text); }`);
  fails(`[DATA-UI='card'][DATA-PART='nope'] { color: red; }`, 'is not a part of card');
});

test('takes data-ui and data-part only with =', () => {
  fails(
    `[data-ui^='button'] { color: red; }`,
    "[data-ui^='button']: data-ui matches one family only with =, not ^=",
  );
  fails(
    `[data-ui='card'] [data-part*='title'] { color: red; }`,
    "[data-part*='title']: data-part matches one part only with =, not *=",
  );
  ok(`[data-ui='card'] [data-part] { color: red; }`);
});

test('refuses the nesting selector outside a style rule, where it is the scoping root', () => {
  fails(
    `& { color: red; }`,
    '&: outside a style rule the nesting selector is the scoping root, which is not a public selector',
  );
  fails(
    `@media all { & [data-ui='card'] { color: red; } }`,
    '&: outside a style rule the nesting selector is the scoping root',
  );
  ok(`[data-ui='card'] { @media all { & { color: red; } } }`);
});

test('accepts & outside a style rule as the theme root in a scheme or a density, ahead of a public hook', () => {
  // The root carries the theme's own scheme: `[data-slotted-scheme] …` asks for
  // a descendant of the root, which the theme's own `html` never is.
  ok(
    `&[data-slotted-scheme='high-contrast'] [data-ui='text-field'] { border-color: var(--slotted-control-border-color); }`,
  );
  ok(`&[data-slotted-density='compact'] > [data-ui='card'] { padding: var(--slotted-space-2); }`);
  fails(
    `&[data-slotted-scheme='dark'] { color: red; }`,
    "&[data-slotted-scheme='dark']: the theme root is reached only ahead of a public hook, not styled itself",
  );
  fails(
    `&[data-ui='card'] [data-ui='button'] { color: red; }`,
    "&[data-ui='card']: outside a style rule the nesting selector is the theme root, which only a scheme, a density or seeds narrow",
  );
  fails(
    `[data-ui='card'] &[data-slotted-scheme='dark'] [data-ui='button'] { color: red; }`,
    "&[data-slotted-scheme='dark']: outside a style rule the nesting selector is the theme root, which begins a selector",
  );
});

test('refuses a scheme ahead of a public hook, which a descendant selector never reaches, and names &', () => {
  // The element that carries the scheme is the scope root, which is not its own descendant.
  fails(
    `[data-slotted-scheme='dark'] [data-ui='card'] { --x: 1; }`,
    "[data-slotted-scheme='dark']: ahead of a public hook the scheme sits on the theme root, which a descendant selector never reaches; write &[data-slotted-scheme='dark'] …",
  );
  fails(
    `[data-slotted-scheme='dark'] > [data-part='content'] { --x: 1; }`,
    "[data-slotted-scheme='dark']: ahead of a public hook the scheme sits on the theme root, which a descendant selector never reaches; write &[data-slotted-scheme='dark'] …",
  );
  ok(`&[data-slotted-scheme='dark'] [data-ui='card'] { --x: 1; }`);
  // A scheme that narrows a hook on the same element is a compound, not a root.
  ok(`[data-ui='card'][data-slotted-scheme='dark'] { --x: 1; }`);
});

const runtimeErrors = (css) => {
  try {
    defineTheme({ ...values, name: 'ruled', seeds: SEEDS, recipe: recipes.standard, rules: [css] });
  } catch (error) {
    return error.message.split('\n').slice(1);
  }
  return [];
};

test('refuses a declaration outside a style rule, which would apply to the theme root', () => {
  for (const css of [
    `color: red;`,
    `--_card-bg: red;`,
    `@media all { color: red; }`,
    `color: red`,
  ]) {
    const errors = runtimeErrors(css);
    assert.ok(
      errors.some((error) =>
        error.includes('a declaration outside a style rule applies to the theme root'),
      ),
      `${css}\n${errors.join('\n')}`,
    );
  }
});

test('refuses @property for a private property or a token, and keeps a theme its own', () => {
  fails(
    `@property --_x { syntax: '<color>'; inherits: true; initial-value: red; }`,
    '@property --_x: a theme rule cannot register a private property of a family',
  );
  fails(
    `@property --slotted-text { syntax: '<color>'; inherits: true; initial-value: red; }`,
    '@property --slotted-text: a theme rule cannot register a token',
  );
  ok(`@property --ruled-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }`);
});

test('refuses a style query over a private property, in a value and in @container', () => {
  fails(
    `[data-ui='card'] { color: if(style(--_card-bg: red): blue; else: green); }`,
    'style(--_card-bg) reads a private property of a family',
  );
  fails(
    `@container style(--_x: 1) { [data-ui='card'] { color: red; } }`,
    'style(--_x) reads a private property of a family',
  );
  ok(`@container style(--slotted-control-height-md: 34px) { [data-ui='card'] { color: red; } }`);
});

test('does not export processRules, which checks nothing on its own', async () => {
  const theme = await import('../dist/index.js');
  assert.equal('processRules' in theme, false);
});

/**
 * The build and the runtime hold one policy: every rule the CLI refuses,
 * `defineTheme` refuses with the same messages, and every rule the CLI
 * accepts, `defineTheme` accepts.
 */
test('defineTheme refuses exactly what the build refuses, with the same messages', () => {
  const corpus = [
    `[data-ui='button'][data-variant='solid'] [data-part='label'] { font-weight: var(--slotted-font-weight-semibold); }`,
    `[data-ui='text-field']:has(> [data-part='input']:focus-visible) { outline: 2px solid var(--slotted-tone-accent-solid); }`,
    `[data-ui='text-field'] input { color: red; }`,
    `.card, #x, [data-ui='card'] > * { color: red; }`,
    `:root { --slotted-text: red; }`,
    `[data-ui='tabs'] [role='tab'][aria-selected] { color: red; }`,
    `[data-ui='card'] :first-child { margin: 0; }`,
    `:is([data-ui='card'], div):not(.x):has(span) { color: red; }`,
    `[data-ui='card'] {\n  & [data-part='title'] { color: red; }\n  background: var(--_ink);\n}`,
    `@media (width > 40rem) {\n  [data-ui='nope'] [data-part='x'] { color: var(--slotted-nope); }\n}`,
    `@keyframes pulse { from { opacity: 0; } to { opacity: 1; } }`,
    `--x, input { color: red; }`,
    `@media all {\n  @scope (input) { & { color: red; } }\n}`,
    `[data-ui='card'] {\n  @scope (select) { & { color: red; } }\n}`,
    `@layer x { [data-ui='card'] { color: red; } }`,
    `[data-ui='card'] { color: v\\61r(--\\5f x); --_card-bg: red; }`,
    `[DATA-UI='card'] [data-ui^='button'] [data-part*='title'] { color: red; }`,
    `& { color: red; }`,
    `color: red;`,
    `@media all { color: red; }`,
  ];
  for (const css of corpus) {
    const build = validateRules(css, 'rules.css').map((error) => error.replace(/^rules\.css:/, ''));
    let runtime = [];
    try {
      defineTheme({
        ...values,
        name: 'parity',
        seeds: SEEDS,
        recipe: recipes.standard,
        rules: [css],
      });
    } catch (error) {
      runtime = error.message
        .split('\n')
        .slice(1)
        .map((line) => line.replace(/^- rules\[0\]:/, ''));
    }
    assert.deepEqual(runtime, build, css);
  }
});

test('the runtime path imports neither lightningcss nor a Node module', () => {
  const index = readFileSync(new URL('../dist/index.js', import.meta.url), 'utf8');
  const imports = [...index.matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)].map(([, s]) => s);
  assert.deepEqual(
    imports.filter((specifier) => specifier === 'lightningcss' || specifier.startsWith('node:')),
    [],
  );
});
