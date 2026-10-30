import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { bidiConnection, evaluated } from './engines.mjs';

/** A WebSocket stand-in: answers the commands `answer` names, records the rest. */
function fakeSocket(answer = {}) {
  const socket = new EventTarget();
  socket.sent = [];
  socket.send = (text) => {
    const { id, method } = JSON.parse(text);
    socket.sent.push(method);
    if (method in answer) {
      queueMicrotask(() =>
        socket.dispatchEvent(
          Object.assign(new Event('message'), {
            data: JSON.stringify({ id, type: 'success', result: answer[method] }),
          }),
        ),
      );
    }
  };
  socket.close = () => socket.dispatchEvent(new Event('close'));
  return socket;
}

test('rejects a command in flight when the browser exits, with the exit and its output', async () => {
  const socket = fakeSocket({ 'session.new': {} });
  const browser = new EventEmitter();
  const { send } = bidiConnection(socket, browser, {
    output: () => 'Crash Annotation GraphicsCriticalError\nExiting due to channel error.',
  });
  await send('session.new');
  const evaluation = send('script.evaluate', { expression: '1' });
  browser.emit('exit', null, 'SIGKILL');
  await assert.rejects(evaluation, /firefox exited \(SIGKILL\)[\s\S]*Exiting due to channel error/);
  await assert.rejects(send('script.evaluate'), /firefox exited \(SIGKILL\)/);
});

test('rejects a command in flight when the connection closes', async () => {
  const socket = fakeSocket();
  const { send } = bidiConnection(socket, new EventEmitter(), { output: () => '' });
  const evaluation = send('browsingContext.navigate');
  socket.dispatchEvent(new Event('close'));
  await assert.rejects(evaluation, /the WebDriver BiDi connection closed/);
});

test('rejects a command no answer reaches within the timeout, naming it', async () => {
  const { send } = bidiConnection(fakeSocket(), new EventEmitter(), { timeout: 20 });
  await assert.rejects(
    send('script.evaluate'),
    /script\.evaluate: no answer from firefox in 0\.02 s/,
  );
});

test('settles a browser.close that the exit it causes interrupts', async () => {
  const browser = new EventEmitter();
  const { send } = bidiConnection(fakeSocket(), browser, { output: () => '' });
  const closed = send('browser.close');
  browser.emit('exit', 0, null);
  await assert.rejects(closed, /firefox exited \(code 0\)/);
});

test('reads an expression whose value is undefined as undefined', () => {
  assert.equal(evaluated(undefined), undefined);
  assert.deepEqual(evaluated('{"a":[1]}'), { a: [1] });
});
