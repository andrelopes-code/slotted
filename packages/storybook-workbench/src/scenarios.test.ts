import { describe, expect, it } from 'vitest';

import contract from '../../../specs/components/button/contract.json';
import {
  apiMetadataErrors,
  BUTTON_FAMILY_SCENARIOS,
  scenario,
  scenarioCoverageErrors,
  storyScenarioIds,
} from './scenarios';

describe('workbench scenario metadata', () => {
  it('matches the button-family scenario contract', () => {
    expect(BUTTON_FAMILY_SCENARIOS).toEqual(contract.scenarios);
  });

  it('collects story scenario IDs and reports missing or unknown IDs', () => {
    const stories = {
      default: { title: 'Example' },
      Matrix: { parameters: scenario('matrix') },
      Unexpected: { parameters: scenario('unexpected') },
      utility: () => undefined,
    };

    expect(storyScenarioIds(stories)).toEqual(['matrix', 'unexpected']);
    expect(scenarioCoverageErrors(['matrix', 'themes'], stories)).toEqual([
      'missing themes',
      'unknown unexpected',
    ]);
  });

  it('reports duplicate known story scenario IDs', () => {
    const stories = {
      First: { parameters: scenario('matrix') },
      Second: { parameters: scenario('matrix') },
    };

    expect(scenarioCoverageErrors(['matrix'], stories)).toEqual(['duplicate matrix']);
  });

  it('reports missing API capability rows and incorrect defaults', () => {
    expect(
      apiMetadataErrors(
        { capabilities: ['appearance', 'loading'], defaults: { size: 'md', loading: false } },
        [
          { name: 'variant', defaultValue: 'accent' },
          { name: 'fill', defaultValue: 'solid' },
          { name: 'size', defaultValue: 'lg' },
        ],
      ),
    ).toEqual([
      'missing API loading',
      'default size: expected md, received lg',
      'missing default loading',
    ]);
  });

  it('reports duplicate API rows before checking capability rows or defaults', () => {
    expect(
      apiMetadataErrors({ capabilities: ['appearance'], defaults: { variant: 'accent' } }, [
        { name: 'variant', defaultValue: 'accent' },
        { name: 'variant', defaultValue: 'secondary' },
        { name: 'fill', defaultValue: 'solid' },
        { name: 'size', defaultValue: 'md' },
      ]),
    ).toEqual(['duplicate API variant']);
  });
});
