import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/attachment/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_ATTACHMENT_DOCS } from './attachment.docs';
import * as attachmentStories from './attachment.stories';

describe('Angular Attachment stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.attachment, attachmentStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(contract.members.attachment, ANGULAR_ATTACHMENT_DOCS.attachment.api),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_ATTACHMENT_DOCS.attachment,
        framework: 'Angular',
        member: contract.members.attachment,
        scenarioIds: contract.scenarios.attachment,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_ATTACHMENT_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
