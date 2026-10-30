import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/attachment/contract.json';
import { SlottedProvider } from '../i18n';
import {
  ATTACHMENT_KIND_GLYPH,
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentBody,
  AttachmentDefaultsProvider,
  AttachmentDetail,
  AttachmentFilename,
  AttachmentGroup,
  AttachmentLink,
  AttachmentMessage,
  AttachmentPreview,
  AttachmentProgress,
  AttachmentRemove,
  AttachmentTrigger,
} from './index';
import type { AttachmentFile, AttachmentProps } from './index';

const claim: AttachmentFile = {
  name: 'claim-form-2026-0914.pdf',
  type: 'application/pdf',
  size: 248_000,
};

const full = (props: Partial<AttachmentProps> = {}) => (
  <AttachmentGroup aria-label="Attachments" data-testid="group">
    <Attachment data-testid="root" file={claim} {...props}>
      <AttachmentPreview data-testid="preview" />
      <AttachmentBody data-testid="body">
        <AttachmentLink href="/files/claim-form.pdf" />
        <AttachmentDetail data-testid="detail" />
      </AttachmentBody>
      <AttachmentMessage>Rejected by the virus scan.</AttachmentMessage>
      <AttachmentProgress data-testid="progress" value={62} />
      <AttachmentActions data-testid="actions">
        <AttachmentAction aria-label="Share claim-form-2026-0914.pdf">S</AttachmentAction>
        <AttachmentRemove />
      </AttachmentActions>
    </Attachment>
  </AttachmentGroup>
);

const trigger = () => document.querySelector('[data-part="trigger"]') as HTMLElement;

