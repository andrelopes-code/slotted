import { Check, Copy, Maximize2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { CodeLine } from '@slotted/core/code';
import { IconButton } from '@slotted/react/button';
import { CodeBlock, type CodeBlockHandle } from '@slotted/react/code-block';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Icon } from '@slotted/react/icon';
import { Tab, TabActions, TabList, TabPanel, Tabs } from '@slotted/react/tabs';

import PreviewAxes from './PreviewAxes';

interface Props {
  /** The id of the stage the preview renders in, which the axes menu re-scopes. */
  stageId: string;
  code: string;
  tokens: CodeLine[];
  language: string;
  fileName: string;
  /** The server-rendered example, which the page's runtime mounts in place. */
  children?: ReactNode;
}

/** How long the copy action shows its check, as the code block's own control does. */
const COPIED_FOR = 1500;

/**
 * One example, one frame: a Preview tab with the running example and a Code
 * tab with its source. Both panels stay mounted, so the example the runtime
 * mounted survives a switch and the code is in the page without JavaScript.
 * The code panel is at least as tall as the preview last measured, so the
 * frame keeps its height across a switch.
 */
export default function ExampleFrame({
  stageId,
  code,
  tokens,
  language,
  fileName,
  children,
}: Props) {
  const [tab, setTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const block = useRef<CodeBlockHandle>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const stage = document.getElementById(stageId);
    const root = frame.current;
    if (!stage || !root) return;
    const measure = () => {
      /* A hidden stage measures zero; the last visible height stands. */
      if (stage.offsetHeight > 0) {
        root.style.setProperty('--docs-example-h', `${stage.offsetHeight}px`);
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    measure();
    return () => observer.disconnect();
  }, [stageId]);

  return (
    <div className="docs-example-frame" ref={frame}>
      <Tabs
        mount="eager"
        size="sm"
        track="none"
        value={tab}
        onValueChange={(value) => setTab(value)}
        style={{ ['--slotted-tabs-gap' as string]: '0px' }}
      >
        <TabList aria-label="Example" style={{ paddingInlineStart: 'var(--slotted-space-4)' }}>
          <Tab value="preview">Preview</Tab>
          <Tab value="code">Code</Tab>
        </TabList>
        <TabActions style={{ marginInlineEnd: 'var(--slotted-space-4)' }}>
          {tab === 'preview' ? (
            <PreviewAxes target={stageId} />
          ) : (
            <>
              <IconButton
                aria-label="Copy code"
                size="sm"
                variant="ghost"
                onClick={() => void block.current?.copy()}
              >
                <Icon size="sm">
                  {copied ? <Check strokeWidth={1.75} /> : <Copy strokeWidth={1.75} />}
                </Icon>
              </IconButton>
              <CodeDialog code={code} tokens={tokens} language={language} fileName={fileName} />
            </>
          )}
        </TabActions>
        <TabPanel value="preview">
          {/* The frame's own gap of 0 is a custom property, so it is inherited:
              without the reset, every Tabs inside an example lost the distance
              between its list and its panel. */}
          <div
            className="docs-example-stage"
            id={stageId}
            style={{ ['--slotted-tabs-gap' as string]: 'initial' }}
          >
            {children}
          </div>
        </TabPanel>
        <TabPanel value="code">
          <div className="docs-example-code">
            <div
              className="docs-code"
              data-joined=""
              data-slotted-theme="default"
              data-slotted-scheme="dark"
            >
              <CodeBlock
                ref={block}
                code={code}
                tokens={tokens}
                language={language}
                fileName={fileName}
                title={fileName}
                copy={false}
                maxLines={24}
                onCopy={(request) => {
                  if (!request.copied) return;
                  setCopied(true);
                  clearTimeout(timer.current);
                  timer.current = setTimeout(() => setCopied(false), COPIED_FOR);
                }}
              />
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}

/**
 * The whole source in a layer as wide as the screen allows, for an example
 * longer than the frame's 24 lines. The code is the panel's body, so the
 * block draws no card of its own inside the panel's; Escape closes it, and
 * the header control takes the whole screen.
 */
function CodeDialog({
  code,
  tokens,
  language,
  fileName,
}: Pick<Props, 'code' | 'tokens' | 'language' | 'fileName'>) {
  return (
    <Dialog size="xl" fullscreenToggle>
      <DialogTrigger
        render={(props) => (
          <IconButton {...props} aria-label="Expand code" size="sm" variant="ghost">
            <Icon size="sm">
              <Maximize2 strokeWidth={1.75} />
            </Icon>
          </IconButton>
        )}
      />
      <DialogContent
        className="docs-code-dialog"
        data-slotted-theme="default"
        data-slotted-scheme="dark"
      >
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <DialogBody>
          <CodeBlock
            code={code}
            tokens={tokens}
            language={language}
            fileName={fileName}
            lineNumbers
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
