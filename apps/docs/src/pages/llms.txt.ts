import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';

import {
  AGENT_BINDING_LABELS,
  AGENT_BINDINGS,
  agentFamilies,
  agentGuidelines,
  agentSkills,
  agentSummary,
} from '../lib/agent-docs';
import { SITE_NAME } from '../lib/site';

/** The index an agent reads first (llmstxt.org): one line per family, token page, guideline page, skill and the skills index, per binding. */
export const GET: APIRoute = async () => {
  const introduction = await getEntry('foundations', 'introduction');
  if (introduction === undefined) throw new Error('the introduction foundation page is missing');

  const lines = [`# ${SITE_NAME}`, '', `> ${introduction.data.description}`, ''];
  for (const binding of AGENT_BINDINGS) {
    lines.push(`## ${AGENT_BINDING_LABELS[binding]} components`, '');
    for (const family of agentFamilies(binding)) {
      lines.push(
        `- [${family}](/${binding}/components/${family}.md): ${agentSummary(binding, family)}`,
      );
    }
    lines.push('', `## ${AGENT_BINDING_LABELS[binding]} tokens`, '');
    lines.push(`- [tokens](/${binding}/tokens.md)`);
    lines.push('', `## ${AGENT_BINDING_LABELS[binding]} guidelines`, '');
    for (const page of agentGuidelines(binding))
      lines.push(`- [${page}](/${binding}/guidelines/${page}.md)`);
    lines.push('', `## ${AGENT_BINDING_LABELS[binding]} skills`, '');
    lines.push(`- [index](/${binding}/skills/index.md)`);
    for (const skill of agentSkills(binding))
      lines.push(`- [${skill}](/${binding}/skills/${skill}/SKILL.md)`);
    lines.push('');
  }
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
