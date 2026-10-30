import { describe, expect, it } from 'vitest';

import {
  PUBLISHED_FORBIDDEN,
  parseTopic,
  renderGuidelinesIndex,
  renderTopic,
  topicErrors,
} from './guidelines.ts';

const source = `---
topic: async feedback
prefix: AF
triggers:
  [
    loading,
    pending,
  ]
families: [skeleton, button]
---

# Async feedback

What a screen shows between a request starting and its answer arriving.

### AF-01 · Pending is not empty

Level: MUST
Applies to: any region filled by a request — a \`popover\` body, a \`list\`,
  a \`data-grid\`
Rule: A region whose first answer has not arrived shows its pending state.
Why: An empty state is a statement about the data.
Do: Draw placeholders until the answer.
Don't: Draw the empty words before the answer.
Seen in: a screen · corrected
Verified in: the banner suite, "pending, not empty"
Check: Throttle the network, open the region cold; the empty words do not appear before the answer.

### AF-02 · Old rule

Status: retired · rewritten as AF-03
`;

describe('parseTopic', () => {
  it('reads the frontmatter, the intro and each rule, joining a wrapped field line', () => {
    const topic = parseTopic('async-feedback.md', source);
    expect(topic.prefix).toBe('AF');
    expect(topic.triggers).toEqual(['loading', 'pending']);
    expect(topic.families).toEqual(['skeleton', 'button']);
    expect(topic.title).toBe('Async feedback');
    expect(topic.intro).toBe(
      'What a screen shows between a request starting and its answer arriving.',
    );
    const [first, second] = topic.rules;
    expect(first!.id).toBe('AF-01');
    expect(first!.level).toBe('MUST');
    expect(first!.fields.find(([key]) => key === 'Applies to')![1]).toBe(
      'any region filled by a request — a `popover` body, a `list`, a `data-grid`',
    );
    expect(second!.status).toBe('retired');
    expect(second!.statusText).toBe('rewritten as AF-03');
  });
});

describe('topicErrors', () => {
  it('accepts a well-formed topic', () => {
    expect(topicErrors(parseTopic('async-feedback.md', source), source)).toEqual([]);
  });

  it('reports fields out of order, a missing Check, a foreign prefix and a retired rule with a body', () => {
    const broken = source
      .replace('Why: An empty state', 'Why: moved\nRule: duplicate')
      .replace(/Check: Throttle.*\n/, '')
      .replace('### AF-02', '### LP-02')
      .replace('Status: retired · rewritten as AF-03', 'Status: retired · x\nLevel: MUST');
    const errors = topicErrors(parseTopic('async-feedback.md', broken), broken);
    expect(errors).toContain('async-feedback.md AF-01: fields out of order or repeated');
    expect(errors).toContain('async-feedback.md AF-01: no Check');
    expect(errors).toContain('async-feedback.md LP-02: id does not start with prefix AF');
    expect(errors).toContain('async-feedback.md LP-02: a retired rule keeps only its Status');
  });

  it('reports a fenced block and a forbidden qualifier', () => {
    const broken = `${source}\n\`\`\`css\na {}\n\`\`\`\nA clean layout.\n`;
    const errors = topicErrors(parseTopic('async-feedback.md', broken), broken);
    expect(errors).toContain('async-feedback.md: fenced code block');
    expect(errors).toContain('async-feedback.md: forbidden word "clean"');
  });
});

describe('PUBLISHED_FORBIDDEN', () => {
  it.each([
    'Seen on Nexora',
    'in the demo panel',
    'Spec: the banner suite',
    'every command under §53.11',
    'see [the page](./x.md)',
  ])('rejects %s', (text) => {
    expect(PUBLISHED_FORBIDDEN.some((pattern) => pattern.test(text))).toBe(true);
  });

  it('accepts a rule that names only the library', () => {
    expect(
      PUBLISHED_FORBIDDEN.some((pattern) =>
        pattern.test(
          'A `data-grid` region waits; see [WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/).',
        ),
      ),
    ).toBe(false);
  });
});

describe('retired rules', () => {
  it('joins a wrapped Status line, and reports prose left in a retired rule', () => {
    const wrapped = source.replace(
      'Status: retired · rewritten as AF-03',
      'Status: retired · rewritten as AF-03, which keeps\n  one scroller\n\nA paragraph left behind.',
    );
    const topic = parseTopic('async-feedback.md', wrapped);
    expect(topic.rules[1]!.statusText).toBe('rewritten as AF-03, which keeps one scroller');
    expect(topicErrors(topic, wrapped)).toContain(
      'async-feedback.md AF-02: a retired rule keeps only its Status',
    );
  });
});

describe('renderTopic', () => {
  it('drops the source-only fields and keeps a retired rule as heading and status', () => {
    const out = renderTopic(parseTopic('async-feedback.md', source));
    expect(out).not.toContain('Seen in:');
    expect(out).not.toContain('Verified in:');
    expect(out).toContain('Check: Throttle the network');
    expect(out).toContain('### AF-02 · Old rule\n\nStatus: retired · rewritten as AF-03\n');
    expect(out.startsWith('---\ntopic: async feedback\n')).toBe(true);
  });
});

describe('renderGuidelinesIndex', () => {
  it('lists active rules only, one row each, with the Rule text', () => {
    const out = renderGuidelinesIndex([parseTopic('async-feedback.md', source)]);
    expect(out).toContain(
      '| AF-01 | MUST | A region whose first answer has not arrived shows its pending state. | `async-feedback.md` |',
    );
    expect(out).not.toContain('AF-02');
  });
});
