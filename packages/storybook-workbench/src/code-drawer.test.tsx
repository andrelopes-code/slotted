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
});
