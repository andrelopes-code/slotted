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

  it('reports missing API capability rows and incorrect defaults', () => {
    expect(
      apiMetadataErrors(
        { capabilities: ['appearance', 'loading'], defaults: { size: 'md', loading: false } },
        [
          { name: 'variant', defaultValue: 'solid' },
          { name: 'tone', defaultValue: 'accent' },
          { name: 'size', defaultValue: 'lg' },
        ],
      ),
    ).toEqual(['missing API loading', 'default size: expected md, received lg', 'missing default loading']);
  });
});
