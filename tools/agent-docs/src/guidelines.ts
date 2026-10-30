/**
 * A guideline topic: frontmatter, a title, an intro, and rules in the form
 * `content/guidelines/writing-rules.md` states. Parsed to validate and to render
 * the published copy, which drops the fields only the source keeps.
 */
export type Level = 'MUST' | 'SHOULD' | 'MAY';

export const RULE_FIELDS = [
  'Level',
  'Applies to',
  'Rule',
  'Why',
  'Do',
  "Don't",
  'Seen in',
  'Verified in',
  'Check',
] as const;
const REQUIRED_FIELDS = ['Level', 'Applies to', 'Rule', 'Why', 'Do', "Don't", 'Check'];
export const SOURCE_ONLY_FIELDS = ['Seen in', 'Verified in'] as const;
const LEVELS = new Set(['MUST', 'SHOULD', 'MAY']);

/** Qualifiers `writing-rules.md` names as untestable. */
const FORBIDDEN_WORDS = ['generous', 'clean', 'modern'];

/** Text that names the repository's demo, its tests or its spec sections; never in a published file. */
export const PUBLISHED_FORBIDDEN: readonly RegExp[] = [
  /\bNexora\b/,
  /\bthe demo\b/i,
  /\bsimulated backend\b/i,
  /\bSpec:/,
  /§\d/,
  /^```/m,
  /\]\((?!https:\/\/)[^)]+\)/,
];

export interface Rule {
  id: string;
  title: string;
  status: 'active' | 'retired';
  statusText?: string;
  fields: [string, string][];
  level?: Level;
}

export interface Topic {
  file: string;
  topic: string;
  prefix: string;
  triggers: string[];
  families: string[];
  frontmatter: string;
  title: string;
  intro: string;
  rules: Rule[];
}

const HEADING = /^### ([A-Z]{2}-\d{2}) · (.+)$/;
const FIELD = /^(Status|Level|Applies to|Rule|Why|Do|Don't|Seen in|Verified in|Check): (.*)$/;

function list(frontmatter: string, key: string): string[] {
  const match = new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm').exec(frontmatter);
  if (match === null) return [];
  return match[1]!
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function scalar(frontmatter: string, key: string): string {
  return new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontmatter)?.[1]?.trim() ?? '';
}

export function parseTopic(file: string, source: string): Topic {
  const end = source.indexOf('\n---\n', 4);
  if (!source.startsWith('---\n') || end === -1) throw new Error(`${file}: no frontmatter`);
  const frontmatter = source.slice(4, end);
  const body = source.slice(end + 5).split('\n');

  const title = (body.find((line) => line.startsWith('# ')) ?? '').slice(2).trim();
  const firstRule = body.findIndex((line) => HEADING.test(line));
  const introLines = body.slice(
    body.findIndex((line) => line.startsWith('# ')) + 1,
    firstRule === -1 ? undefined : firstRule,
  );
  const intro = introLines.join('\n').trim();

  const rules: Rule[] = [];
  let current: Rule | undefined;
  let previousBlank = true;
  for (const line of firstRule === -1 ? [] : body.slice(firstRule)) {
    const heading = HEADING.exec(line);
    if (heading !== null) {
      current = { id: heading[1]!, title: heading[2]!, status: 'active', fields: [] };
      rules.push(current);
      continue;
    }
    const blank = line.trim() === '';
    const continues = !previousBlank;
    previousBlank = blank;
    if (current === undefined || blank) continue;
    const field = FIELD.exec(line);
    if (field === null) {
      // A wrapped line continues the field above it; in a retired rule, anything else is a body
      // the rule should not keep, held as a field so validation reports it.
      if (current.status === 'retired') {
        if (continues && current.fields.length === 0)
          current.statusText = `${current.statusText ?? ''} ${line.trim()}`;
        else current.fields.push(['Body', line.trim()]);
        continue;
      }
      const last = current.fields.at(-1);
      if (last !== undefined) last[1] = `${last[1]} ${line.trim()}`;
      continue;
    }
    const [, key, value] = field as unknown as [string, string, string];
    if (key === 'Status') {
      current.status = 'retired';
      current.statusText = value.replace(/^retired · /, '');
    } else {
      current.fields.push([key, value]);
      if (key === 'Level') current.level = value as Level;
    }
  }

  return {
    file,
    topic: scalar(frontmatter, 'topic'),
    prefix: scalar(frontmatter, 'prefix'),
    triggers: list(frontmatter.replace(/\n\s+/g, ' '), 'triggers'),
    families: list(frontmatter.replace(/\n\s+/g, ' '), 'families'),
    frontmatter,
    title,
    intro,
    rules,
  };
}

export function topicErrors(topic: Topic, source: string): string[] {
  const errors: string[] = [];
  const at = (rule: Rule) => `${topic.file} ${rule.id}`;
  if (!/^[A-Z]{2}$/.test(topic.prefix)) errors.push(`${topic.file}: prefix "${topic.prefix}"`);
  if (topic.title === '') errors.push(`${topic.file}: no title`);
  for (const rule of topic.rules) {
    if (!rule.id.startsWith(`${topic.prefix}-`))
      errors.push(`${at(rule)}: id does not start with prefix ${topic.prefix}`);
    if (rule.status === 'retired') {
      if (rule.fields.length > 0) errors.push(`${at(rule)}: a retired rule keeps only its Status`);
      continue;
    }
    const keys = rule.fields.map(([key]) => key);
    const expected = RULE_FIELDS.filter((key) => keys.includes(key));
    if (keys.join('|') !== expected.join('|'))
      errors.push(`${at(rule)}: fields out of order or repeated`);
    for (const key of REQUIRED_FIELDS)
      if (!keys.includes(key))
        errors.push(key === 'Check' ? `${at(rule)}: no Check` : `${at(rule)}: no ${key}`);
    if (rule.level !== undefined && !LEVELS.has(rule.level))
      errors.push(`${at(rule)}: level "${rule.level}"`);
  }
  if (/^```/m.test(source)) errors.push(`${topic.file}: fenced code block`);
  const prose = source.replace(/`[^`\n]*`/g, '');
  for (const word of FORBIDDEN_WORDS)
    if (new RegExp(`\\b${word}\\b`, 'i').test(prose))
      errors.push(`${topic.file}: forbidden word "${word}"`);
  const ids = topic.rules.map((rule) => rule.id);
  for (const id of new Set(ids))
    if (ids.indexOf(id) !== ids.lastIndexOf(id)) errors.push(`${topic.file}: ${id} appears twice`);
  return errors;
}

export function renderTopic(topic: Topic): string {
  const lines = ['---', topic.frontmatter, '---', '', `# ${topic.title}`, ''];
  if (topic.intro !== '') lines.push(topic.intro, '');
  for (const rule of topic.rules) {
    lines.push(`### ${rule.id} · ${rule.title}`, '');
    if (rule.status === 'retired') {
      lines.push(`Status: retired · ${rule.statusText ?? ''}`, '');
      continue;
    }
    for (const [key, value] of rule.fields)
      if (!(SOURCE_ONLY_FIELDS as readonly string[]).includes(key)) lines.push(`${key}: ${value}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function renderGuidelinesIndex(topics: readonly Topic[]): string {
  const lines = [
    '# Guidelines index',
    '',
    'Every active rule, one line each. Load this first; load a topic file when the task matches its `triggers`.',
    '',
    '| ID | Level | Rule | File |',
    '| --- | --- | --- | --- |',
  ];
  for (const topic of [...topics].sort((a, b) => a.file.localeCompare(b.file)))
    for (const rule of topic.rules) {
      if (rule.status === 'retired') continue;
      const text = rule.fields.find(([key]) => key === 'Rule')?.[1] ?? '';
      lines.push(
        `| ${rule.id} | ${rule.level} | ${text.replaceAll('|', '\\|')} | \`${topic.file}\` |`,
      );
    }
  return `${lines.join('\n')}\n`;
}
