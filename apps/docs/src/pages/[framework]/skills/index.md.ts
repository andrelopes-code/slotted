import type { APIRoute, GetStaticPaths } from 'astro';

import { AGENT_BINDINGS, agentSkillsIndex, type AgentBinding } from '../../../lib/agent-docs';

/** The skills index of both bindings, as the package ships it. */
export const getStaticPaths = (() =>
  AGENT_BINDINGS.map((framework) => ({ params: { framework } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(agentSkillsIndex(params['framework'] as AgentBinding), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
