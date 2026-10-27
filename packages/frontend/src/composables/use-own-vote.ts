import { until } from '@vueuse/core';
import { chunk } from 'lodash-es';
import { ref, watch, type Ref } from 'vue';
import { api } from '@/api';
import { useUserStore } from '@/store/user';

type VoteTarget = 'post' | 'comment';

interface Rated {
  isRated: boolean;
  negative?: boolean;
}

interface Votable {
  _id: string;
  rated: Rated;
}

type Resolve = (rated: Rated | undefined) => void;

/** The backend's VOTE_LOOKUP_MAX_IDS */
const MAX_IDS_PER_LOOKUP = 100;

const lookUpRequests = {
  post: (ids: string[]) => api.posts.getMyVotes(ids),
  comment: (ids: string[]) => api.comments.getMyVotes(ids),
};

const waiting: Record<VoteTarget, Map<string, Resolve[]>> = {
  post: new Map(),
  comment: new Map(),
};

async function lookUpWaiting(target: VoteTarget) {
  const resolvers = waiting[target];

  waiting[target] = new Map();

  await Promise.all(
    chunk([...resolvers.keys()], MAX_IDS_PER_LOOKUP).map(async (ids) => {
      let votes: Record<string, Rated> = {};

      try {
        votes = await lookUpRequests[target](ids);
      } catch {
        // The API client has told the user; the items keep what they show
      }

      ids.forEach((id) => {
        resolvers.get(id)?.forEach((resolve) => resolve(votes[id]));
      });
    }),
  );
}

/** Every item on screen asks at once when the user signs in: the ones asked in
 * the same tick go out as one request */
function lookUpOwnVote(target: VoteTarget, id: string) {
  const resolvers = waiting[target];

  if (resolvers.size === 0) {
    queueMicrotask(() => void lookUpWaiting(target));
  }

  return new Promise<Rated | undefined>((resolve) => {
    resolvers.set(id, [...(resolvers.get(id) ?? []), resolve]);
  });
}

export async function lookUpOwnVotes(target: VoteTarget, ids: string[]) {
  const votes = await Promise.all(ids.map((id) => lookUpOwnVote(target, id)));

  return new Map(ids.map((id, i) => [id, votes[i]]));
}

/** A post or comment carries the vote of whoever was signed in when it was
 * loaded. This keeps it in step as the user signs in or out afterwards. */
export function useOwnVote<T extends Votable>(
  target: VoteTarget,
  item: Ref<T>,
) {
  const userStore = useUserStore();

  /** Whose vote `item` shows */
  const shownFor = ref(userStore.userId);

  watch(
    () => userStore.userId,
    async (userId) => {
      if (!userId) {
        item.value = { ...item.value, rated: { isRated: false } };
        shownFor.value = userId;

        return;
      }

      const rated = await lookUpOwnVote(target, item.value._id);

      if (userStore.userId !== userId) {
        return;
      }

      if (rated) {
        item.value = { ...item.value, rated };
      }

      // Even when the lookup failed: what the item shows is all there is to go on
      shownFor.value = userId;
    },
  );

  return {
    whenOwnVoteShown: () =>
      until(() => shownFor.value === userStore.userId).toBe(true),
  };
}
