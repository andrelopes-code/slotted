import { describe, expect, it, vi } from 'vitest';

import { CustomSheet, type CustomThemeModule } from './custom-sheet';
import { NO_CUSTOMISATION } from './customisation';

const flat = { ...NO_CUSTOMISATION, cards: 'flat' as const };

describe('CustomSheet', () => {
  /**
   * A compile that does not happen — the module does not load, or the theme
   * does not compile — is a state of its own: the sheet on the page stays as
   * it was, and a retry asks again for what was last requested.
   */
  it('fails without touching the page, and compiles the last request on retry', async () => {
    const real = (await import('./custom-theme')) as CustomThemeModule;
    const load = vi
      .fn<() => Promise<CustomThemeModule>>()
      .mockRejectedValueOnce(new Error('chunk'))
      .mockResolvedValue(real);
    const sheet = new CustomSheet('nexora-custom', document, 0, load);

    sheet.request('nexora-corporate', flat);
    await vi.waitFor(() => expect(sheet.failed()).toBe(true));
    expect(sheet.compiled()).toBeNull();
    expect(
      document.head.querySelector('style[data-slotted-theme-sheet="nexora-custom"]'),
    ).toBeNull();

    sheet.retry();
    await vi.waitFor(() => expect(sheet.holds('nexora-corporate', flat)).toBe(true));
    expect(sheet.failed()).toBe(false);
    expect(load).toHaveBeenCalledTimes(2);
    sheet.end();
  });

  it('fails when the theme does not compile', async () => {
    const sheet = new CustomSheet('nexora-custom', document, 0, () =>
      Promise.resolve({
        applyCustomTheme: () => {
          throw new Error('invalid theme');
        },
      }),
    );
    sheet.request('default', flat);
    await vi.waitFor(() => expect(sheet.failed()).toBe(true));
    expect(sheet.compiled()).toBeNull();
    sheet.end();
  });
});
