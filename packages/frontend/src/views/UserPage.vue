<template>
  <div>
    <NotFound v-if="loadFailure === 'not-found'" />

    <LoadError
      v-else-if="loadFailure === 'failed'"
      title="This profile could not be loaded"
      :loading="isFetchingUser"
      @retry="handleFetchAll(route.params.login as string)"
    />

    <template v-else>
      <div
        v-if="isFetchingUser && !user"
        class="u-widget u-loading"
        data-testid="profile-loading"
      >
        <CircularLoader />
      </div>

      <template v-else>
        <UserProfile v-if="user" :user="user" />

        <PostsContainer
          v-model:posts="posts"
          :is-loading="isLoading"
          :has-next-page="hasNextPage"
          @fetch-more="handleNextPage"
        >
          <template #no-content>
            This author has not posted anything yet.
          </template>

          <template #no-more-content>
            You've read all the posts this author has posted!
          </template>
        </PostsContainer>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { api } from '@/api';
import { isNotFoundError } from '@/api/ApiClient';
import { postTypes } from '@/api/posts';
import { userTypes } from '@/api/users';
import LoadError from '@/components/LoadError.vue';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import { useLatestRequest } from '@/composables/use-latest-request';
import { useRestorablePosts } from '@/composables/use-restorable-posts';
import * as consts from '@/const';
import NotFound from '@/views/NotFound.vue';
import UserProfile from '@components/User/UserProfile.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

const route = useRoute();

const posts = ref<postTypes.Post[]>([]);

const user = ref<userTypes.GetUserProfileResponse | null>(null);

const loadFailure = ref<'not-found' | 'failed' | null>(null);

const { run: fetchLatestUser, isPending: isFetchingUser } = useLatestRequest();
const { run: fetchLatestPosts, isPending: isLoading } = useLatestRequest();

const nextCursor = ref<string | null>(null);
const hasNextPage = ref(false);

const { restore } = useRestorablePosts(posts, {
  user,
  nextCursor,
  hasNextPage,
});

/** Resolves to `false` when the profile failed or another one was asked for in the meantime */
const handleFetchUser = async (login: string) => {
  try {
    const fetchedUser = await fetchLatestUser((signal) =>
      api.users.getUserProfile(login, { signal, notifyOnError: false }),
    );

    if (!fetchedUser) {
      return false;
    }

    user.value = fetchedUser;
    loadFailure.value = null;

    return true;
  } catch (error) {
    loadFailure.value = isNotFoundError(error) ? 'not-found' : 'failed';

    return false;
  }
};

/**
 *
 * @param options
 * @param isCombine - if true, posts are concatenated to the existing array
 */
const handleFetchPosts = async ({ isCombine = false } = {}) => {
  const cursor = isCombine ? nextCursor.value : null;

  const data = await fetchLatestPosts((signal) =>
    api.posts.getPostsByAuthor(
      {
        author: user.value?.login || (route.params.login as string),
        limit: consts.POSTS_INITIAL_COUNT,
        ...(cursor && { cursor }),
      },
      { signal },
    ),
  );

  if (!data) {
    return;
  }

  nextCursor.value = data.nextCursor;
  hasNextPage.value = data.hasNextPage;

  if (isCombine) {
    posts.value = posts.value.concat(data.posts);
  } else {
    posts.value = data.posts;
  }
};

const handleNextPage = () => {
  handleFetchPosts({ isCombine: true });
};

const handleFetchAll = async (login: string) => {
  if (await handleFetchUser(login)) {
    await handleFetchPosts();
  }
};

// `route` still holds the old login here: the update has not happened yet
onBeforeRouteUpdate((to, from) => {
  if (to.params.login !== from.params.login) {
    handleFetchAll(to.params.login as string);
  }
});

onBeforeMount(() => {
  const login = route.params.login as string;

  if (restore()) {
    // The profile keeps its own copy of a follow, so the saved one may be behind
    void handleFetchUser(login);
  } else {
    handleFetchAll(login);
  }
});
</script>
