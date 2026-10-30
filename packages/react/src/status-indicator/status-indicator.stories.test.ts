import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/status-indicator/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_STATUS_INDICATOR_DOCS } from './status-indicator.docs';
import * as statusIndicatorStories from './status-indicator.stories';

describe('StatusIndicator stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.statusIndicator, statusIndicatorStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.statusIndicator,
        REACT_STATUS_INDICATOR_DOCS.statusIndicator.api,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_STATUS_INDICATOR_DOCS.statusIndicator,
        framework: 'React',
        member: contract.members.statusIndicator,
        scenarioIds: contract.scenarios.statusIndicator,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_STATUS_INDICATOR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
