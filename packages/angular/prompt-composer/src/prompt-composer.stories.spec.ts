import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/prompt-composer/contract.json';
import { ANGULAR_PROMPT_COMPOSER_DOCS } from './prompt-composer.docs';
import * as promptComposerStories from './prompt-composer.stories';

describe('Angular PromptComposer stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.promptComposer, promptComposerStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_PROMPT_COMPOSER_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_PROMPT_COMPOSER_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_PROMPT_COMPOSER_DOCS.promptComposer,
        framework: 'Angular',
        member: contract.members.promptComposer,
        scenarioIds: contract.scenarios.promptComposer,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_PROMPT_COMPOSER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
