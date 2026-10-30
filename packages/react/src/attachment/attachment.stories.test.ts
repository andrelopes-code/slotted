import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/attachment/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_ATTACHMENT_DOCS } from './attachment.docs';
import * as attachmentStories from './attachment.stories';

describe('Attachment stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.attachment, attachmentStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(contract.members.attachment, REACT_ATTACHMENT_DOCS.attachment.api),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_ATTACHMENT_DOCS.attachment,
        framework: 'React',
        member: contract.members.attachment,
        scenarioIds: contract.scenarios.attachment,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_ATTACHMENT_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
