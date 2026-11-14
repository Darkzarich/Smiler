import { onScopeDispose, readonly, ref } from 'vue';

/**
 * One request at a time: starting another aborts the one still in flight, so an
 * answer that arrives after a newer request was made is never applied, whatever
 * order the two come back in.
 */
export function useLatestRequest() {
  const isPending = ref(false);

  let current: AbortController | undefined;

  /** Resolves to the answer, or to `undefined` once a newer `run` or `cancel`
   * has superseded this one; a superseded request's failure is dropped too. */
  async function run<Data>(request: (signal: AbortSignal) => Promise<Data>) {
    current?.abort();

    const controller = new AbortController();

    current = controller;
    isPending.value = true;

    try {
      const data = await request(controller.signal);

      // A request that ignores the signal still resolves after it is aborted
      return controller.signal.aborted ? undefined : data;
    } catch (error) {
      if (controller.signal.aborted) {
        return undefined;
      }

      throw error;
    } finally {
      if (current === controller) {
        current = undefined;
        isPending.value = false;
      }
    }
  }

  function cancel() {
    current?.abort();
    current = undefined;
    isPending.value = false;
  }

  onScopeDispose(cancel);

  return { run, cancel, isPending: readonly(isPending) };
}
