import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CodeDrawer } from './code-drawer';
import type { WorkbenchSnippet } from './snippets';

const snippet: WorkbenchSnippet = {
  id: 'button',
  label: 'React example',
  language: 'tsx',
  source: '<Button>Save</Button>\n',
};

const originalClipboard = navigator.clipboard;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: originalClipboard });
  vi.restoreAllMocks();
});

describe('CodeDrawer', () => {
  it('reveals the exact source and announces successful copy before resetting', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<CodeDrawer snippet={snippet} />);

    expect(screen.getByText(snippet.label).closest('details')).not.toHaveAttribute('open');
    fireEvent.click(screen.getByText(snippet.label));
    expect(screen.getByText((_, element) => element?.tagName === 'CODE' && element.textContent === snippet.source)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: `Copy ${snippet.label}` }));
    await act(async () => {});
    expect(writeText).toHaveBeenCalledWith(snippet.source);
    expect(screen.getByRole('button', { name: `Copy ${snippet.label}` })).toHaveTextContent('Copied');
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Copied');

    act(() => vi.advanceTimersByTime(1800));
    expect(screen.getByRole('button', { name: `Copy ${snippet.label}` })).toHaveTextContent('Copy code');
  });

  it('uses execCommand when Clipboard API is unavailable and announces failure when copying fails', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: () => false,
      writable: true,
    });
    const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true);
    const { rerender } = render(<CodeDrawer snippet={snippet} />);

    fireEvent.click(screen.getByRole('button', { name: `Copy ${snippet.label}` }));
    await vi.waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
    await vi.waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Copied'));

    execCommand.mockReturnValue(false);
    rerender(<CodeDrawer snippet={{ ...snippet, id: 'failed' }} />);
    fireEvent.click(screen.getByRole('button', { name: `Copy ${snippet.label}` }));
    await vi.waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Copy failed'));
  });

  it('does not schedule copy feedback after an unmounted drawer resolves', async () => {
    const write = deferred<void>();
    const setTimeout = vi.spyOn(window, 'setTimeout');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(() => write.promise) } });
    const { unmount } = render(<CodeDrawer snippet={snippet} />);

    fireEvent.click(screen.getByRole('button', { name: `Copy ${snippet.label}` }));
    unmount();
    write.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(setTimeout).not.toHaveBeenCalled();
  });

  it('keeps the newest copy result when an earlier request settles last', async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    const writeText = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<CodeDrawer snippet={snippet} />);

    const copy = screen.getByRole('button', { name: `Copy ${snippet.label}` });
    fireEvent.click(copy);
    fireEvent.click(copy);
    second.resolve();
    await vi.waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Copied'));
    first.reject(new Error('stale failure'));
    await Promise.resolve();

    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Copied');
  });
});
