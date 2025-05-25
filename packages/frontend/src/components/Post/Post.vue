<template>
  <div class="post">
    <div class="post__left">
      <div
        :data-testid="`post-${post.id}-upvote`"
        class="post__upvote"
        :class="
          post.rated.isRated && !post.rated.negative
            ? 'post__upvote--active'
            : ''
        "
        role="button"
        tabindex="0"
        @click="upvote(post.id)"
      >
        <IconPlus />
      </div>

      <div class="post__rating" :data-testid="`post-${post.id}-rating`">
        {{ post.rating }}
      </div>

      <div
        :data-testid="`post-${post.id}-downvote`"
        class="post__downvote"
        :class="
          post.rated.isRated && post.rated.negative
            ? 'post__downvote--active'
            : ''
        "
        role="button"
        tabindex="0"
        @click="downvote(post.id)"
      >
        <IconMinus />
      </div>
    </div>

    <div class="post__main">
      <div class="post__title">
        <RouterLink
          class="post__title-link"
          :to="{
            name: 'Single',
            params: {
              slug: post.slug,
            },
          }"
          :target="isMobile() ? '' : '_blank'"
          :data-testid="`post-${post.id}-title`"
        >
          {{ post.title }}
        </RouterLink>

        <template v-if="canEdit">
          <RouterLink
            title="Edit post"
            :to="{ name: 'PostEdit', params: { slug: post.slug } }"
          >
            <IconEdit data-testid="post-edit-icon" />
          </RouterLink>

          <button class="post__delete-button" @click="deletePost(post.id)">
            <IconDelete data-testid="post-delete-icon" />
          </button>
        </template>
      </div>

      <div v-if="post.tags.length > 0" class="post__tags">
        <button
          v-for="tag in post.tags"
          :key="tag"
          :data-testid="`post-${post.id}-tag-${tag}`"
          class="post__tags-item"
          @click.prevent.stop="openContextMenu($event, tag)"
        >
          {{ tag }}
        </button>
      </div>

      <div class="post__body">
        <div
          v-for="section in post.sections"
          :key="section.hash"
          class="post__sections"
        >
          <div
            v-if="isTextSection(section)"
            :data-testid="`post-${post.id}-text-${section.hash}`"
            v-html="section.content"
          />

          <div
            v-if="isPictureSection(section)"
            class="post__section-attachment"
          >
            <img
              class="post__section-image"
              :src="resolveImage(section.url)"
              :alt="section.url"
              :data-testid="`post-${post.id}-pic-${section.hash}`"
              @error="resolveImageError"
            />
          </div>

          <div v-if="isVideoSection(section)" class="post__section-attachment">
            <video
              class="post__section-video"
              controls
              :src="section.url"
              :data-testid="`post-${post.id}-vid-${section.hash}`"
            >
              <track kind="captions" />
            </video>
          </div>
        </div>
      </div>

      <!-- for mobile -->
      <div class="post__rate-mobile">
        <button
          class="post__upvote"
          :data-testid="`m-post-${post.id}-upvote`"
          :class="
            post.rated.isRated && !post.rated.negative
              ? 'post__upvote--active'
              : ''
          "
          @click="upvote(post.id)"
        >
          <IconPlus />
        </button>
        <div class="post__rating">
          {{ post.rating }}
        </div>
        <button
          class="post__downvote"
          :data-testid="`m-post-${post.id}-downvote`"
          :class="
            post.rated.isRated && post.rated.negative
              ? 'post__downvote--active'
              : ''
          "
          @click="downvote(post.id)"
        >
          <IconMinus />
        </button>
      </div>

      <!-- for mobile -->
      <div class="post__footer">
        <div class="post__meta-info">
          <span class="post__date">
            {{ formatFromNow(post.createdAt) }}
          </span>

          <RouterLink
            class="post__comments-count"
            :target="isMobile() ? '' : '_blank'"
            :to="{
              name: 'Single',
              hash: '#comments',
              params: {
                slug: post.slug,
              },
            }"
          >
            <IconComments /> {{ post.commentCount }}
          </RouterLink>

          <RouterLink
            v-if="post.author"
            :to="{
              name: 'UserPage',
              params: {
                login: post.author.login,
              },
            }"
            :data-testid="`post-${post.id}-author`"
            class="post__author-container"
          >
            <span class="post__author-login">
              {{ post.author.login }}
            </span>
            <img
              class="post__author-avatar"
              :src="resolveAvatar(post.author.avatar)"
              :alt="post.author.avatar"
            />
          </RouterLink>
          <span v-else class="post__author-container">
            <span> Anonymous </span>
            <img :src="resolveAvatar('')" :alt="'avatar'" />
          </span>
        </div>
      </div>
    </div>

    <BaseContextMenu
      v-click-outside="closeContextMenu"
      :show="contextMenuData.show"
      :pos-x="contextMenuData.x"
      :pos-y="contextMenuData.y"
      :items="contextMenuOptions"
      @action="handleContextMenuAction"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import type { postTypes } from '@/api/posts';
