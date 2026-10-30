import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseTopic, renderGuidelinesIndex } from './guidelines.ts';

const root = resolve(import.meta.dirname, '../../..');

/**
 * A dialog's body is narrower than the form measure, so the page layout rules
 * leave its form ragged. One rule lays out a form in a dialog, the index names
 * it, and the page rules it replaces name it as their exception.
 */
describe('the forms guideline in a dialog', () => {
  const file = 'forms.md';
  const topic = parseTopic(
    file,
    readFileSync(resolve(root, 'tools/agent-docs/content/guidelines', file), 'utf8'),
  );

  it('lists a rule for a form inside a dialog in the index', () => {
    const index = renderGuidelinesIndex([topic]);

    const dialogRows = index.split('\n').filter((line) => /^\| FM-\d{2} \|.*`dialog`/.test(line));

    expect(dialogRows).toHaveLength(1);
  });

  it('names that rule as the exception of FM-19 and FM-20', () => {
    const dialogRule = topic.rules.find((rule) => field(rule.fields, 'Rule').includes('`dialog`'));

    const exceptions = ['FM-19', 'FM-20'].map((id) =>
      field(topic.rules.find((rule) => rule.id === id)?.fields ?? [], 'Applies to'),
    );

    expect(dialogRule).toBeDefined();
    for (const scope of exceptions) expect(scope).toContain(dialogRule?.id);
  });
});

function field(fields: [string, string][], name: string) {
  return fields.find(([key]) => key === name)?.[1] ?? '';
}
