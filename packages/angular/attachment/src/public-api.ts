export {
  ATTACHMENT_CONTROL_SELECTOR,
  ATTACHMENT_DEFAULTS,
  ATTACHMENT_KIND_GLYPH,
  injectAttachmentDefaults,
  provideAttachmentDefaults,
} from './attachment-defaults';
export type {
  AttachmentDefaults,
  AttachmentFile,
  AttachmentLayout,
  AttachmentOrientation,
  AttachmentRemoveReason,
  AttachmentRemoveRequest,
  AttachmentSize,
} from './attachment-defaults';
export { SlAttachment, SlAttachmentGroup } from './attachment';
export {
  SlAttachmentAction,
  SlAttachmentActions,
  SlAttachmentBody,
  SlAttachmentDetail,
  SlAttachmentFilename,
  SlAttachmentMessage,
  SlAttachmentPreview,
  SlAttachmentProgress,
  SlAttachmentRemove,
  SlAttachmentTrigger,
} from './attachment-parts';
