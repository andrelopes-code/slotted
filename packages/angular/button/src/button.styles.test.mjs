import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/button/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./button.css', import.meta.url), 'utf8');
const normalizedCss = css.replace(/\s+/g, '');
const groupCss = readFileSync(new URL('./button-group.css', import.meta.url), 'utf8');

function assertRuleDeclarations(source, selector, declarations) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));

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

function assertNormalizedRuleDeclarations(source, selector, declarations) {
  const normalizedSource = source.replace(/\s+/g, '');
  const normalizedSelector = selector.replace(/\s+/g, '');
  const start = normalizedSource.indexOf(`${normalizedSelector}{`);
  assert.notEqual(start, -1, `Missing selector: ${selector}`);
  const end = normalizedSource.indexOf('}', start);
  const rule = normalizedSource.slice(start, end + 1);

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
    default: ':host {',
    hover:
      ":host([data-fill='solid']:hover:not(:disabled):not([aria-disabled='true']):not([data-state='pressed']))",
    active:
      ":host([data-fill='solid']:active:not(:disabled):not([aria-disabled='true']):not([data-state='pressed']))",
    'focus-visible': ':host(:focus-visible)',
    disabled: ":host([data-state='disabled'])",
    loading: ":host([data-state='loading'])",
    pressed: ":host([data-slotted-component='toggle-button'][data-state='pressed'])",
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
    assertNormalizedRuleDeclarations(css, `:host([data-size='${size}'])`, [
      `border-radius: var(--slotted-button-radius-${size}, var(--slotted-control-radius, 4px));`,
    ]);
  }
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Missing reduced-motion CSS');
});

test('maps secondary to a theme palette and keeps fill borders intentional', () => {
  assertNormalizedRuleDeclarations(css, ":host([data-variant='secondary'])", [
    '--_solid: var(--slotted-tone-secondary-solid);',
    '--_on-solid: var(--slotted-tone-secondary-on-solid);',
    '--_text: var(--slotted-tone-secondary-text);',
  ]);
  assertNormalizedRuleDeclarations(css, ":host([data-fill='solid'])", [
    'border-color: transparent;',
  ]);
  assertNormalizedRuleDeclarations(
    css,
    ":host([data-fill='solid']:hover:not(:disabled):not([aria-disabled='true']):not([data-state='pressed']))",
    ['border-color: transparent;'],
  );
  assertNormalizedRuleDeclarations(
    css,
    ":host([data-fill='solid']:active:not(:disabled):not([aria-disabled='true']):not([data-state='pressed']))",
    ['border-color: transparent;'],
  );
  assertNormalizedRuleDeclarations(
    css,
    ":host([data-fill='outline']:hover:not(:disabled):not([aria-disabled='true']):not([data-state='pressed']))",
    ['background: var(--_subtle-hover);', 'border-color: var(--_border);'],
  );
  assertNormalizedRuleDeclarations(
    css,
    ":host([data-fill='outline']:active:not(:disabled):not([aria-disabled='true']):not([data-state='pressed']))",
    ['background: var(--_subtle-active);', 'border-color: var(--_border);'],
  );
});

test('styles button group seams and focus layering with logical properties', () => {
  assertRuleDeclarations(groupCss, '.slotted-button-group', [
    'align-items: stretch;',
    'display: inline-flex;',
    'gap: var(--slotted-button-group-gap, 0px);',
    'isolation: isolate;',
    'vertical-align: middle;',
  ]);
  for (const orientation of contract.orientations) {
    assert.ok(
      groupCss.includes(`.slotted-button-group[data-orientation='${orientation}']`),
      `Missing group orientation: ${orientation}`,
    );
  }
  assertRuleDeclarations(groupCss, ".slotted-button-group[data-orientation='vertical']", [
    'flex-direction: column;',
  ]);
  assertRuleDeclarations(
    groupCss,
    ".slotted-button-group[data-orientation='horizontal'] > .slotted-button:not(:first-child)",
    [
      'border-start-start-radius: var(--slotted-button-group-inner-radius, 0px);',
      'border-end-start-radius: var(--slotted-button-group-inner-radius, 0px);',
      'margin-inline-start: var(--slotted-button-group-adjacent-offset, -1px);',
    ],
  );
  assertRuleDeclarations(
    groupCss,
    ".slotted-button-group[data-orientation='horizontal'] > .slotted-button:not(:last-child)",
    [
      'border-start-end-radius: var(--slotted-button-group-inner-radius, 0px);',
      'border-end-end-radius: var(--slotted-button-group-inner-radius, 0px);',
    ],
  );
  assertRuleDeclarations(
    groupCss,
    ".slotted-button-group[data-orientation='vertical'] > .slotted-button:not(:first-child)",
    [
      'border-start-start-radius: var(--slotted-button-group-inner-radius, 0px);',
      'border-start-end-radius: var(--slotted-button-group-inner-radius, 0px);',
      'margin-block-start: var(--slotted-button-group-adjacent-offset, -1px);',
    ],
  );
  assertRuleDeclarations(
    groupCss,
    ".slotted-button-group[data-orientation='vertical'] > .slotted-button:not(:last-child)",
    [
      'border-end-start-radius: var(--slotted-button-group-inner-radius, 0px);',
      'border-end-end-radius: var(--slotted-button-group-inner-radius, 0px);',
    ],
  );
  assertRuleDeclarations(
    groupCss,
    ".slotted-button-group > .slotted-button:hover:not([data-state='pressed'])",
    ['z-index: 1;'],
  );
  assertRuleDeclarations(groupCss, '.slotted-button-group > .slotted-button:focus-visible', [
    'z-index: 2;',
  ]);
});

test('sizes consumer supplied SVG icons without imposing an icon visual language', () => {
  assertRuleDeclarations(css, ':host [data-part] > svg', [
    'block-size: 100%;',
    'display: block;',
    'inline-size: 100%;',
  ]);

  const iconSlotRule = css.match(
    /\[data-part='icon'\],[\s\S]*?\[data-part='trailing'\]\s*\{([\s\S]*?)\}/,
  );
  assert.ok(iconSlotRule, 'Missing icon slot rule');
  assert.match(iconSlotRule[1], /font-size:\s*var\(--_button-icon-size\);/);
  assert.match(iconSlotRule[1], /line-height:\s*1;/);
  assert.doesNotMatch(iconSlotRule[1], /(?:fill|stroke):/);
});
