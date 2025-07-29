<template>
  <div v-if="isShow" class="post-create">
    <h1 class="post-create__header" data-testid="post-create-header">
      {{ isEdit ? 'Edit' : 'Make' }} Post
    </h1>
    <PostEditor :key="key" :is-edit="isEdit" :post="post" />
  </div>
</template>

<script setup lang="ts">
// TODO: Rename component to something better
import { onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import { checkCanEditPost } from '@/utils/check-can-edit-post';
import PostEditor from '@components/PostEditor/PostEditor.vue';

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();

const { showErrorNotification } = useNotificationsStore();

const key = ref('');

// TODO: Loader \ Skeleton
const isShow = ref(false);

const isEdit = ref(false);

const post = ref<postTypes.Post | null>(null);

const showEditor = () => {
  post.value = null;
  isEdit.value = false;
  isShow.value = true;
  key.value = '';
};

const handleSetPost = (fetchedPost: postTypes.Post) => {
  isShow.value = false;
  key.value = 'edit';

  const userId = userStore.user?.id;

  if (fetchedPost.author.id !== userId) {
    showErrorNotification({
      message: "Only post's author can edit this post",
    });

    return router.push({
      name: 'Home',
    });
  }

  if (!checkCanEditPost(fetchedPost, userId)) {
    showErrorNotification({
      message:
        'You cannot edit this post anymore. The time allowed to edit has expired',
    });

    return router.push({
      name: 'Home',
    });
  }

  post.value = fetchedPost;
  isEdit.value = true;
  isShow.value = true;
};

onBeforeMount(async () => {
  // TODO: ??? was that the only way?
  if (route.meta.mode === 'edit') {
    try {
      const data = await api.posts.getPostBySlug(route.params.slug as string);

      handleSetPost(data);
    } catch {
      router.push({
        name: 'NotFound',
      });
    }
  } else {
    showEditor();
  }
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.post-create {
  @include mixins.widget;
  @include mixins.flex-col;

  @include mixins.for-size(phone-only) {
    padding-right: 0;
    padding-left: 0;
    border: none;
    border-radius: 0;
  }

  &__header {
    margin-bottom: 16px;
    color: var(--color-main-text);
    font-size: 1.5rem;
    align-self: center;
    font-weight: 500;
  }
}
</style>
