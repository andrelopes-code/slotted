import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/file-upload/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_FILE_UPLOAD_DOCS } from './file-upload.docs';
import * as fileUploadStories from './file-upload.stories';

describe('FileUpload stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.fileUpload, fileUploadStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_FILE_UPLOAD_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_FILE_UPLOAD_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_FILE_UPLOAD_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
