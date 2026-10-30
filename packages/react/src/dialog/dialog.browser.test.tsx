import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import {
  AlertDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './index';

const ROWS = Array.from({ length: 60 }, (_, index) => `Row ${String(index + 1)}`);

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * The virtual keyboard shrinks only the visual viewport on Android Chrome and
 * iOS Safari, and a full-screen panel is the layout viewport's height: its
 * lower part sat under the keys and its list had nothing to scroll. With the
 * inset the binding writes, the panel's scroll box ends above the keys and
 * scrolls to its last row.
 */
describe('a full-screen dialog over the virtual keyboard', () => {
  it('ends its scroll box above the keys and scrolls to the last row', async () => {
    render(
      <Dialog defaultOpen fullScreen="narrow">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rows</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {ROWS.map((row) => (
              <p key={row}>{row}</p>
            ))}
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    /* The binding's own first reading lands after the first layout. */
    await frame();
    await frame();
    const root = document.querySelector('[data-ui="dialog"]') as HTMLElement;
    root.style.setProperty('--slotted-keyboard-inset', '260px');
    await frame();

    const keys = window.innerHeight - 260;
    const body = document.querySelector('[data-part="body"]') as HTMLElement;
    expect(Math.round(body.getBoundingClientRect().bottom)).toBe(keys);

    body.scrollTop = body.scrollHeight;
    await frame();
    const last = screen.getByText(ROWS.at(-1) ?? '');
    expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(keys + 1);
    expect(last.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      body.getBoundingClientRect().top,
    );
  });
});

/**
 * A dialog that edits a record submits with Enter from any field and with the
 * footer's submit. The form is the panel itself, through `render`, so the
 * header, the body and the footer stay the panel's children and keep its
 * inset and rows; a form wrapped around them inside the panel loses both.
 */
describe('a dialog that is a form', () => {
  const parts = (
    <>
      <DialogHeader>
        <DialogTitle>Edit contact</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <input aria-label="Name" defaultValue="Ana" />
      </DialogBody>
      <DialogFooter>
        <button type="submit">Save</button>
      </DialogFooter>
    </>
  );

  /** `panel`: the form is the panel. `wrapper`: a form around the parts, inside it. */
  function Record({
    form,
    onSubmit,
  }: {
    form: 'none' | 'panel' | 'wrapper';
    onSubmit?: () => void;
  }) {
    const submit = (event: { preventDefault(): void }) => {
      event.preventDefault();
      onSubmit?.();
    };
    return (
      <Dialog defaultOpen>
        {form === 'panel' ? (
          <DialogContent render={(props) => <form {...props} onSubmit={submit} />}>
            {parts}
          </DialogContent>
        ) : (
          <DialogContent>
            {form === 'wrapper' ? <form onSubmit={submit}>{parts}</form> : parts}
          </DialogContent>
        )}
      </Dialog>
    );
  }

  const geometry = () => {
    const panel = document.querySelector('[data-part="content"]') as HTMLElement;
    const box = panel.getBoundingClientRect();
    return ['header', 'body', 'footer'].map((part) => {
      const rect = (
        panel.querySelector(`[data-part="${part}"]`) as HTMLElement
      ).getBoundingClientRect();
      return [rect.left - box.left, rect.top - box.top, rect.width, rect.height].map(Math.round);
    });
  };

  async function reference() {
    const shown = render(<Record form="none" />);
    await frame();
    await frame();
    const measured = geometry();
    shown.unmount();
    const header = measured[0]!;
    expect(header[2]).toBeGreaterThan(0);
    return measured;
  }

  it('is the panel through render, keeps its rows, and submits with Enter from a field', async () => {
    const expected = await reference();
    let submitted = 0;
    render(<Record form="panel" onSubmit={() => (submitted += 1)} />);
    await frame();
    await frame();
    const panel = document.querySelector('[data-part="content"]') as HTMLElement;
    expect(panel.tagName).toBe('FORM');
    expect(panel).toHaveAttribute('role', 'dialog');
    expect(geometry()).toEqual(expected);
    const header = panel.querySelector('[data-part="header"]') as HTMLElement;
    expect(Number.parseFloat(getComputedStyle(header).paddingInlineStart)).toBeGreaterThan(0);

    (screen.getByLabelText('Name') as HTMLInputElement).focus();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toBe(1);
  });

  it('keeps the panel’s inset and rows for a form wrapped around the parts', async () => {
    const expected = await reference();
    let submitted = 0;
    render(<Record form="wrapper" onSubmit={() => (submitted += 1)} />);
    await frame();
    await frame();
    expect(geometry()).toEqual(expected);
    const header = document.querySelector('[data-part="header"]') as HTMLElement;
    expect(Number.parseFloat(getComputedStyle(header).paddingInlineStart)).toBeGreaterThan(0);

    (screen.getByLabelText('Name') as HTMLInputElement).focus();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toBe(1);
  });
});

/**
 * A consumer that writes `onOpenChange` inline hands the root a new handler on
 * every render of the component that holds the dialog, and that component
 * re-renders on each keystroke typed inside it. The layer's lifecycle runs on
 * `open` alone: a new handler moved focus back to the opener after the first
 * character.
 */
describe('a dialog whose owner re-renders while it is open', () => {
  it.each(['dialog', 'alertDialog'] as const)(
    'keeps focus in the %s input across keystrokes',
    async (member) => {
      const Root = member === 'dialog' ? Dialog : AlertDialog;
      function Owned({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
        const [value, setValue] = useState('');
        return (
          <Root open={open} onOpenChange={(next) => setOpen(next)}>
            <DialogContent>
              <DialogTitle>T</DialogTitle>
              <DialogDescription>D</DialogDescription>
              <DialogBody>
                <input
                  aria-label="R"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              </DialogBody>
            </DialogContent>
          </Root>
        );
      }
      function Page() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Open
            </button>
            <Owned open={open} setOpen={setOpen} />
          </>
        );
      }
      render(<Page />);

      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const input = screen.getByRole('textbox', { name: 'R' });
      await userEvent.click(input);
      await userEvent.keyboard('Duplicated');

      expect(input).toHaveValue('Duplicated');
      expect(document.activeElement).toBe(input);
    },
  );
});

/**
 * A full-screen dialog without a body — a confirmation, a header and its
 * actions — keeps its footer at the bottom of the screen. The panel's grid is
 * header, body (the row that stretches), footer; the footer took the second
 * row and its buttons stood in the middle of a phone.
 */
describe('a full-screen dialog without a body', () => {
  it('rests its footer on the bottom of the screen', async () => {
    render(
      <Dialog defaultOpen fullScreen="narrow">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave the draft?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <button type="button">Leave</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await frame();
    await frame();
    const footer = document.querySelector('[data-part="footer"]') as HTMLElement;
    const button = screen.getByRole('button', { name: 'Leave' });
    const inset = Number.parseFloat(getComputedStyle(footer).paddingBlockEnd);

    expect(Math.round(footer.getBoundingClientRect().bottom)).toBe(window.innerHeight);
    expect(Math.round(button.getBoundingClientRect().bottom + inset)).toBe(window.innerHeight);
  });
});

/**
 * Every size read `--slotted-dialog-measure`, so a theme could not widen one
 * step without collapsing all of them to one width.
 */
describe('the measure of a dialog size', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  /* Wide enough that a narrow layer does not take the panel to the whole screen. */
  const measure = async (size: 'sm' | 'md') => {
    await page.viewport(1280, 915);
    render(
      <Dialog defaultOpen size={size}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
          <DialogBody>Body</DialogBody>
        </DialogContent>
      </Dialog>,
    );
    await frame();
    const content = document.querySelector('[data-ui="dialog"] [data-part="content"]')!;
    return getComputedStyle(content).maxInlineSize;
  };

  it('reads a token of its own before the shared one', async () => {
    document.documentElement.style.setProperty('--slotted-dialog-measure-sm', '30rem');
    try {
      expect(await measure('sm')).toBe('480px');
    } finally {
      document.documentElement.style.removeProperty('--slotted-dialog-measure-sm');
    }
  });

  it('holds the form measure and the panel’s inline padding at md', async () => {
    /* 40rem of form and 1.5rem of padding on each side. */
    expect(await measure('md')).toBe('688px');
  });
});

/**
 * A plain panel places the title and the description in a bar of its own.
 * The rules that set their type matched them only as the header's children,
 * so outside it they kept the user agent's heading size and margins.
 */
describe('the title and the description outside the header', () => {
  const read = () => {
    const title = document.querySelector('[data-ui="dialog"] [data-part="title"]')!;
    const description = document.querySelector('[data-ui="dialog"] [data-part="description"]')!;

    return { title: getComputedStyle(title), description: getComputedStyle(description) };
  };

  it('carry no user agent margin and the header’s type', async () => {
    const { unmount } = render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>photo.png</DialogTitle>
            <DialogDescription>1 of 3</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    await frame();
    const header = read();
    const headerTitleSize = header.title.fontSize;
    const headerDescriptionSize = header.description.fontSize;
    unmount();

    render(
      <Dialog defaultOpen surface="plain">
        <DialogContent>
          <div style={{ display: 'grid' }}>
            <DialogTitle>photo.png</DialogTitle>
            <DialogDescription>1 of 3</DialogDescription>
          </div>
        </DialogContent>
      </Dialog>,
    );
    await frame();
    const { title, description } = read();

    expect(title.marginBlockStart).toBe('0px');
    expect(title.marginBlockEnd).toBe('0px');
    expect(description.marginBlockStart).toBe('0px');
    expect(description.marginBlockEnd).toBe('0px');
    expect(title.fontSize).toBe(headerTitleSize);
    expect(description.fontSize).toBe(headerDescriptionSize);
  });

  it('leave the title of a family inside the dialog to that family', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div data-ui="other" data-ui-other="">
              <h3 data-part="title" data-part-title="">
                Nested
              </h3>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    await frame();
    const nested = screen.getByText('Nested');

    expect(getComputedStyle(nested).marginBlockStart).not.toBe('0px');
  });
});

/**
 * A full-screen layer is the window's size whatever its content: a plain
 * panel holding something taller than the window grew the layer's row with
 * it, and a viewer's layer changed size at every step of its zoom.
 */
describe('a full-screen plain dialog with content taller than the window', () => {
  it('keeps the panel at the window height', async () => {
    render(
      <Dialog defaultOpen fullScreen="always" surface="plain">
        <DialogContent aria-label="Tall">
          <div style={{ blockSize: '3000px' }} />
        </DialogContent>
      </Dialog>,
    );
    await frame();
    const content = document.querySelector('[data-ui="dialog"] [data-part="content"]')!;

    expect(Math.round(content.getBoundingClientRect().height)).toBe(window.innerHeight);
  });
});
