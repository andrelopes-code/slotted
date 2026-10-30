import { useEffect, useRef, useState } from 'react';

import { highlight } from './highlight';

import type { SnippetLanguage, WorkbenchSnippet } from './snippets';

const LANGUAGE_LABELS: Record<SnippetLanguage, string> = {
  angular: 'Angular',
  css: 'CSS',
  markdown: 'Markdown',
  ts: 'TypeScript',
  tsx: 'React',
};

export function CodeDrawer({ snippet }: { snippet: WorkbenchSnippet }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const mounted = useRef(true);
  const request = useRef(0);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(resetTimer.current);
    };
  }, []);

  async function writeSource() {
    if (navigator.clipboard?.writeText !== undefined) {
      try {
        await navigator.clipboard.writeText(snippet.source);
        return;
      } catch {
        // Continue to the fallback used by remote HTTP dev servers.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = snippet.source;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    let copied: boolean;
    try {
      copied = document.execCommand('copy');
    } finally {
      textarea.remove();
    }
    if (!copied) throw new Error('Fallback copy failed');
  }

  async function copy() {
    const requestId = ++request.current;
    window.clearTimeout(resetTimer.current);
    try {
      await writeSource();
      if (!mounted.current || requestId !== request.current) return;
      setStatus('copied');
    } catch {
      if (!mounted.current || requestId !== request.current) return;
      setStatus('failed');
    }
    resetTimer.current = window.setTimeout(() => setStatus('idle'), 1800);
  }

  const message = status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : '';

  return (
    <details className="slotted-code-drawer">
      <summary>{snippet.label}</summary>
      <div className="slotted-code-drawer__toolbar">
        <span>{LANGUAGE_LABELS[snippet.language]}</span>
        <button aria-label={`Copy ${snippet.label}`} onClick={copy} type="button">
          {status === 'copied' ? 'Copied' : 'Copy code'}
        </button>
        <span aria-live="polite" className="slotted-visually-hidden">
          {message}
        </span>
      </div>
      <pre className="slotted-code-drawer__source" data-language={snippet.language}>
        <code>
          {highlight(snippet.source, snippet.language).map((token, index) => (
            <span data-token={token.kind} key={`${token.kind}-${index}`}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
    </details>
  );
}
