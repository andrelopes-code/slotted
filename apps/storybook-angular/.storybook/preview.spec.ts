import { describe, expect, it } from 'vitest';

import preview from './preview';

describe('Angular Storybook preview', () => {
  it('maps toolbar globals to the theme wrapper without throwing', () => {
    const decorator = preview.decorators?.[0];

    expect(decorator).toBeTypeOf('function');

    const rendered = decorator?.(() => ({ template: '<button>Probe</button>' }), {
      globals: {
        density: 'compact',
        scheme: 'dark',
        theme: 'default',
      },
    } as never);

    expect(rendered).toMatchObject({
      props: {
        slottedBackground: '#111827',
        slottedDensity: 'compact',
        slottedScheme: 'dark',
        slottedTheme: 'default',
      },
    });
    expect(rendered?.template).toContain('<button>Probe</button>');
  });
});
