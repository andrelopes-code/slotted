import { afterLayout } from './after-layout';

/**
 * How much of the layout viewport the virtual keyboard covers, in pixels.
 *
 * On a phone the keyboard shrinks the *visual* viewport and leaves the layout
 * viewport alone — `interactive-widget=resizes-visual` is the default in
 * Chrome and Safari — so anything fixed to the bottom of the layout viewport
 * ends up under the keys. The covered band is what the layout viewport has
 * below the visual one: `innerHeight − (height + offsetTop)`.
 *
 * `navigator.virtualKeyboard.overlaysContent` is never set here: it is a
 * page-wide switch, and the API is not Baseline. An application that opted
 * into `interactive-widget=resizes-content` sees the two viewports agree and
 * reads nought, which is right, because its layout already shrank.
 */
export function observeKeyboardInset(
  view: Window | null | undefined,
  onInset: (pixels: number) => void,
): () => void {
  const viewport = view?.visualViewport;
  if (view === null || view === undefined || viewport === null || viewport === undefined) {
    return () => undefined;
  }

  let last = -1;
  const measure = () =>
    Math.max(0, Math.round(view.innerHeight - (viewport.height + viewport.offsetTop)));
  const report = (inset: number) => {
    if (inset === last) return;
    last = inset;
    onInset(inset);
  };
  const read = () => report(measure());

  /* The first reading waits for the layout the opening layer causes: read in
     the commit that mounted it, it forced that layout early. */
  let first = 0;
  const doc = view.document as Document | undefined;
  let cancel = () => {};
  if (doc === undefined) read();
  else {
    cancel = afterLayout(
      doc,
      () => {
        first = measure();
      },
      () => report(first),
    );
  }
  viewport.addEventListener('resize', read);
  viewport.addEventListener('scroll', read);
  return () => {
    cancel();
    viewport.removeEventListener('resize', read);
    viewport.removeEventListener('scroll', read);
  };
}
