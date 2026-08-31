import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/description-list/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_DESCRIPTION_LIST_DOCS } from './description-list.docs';
import * as descriptionListStories from './description-list.stories';

describe('DescriptionList stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.descriptionList, descriptionListStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_DESCRIPTION_LIST_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_DESCRIPTION_LIST_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_DESCRIPTION_LIST_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
