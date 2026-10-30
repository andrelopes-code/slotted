import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Build-time only: the agent documentation each package build wrote into its
 * `dist/docs`. The site serves those files as they are, so the Markdown an
 * agent reads here is the Markdown that ships in the package.
 */
export const AGENT_BINDINGS = ['react', 'angular'] as const;
export type AgentBinding = (typeof AGENT_BINDINGS)[number];
export const AGENT_BINDING_LABELS: Readonly<Record<AgentBinding, string>> = {
  react: 'React',
  angular: 'Angular',
};

const PACKAGE_INDEX_LINE = '<!-- index: ./index.md -->';
const SITE_INDEX_LINE = '<!-- index: /llms.txt -->';
const NOT_PAGES = new Set(['index', 'AGENTS.snippet', 'tokens']);

function docsDir(binding: AgentBinding): string {
  const dir = resolve(process.cwd(), '../../packages', binding, 'dist/docs');
  if (!existsSync(resolve(dir, 'index.md'))) {
    throw new Error(`${dir}/index.md is missing: build @slotted/${binding} before the site`);
  }
  return dir;
}

/** Every Markdown page of a binding: one per family, and the sections moved out of one. */
export function agentPages(binding: AgentBinding): string[] {
  return readdirSync(docsDir(binding))
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.slice(0, -'.md'.length))
    .filter((page) => !NOT_PAGES.has(page))
    .sort();
}

export function agentFamilies(binding: AgentBinding): string[] {
  return readdirSync(docsDir(binding))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -'.json'.length))
    .sort();
}

/** The package page, with its first line pointing at the site index instead of the package one. */
export function agentMarkdown(binding: AgentBinding, page: string): string {
  const content = readFileSync(resolve(docsDir(binding), `${page}.md`), 'utf8');
  return content.startsWith(PACKAGE_INDEX_LINE)
    ? `${SITE_INDEX_LINE}${content.slice(PACKAGE_INDEX_LINE.length)}`
    : content;
}

export function agentJson(binding: AgentBinding, family: string): string {
  return readFileSync(resolve(docsDir(binding), `${family}.json`), 'utf8');
}

export function agentSummary(binding: AgentBinding, family: string): string {
  return (JSON.parse(agentJson(binding, family)) as { catalog: { summary: string } }).catalog
    .summary;
}

/** The token page a binding ships: `tokens.md`. */
export function agentTokens(binding: AgentBinding): string {
  return readFileSync(resolve(docsDir(binding), 'tokens.md'), 'utf8');
}

/** The guideline pages a binding ships: `guidelines/*.md`. */
export function agentGuidelines(binding: AgentBinding): string[] {
  const dir = resolve(docsDir(binding), 'guidelines');
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => file.slice(0, -'.md'.length))
        .sort()
    : [];
}

export function agentGuideline(binding: AgentBinding, page: string): string {
  return readFileSync(resolve(docsDir(binding), 'guidelines', `${page}.md`), 'utf8');
}

/** The product skills a binding ships: `skills/<name>/SKILL.md`. */
export function agentSkills(binding: AgentBinding): string[] {
  const dir = resolve(docsDir(binding), 'skills');
  return existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];
}

/** The skills index a binding ships: `skills/index.md`. */
export function agentSkillsIndex(binding: AgentBinding): string {
  return readFileSync(resolve(docsDir(binding), 'skills', 'index.md'), 'utf8');
}

export function agentSkill(binding: AgentBinding, skill: string): string {
  return readFileSync(resolve(docsDir(binding), 'skills', skill, 'SKILL.md'), 'utf8');
}
