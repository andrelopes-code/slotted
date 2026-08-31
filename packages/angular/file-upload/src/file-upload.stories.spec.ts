import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/file-upload/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_FILE_UPLOAD_DOCS } from './file-upload.docs';
import * as fileUploadStories from './file-upload.stories';

describe('Angular FileUpload stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.fileUpload, fileUploadStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_FILE_UPLOAD_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_FILE_UPLOAD_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_FILE_UPLOAD_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
