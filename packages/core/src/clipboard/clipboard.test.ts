import { beforeEach, describe, expect, it, vi } from 'vitest';

import { writeToClipboard } from './clipboard';

/**
 * The ladder, one rung at a time. Each case answers one question: which way the
 * text went, and what the reader's own selection looked like afterwards.
 */
describe('writeToClipboard', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  const withClipboard = (writeText: () => Promise<void>) => {
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
  };

  it('writes through the API when the API accepts it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    withClipboard(writeText);

    await expect(writeToClipboard('slotted')).resolves.toBe('api');
    expect(writeText).toHaveBeenCalledWith('slotted');
  });

  /**
   * The measured refusals of DL1: no user activation, or a document that has
   * lost focus. Both are ordinary, and both are what the second rung answers.
   */
  it('falls to the command when the API refuses, and leaves no carrier behind', async () => {
    withClipboard(vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')));
    const command = vi.fn().mockReturnValue(true);
    document.execCommand = command as unknown as typeof document.execCommand;

    await expect(writeToClipboard('slotted')).resolves.toBe('command');
    expect(command).toHaveBeenCalledWith('copy');
    expect(document.body.children).toHaveLength(0);
  });

  it('gives back the selection the reader had', async () => {
    withClipboard(vi.fn().mockRejectedValue(new Error('refused')));
    document.execCommand = vi.fn().mockReturnValue(true) as unknown as typeof document.execCommand;
    const paragraph = document.createElement('p');
    paragraph.textContent = 'a paragraph the reader had selected';
    document.body.append(paragraph);
    const held = document.createRange();
    held.selectNodeContents(paragraph);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(held);

    await writeToClipboard('slotted');

    expect(String(window.getSelection() ?? '')).toBe('a paragraph the reader had selected');
  });

  it('refuses only when both ways do', async () => {
    withClipboard(vi.fn().mockRejectedValue(new Error('refused')));
    document.execCommand = vi.fn().mockReturnValue(false) as unknown as typeof document.execCommand;

    await expect(writeToClipboard('slotted')).resolves.toBe('refused');
  });

  it('reaches the command with no clipboard API at all', async () => {
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: undefined });
    document.execCommand = vi.fn().mockReturnValue(true) as unknown as typeof document.execCommand;

    await expect(writeToClipboard('slotted')).resolves.toBe('command');
  });
});
