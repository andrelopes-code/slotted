import type { APIRoute, GetStaticPaths } from 'astro';

import {
  AGENT_BINDINGS,
  agentSkill,
  agentSkills,
  type AgentBinding,
} from '../../../../lib/agent-docs';

/** Each product skill of both bindings, as the package ships it. */
export const getStaticPaths = (() =>
  AGENT_BINDINGS.flatMap((framework) =>
    agentSkills(framework).map((skill) => ({ params: { framework, skill } })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(agentSkill(params['framework'] as AgentBinding, params['skill'] as string), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
