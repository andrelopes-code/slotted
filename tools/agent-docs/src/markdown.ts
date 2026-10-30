/**
 * One table cell: whitespace collapsed, so a line break in an input cannot end
 * the row early, and every pipe escaped, code spans included, as GFM requires.
 */
export function cell(value: string): string {
  return value.replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
}

/** An inline code span long enough to hold the backticks inside it. */
export function code(value: string): string {
  const longest = Math.max(0, ...[...value.matchAll(/`+/g)].map((match) => match[0].length));
  const ticks = '`'.repeat(longest + 1);
  return longest === 0 ? `${ticks}${value}${ticks}` : `${ticks} ${value} ${ticks}`;
}

export function table(header: readonly string[], rows: readonly (readonly string[])[]): string[] {
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ];
}

/** A fenced block whose fence is longer than any backtick run in the source. */
export function fence(language: string, source: string): string[] {
  const longest = Math.max(0, ...[...source.matchAll(/`+/g)].map((match) => match[0].length));
  const ticks = '`'.repeat(Math.max(3, longest + 1));
  return [`${ticks}${language}`, ...source.replace(/\n+$/, '').split('\n'), ticks];
}