import { POST_SECTION_TYPES, POST_RATE_VALUE } from '@/const';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import { formatFromNow } from '@/utils/format-from-now';
import { resolveAvatar } from '@/utils/resolve-avatar';
import { resolveImage } from '@/utils/resolve-image';
import { resolveImageError } from '@/utils/resolve-image-error';
import BaseContextMenu from '@common/BaseContextMenu.vue';
import IconComments from '@icons/IconComments.vue';
import IconDelete from '@icons/IconDelete.vue';
import IconEdit from '@icons/IconEdit.vue';
import IconMinus from '@icons/IconMinus.vue';
import IconPlus from '@icons/IconPlus.vue';
import { isMobile } from '@utils/is-mobile';

interface Props {
  post: postTypes.Post;
  canEdit?: boolean;
}

interface ContextMenuData {
  show: boolean;
  x: number;
  y: number;
  target: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
});

const router = useRouter();

const isRequesting = ref(false);

const userStore = useUserStore();
const { user, isTagFollowed } = storeToRefs(userStore);

const notificationsStore = useNotificationsStore();

const contextMenuData = reactive<ContextMenuData>({
  show: false,
  x: 0,
  y: 0,
  target: null,
});

const isTextSection = (
  section: postTypes.PostSection,
): section is postTypes.PostTextSection =>
  section.type === POST_SECTION_TYPES.TEXT;

const isPictureSection = (
  section: postTypes.PostSection,
): section is postTypes.PostPictureSection =>
  section.type === POST_SECTION_TYPES.PICTURE;

const isVideoSection = (
  section: postTypes.PostSection,
): section is postTypes.PostVideoSection =>
  section.type === POST_SECTION_TYPES.VIDEO;

const contextMenuOptions = computed(() => {
  const options = [];

  if (router.currentRoute.value.name !== 'Search') {
    options.push({
      label: 'Search tag',
      value: 'search',
    });
  }

  if (user.value) {
    const isTargetTagFollowed = contextMenuData.target
      ? isTagFollowed.value[contextMenuData.target]
      : false;

    if (isTargetTagFollowed) {
      options.push({
        label: 'Unfollow tag',
        value: 'unfollow',
      });
    } else {
      options.push({
        label: 'Follow tag',
        value: 'follow',
      });
    }
  }

  return options;
});

const upvote = async (id: string) => {
  if (isRequesting.value) {
    return;
  }

  isRequesting.value = true;

  if (!props.post.rated.isRated) {
    try {
      props.post.rated.isRated = true;
      props.post.rated.negative = false;
      props.post.rating = props.post.rating + POST_RATE_VALUE;

      const data = await api.posts.updateRateById(id, {
        negative: false,
      });

      Object.assign(props.post, {
        rating: data.rating,
        commentCount: data.commentCount,
      });
    } catch {
      props.post.rated.isRated = false;
      props.post.rating = props.post.rating - POST_RATE_VALUE;
    } finally {
      isRequesting.value = false;
    }

    return;
  }

  if (props.post.rated.negative) {
    try {
      props.post.rated.isRated = false;
      props.post.rating = props.post.rating + POST_RATE_VALUE;

      const data = await api.posts.removeRateById(id);

      Object.assign(props.post, {
        rating: data.rating,
        commentCount: data.commentCount,
      });
    } catch {
      props.post.rated.isRated = true;
      props.post.rating = props.post.rating - POST_RATE_VALUE;
    } finally {
      isRequesting.value = false;
    }
  }
};

const downvote = async (id: string) => {
  if (isRequesting.value) {
    return;
  }

  isRequesting.value = true;

  if (!props.post.rated.isRated) {
    try {
      props.post.rated.isRated = true;
      props.post.rated.negative = true;
      props.post.rating = props.post.rating - POST_RATE_VALUE;

      const data = await api.posts.updateRateById(id, {
        negative: true,
      });

      Object.assign(props.post, {
        rating: data.rating,
        commentCount: data.commentCount,
      });
    } catch {
      props.post.rated.isRated = false;
      props.post.rating = props.post.rating + POST_RATE_VALUE;
    } finally {
      isRequesting.value = false;
    }

    return;
  }

  if (!props.post.rated.negative) {
    try {
      props.post.rated.isRated = false;
      props.post.rating = props.post.rating - POST_RATE_VALUE;

      const data = await api.posts.removeRateById(id);

      Object.assign(props.post, {
        rating: data.rating,
        commentCount: data.commentCount,
      });
    } catch {
      props.post.rated.isRated = true;
      props.post.rating = props.post.rating + POST_RATE_VALUE;
    } finally {
      isRequesting.value = false;
    }
  }
};

const deletePost = async (id: string) => {
  await api.posts.deletePostById(id);

  notificationsStore.showInfoNotification({
    message: 'The post has been successfully deleted',
  });

  router.push({ name: 'Home' });
};

const openContextMenu = (ev: MouseEvent, tag: string) => {
  if (!contextMenuData.show) {
    contextMenuData.show = true;
    contextMenuData.target = tag;
    contextMenuData.x = ev.layerX;
    contextMenuData.y = ev.layerY;
  }
};

