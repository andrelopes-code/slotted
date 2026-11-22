import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusIndicator } from './index';

describe('the dot at a root other than 16px', () => {
  it.each(['sm', 'md', 'lg'] as const)('measures whole pixels at a 14px root, size %s', (size) => {
    document.documentElement.style.fontSize = '14px';
    try {
      const { container } = render(
        <StatusIndicator size={size} status="neutral">
          Open
        </StatusIndicator>,
      );
      const mark = getComputedStyle(container.querySelector('[data-part="mark"]')!);

      expect(Number.isInteger(parseFloat(mark.inlineSize)), mark.inlineSize).toBe(true);
      expect(Number.isInteger(parseFloat(mark.blockSize)), mark.blockSize).toBe(true);
    } finally {
      document.documentElement.style.fontSize = '';
    }
  });
});
