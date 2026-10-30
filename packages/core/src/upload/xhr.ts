import type { UploadAdapter, UploadContext } from './types';

/**
 * The one adapter this library ships, and the reason it is `XMLHttpRequest`
 * rather than `fetch`.
 *
 * `fetch` reports no upload progress. Streaming a request body needs HTTP/2 and
 * `duplex: 'half'`, which is not available across the browsers this library
 * supports, so a `fetch` adapter can only draw an indeterminate bar. Ant
 * Design, Vaadin and Uppy all ship an `XMLHttpRequest` sender for the same
 * reason.
 *
 * It lives here rather than as six props on the family: one transport behind
 * six configuration values is exactly what composition is for.
 */

export interface XhrUploadOptions {
  /** Where the file goes. A function is called per file, for a signed URL. */
  url: string | ((file: File) => string | Promise<string>);
  method?: string | undefined;
  /** The field the file is sent under, when the body is a `FormData`. */
  fieldName?: string | undefined;
  headers?: Record<string, string> | (() => Record<string, string>) | undefined;
  /** Extra fields alongside the file. */
  data?: Record<string, string> | ((file: File) => Record<string, string>) | undefined;
  withCredentials?: boolean | undefined;
  /** Sends the file as the whole body rather than inside a `FormData`. */
  raw?: boolean | undefined;
  /** What a 2xx response resolves with. The text, parsed as JSON when it parses. */
  parse?: ((xhr: XMLHttpRequest) => unknown) | undefined;
}

function defaultParse(xhr: XMLHttpRequest): unknown {
  const text = xhr.responseText;
  if (text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** A failed response, carrying the status so a consumer can tell 413 from 500. */
export class XhrUploadError extends Error {
  constructor(
    readonly status: number,
    readonly response: unknown,
  ) {
    super(`Upload failed with status ${status}`);
    this.name = 'XhrUploadError';
  }
}

export function createXhrUpload(options: XhrUploadOptions): UploadAdapter {
  const {
    method = 'POST',
    fieldName = 'file',
    withCredentials = false,
    raw = false,
    parse = defaultParse,
  } = options;

  return {
    /*
     * Not pausable. `XMLHttpRequest` has no way to suspend a request in flight,
     * so declaring otherwise would put a pause control over a sender that
     * cannot honour it — which is the one thing the handshake exists to
     * prevent. A resumable adapter is the consumer's, and `tus` is the protocol
     * for it.
     */
    pausable: false,

    async send(file: File, context: UploadContext): Promise<unknown> {
      const url = typeof options.url === 'function' ? await options.url(file) : options.url;
      const headers = typeof options.headers === 'function' ? options.headers() : options.headers;
      const extra = typeof options.data === 'function' ? options.data(file) : options.data;

      return new Promise<unknown>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.withCredentials = withCredentials;
        for (const [name, value] of Object.entries(headers ?? {})) {
          xhr.setRequestHeader(name, value);
        }

        /*
         * The reader's cancel reaches the request through the platform's own
         * cancellation, and the listener is removed either way: an aborted
         * request that left a listener on a long-lived signal is a leak per
         * file, which a page uploading a folder would feel.
         */
        const abort = () => xhr.abort();
        context.signal.addEventListener('abort', abort, { once: true });
        const done = () => context.signal.removeEventListener('abort', abort);

        xhr.upload.addEventListener('progress', (event) => {
          context.progress(event.loaded, event.lengthComputable ? event.total : undefined);
        });

        xhr.addEventListener('load', () => {
          done();
          const body = parse(xhr);
          if (xhr.status >= 200 && xhr.status < 300) resolve(body);
          else reject(new XhrUploadError(xhr.status, body));
        });
        xhr.addEventListener('error', () => {
          done();
          reject(new XhrUploadError(xhr.status, undefined));
        });
        xhr.addEventListener('abort', () => {
          done();
          reject(new DOMException('Upload aborted', 'AbortError'));
        });

        if (raw) {
          xhr.send(file);
          return;
        }

        const body = new FormData();
        for (const [name, value] of Object.entries(extra ?? {})) body.append(name, value);
        body.append(fieldName, file, file.name);
        xhr.send(body);
      });
    },
  };
}
