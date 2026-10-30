import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  componentName,
  componentReadme,
  loadFamilyDocs,
  previewHtml,
  renderExamples,
} from './design-system-components.ts';

/** Reads the React docs the package build wrote; run after `pnpm --filter @slotted/react build`. */
const root = resolve(import.meta.dirname, '../../..');
const docsDir = join(root, 'packages/react/dist/docs');

describe('component folders', () => {
  it('names a family as a JavaScript identifier', () => {
    expect(['button', 'data-grid', 'datetime-range-picker'].map(componentName)).toEqual([
      'Button',
      'DataGrid',
      'DatetimeRangePicker',
    ]);
    const families = readdirSync(docsDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => componentName(file.slice(0, -'.json'.length)));
    expect(families.filter((name) => !/^[A-Z][A-Za-z0-9]*$/.test(name))).toEqual([]);
  });

  it('opens the guidelines on the summary and keeps the page without its title', () => {
    const docs = loadFamilyDocs(docsDir, 'button');
    const readme = componentReadme(docs, docsDir);
    expect(readme.startsWith(`${docs.summary}\n\n`)).toBe(true);
    expect(readme).not.toMatch(/^# button$/m);
    expect(readme).not.toContain('<!-- index:');
    expect(readme).toContain('## Props');
    expect(readme).not.toMatch(/\]\(\.\//);
  });

  it('marks the card, wraps the markup in the default theme and follows the page scheme', () => {
    const html = previewHtml('<button data-ui="button">Save</button>', 'Actions');
    expect(html.split('\n')[0]).toBe('<!-- @dsCard group="Actions" height=160 -->');
    expect(html).toContain('data-slotted-theme="default"');
    expect(html.match(/<script>/g)).toHaveLength(1);
  });

  it('renders a complete example to the family markup, and records an example that fails', async () => {
    const docs = loadFamilyDocs(docsDir, 'button');
    const { markup, errors } = await renderExamples(
      root,
      new Map([
        ['button', docs.example!],
        ['text-field', loadFamilyDocs(docsDir, 'text-field').example!],
        ['broken', "export default function Broken() { throw new Error('no'); }"],
      ]),
    );
    expect(markup.get('button')).toContain('data-ui="button"');
    expect(markup.get('text-field')).toContain('data-ui="text-field"');
    expect(errors.get('broken')).toBe('no');
    expect('require' in globalThis).toBe(false);
  });
});
