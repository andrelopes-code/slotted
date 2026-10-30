import type { APIRoute, GetStaticPaths } from 'astro';

import {
  AGENT_BINDINGS,
  agentFamilies,
  agentJson,
  type AgentBinding,
} from '../../../lib/agent-docs';

export const getStaticPaths = (() =>
  AGENT_BINDINGS.flatMap((framework) =>
    agentFamilies(framework).map((family) => ({ params: { framework, family } })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(agentJson(params['framework'] as AgentBinding, params['family'] as string), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
