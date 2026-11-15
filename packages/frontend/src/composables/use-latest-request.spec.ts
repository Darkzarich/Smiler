import { describe, expect, it } from 'vitest';
import { effectScope } from 'vue';
import { useLatestRequest } from './use-latest-request';

function deferred<Data>() {
  let resolve!: (data: Data) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Data>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/** Settles like a request that ignores its signal, so only the composable
 * keeps a late answer out */
function request<Data>() {
  const answer = deferred<Data>();
  const signals: AbortSignal[] = [];

  return {
    ...answer,
    signals,
    send: (signal: AbortSignal) => {
      signals.push(signal);

      return answer.promise;
    },
  };
}

describe('useLatestRequest', () => {
  it('drops an answer that arrives after a newer request was made', async () => {
    const { run } = useLatestRequest();
    const first = request<string>();
    const second = request<string>();

    const firstResult = run(first.send);
    const secondResult = run(second.send);

    second.resolve('second');
    first.resolve('first');

    expect(await secondResult).toBe('second');
    expect(await firstResult).toBeUndefined();
  });

  it('aborts the request it supersedes', () => {
    const { run } = useLatestRequest();
    const first = request<string>();
    const second = request<string>();

    void run(first.send);
    void run(second.send);

    expect(first.signals[0]?.aborted).toBe(true);
    expect(second.signals[0]?.aborted).toBe(false);
  });

  it('stays pending until the newest request settles', async () => {
    const { run, isPending } = useLatestRequest();
    const first = request<string>();
    const second = request<string>();

    const firstResult = run(first.send);
    const secondResult = run(second.send);

    first.resolve('first');
    await firstResult;

    expect(isPending.value).toBe(true);

    second.resolve('second');
    await secondResult;

    expect(isPending.value).toBe(false);
  });

  it('drops the failure of a superseded request', async () => {
    const { run } = useLatestRequest();
    const first = request<string>();

    const firstResult = run(first.send);

    void run(request<string>().send);
    first.reject(new Error('canceled'));

    expect(await firstResult).toBeUndefined();
  });

  it('passes on the failure of the newest request', async () => {
    const { run, isPending } = useLatestRequest();
    const only = request<string>();

    const result = run(only.send);

    only.reject(new Error('Network Error'));

    await expect(result).rejects.toThrow('Network Error');
    expect(isPending.value).toBe(false);
  });

  it('drops the answer in flight on cancel', async () => {
    const { run, cancel, isPending } = useLatestRequest();
    const only = request<string>();

    const result = run(only.send);

    cancel();

    expect(isPending.value).toBe(false);
    expect(only.signals[0]?.aborted).toBe(true);

    only.resolve('late');

    expect(await result).toBeUndefined();
  });

  it('aborts the request in flight when its scope is disposed', () => {
    const scope = effectScope();
    const only = request<string>();

    scope.run(() => {
      void useLatestRequest().run(only.send);
    });
    scope.stop();

    expect(only.signals[0]?.aborted).toBe(true);
  });
});