const closeContextMenu = () => {
  if (contextMenuData.show) {
    contextMenuData.show = false;
  }
};

const handleContextMenuAction = (action: string) => {
  const target = contextMenuData.target;

  if (!target) {
    return;
  }

  switch (action) {
    case 'follow':
      return handleFollowTag(target);
    case 'unfollow':
      return handleUnfollowTag(target);
    case 'search':
      return searchByTag(target);
  }
};

const handleFollowTag = async (tag: string) => {
  closeContextMenu();

  await api.tags.follow(tag);

  notificationsStore.showInfoNotification({
    message: "You're now following this tag!",
  });

  userStore.followTag(tag);
};

const handleUnfollowTag = async (tag: string) => {
  closeContextMenu();

  await api.tags.unfollow(tag);

  notificationsStore.showInfoNotification({
    message: 'This tag was successfully unfollowed!',
  });

  userStore.unfollowTag(tag);
};

const searchByTag = (tag: string) => {
  router.push({
    name: 'Search',
    query: {
      tags: [tag],
    },
  });
};
</script>

<style lang="scss" scoped>
@use '@/styles/mixins';

.post {
  display: flex;
  flex-flow: row nowrap;

  &__left {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 10%;

    @include mixins.for-size(phone-only) {
      display: none;
    }
  }

  &__rating {
    margin-top: -1rem;
    margin-bottom: -1rem;
    font-size: 20px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1rem;
    font-size: 20px;
    font-weight: 400;

    svg {
      position: relative;
      top: 3px;
      fill: var(--color-gray-light);
      cursor: pointer;
    }
  }

  &__title-link {
    color: var(--color-main-text);
    text-decoration: none;
  }

  &__upvote,
  &__rating,
  &__downvote {
    color: var(--color-gray-light);
    transition: all 200ms ease-out;

    svg {
      width: 5rem;
      fill: var(--color-gray-light);
      transition: all 200ms ease-out;

      @include mixins.for-size(phone-only) {
        width: 3rem;
      }
    }
  }

  &__downvote {
    &--active,
    &:hover {
      svg {
        cursor: pointer;
        fill: var(--color-danger);
      }
    }
  }

  &__upvote {
    &--active,
    &:hover {
      /* stylelint-disable-next-line no-descending-specificity */
      svg {
        cursor: pointer;
        fill: var(--color-primary);
      }
    }
  }

  &__tags {
    @include mixins.flex-row;

    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  &__tags-item {
    margin-top: 0.5rem;
    margin-right: 0.5rem;
    padding: 0.1rem;
    border: 1px solid var(--color-primary);
    border-radius: 5px;
    background: transparent;
    color: var(--color-primary);
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: bold;
    user-select: none;
    cursor: pointer;
  }

  &__main {
    @include mixins.widget;

    width: 90%;
    color: var(--color-main-text);

    @include mixins.for-size(phone-only) {
      width: 100%;
      border: none;
      border-radius: 0;
    }
  }

  &__rate-mobile {
    display: none;

    @include mixins.for-size(phone-only) {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  &__body {
    line-height: 1.5rem;

    cite {
      display: block;
      margin-top: 0.5rem;
      padding: 0.5rem;
      padding-left: 1rem;
      border: 1px solid var(--color-gray-light);
      background: var(--color-bg);
    }
  }

  &__section-attachment {
    display: flex;
    flex-flow: row nowrap;
    margin-top: 1rem;
    margin-bottom: 1rem;

    @include mixins.for-size(phone-only) {
      width: 110%;
      margin-left: -1rem;
      border: none;
    }
  }

  &__section-image,
  &__section-video {
    width: 100%;
    height: 100%;
  }

  &__footer {
    @include mixins.for-size(phone-only) {
      margin-top: -1rem;
    }
  }

  &__meta-info {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    margin: -1rem;
    margin-top: 1rem;
    padding: 0.5rem;
    border-bottom-right-radius: 8px;
    border-bottom-left-radius: 8px;
    background: var(--color-header);

    @include mixins.for-size(phone-only) {
      border-top: none;
    }
  }

  &__date {
    flex: 1;
  }

  &__comments-count {
    flex: 1;
    color: var(--color-gray-light);
    text-align: center;
    text-decoration: none;

    /* stylelint-disable-next-line no-descending-specificity */
    svg {
      position: relative;
      top: 2px;
      width: 1rem;
      height: 1rem;
      margin-right: 0.2rem;
      fill: var(--color-main-text);
    }
  }

  &__author-container {
    display: flex;
    flex: 1;
    justify-content: flex-end;
    align-items: center;
    color: var(--color-main-text);
    text-decoration: none;
  }

  &__author-login {
    border-bottom: 1px solid transparent;

    &:hover {
      border-bottom: 1px solid var(--color-main-text);
    }
  }

  &__author-avatar {
    width: 1.5rem;
    height: 1.5rem;
    margin-left: 0.5rem;
    border-radius: 50%;
  }
}
</style>
