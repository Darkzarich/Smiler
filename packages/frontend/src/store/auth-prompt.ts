import { defineStore } from 'pinia';
import { useUserStore } from './user';

export type AuthPromptMode = 'signin' | 'signup';

interface AuthPromptOptions {
  /** What the visitor was trying to do, e.g. "Sign in to vote" */
  title: string;
  mode?: AuthPromptMode;
}

interface State {
  isOpen: boolean;
  title: string;
  mode: AuthPromptMode;
}

let resolveOpenPrompt: ((isSignedIn: boolean) => void) | null = null;

export const useAuthPromptStore = defineStore('auth-prompt', {
  state: (): State => ({
    isOpen: false,
    title: '',
    mode: 'signin',
  }),
  actions: {
    /** Resolves true once the visitor signs in or up, false if they close it */
    open(options: AuthPromptOptions) {
      // A prompt replaced by another one was dismissed
      resolveOpenPrompt?.(false);

      this.title = options.title;
      this.mode = options.mode ?? 'signin';
      this.isOpen = true;

      return new Promise<boolean>((resolve) => {
        resolveOpenPrompt = resolve;
      });
    },
    async ensureSignedIn(options: AuthPromptOptions) {
      if (useUserStore().user) {
        return true;
      }

      return this.open(options);
    },
    close() {
      this.finish(false);
    },
    complete() {
      this.finish(true);
    },
    finish(isSignedIn: boolean) {
      const resolve = resolveOpenPrompt;

      this.isOpen = false;
      resolveOpenPrompt = null;
      resolve?.(isSignedIn);
    },
  },
});
