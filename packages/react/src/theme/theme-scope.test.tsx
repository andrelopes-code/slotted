import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeScope } from './index';

describe('ThemeScope', () => {
  it('writes the theme axes and the seeds on the element it renders', () => {
    render(
      <ThemeScope
        data-testid="scope"
        theme="default"
        scheme="system"
        density="compact"
        corners="round"
        seeds={{ accent: '#e11d48' }}
      >
        content
      </ThemeScope>,
    );
    const scope = screen.getByTestId('scope');
    expect(scope.tagName).toBe('DIV');
    expect(scope.getAttribute('data-slotted-theme')).toBe('default');
    expect(scope.getAttribute('data-slotted-scheme')).toBe('system');
    expect(scope.getAttribute('data-slotted-density')).toBe('compact');
    expect(scope.getAttribute('data-slotted-corners')).toBe('round');
    expect(scope.hasAttribute('data-slotted-seeds')).toBe(true);
    expect(scope.style.getPropertyValue('--slotted-seed-accent')).toBe('#e11d48');
  });

  it('writes no seed marker without seeds, and nothing for an axis it was not given', () => {
    render(<ThemeScope data-testid="scope" scheme="dark" />);
    const scope = screen.getByTestId('scope');
    expect(scope.hasAttribute('data-slotted-seeds')).toBe(false);
    expect(scope.hasAttribute('data-slotted-theme')).toBe(false);
  });

  it('hands its props to the element render returns', () => {
    render(
      <ThemeScope theme="default" render={(props) => <section data-testid="scope" {...props} />} />,
    );
    expect(screen.getByTestId('scope').tagName).toBe('SECTION');
    expect(screen.getByTestId('scope').getAttribute('data-slotted-theme')).toBe('default');
  });

  it('refuses an invalid seed before it reaches the DOM', () => {
    expect(() => render(<ThemeScope seeds={{ accent: 'banana' }} />)).toThrow();
  });
});
