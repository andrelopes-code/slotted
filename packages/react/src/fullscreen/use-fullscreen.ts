import { createFullscreen, fullscreenSupported } from '@slotted/core/fullscreen';
import type {
  FullscreenController,
  FullscreenError,
  FullscreenMode,
  FullscreenOptions,
} from '@slotted/core/fullscreen';
import { fullscreenMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useMessages } from '../i18n';
import { useFullscreenDefaults } from './fullscreen-defaults';
import type {
  FullscreenHandle,
  FullscreenReason,
  FullscreenTarget,
  UseFullscreenOptions,
} from './fullscreen.types';

function resolve(target: FullscreenTarget): HTMLElement | null {
  if (target === null) return null;
  return target instanceof HTMLElement ? target : target.current;
}

/**
 * The state of one region given the whole screen, and the three actions that
 * move it. `Fullscreen` is this hook on its own `div`; a consumer holding the
 * element already — a `video`'s container, the document itself — calls it
 * directly and hands the result to a `FullscreenTrigger` as its `target`.
 *
 * The boolean is the consumer's or the hook's; the way it is applied belongs to
 * `@slotted/core/fullscreen`. An entry is applied inside the handler that
 * asked for it when the hook owns the state, because the agent grants native
 * full screen only to a request made during a gesture; a controlled entry is
 * applied by the render that follows, which is still inside the agent's
 * activation window.
 */
export function useFullscreen(
  target: FullscreenTarget,
  {
    fullscreen,
    defaultFullscreen = false,
    onFullscreenChange,
    onFullscreenError,
    mode: policy,
    navigationUI,
    messages,
  }: UseFullscreenOptions = {},
): FullscreenHandle {
  const defaults = useFullscreenDefaults();
  const t = useMessages(fullscreenMessages, messages);
  const [own, setOwn] = useState(defaultFullscreen);
  const [mode, setMode] = useState<FullscreenMode | null>(null);
  const [error, setError] = useState<FullscreenError | null>(null);
  const [supported, setSupported] = useState(false);

  const state = createControllable<boolean>({
    controlled: fullscreen,
    initial: own,
    onRequest: (request) => onFullscreenChange?.(request.value, request as never),
  });

  const controllerRef = useRef<FullscreenController | null>(null);
  /* Set when the agent left native and the consumer kept the state: a new
     request outside a gesture would only be refused, so the next entry goes
     straight to the layout. */
  const agentLeft = useRef(false);

  /* The latest of everything a controller callback reads, so the controller
     is made once per element rather than once per render. */
  const latest = useRef({ state, onFullscreenError, t, policy, navigationUI, defaults });
  latest.current = { state, onFullscreenError, t, policy, navigationUI, defaults };

  const request = (next: boolean, reason: FullscreenReason, source?: unknown) => {
    const current = latest.current.state;
    if (!current.request(next, reason, source)) return;
    setOwn(next);
    const controller = controllerRef.current;
    if (!controller) return;
    if (next) {
      setError(null);
      void controller.enter();
    } else void controller.exit();
  };
  const requestRef = useRef(request);
  requestRef.current = request;

  const controllerOptions = (): FullscreenOptions => ({
    policy: latest.current.policy ?? latest.current.defaults.mode,
    navigationUI: latest.current.navigationUI ?? latest.current.defaults.navigationUI,
    t: latest.current.t,
    onModeChange: setMode,
    onError: (failure) => {
      setError(failure);
      latest.current.onFullscreenError?.(failure);
    },
    onExit: (source) => {
      /* In native the agent has already left and the controller is out; in
         the layout `Escape` only asked, and the region is still there. */
      agentLeft.current = controllerRef.current?.mode === null;
      requestRef.current(false, 'escape', source);
    },
  });

  /* A ref object is read once, after the commit that attached it; an element
     is the controller's identity, and a new one makes a new controller. */
  useLayoutEffect(() => {
    const element = resolve(target);
    if (!element) return undefined;
    setSupported(fullscreenSupported(element.ownerDocument));
    const controller = createFullscreen(element, controllerOptions());
    controllerRef.current = controller;
    return () => {
      controllerRef.current = null;
      controller.destroy();
    };
    /* The options are read through `latest`, so the element alone decides. */
  }, [target]);

  /* Options the controller reads on its next move. */
  useEffect(() => {
    controllerRef.current?.update(controllerOptions());
  });

  /* The state applied: a controlled value, a default of `true`, and a value
     the consumer kept after the agent left. */
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    if (state.value && controller.mode === null) {
      const native = !agentLeft.current;
      agentLeft.current = false;
      void controller.enter({ native });
    } else if (!state.value && controller.mode !== null) {
      void controller.exit();
    }
    /* `mode` and a new element are the signals; the controller is read live. */
  }, [state.value, mode, target]);

  return {
    fullscreen: state.value,
    mode,
    supported,
    error,
    t,
    enter: (reason = 'programmatic', source) => request(true, reason, source),
    exit: (reason = 'programmatic', source) => request(false, reason, source),
    toggle: (reason = 'programmatic', source) => request(!state.value, reason, source),
  };
}
