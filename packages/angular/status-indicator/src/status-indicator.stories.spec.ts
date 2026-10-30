import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/status-indicator/contract.json';
import { ANGULAR_STATUS_INDICATOR_DOCS } from './status-indicator.docs';
import * as statusIndicatorStories from './status-indicator.stories';

describe('Angular StatusIndicator stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.statusIndicator, statusIndicatorStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.statusIndicator,
        ANGULAR_STATUS_INDICATOR_DOCS.statusIndicator.api,
      ),
    ).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * which element the directive attaches to, what it is made of, and one
   * captioned demonstration per scenario with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_STATUS_INDICATOR_DOCS.statusIndicator,
        framework: 'Angular',
        member: contract.members.statusIndicator,
        scenarioIds: contract.scenarios.statusIndicator,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_STATUS_INDICATOR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
