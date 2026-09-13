import { useEventListener, watchDebounced } from '@vueuse/core';
import { ref, toValue } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { postTypes } from '@/api/posts';
import type { userTypes } from '@/api/users';

/** The unfinished post as this device holds it. The account holds one of these
 * too (the template the Save Draft button writes); this is the copy that keeps
 * up with the typing, so nothing is lost between two of those saves. */
export interface LocalPostDraft {
  title: string;
  tags: string[];
  sections: postTypes.PostSection[];
  /** Epoch ms of the last local edit, compared against the template's own
   * `updatedAt` to decide which of the two the editor opens. */
  updatedAt: number;
}

/** Per user, so a shared browser keeps one draft per account and signing out
 * of one never hands its writing to whoever signs in next. */
const storageKey = (userId: string) => `post-draft:${userId}`;

/** Long enough to stay out of the way of typing — a draft is several rich text
 * documents, and serializing them is work every keystroke would wait on — and
 * short enough that a tab that dies loses a few words at most. What is still
 * pending is flushed when the page goes away, so this is not the deadline. */
const SAVE_DEBOUNCE_MS = 500;

function isLocalPostDraft(value: unknown): value is LocalPostDraft {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const draft = value as Record<string, unknown>;

  return (
    typeof draft.title === 'string' &&
    Array.isArray(draft.tags) &&
    Array.isArray(draft.sections) &&
    typeof draft.updatedAt === 'number' &&
    Number.isFinite(draft.updatedAt)
  );
}

/** Anything unreadable is dropped rather than repaired: the account still holds
 * a copy, and half a draft is worse than the one the server can serve. */
export function readLocalPostDraft(userId: string): LocalPostDraft | null {
  try {
    const stored = localStorage.getItem(storageKey(userId));

    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);

    return isLocalPostDraft(parsed) ? parsed : null;
  } catch {
    // Not valid JSON, or storage the browser refuses to read at all (Safari
    // in private mode throws on access rather than answering empty).
    return null;
  }
}

export function writeLocalPostDraft(
  userId: string,
  draft: Omit<LocalPostDraft, 'updatedAt'>,
) {
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ ...draft, updatedAt: Date.now() }),
    );
  } catch {
    // Out of quota, or storage is off. The draft still lives in the editor and
    // the Save Draft button still reaches the account, so this is not worth
    // interrupting the writing over.
  }
}

export function clearLocalPostDraft(userId: string) {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // See writeLocalPostDraft.
  }
}

interface PickedDraft {
  source: 'local' | 'server';
  title: string;
  tags: string[];
  sections: postTypes.PostSection[];
}

/**
 * Which of the two copies the editor opens: the newer one, with the account's
 * winning a tie so a device that never edited anything cannot hold back a
 * draft written elsewhere.
 *
 * The two stamps come from two clocks — the server's and this device's — so a
 * device set to the wrong time can win a comparison it should have lost. The
 * cost of that is opening the writing that device holds, which is still the
 * user's own, and the other copy stays on the account untouched.
 */
export function pickNewerDraft(
  local: LocalPostDraft | null,
  server: userTypes.GetUserTemplateResponse,
): PickedDraft {
  const parsedServerStamp = server.updatedAt ? Date.parse(server.updatedAt) : 0;

  // A template saved before the stamp existed reads as the oldest thing there
  // is, which is what it is next to a draft written since.
  const serverSavedAt = Number.isNaN(parsedServerStamp) ? 0 : parsedServerStamp;

  if (local && local.updatedAt > serverSavedAt) {
    return {
      source: 'local',
      title: local.title,
      tags: local.tags,
      sections: local.sections,
    };
  }

  return {
    source: 'server',
    title: server.title,
    tags: server.tags || [],
    sections: server.sections || [],
  };
}

interface UseLocalPostDraftParams {
  userId: MaybeRefOrGetter<string | undefined>;
  title: Ref<string>;
  tags: Ref<string[]>;
  sections: Ref<postTypes.PostSection[]>;
}

/**
 * Keeps the editor's contents in this device's storage, as the half of the
 * draft that survives a closed tab without a round trip. Saving starts only
 * once `start` is called, so the load that decides what to open is never
 * written back over what it was deciding between.
 */
export function useLocalPostDraft({
  userId,
  title,
  tags,
  sections,
}: UseLocalPostDraftParams) {
  const isStarted = ref(false);

  const save = () => {
    const id = toValue(userId);

    if (!isStarted.value || !id) {
      return;
    }

    writeLocalPostDraft(id, {
      title: title.value,
      tags: tags.value,
      sections: sections.value,
    });
  };

  watchDebounced([title, tags, sections], save, {
    deep: true,
    debounce: SAVE_DEBOUNCE_MS,
  });

  // A debounce can still be pending when the page goes away. localStorage is
  // synchronous, so the last edits can be written on the way out — `pagehide`
  // rather than `unload` because a page frozen into the back/forward cache
  // never fires the latter, and `visibilitychange` because a phone switching
  // apps may never fire either.
  useEventListener(window, 'pagehide', save);
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      save();
    }
  });

  return {
    read: () => {
      const id = toValue(userId);

      return id ? readLocalPostDraft(id) : null;
    },
    clear: () => {
      const id = toValue(userId);

      if (id) {
        clearLocalPostDraft(id);
      }
    },
    save,
    /** Called once the editor has settled on what to show. */
    start: () => {
      isStarted.value = true;
    },
  };
}
