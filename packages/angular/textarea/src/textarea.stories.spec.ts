import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/textarea/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_TEXTAREA_DOCS } from './textarea.docs';
import * as textareaStories from './textarea.stories';

describe('Angular Textarea stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.textarea, textareaStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_TEXTAREA_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_TEXTAREA_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_TEXTAREA_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
