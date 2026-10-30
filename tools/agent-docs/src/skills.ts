import type { Binding } from './types.ts';

/** A product skill: `content/skills/<name>/SKILL.md`, published per binding. */
export interface Skill {
  name: string;
  description: string;
  source: string;
}

export const SKILL_MAX_LINES = 500;

/** What `{{themeScope}}` reads in each binding: the element that names a theme, scheme, density and seeds. */
export const THEME_SCOPE: Readonly<Record<Binding, string>> = {
  react: 'the `ThemeScope` component from `@slotted/react/theme`',
  angular: 'the `slThemeScope` directive from `@slotted/angular/theme`',
};

const PLACEHOLDERS = new Set(['docsDir', 'package', 'themeScope']);

export function parseSkill(source: string): Skill {
  const end = source.indexOf('\n---\n', 4);
  const frontmatter = source.startsWith('---\n') && end !== -1 ? source.slice(4, end) : '';
  const field = (key: string) =>
    new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontmatter)?.[1]?.trim() ?? '';
  return { name: field('name'), description: field('description'), source };
}

export function skillErrors(
  dir: string,
  skill: Skill,
  activeRuleIds: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  if (skill.name !== dir) errors.push(`${dir}: name is ${skill.name || 'missing'}`);
  if (!skill.description.startsWith('Use when'))
    errors.push(`${dir}: description does not start with "Use when"`);
  if (skill.source.split('\n').length > SKILL_MAX_LINES)
    errors.push(`${dir}: more than ${SKILL_MAX_LINES} lines`);
  const cited = new Set([...skill.source.matchAll(/\b[A-Z]{2}-\d{2}\b/g)].map(([id]) => id));
  for (const id of cited)
    if (!activeRuleIds.has(id)) errors.push(`${dir}: cites ${id}, which is not an active rule`);
  const placeholders = [...skill.source.matchAll(/\{\{(\w+)\}\}/g)].map(([, name]) => name);
  for (const name of placeholders)
    if (!PLACEHOLDERS.has(name!)) errors.push(`${dir}: unknown placeholder {{${name}}}`);
  return errors;
}

/**
 * `docsDir` is the root of the installed docs relative to the file being
 * written (`..` from `guidelines/`, `../..` from `skills/<name>/`), so a path
 * resolves against the file that names it, wherever `node_modules` is.
 */
export function renderContent(source: string, binding: Binding, docsDir: string): string {
  return source
    .replaceAll('{{docsDir}}', docsDir)
    .replaceAll('{{package}}', `@slotted/${binding}`)
    .replaceAll('{{themeScope}}', THEME_SCOPE[binding]);
}
