import type { APIRoute, GetStaticPaths } from 'astro';

import {
  AGENT_BINDINGS,
  agentGuideline,
  agentGuidelines,
  type AgentBinding,
} from '../../../lib/agent-docs';

/** Each guideline page of both bindings, as the package ships it. */
export const getStaticPaths = (() =>
  AGENT_BINDINGS.flatMap((framework) =>
    agentGuidelines(framework).map((page) => ({ params: { framework, page } })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(agentGuideline(params['framework'] as AgentBinding, params['page'] as string), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
