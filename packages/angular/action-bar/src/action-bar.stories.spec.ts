import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/action-bar/contract.json';
import { ANGULAR_ACTION_BAR_DOCS } from './action-bar.docs';
import * as actionBarStories from './action-bar.stories';

describe('Angular ACTION BAR stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.actionBar, actionBarStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_ACTION_BAR_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_ACTION_BAR_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_ACTION_BAR_DOCS.actionBar,
        framework: 'Angular',
        member: contract.members.actionBar,
        scenarioIds: contract.scenarios.actionBar,
        /* The bar holds no state a consumer can own, so its contract declares
           no model; reading it through the optional shape keeps the check the
           same as every other family's. */
        stateModel: (contract as { stateModel?: Record<string, unknown> }).stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_ACTION_BAR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
