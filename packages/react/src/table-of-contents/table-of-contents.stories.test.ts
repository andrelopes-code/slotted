import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/table-of-contents/contract.json';
import { REACT_TABLE_OF_CONTENTS_DOCS } from './table-of-contents.docs';
import * as tableOfContentsStories from './table-of-contents.stories';

describe('TableOfContents stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.tableOfContents, tableOfContentsStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_TABLE_OF_CONTENTS_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_TABLE_OF_CONTENTS_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_TABLE_OF_CONTENTS_DOCS.tableOfContents,
        framework: 'React',
        member: contract.members.tableOfContents,
        scenarioIds: contract.scenarios.tableOfContents,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TABLE_OF_CONTENTS_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
