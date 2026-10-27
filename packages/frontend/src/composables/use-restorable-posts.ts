import { toRaw, watch, type Ref } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';
import { postTypes } from '@/api/posts';
import { lookUpOwnVotes } from '@/composables/use-own-vote';
import { useUserStore } from '@/store/user';
import {
  isHistoryTraversal,
  setRestoredScrollTop,
} from '@/utils/history-traversal';

interface Snapshot {
  posts: postTypes.Post[];
  state: Record<string, unknown>;
  /** A post on screen, and where its top was */
  anchor: { id: string; top: number } | null;
}

const MAX_SNAPSHOTS = 10;

const snapshots = new Map<string, Snapshot>();

/** vue-router numbers history entries, so Back to a list finds the copy saved
 * on that entry, not one from an earlier visit to the same URL */
const entryKey = (fullPath: string) =>
  `${window.history.state?.position}:${fullPath}`;

/** The first post that starts on screen: a picture loading later inside a post
 * cut off by the header would move everything under it. Failing that, the
 * post that fills the screen. */
function findAnchorPost() {
  const headerBottom =
    document.querySelector('.header')?.getBoundingClientRect().bottom ?? 0;

  const onScreen = [
    ...document.querySelectorAll<HTMLElement>('[data-post-id]'),
  ].filter((el) => {
    const { top, bottom } = el.getBoundingClientRect();

    return bottom > headerBottom && top < window.innerHeight;
  });

  const anchor =
    onScreen.find((el) => el.getBoundingClientRect().top >= headerBottom) ??
    onScreen[0];

  return anchor?.dataset.postId
    ? { id: anchor.dataset.postId, top: anchor.getBoundingClientRect().top }
    : null;
}

/** Keeps a post list's loaded pages and the reader's place in it for Back and
 * Forward. Each view still fetches page one on any other visit. */
export function useRestorablePosts(
  posts: Ref<postTypes.Post[]>,
  state: Record<string, Ref<unknown>>,
) {
  const route = useRoute();
  const userStore = useUserStore();

  let key = entryKey(route.fullPath);

  // A link from one profile to another keeps the component on a new entry
  watch(
    () => route.fullPath,
    (fullPath) => {
      key = entryKey(fullPath);
    },
  );

  // Not on unmount: by then a feed has already emptied its list for the new route
  onBeforeRouteLeave(() => {
    snapshots.delete(key);
    snapshots.set(key, {
      posts: toRaw(posts.value),
      state: Object.fromEntries(
        Object.entries(state).map(([name, value]) => [name, value.value]),
      ),
      anchor: findAnchorPost(),
    });

    if (snapshots.size > MAX_SNAPSHOTS) {
      snapshots.delete(snapshots.keys().next().value!);
    }
  });

  /** Votes cast on a post's own page, or a sign in or out since, are not in
   * the saved copy */
  async function refreshOwnVotes(restored: postTypes.Post[]) {
    const { userId } = userStore;

    if (!userId) {
      if (restored.some((post) => post.rated.isRated)) {
        posts.value = posts.value.map((post) => ({
          ...post,
          rated: { isRated: false },
        }));
      }

      return;
    }

    const votes = await lookUpOwnVotes(
      'post',
      restored.map((post) => post._id),
    );

    if (userStore.userId !== userId) {
      return;
    }

    // A post voted on in the meantime is a new object and shows the newer vote
    posts.value = posts.value.map((post, i) => {
      const rated = votes.get(post._id);

      return rated && toRaw(post) === restored[i] ? { ...post, rated } : post;
    });
  }

  /** Puts back the copy saved on this history entry, if this is Back or
   * Forward and there is one */
  function restore() {
    const snapshot = isHistoryTraversal() ? snapshots.get(key) : undefined;

    if (!snapshot) {
      return false;
    }

    posts.value = snapshot.posts;

    for (const [name, value] of Object.entries(snapshot.state)) {
      state[name]!.value = value;
    }

    const { anchor } = snapshot;

    if (anchor) {
      setRestoredScrollTop(() => {
        const el = document.querySelector(`[data-post-id="${anchor.id}"]`);

        return el
          ? el.getBoundingClientRect().top + window.scrollY - anchor.top
          : null;
      });
    }

    void refreshOwnVotes(snapshot.posts);

    return true;
  }

  return { restore };
}
