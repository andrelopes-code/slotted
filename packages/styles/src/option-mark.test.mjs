import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * R5 for the mark inside an option (SL7, CB9): the check that says an option
 * is selected sits on the first line of the label, never centred on a label
 * that wrapped or on a label with a description under it.
 *
 * The geometry is the option's own line box. The option states the
 * line-height every cell inherits; the mark is exactly one line tall
 * (`1lh`, resolved against that inherited line-height) and lives in row one
 * of the option's grid, where the label's first line is. A second line of the
 * label, and the description in row two, grow the row under the mark, which
 * stays where the first line is: the harness measures it 0.25px from the
 * centre of that line, which is the asymmetry of the font's ascent and
 * descent, and the audit's larger number (G7) is the centre of the whole
 * label box.
 */
const OPTIONS = [
  {
    family: 'select',
    item: '[data-ui-select] [data-part-item]',
    mark: '[data-ui-select] [data-part-indicator]',
    line: '[data-ui-select] :is([data-part-indicator], [data-part-icon])',
  },
  {
    family: 'combobox',
    item: '[data-ui-combobox] [data-part-item]',
    mark: '[data-ui-combobox] [data-part-indicator]',
    line: '[data-ui-combobox] :is([data-part-indicator], [data-part-icon])',
  },
  /*
   * `multi-select` scopes every option part to the option itself, because a
   * chip in its control carries a `label` of its own and the rule that lays out
   * an option's label would otherwise have reached it.
   */
  {
    family: 'multi-select',
    item: '[data-ui-multi-select] [data-part-item]',
    mark: '[data-ui-multi-select] [data-part-item] > [data-part-indicator]',
    line: '[data-ui-multi-select] [data-part-item] > :is([data-part-indicator], [data-part-icon])',
  },
];

/** Every innermost `selector { declarations }` pair. */
function rules(css) {
  const found = [];
  const stack = [];
  let start = 0;
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    if (char === '{') {
      stack.push({
        selector: css
          .slice(start, index)
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .trim(),
        body: index + 1,
      });
      start = index + 1;
    } else if (char === '}') {
      const open = stack.pop();
      if (open && !open.selector.startsWith('@')) {
        found.push({
          selector: open.selector
            .replace(/\s+/g, ' ')
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .trim(),
          body: css.slice(open.body, index).replace(/\/\*[\s\S]*?\*\//g, ''),
          media: stack.map((frame) => frame.selector).find((s) => s.startsWith('@media')) ?? '',
        });
      }
      start = index + 1;
    }
  }
  return found;
}

function declaration(body, property) {
  const match = body.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`));
  return match ? match[1].replace(/\s+/g, ' ').trim() : undefined;
}

function find(all, selector) {
  const rule = all.find((candidate) => !candidate.media && candidate.selector === selector);
  assert.ok(rule, `no rule for \`${selector}\``);
  return rule;
}

for (const { family, item, mark, line } of OPTIONS) {
  const css = readFileSync(`${source}${family}/${family}.css`, 'utf8');
  const all = rules(css);

  test(`${family}: the option owns the line box its mark measures against`, () => {
    const option = find(all, item);
    assert.equal(declaration(option.body, 'display'), 'grid');
    assert.equal(declaration(option.body, 'line-height'), 'var(--slotted-line-height-md, 1.5)');
  });

  test(`${family}: the mark is one line tall and sits in the row of the label's first line`, () => {
    assert.equal(declaration(find(all, line).body, 'block-size'), '1lh');
    const indicator = find(all, mark);
    assert.equal(declaration(indicator.body, 'grid-row'), '1');
    assert.equal(
      declaration(indicator.body, 'align-self'),
      undefined,
      'a mark that is exactly one line tall needs no alignment; one that is aligned is no longer a line',
    );
    assert.equal(declaration(indicator.body, 'margin-block-start'), undefined);
  });
}
