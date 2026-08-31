import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/fieldset/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_FIELDSET_DOCS } from './fieldset.docs';
import * as fieldsetStories from './fieldset.stories';

describe('Angular Fieldset stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.fieldset, fieldsetStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_FIELDSET_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_FIELDSET_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_FIELDSET_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
