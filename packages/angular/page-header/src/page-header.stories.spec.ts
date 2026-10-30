import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/page-header/contract.json';
import { ANGULAR_PAGE_HEADER_DOCS } from './page-header.docs';
import * as pageHeaderStories from './page-header.stories';

describe('SlPageHeader stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.pageHeader, pageHeaderStories)).toEqual([]);
  });

  /**
   * The state model is handed over: `expanded` and `pinned` are `model()`
   * inputs, which the checker reads as two-way and therefore asks for no
   * `default*` row — a `model()` is both halves at once.
   */
  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_PAGE_HEADER_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          ANGULAR_PAGE_HEADER_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_PAGE_HEADER_DOCS.pageHeader,
        framework: 'Angular',
        member: contract.members.pageHeader,
        scenarioIds: contract.scenarios.pageHeader,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_PAGE_HEADER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);

    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
