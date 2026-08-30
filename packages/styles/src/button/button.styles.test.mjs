import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/button/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = [
  readFileSync(new URL('./button.css', import.meta.url), 'utf8'),
  readFileSync(new URL('./button-group.css', import.meta.url), 'utf8'),
].join('\n');
const normalizedCss = css.replace(/\s+/g, '');

function assertRuleDeclarations(selector, declarations) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));

  assert.ok(match, `Missing selector: ${selector}`);
  for (const declaration of declarations) {
    const whitespaceTolerantDeclaration = declaration
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replaceAll(' ', '\\s*');
    assert.match(
      match[1],
      new RegExp(whitespaceTolerantDeclaration),
      `Missing declaration for ${selector}: ${declaration}`,
    );
  }
}

function assertNormalizedRuleDeclarations(selector, declarations) {
  const normalizedSelector = selector.replace(/\s+/g, '');
  const start = normalizedCss.indexOf(`${normalizedSelector}{`);
  assert.notEqual(start, -1, `Missing selector: ${selector}`);
  const end = normalizedCss.indexOf('}', start);
  const rule = normalizedCss.slice(start, end + 1);

  for (const declaration of declarations) {
    assert.ok(
      rule.includes(declaration.replace(/\s+/g, '')),
      `Missing declaration for ${selector}: ${declaration}`,
    );
  }
}

test('implements every contract state in framework-owned CSS', () => {
  const requiredStates = new Set(
    Object.values(contract.members).flatMap((member) => member.states),
  );
  const selectors = {
    default: '.slotted-button {',
    hover:
      ".slotted-button[data-fill='solid']:hover:not(:disabled):not([aria-disabled='true']):not([data-pressed])",
    active:
      ".slotted-button[data-fill='solid']:active:not(:disabled):not([aria-disabled='true']):not([data-pressed])",
    'focus-visible': '.slotted-button:focus-visible',
    disabled: `[${contract.stateAttributes.disabled}]`,
    loading: `[${contract.stateAttributes.loading}]`,
    pressed: `[${contract.stateAttributes.pressed}]`,
  };

  assert.deepEqual(new Set(Object.keys(selectors)), requiredStates);
  for (const selector of Object.values(selectors)) {
    assert.ok(
      normalizedCss.includes(selector.replace(/\s+/g, '')),
      `Missing state selector: ${selector}`,
    );
  }

  for (const variant of contract.axes.variant) {
    assert.ok(css.includes(`[data-variant='${variant}']`), `Missing variant: ${variant}`);
  }
  for (const fill of contract.axes.fill) {
    assert.ok(css.includes(`[data-fill='${fill}']`), `Missing fill: ${fill}`);
  }
  for (const size of contract.axes.size) {
    assert.ok(css.includes(`[data-size='${size}']`), `Missing size: ${size}`);
    assertNormalizedRuleDeclarations(`.slotted-button[data-size='${size}']`, [
      `border-radius: var(--slotted-button-radius-${size}, var(--slotted-control-radius, 4px));`,
    ]);
  }
  assert.ok(css.includes('--slotted-control-radius'), 'Missing control radius token');
});

test('maps secondary to a theme palette and keeps fill borders intentional', () => {
  assertNormalizedRuleDeclarations(".slotted-button[data-variant='secondary']", [
    '--_solid: var(--slotted-tone-secondary-solid);',
    '--_on-solid: var(--slotted-tone-secondary-on-solid);',
    '--_text: var(--slotted-tone-secondary-text);',
  ]);
  assertNormalizedRuleDeclarations(".slotted-button[data-fill='solid']", [
    'border-color: transparent;',
  ]);
  assertNormalizedRuleDeclarations(
    ".slotted-button[data-fill='solid']:hover:not(:disabled):not([aria-disabled='true']):not([data-pressed])",
    ['border-color: transparent;'],
  );
  assertNormalizedRuleDeclarations(
    ".slotted-button[data-fill='solid']:active:not(:disabled):not([aria-disabled='true']):not([data-pressed])",
    ['border-color: transparent;'],
  );
  assertNormalizedRuleDeclarations(
    ".slotted-button[data-fill='outline']:hover:not(:disabled):not([aria-disabled='true']):not([data-pressed])",
    ['background: var(--_subtle-hover);', 'border-color: var(--_border);'],
  );
  assertNormalizedRuleDeclarations(
    ".slotted-button[data-fill='outline']:active:not(:disabled):not([aria-disabled='true']):not([data-pressed])",
    ['background: var(--_subtle-active);', 'border-color: var(--_border);'],
  );
});

