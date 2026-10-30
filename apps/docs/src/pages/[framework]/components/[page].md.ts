import type { APIRoute, GetStaticPaths } from 'astro';

import {
  AGENT_BINDINGS,
  agentMarkdown,
  agentPages,
  type AgentBinding,
} from '../../../lib/agent-docs';

/** The Markdown of every family, and of each section moved out of one, for both bindings. */
export const getStaticPaths = (() =>
  AGENT_BINDINGS.flatMap((framework) =>
    agentPages(framework).map((page) => ({ params: { framework, page } })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(agentMarkdown(params['framework'] as AgentBinding, params['page'] as string), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