describe('Attachment', () => {
  it('is selected in public by the family identifier and every contract part', () => {
    render(full({ onRemove: () => {} }));
    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-ui', contract.ui);
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root.tagName).toBe('LI');
    for (const part of contract.members.attachment.parts) {
      if (part === 'root') continue;
      expect(document.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
  });

  it('is a div outside a group and an li inside one', () => {
    render(
      <Attachment data-testid="alone" file={claim}>
        <AttachmentBody>
          <AttachmentFilename />
        </AttachmentBody>
      </Attachment>,
    );
    expect(screen.getByTestId('alone').tagName).toBe('DIV');
  });

  it('reads the kind, the split name and the size from the file', () => {
    render(full());
    expect(screen.getByTestId('root')).toHaveAttribute('data-kind', 'pdf');
    expect(screen.getByTestId('preview')).toHaveAttribute('data-extension', 'PDF');
    expect(screen.getByTestId('preview')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('[data-part="name"]')).toHaveTextContent('claim-form-2026-0914');
    expect(document.querySelector('[data-part="extension"]')).toHaveTextContent('.pdf');
    expect(document.querySelector('[data-part="filename"]')).toHaveAttribute('dir', 'auto');
    expect(screen.getByTestId('detail')).toHaveTextContent('248 kB');
  });

  it('draws each kind with the mark the contract names', () => {
    for (const [kind, entry] of Object.entries(contract.kinds)) {
      expect(ATTACHMENT_KIND_GLYPH[kind as keyof typeof ATTACHMENT_KIND_GLYPH]).toBe(entry.glyph);
    }
    render(full());
    expect(screen.getByTestId('preview').querySelector('svg')).toHaveAttribute(
      'data-glyph',
      'file-text',
    );
  });

  it('shows a thumbnail, and returns to the tile when it fails to load', () => {
    render(
      <Attachment file={{ name: 'dent.jpg', type: 'image/jpeg' }}>
        <AttachmentPreview data-testid="preview" src="/dent.jpg" />
      </Attachment>,
    );
    const image = screen.getByTestId('preview').querySelector('img') as HTMLImageElement;
    expect(image).toHaveAttribute('alt', '');
    /* A list of a hundred receipts fetched every thumbnail at once. */
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('decoding', 'async');
    fireEvent.error(image);
    expect(screen.getByTestId('preview').querySelector('img')).toBeNull();
    expect(screen.getByTestId('preview').querySelector('svg')).toHaveAttribute(
      'data-glyph',
      'file-image',
    );
  });

  it('names the trigger by the file and describes it by the detail and the message', () => {
    render(full());
    const link = screen.getByRole('link', { name: 'claim-form-2026-0914.pdf' });
    expect(link).toHaveAttribute('href', '/files/claim-form.pdf');
    expect(link).toHaveAttribute('title', 'claim-form-2026-0914.pdf');
    expect(link).toHaveAccessibleDescription('248 kB Rejected by the virus scan.');
  });

  it('paints the three states from data and keeps aria-invalid off the list item', () => {
    render(full({ disabled: true, invalid: true, loading: true }));
    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-invalid', '');
    expect(root).toHaveAttribute('data-loading', '');
    expect(root).toHaveAttribute('data-disabled', '');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root).not.toHaveAttribute('aria-invalid');
    expect(root).not.toHaveAttribute('aria-disabled');
  });

  it('refuses a link trigger while loading and keeps its destination', () => {
    const onClick = vi.fn();
    render(
      <Attachment file={claim} loading>
        <AttachmentBody>
          <AttachmentLink href="/claim.pdf" onClick={onClick} />
        </AttachmentBody>
      </Attachment>,
    );
    expect(trigger()).toHaveAttribute('aria-disabled', 'true');
    expect(trigger()).toHaveAttribute('href', '/claim.pdf');
    fireEvent.click(trigger());
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disables a button trigger while disabled, and runs the page handler otherwise', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Attachment file={claim} disabled>
        <AttachmentBody>
          <AttachmentTrigger onClick={onClick} />
        </AttachmentBody>
      </Attachment>,
    );
    expect(trigger()).toBeDisabled();
    rerender(
      <Attachment file={claim}>
        <AttachmentBody>
          <AttachmentTrigger onClick={onClick} />
        </AttachmentBody>
      </Attachment>,
    );
    fireEvent.click(trigger());
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders remove only when the attachment is removable, named by the file', () => {
    const { rerender } = render(full());
    expect(document.querySelector('[data-part="remove"]')).toBeNull();
    rerender(full({ onRemove: () => {} }));
    expect(screen.getByRole('button', { name: 'Remove claim-form-2026-0914.pdf' })).toBeVisible();
  });

  it('asks to be removed with the reason the control or the key gives', () => {
    const onRemove = vi.fn();
    render(full({ onRemove }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove claim-form-2026-0914.pdf' }));
    expect(onRemove).toHaveBeenLastCalledWith(
      expect.objectContaining({ file: claim, reason: 'remove' }),
    );
    fireEvent.keyDown(trigger(), { key: 'Delete' });
    expect(onRemove).toHaveBeenLastCalledWith(expect.objectContaining({ reason: 'keyboard' }));
    fireEvent.keyDown(trigger(), { key: 'Backspace' });
    expect(onRemove).toHaveBeenCalledTimes(3);
    fireEvent.keyDown(trigger(), { key: 'Delete', repeat: true });
    expect(onRemove).toHaveBeenCalledTimes(3);
  });

  it('lets the page refuse the key by handling it first, and refuses it while disabled', () => {
    const onRemove = vi.fn();
    const { rerender } = render(full({ onRemove, onKeyDown: (event) => event.preventDefault() }));
    fireEvent.keyDown(trigger(), { key: 'Delete' });
    expect(onRemove).not.toHaveBeenCalled();
    rerender(full({ onRemove, disabled: true }));
    fireEvent.keyDown(trigger(), { key: 'Delete' });
    expect(screen.getByRole('button', { name: 'Remove claim-form-2026-0914.pdf' })).toBeDisabled();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('draws the transfer with the progress bar, named by the file, and waits without a value', () => {
    const { rerender } = render(full());
    const bar = screen.getByRole('progressbar', { name: 'claim-form-2026-0914.pdf' });
    expect(bar).toHaveAttribute('aria-valuenow', '62');
    rerender(
      <Attachment file={claim} loading>
        <AttachmentProgress />
      </Attachment>,
    );
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  it('disables the family actions with the attachment', () => {
    render(full({ disabled: true }));
    expect(screen.getByRole('button', { name: 'Share claim-form-2026-0914.pdf' })).toBeDisabled();
  });

  it('inherits size and orientation from the group and the provider, and its own prop wins', () => {
    render(
      <AttachmentDefaultsProvider layout="strip" size="lg">
        <AttachmentGroup aria-label="Pièces jointes" data-testid="group" orientation="vertical">
          <Attachment
            data-testid="a"
            file={claim}
            messages={{ remove: 'Retirer {name}' }}
            onRemove={() => {}}
          >
            <AttachmentRemove />
          </Attachment>
          <Attachment data-testid="b" file={claim} orientation="horizontal" size="sm" />
        </AttachmentGroup>
      </AttachmentDefaultsProvider>,
    );
    expect(screen.getByTestId('group')).toHaveAttribute('data-layout', 'strip');
    expect(screen.getByTestId('group')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByTestId('a')).toHaveAttribute('data-size', 'lg');
    expect(screen.getByTestId('a')).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByTestId('b')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByTestId('b')).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByRole('button', { name: 'Retirer claim-form-2026-0914.pdf' })).toBeVisible();
  });

  it('speaks the language in force, and writes the size in its digits', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Attachment file={{ name: 'README', size: 1_500_000 }} onRemove={() => {}}>
          <AttachmentPreview data-testid="preview" />
          <AttachmentDetail data-testid="detail" />
          <AttachmentRemove />
        </Attachment>
      </SlottedProvider>,
    );
    expect(screen.getByRole('button', { name: 'Remover README' })).toBeVisible();
    expect(screen.getByTestId('preview')).toHaveAttribute('data-extension', 'ARQUIVO');
    expect(screen.getByTestId('detail')).toHaveTextContent('1,5 MB');
  });

  it('moves focus to the attachment that took the removed one’s place', async () => {
    const files: AttachmentFile[] = [{ name: 'a.pdf' }, { name: 'b.pdf' }, { name: 'c.pdf' }];
    function Tray() {
      const [list, setList] = useState(files);
      return (
        <AttachmentGroup aria-label="Tray">
          {list.map((file) => (
            <Attachment
              file={file}
              key={file.name}
              onRemove={({ file: gone }) => setList((all) => all.filter((f) => f !== gone))}
            >
              <AttachmentActions>
                <AttachmentRemove />
              </AttachmentActions>
            </Attachment>
          ))}
        </AttachmentGroup>
      );
    }
    render(<Tray />);
    const remove = screen.getByRole('button', { name: 'Remove b.pdf' });
    remove.focus();
    await act(async () => {
      fireEvent.click(remove);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove c.pdf' }));
  });

  it('lets a consumer substitute the element of a part', () => {
    render(
      <Attachment file={claim}>
        <AttachmentActions>
          <AttachmentAction
            aria-label="Download claim-form-2026-0914.pdf"
            render={({ disabled: _disabled, type: _type, ...props }) => (
              <a {...props} download href="/claim.pdf" />
            )}
          />
        </AttachmentActions>
      </Attachment>,
    );
    const link = screen.getByRole('link', { name: 'Download claim-form-2026-0914.pdf' });
    expect(link).toHaveAttribute('data-part', 'action');
    expect(link).toHaveAttribute('download');
  });
});
