<template>
  <NotFound v-if="loadFailure === 'not-found'" />

  <LoadError
    v-else-if="loadFailure === 'failed'"
    title="This post could not be loaded"
    :loading="isFetchingPost"
    @retry="fetchPostToEdit()"
  />

  <div v-else-if="isShow" class="post-create u-widget u-flex-col">
    <h1
      class="post-create__header u-page-title"
      data-testid="post-create-header"
    >
      {{ isEdit ? 'Edit post' : 'New post' }}
    </h1>
    <PostEditor :key="key" :is-edit="isEdit" :post="post" />
  </div>
</template>

<script setup lang="ts">
// TODO: Rename component to something better
import { onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { isNotFoundError } from '@/api/ApiClient';
import { postTypes } from '@/api/posts';
import LoadError from '@/components/LoadError.vue';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import { checkCanEditPost } from '@/utils/check-can-edit-post';
import NotFound from '@/views/NotFound.vue';
import PostEditor from '@components/PostEditor/PostEditor.vue';

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();

const { showErrorNotification } = useNotificationsStore();

const key = ref('');

// TODO: Loader \ Skeleton
const isShow = ref(false);

const isEdit = ref(false);

const loadFailure = ref<'not-found' | 'failed' | null>(null);

const isFetchingPost = ref(false);

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

  const userId = userStore.user?._id;

  if (fetchedPost.author._id !== userId) {
    showErrorNotification({
      message: "Only post's author can edit this post",
    });

    return router.replace({
      name: 'Home',
    });
  }

  if (!checkCanEditPost(fetchedPost, userId)) {
    showErrorNotification({
      message:
        'You cannot edit this post anymore. The time allowed to edit has expired',
    });

    return router.replace({
      name: 'Home',
    });
  }

  post.value = fetchedPost;
  isEdit.value = true;
  isShow.value = true;
};

const fetchPostToEdit = async () => {
  try {
    isFetchingPost.value = true;

    const data = await api.posts.getPostBySlug(
      { slug: route.params.slug as string },
      { notifyOnError: false },
    );

    loadFailure.value = null;
    handleSetPost(data);
  } catch (error) {
    loadFailure.value = isNotFoundError(error) ? 'not-found' : 'failed';
  } finally {
    isFetchingPost.value = false;
  }
};

onBeforeMount(async () => {
  // TODO: ??? was that the only way?
  if (route.meta.mode === 'edit') {
    fetchPostToEdit();
  } else {
    showEditor();
  }
});
</script>
