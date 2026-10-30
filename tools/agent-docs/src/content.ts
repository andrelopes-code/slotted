import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseTopic, type Topic } from './guidelines.ts';
import { parseSkill, type Skill } from './skills.ts';

/** Files of `content/guidelines` that are not topics; `writing-rules.md` is never published. */
export const NOT_TOPICS = new Set(['README.md', 'writing-rules.md', 'index.md']);

export interface Content {
  readme: string;
  topics: Topic[];
  topicSources: Map<string, string>;
  skills: Map<string, Skill>;
}

export function contentDir(root: string): string {
  return join(root, 'tools/agent-docs/content');
}

export function loadContent(root: string): Content {
  const guidelines = join(contentDir(root), 'guidelines');
  const skillsDir = join(contentDir(root), 'skills');
  const topicSources = new Map<string, string>();
  for (const file of existsSync(guidelines) ? readdirSync(guidelines).sort() : [])
    if (file.endsWith('.md') && !NOT_TOPICS.has(file))
      topicSources.set(file, readFileSync(join(guidelines, file), 'utf8'));
  const skills = new Map<string, Skill>();
  for (const name of existsSync(skillsDir) ? readdirSync(skillsDir).sort() : [])
    if (existsSync(join(skillsDir, name, 'SKILL.md')))
      skills.set(name, parseSkill(readFileSync(join(skillsDir, name, 'SKILL.md'), 'utf8')));
  const readmePath = join(guidelines, 'README.md');
  return {
    readme: existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '',
    topics: [...topicSources].map(([file, source]) => parseTopic(file, source)),
    topicSources,
    skills,
  };
}
