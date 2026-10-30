import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/toolbar/contract.json';
import { ANGULAR_TOOLBAR_DOCS } from './toolbar.docs';
import * as toolbarStories from './toolbar.stories';

describe('Angular TOOLBAR stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.toolbar, toolbarStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_TOOLBAR_DOCS
    >) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_TOOLBAR_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_TOOLBAR_DOCS.toolbar,
        framework: 'Angular',
        member: contract.members.toolbar,
        scenarioIds: contract.scenarios.toolbar,
        /* Toolbar holds no state a consumer can own, so its contract declares
           no model; reading it through the optional shape keeps the check the
           same as every other family's. */
        stateModel: (contract as { stateModel?: Record<string, unknown> }).stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_TOOLBAR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
