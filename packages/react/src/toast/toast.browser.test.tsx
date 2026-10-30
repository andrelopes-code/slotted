import { act, render } from '@testing-library/react';
import { cdp } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';

import { createToaster, ToasterProvider, ToastRegion } from './index';

/**
 * A theme that paints the raised message with a translucent surface blurs
 * what is under it through the family's filter token; a reader who asked for
 * less transparency gets no filter whatever the theme set.
 */
describe('the raised message’s backdrop filter', () => {
  afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
  });

  function filter(token?: string) {
    const toaster = createToaster();
    render(
      <ToasterProvider value={toaster}>
        <div
          style={
            token === undefined ? {} : { ['--slotted-toast-backdrop-filter' as string]: token }
          }
        >
          <ToastRegion attach="inline" />
        </div>
      </ToasterProvider>,
    );
    act(() => {
      toaster.show({ title: 'Draft saved' });
    });
    const item = document.querySelector('[data-ui="toast"] [data-part="item"]') as HTMLElement;
    expect(item.getAttribute('data-variant')).toBe('raised');
    return getComputedStyle(item).backdropFilter;
  }

  it('is the theme’s token', () => {
    expect(filter('blur(9px)')).toBe('blur(9px)');
  });

  it('is none by default', () => {
    expect(filter()).toBe('none');
  });

  it('is none under reduced transparency', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    expect(filter('blur(9px)')).toBe('none');
  });
});