test('styles button group seams and focus layering with logical properties', () => {
  assertRuleDeclarations('.slotted-button-group', [
    'align-items: stretch;',
    'display: inline-flex;',
    'gap: var(--slotted-button-group-gap, 0px);',
    'isolation: isolate;',
    'vertical-align: middle;',
  ]);
  assertRuleDeclarations(".slotted-button-group[data-orientation='vertical']", [
    'flex-direction: column;',
  ]);
  assertRuleDeclarations(
    ".slotted-button-group[data-orientation='horizontal'] > .slotted-button:not(:first-child)",
    [
      'border-start-start-radius: var(--slotted-button-group-inner-radius, 0px);',
      'border-end-start-radius: var(--slotted-button-group-inner-radius, 0px);',
      'margin-inline-start: var(--slotted-button-group-adjacent-offset, -1px);',
    ],
  );
  assertRuleDeclarations(
    ".slotted-button-group[data-orientation='horizontal'] > .slotted-button:not(:last-child)",
    [
      'border-start-end-radius: var(--slotted-button-group-inner-radius, 0px);',
      'border-end-end-radius: var(--slotted-button-group-inner-radius, 0px);',
    ],
  );
  assertRuleDeclarations(
    ".slotted-button-group[data-orientation='vertical'] > .slotted-button:not(:first-child)",
    [
      'border-start-start-radius: var(--slotted-button-group-inner-radius, 0px);',
      'border-start-end-radius: var(--slotted-button-group-inner-radius, 0px);',
      'margin-block-start: var(--slotted-button-group-adjacent-offset, -1px);',
    ],
  );
  assertRuleDeclarations(
    ".slotted-button-group[data-orientation='vertical'] > .slotted-button:not(:last-child)",
    [
      'border-end-start-radius: var(--slotted-button-group-inner-radius, 0px);',
      'border-end-end-radius: var(--slotted-button-group-inner-radius, 0px);',
    ],
  );
  assertRuleDeclarations('.slotted-button-group > .slotted-button:hover:not([data-pressed])', [
    'z-index: 1;',
  ]);
  assertRuleDeclarations('.slotted-button-group > .slotted-button:focus-visible', ['z-index: 2;']);
});

test('sizes consumer supplied SVG icons without imposing an icon visual language', () => {
  assertRuleDeclarations('.slotted-button [data-part] > svg', [
    'block-size: 100%;',
    'display: block;',
    'inline-size: 100%;',
  ]);

  const iconSlotRule = css.match(
    /\.slotted-button \[data-part='icon'\],[\s\S]*?\.slotted-button \[data-part='trailing'\]\s*\{([\s\S]*?)\}/,
  );
  assert.ok(iconSlotRule, 'Missing icon slot rule');
  assert.match(iconSlotRule[1], /font-size:\s*var\(--_button-icon-size\);/);
  assert.match(iconSlotRule[1], /line-height:\s*1;/);
  assert.doesNotMatch(iconSlotRule[1], /(?:fill|stroke):/);
});

test('keeps pressed toggle surfaces outside generic interactive selectors', () => {
  const headers = [...css.matchAll(/\.slotted-button[^{}]*:(?:hover|active)[^{]*\{/g)].map(
    ([header]) => header,
  );

  assert.ok(
    headers.length >= 6,
    `Expected at least 6 interactive selectors, found ${headers.length}`,
  );

  for (const pattern of [
    /data-fill='solid'[^{}]*:hover/,
    /data-fill='solid'[^{}]*:active/,
    /data-fill='outline'[^{}]*:hover/,
    /data-fill='outline'[^{}]*:active/,
    /data-fill='ghost'[^{}]*:hover/,
    /data-fill='ghost'[^{}]*:active/,
  ]) {
    assert.ok(
      headers.some((header) => pattern.test(header)),
      `Missing interactive selector matching ${pattern}`,
    );
  }

  for (const header of headers) {
    assert.match(header.replace(/\s+/g, ''), /:not\(\[data-pressed\]\)/);
  }
});
