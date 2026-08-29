import { useEffect, useRef, useState } from 'react';

import type { WorkbenchSnippet } from './snippets';

export function CodeDrawer({ snippet }: { snippet: WorkbenchSnippet }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

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
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } finally {
      textarea.remove();
    }
    if (!copied) throw new Error('Fallback copy failed');
  }

  async function copy() {
    try {
      await writeSource();
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setStatus('idle'), 1800);
  }

  const message = status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : '';

  return (
    <details className="slotted-code-drawer">
      <summary>{snippet.label}</summary>
      <div className="slotted-code-drawer__toolbar">
        <span>{snippet.language === 'angular' ? 'Angular' : 'React'}</span>
        <button aria-label={`Copy ${snippet.label}`} onClick={copy} type="button">
          {status === 'copied' ? 'Copied' : 'Copy code'}
        </button>
        <span aria-live="polite" className="slotted-visually-hidden">
          {message}
        </span>
      </div>
      <pre data-language={snippet.language}>
        <code>{snippet.source}</code>
      </pre>
    </details>
  );
}
