/** One `claude -p --output-format stream-json` session, reduced to what the evaluation reads. */
export interface SessionTrace {
  readPaths: string[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  isError: boolean;
}

interface ToolUse {
  type: string;
  input?: Record<string, unknown>;
}

export function parseStream(lines: readonly string[]): SessionTrace {
  const trace: SessionTrace = {
    readPaths: [],
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    isError: false,
  };
  for (const line of lines) {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }
    if (event['type'] === 'assistant') {
      const content = ((event['message'] as { content?: ToolUse[] }) ?? {}).content ?? [];
      for (const block of content) {
        if (block.type !== 'tool_use' || block.input === undefined) continue;
        const target =
          block.input['file_path'] ??
          block.input['path'] ??
          block.input['command'] ??
          block.input['pattern'];
        if (typeof target === 'string') trace.readPaths.push(target);
      }
    }
    if (event['type'] === 'result') {
      const usage = (event['usage'] as { input_tokens?: number; output_tokens?: number }) ?? {};
      trace.inputTokens = usage.input_tokens ?? 0;
      trace.outputTokens = usage.output_tokens ?? 0;
      trace.costUsd = Number(event['total_cost_usd'] ?? 0);
      trace.isError = event['is_error'] === true;
    }
  }
  return trace;
}

export function triggered(trace: SessionTrace, skill: string): boolean {
  return trace.readPaths.some((path) => path.includes(`skills/${skill}/SKILL.md`));
}
