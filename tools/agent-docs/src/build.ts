import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { compileAngular } from './compile-angular.ts';
import { compileReact } from './compile-react.ts';
import { loadContent } from './content.ts';
import { renderGuidelinesIndex, renderTopic } from './guidelines.ts';
import { nonEnglishProse } from './language-report.ts';
import { loadFamilies } from './load.ts';
import {
  compileBlocks,
  renderAgentsSnippet,
  renderFamily,
  renderFamilyJson,
  renderIndex,
  renderSkillsIndex,
  siteExampleErrors,
} from './render.ts';
import { renderContent } from './skills.ts';
import { loadTokenSource, renderTokens } from './tokens.ts';
import type { Binding, BlockVerdict, FamilyInput } from './types.ts';

export interface BuildResult {
  families: number;
  examples: number;
  excerpts: number;
}

/** Writes the agent documentation of one binding into `out`, replacing what was there. */
export async function buildDocs({
  binding,
  root,
  out,
}: {
  binding: Binding;
  root: string;
  out: string;
}): Promise<BuildResult> {
  // `out` is emptied first; a mistyped `dist` would take the package build with it.
  if (!basename(out).startsWith('docs'))
    throw new Error(`refusing to empty ${out}: its name must start with "docs"`);
  const loaded = await loadFamilies(binding, root);
  const portuguese = nonEnglishProse(loaded);
  if (portuguese.length > 0)
    throw new Error(
      portuguese
        .map(
          (finding) =>
            `${finding.binding} ${finding.family}: ${finding.location} is not in English: ${finding.text}`,
        )
        .join('\n'),
    );

  // One compilation for every block of every family; keys are made unique per family.
  const all = loaded.flatMap((family) =>
    compileBlocks(family).map((block) => ({
      ...block,
      key: `${family.contract.family}/${block.key}`,
    })),
  );
  const compiled = await (binding === 'react' ? compileReact : compileAngular)(all, root);

  const families: FamilyInput[] = loaded.map((family) => {
    const prefix = `${family.contract.family}/`;
    const verdicts = new Map<string, BlockVerdict>();
    for (const [key, verdict] of compiled)
      if (key.startsWith(prefix)) verdicts.set(key.slice(prefix.length), verdict);
    return { ...family, verdicts };
  });

  const broken = siteExampleErrors(families);
  if (broken.length > 0) throw new Error(broken.join('\n'));

  mkdirSync(out, { recursive: true });
  for (const entry of readdirSync(out)) rmSync(join(out, entry), { recursive: true, force: true });

  const content = loadContent(root);
  writeFileSync(join(out, 'index.md'), renderIndex(families, binding, content));
  writeFileSync(join(out, 'AGENTS.snippet.md'), renderAgentsSnippet(binding));
  writeFileSync(join(out, 'tokens.md'), renderTokens(loadTokenSource(root)));
  for (const family of families) {
    for (const file of renderFamily(family).files)
      writeFileSync(join(out, file.path), file.content);
    writeFileSync(
      join(out, `${family.contract.family}.json`),
      `${JSON.stringify(renderFamilyJson(family), null, 2)}\n`,
    );
  }
  if (content.topics.length > 0) {
    mkdirSync(join(out, 'guidelines'));
    writeFileSync(join(out, 'guidelines/README.md'), renderContent(content.readme, binding, '..'));
    writeFileSync(
      join(out, 'guidelines/index.md'),
      renderContent(renderGuidelinesIndex(content.topics), binding, '..'),
    );
    for (const topic of content.topics)
      writeFileSync(
        join(out, 'guidelines', topic.file),
        renderContent(renderTopic(topic), binding, '..'),
      );
  }
  if (content.skills.size > 0) {
    mkdirSync(join(out, 'skills'));
    writeFileSync(join(out, 'skills/index.md'), renderSkillsIndex(content.skills, binding));
  }
  for (const [name, skill] of content.skills) {
    mkdirSync(join(out, 'skills', name), { recursive: true });
    writeFileSync(
      join(out, 'skills', name, 'SKILL.md'),
      renderContent(skill.source, binding, '../..'),
    );
  }

  const verdicts = [...compiled.values()];
  return {
    families: families.length,
    examples: verdicts.filter((verdict) => verdict === 'example').length,
    excerpts: verdicts.filter((verdict) => verdict === 'excerpt').length,
  };
}
