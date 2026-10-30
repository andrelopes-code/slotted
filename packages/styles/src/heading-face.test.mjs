import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;
const specs = new URL('../../../specs/components/', import.meta.url).pathname;

/**
 * A heading is set in `--slotted-font-family-heading`, so a theme gives every
 * title its own face by declaring one token. Without it a theme reached the
 * headings only through rules over each family's parts, and the heading of
 * `typography` could not be reached at all: it carries the same `data-ui` and
 * `data-part` as a line of text.
 *
 * Each row is one rule and the family part it sets. A family whose title
 * already reads `--slotted-<family>-title-*` reads the face through
 * `--slotted-<family>-title-font-family` too; every other one reads the token
 * itself.
 */
const HEADINGS = [
  {
    family: 'typography',
    part: 'root',
    selector: '[data-ui-typography]:is(h1, h2, h3, h4, h5, h6)',
  },
  { family: 'alert', part: 'title', selector: '[data-ui-alert] [data-part-title]', hook: true },
  { family: 'dialog', part: 'title', selector: ':scope [data-part-title]', hook: true },
  {
    family: 'drawer',
    part: 'title',
    selector: '[data-ui-drawer] > [data-part-panel] > [data-part-header] > [data-part-title]',
    hook: true,
  },
  {
    family: 'popover',
    part: 'title',
    selector: '[data-ui-popover] > [data-part-content] > [data-part-header] > [data-part-title]',
  },
  {
    family: 'toast',
    part: 'title',
    selector:
      '[data-ui-toast] > [data-part-list] > [data-part-item] > [data-part-content] > [data-part-title]',
    hook: true,
  },
  {
    family: 'tour',
    part: 'title',
    selector: '[data-ui-tour] [data-part-content] > [data-part-title]',
  },
  {
    family: 'action-sheet',
    part: 'title',
    selector: '[data-ui-action-sheet] [data-part-title]',
  },
  {
    family: 'result-state',
    part: 'title',
    selector: '[data-ui-result-state] [data-part-title]',
    hook: true,
  },
  {
    family: 'page-header',
    part: 'heading',
    selector:
      '[data-ui-page-header] > * > [data-part-title-area] > [data-part-title-row] > [data-part-title] > [data-part-heading]',
  },
  {
    family: 'section',
    part: 'heading',
    selector: '[data-ui-section] > [data-part-header] > [data-part-title] > [data-part-heading]',
  },
  {
    family: 'dashboard-grid',
    part: 'title',
    selector: '[data-ui-dashboard-grid] [data-part-widget] [data-part-title]',
    hook: true,
  },
  {
    family: 'notification-center',
    part: 'title',
    selector: '[data-ui-notification-center] > [data-part-header] > [data-part-title]',
  },
  {
    family: 'import-export-center',
    part: 'title',
    selector: '[data-ui-import-export-center] > [data-part-header] > [data-part-title]',
  },
  {
    family: 'column-manager',
    part: 'title',
    selector: '[data-ui-column-manager] > [data-part-header] > [data-part-title]',
  },
  {
    family: 'form',
    part: 'summary-title',
    selector: '[data-ui-form][data-part-summary] > [data-part-summary-title]',
  },
  {
    family: 'wizard',
    part: 'step-title',
    selector:
      '[data-ui-wizard] > [data-part-layout] > [data-part-main] > [data-part-step] > [data-part-step-header] > [data-part-step-title]',
  },
  {
    family: 'chart',
    part: 'title',
    selector: '[data-ui-chart] > [data-part-header] [data-part-title]',
  },
  {
    family: 'event-calendar',
    part: 'title',
    selector: '[data-ui-event-calendar] > [data-part-header] > [data-part-title]',
  },
  {
    family: 'field-group',
    part: 'legend',
    selector: '[data-ui-field-group] > [data-part-legend] > :is(h1, h2, h3, h4, h5, h6)',
  },
  {
    family: 'prose',
    part: 'root',
    selector:
      "[data-ui-prose] :where(h1, h2, h3, h4, h5, h6):not(:where([data-part='exclude'], [data-part='exclude'] *))",
  },
];

/**
 * Parts whose name says title or heading and which name something smaller than
 * a surface or a region: an item in a collection, a control, or a value. Each
 * keeps the face of the text around it.
 */
const NOT_HEADINGS = {
  'calendar:heading': 'names the month a date control shows',
  'chart:tooltip-title': 'names the datum under the pointer',
  'code-block:title': 'is a file name',
  'data-list:title': 'names one item of the list',
  'event-calendar:event-title': 'names one event',
  'event-calendar:list-day-heading': 'labels one day of the agenda list',
  'media-viewer:heading': 'holds a file name and its position in the bar',
  'media-viewer:title': 'is a file name',
  'import-export-center:heading': 'holds the name and status of one job',
  'import-export-center:job-title': 'names one job',
  'page-header:title': 'holds the heading part, which carries the face',
  'section:title': 'holds the heading part, which carries the face',
  'timeline:title': 'names one entry',
  'transfer:title': 'labels the listbox of one pane',
};

const squash = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');

function rule(family, selector) {
  const css = squash(readFileSync(join(source, family, `${family}.css`), 'utf8'));
  const body = css.split(`${squash(selector)}{`)[1]?.split('}')[0];
  assert.ok(body !== undefined, `${family} has no rule for ${selector}`);
  return body;
}

test('sets every heading and title in the heading face', () => {
  for (const { family, hook, selector } of HEADINGS) {
    const face = hook
      ? `font-family:var(--slotted-${family}-title-font-family,var(--slotted-font-family-heading,var(--slotted-font-family-sans,`
      : 'font-family:var(--slotted-font-family-heading,var(--slotted-font-family-sans,';
    assert.ok(
      rule(family, selector).includes(face),
      `${family} sets ${selector} in a face other than --slotted-font-family-heading`,
    );
  }
});

test('decides the face of every part named as a title or a heading', () => {
  const covered = new Set(HEADINGS.map(({ family, part }) => `${family}:${part}`));
  const undecided = [];
  for (const family of readdirSync(specs)) {
    let contract;
    try {
      contract = JSON.parse(readFileSync(join(specs, family, 'contract.json'), 'utf8'));
    } catch {
      continue;
    }
    const parts = new Set(Object.values(contract.members ?? {}).flatMap((member) => member.parts));
    for (const part of parts) {
      if (!/^(title|heading)$|-(title|heading)$/.test(part)) continue;
      const key = `${family}:${part}`;
      if (!covered.has(key) && !(key in NOT_HEADINGS)) undecided.push(key);
    }
  }
  assert.deepEqual(
    undecided,
    [],
    'a title part either reads --slotted-font-family-heading or is listed as not a heading',
  );
});

test('lists no exclusion that no contract declares', () => {
  for (const key of Object.keys(NOT_HEADINGS)) {
    const [family, part] = key.split(':');
    const contract = JSON.parse(readFileSync(join(specs, family, 'contract.json'), 'utf8'));
    const parts = Object.values(contract.members).flatMap((member) => member.parts);
    assert.ok(parts.includes(part), `${key} is listed and not declared`);
  }
});
