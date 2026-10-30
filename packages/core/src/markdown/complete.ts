/**
 * The source of an answer that is still arriving, closed where it was cut so
 * a parser reads what the writer meant rather than what has landed so far.
 *
 * A language model streams Markdown a few characters at a time, and a parser
 * given `**bold` draws two asterisks, given an open fence swallows the rest of
 * the page into code, and given `[docs](https://ex` draws the bracket syntax
 * until the parenthesis lands. Streamdown ships the same repair as `remend`;
 * this is the part of it that decides a picture: an open fence, an odd count
 * of backticks, `**`, `*` and `~~`, a link or image cut before its end, and
 * a table's delimiter row cut before its last column.
 *
 * It runs on the string, before any adapter, and is idempotent on complete
 * input: every rule looks for something left open and appends nothing when it
 * finds nothing.
 */
export function completeMarkdown(source: string): string {
  const fence = openFence(source);
  if (fence) return `${source}${source.endsWith('\n') ? '' : '\n'}${fence}`;

  const delimiter = openDelimiter(source);
  if (delimiter !== null) return delimiter;

  const start = lastBlockStart(source);
  const head = source.slice(0, start);
  let tail = source.slice(start);

  const cut = /(!?)\[([^\]\n]*)\]\([^)\n]*$/.exec(tail);
  if (cut) tail = tail.slice(0, cut.index) + (cut[1] ? '' : (cut[2] ?? ''));

  return head + closeInline(tail);
}

/** The fence left open at the end of the source, or `null`. */
function openFence(source: string): string | null {
  let open: { char: string; length: number } | null = null;
  for (const line of source.split('\n')) {
    const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (!match?.[1]) continue;
    const marker = match[1];
    const char = marker.charAt(0);
    if (!open) {
      if (char === '`' && (match[2] ?? '').includes('`')) continue;
      open = { char, length: marker.length };
    } else if (char === open.char && marker.length >= open.length && !(match[2] ?? '').trim()) {
      open = null;
    }
  }
  return open ? open.char.repeat(open.length) : null;
}

/**
 * The source with its last line completed as the delimiter row of the header
 * above it, or `null`. Until the row has one cell per header cell the parser
 * reads both lines as a paragraph, and the header flashes as text.
 */
function openDelimiter(source: string): string | null {
  const lines = source.split('\n');
  const last = lines.at(-1) as string;
  const header = lines.at(-2);
  /* A pipe row above the header makes the last line a body row, not a delimiter. */
  const above = lines.at(-3) ?? '';
  if (header === undefined || !header.includes('|') || above.includes('|')) return null;
  if (!/^ {0,3}\|[ \t:|-]*$/.test(last)) return null;
  const count = columns(header).length;
  const written = columns(last);
  if (written.length > count) return null;
  if (written.length === count && written.every((mark) => /^:?-+:?$/.test(mark))) return null;
  const marks = written.map((mark) => (mark.includes('-') ? mark : `${mark}-`));
  while (marks.length < count) marks.push('---');
  lines[lines.length - 1] = `| ${marks.join(' | ')} |`;
  return lines.join('\n');
}

/** The cells of a row, without its outer pipes; escaped pipes stay in their cell. */
function columns(line: string): string[] {
  const parts = line.trim().split(/(?<!\\)\|/);
  if (parts[0]?.trim() === '') parts.shift();
  if (parts.length > 0 && parts.at(-1)?.trim() === '') parts.pop();
  return parts.map((part) => part.trim());
}

/** Where the last paragraph begins: inline markers never span a blank line. */
function lastBlockStart(source: string): number {
  const blank = source.lastIndexOf('\n\n');
  return blank === -1 ? 0 : blank + 2;
}

interface Marker {
  readonly token: string;
  readonly at: number;
}

/**
 * Appends the closer of every inline marker still open in `text`, innermost
 * first. Code spans are read first and hide the markers inside them; a `*`
 * at the start of a line followed by a space is a bullet, not emphasis.
 */
function closeInline(text: string): string {
  const open: Marker[] = [];
  let index = 0;
  let codeOpen = -1;

  while (index < text.length) {
    const char = text[index];

    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === '`') {
      let run = 1;
      while (text[index + run] === '`') run += 1;
      if (codeOpen === -1) {
        const close = text.indexOf('`'.repeat(run), index + run);
        if (close === -1) {
          codeOpen = index;
          open.push({ token: '`'.repeat(run), at: index });
          break;
        }
        index = close + run;
        continue;
      }
      index += run;
      continue;
    }
    if (char === '*' || char === '~') {
      let run = 1;
      while (text[index + run] === char) run += 1;
      const lineStart = index === 0 || text[index - 1] === '\n';
      const bullet = char === '*' && run === 1 && lineStart && /\s/.test(text[index + 1] ?? '');
      if (!bullet && !(char === '~' && run < 2)) {
        let remaining = char === '~' ? 2 : run;
        while (remaining > 0) {
          const size = char === '~' ? 2 : remaining >= 2 ? 2 : 1;
          const token = char.repeat(size);
          const last = open.map((marker) => marker.token).lastIndexOf(token);
          if (last !== -1) {
            open.splice(last, 1);
          } else {
            open.push({ token, at: index });
          }
          remaining -= size;
        }
      }
      index += run;
      continue;
    }
    index += 1;
  }

  if (open.length === 0) return text;
  const body = codeOpen === -1 ? text.replace(/\s+$/, '') : text;
  return (
    body +
    [...open]
      .reverse()
      .map((marker) => marker.token)
      .join('')
  );
}
