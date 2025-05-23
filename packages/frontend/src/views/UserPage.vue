<template>
  <div>
    <!-- TODO: Skeleton? -->
    <UserProfile v-if="user" :user="user" />

    <PostsContainer
      :posts="posts"
      :is-loading="isLoading"
      :has-next-page="hasNextPage"
      @fetch-more="handleNextPage"
    >
      <template #no-content>
        This author has not posted anything yet.
      </template>

      <template #no-more-content>
        You've read all the posts this author had posted!
      </template>
    </PostsContainer>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import { userTypes } from '@/api/users';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import * as consts from '@/const';
import UserProfile from '@components/User/UserProfile.vue';

const route = useRoute();
const router = useRouter();

const posts = ref<postTypes.Post[]>([]);

const user = ref<userTypes.GetUserProfileResponse | null>(null);

const isLoading = ref(false);

const curPage = ref(0);
const hasNextPage = ref(false);

const handleFetchUser = async () => {
  try {
    console.log(route.params.login);

    const fetchedUser = await api.users.getUserProfile(
      route.params.login as string,
    );

    user.value = fetchedUser;
  } catch {
    router.push({
      name: 'NotFound',
    });
  }
};

/**
 *
 * @param options
 * @param isCombine - if true, posts are concatenated to the existing array
 */
const handleFetchPosts = async ({ isCombine = false } = {}) => {
  try {
    isLoading.value = true;

    const data = await api.posts.search({
      author: user.value?.login || (route.params.login as string),
      limit: consts.POSTS_INITIAL_COUNT,
      offset: curPage.value * consts.POSTS_INITIAL_COUNT,
    });

    hasNextPage.value = data.hasNextPage;

    if (isCombine) {
      posts.value = posts.value.concat(data.posts);
    } else {
      posts.value = data.posts;
    }
  } finally {
    isLoading.value = false;
  }
};

const handleNextPage = () => {
  curPage.value = curPage.value + 1;
  handleFetchPosts({ isCombine: true });
};

const handleFetchAll = async () => {
  await handleFetchUser();
  await handleFetchPosts();
};

onBeforeRouteUpdate((to, from) => {
  if (to.params.login !== from.params.login) {
    handleFetchAll();
  }
});

onBeforeMount(() => {
  handleFetchAll();
});
</script>
