<template>
  <div class="post" :class="{ 'post--inert': !interactive }">
    <div class="post__left" :inert="!interactive || undefined">
      <BaseIconButton
        label="Upvote"
        :data-testid="`post-${post._id}-upvote`"
        size="medium"
        tone="primary"
        :pressed="isUpvoted"
        @click="upvote(post._id)"
      >
        <IconPlus />
      </BaseIconButton>

      <div class="post__rating" :data-testid="`post-${post._id}-rating`">
        {{ post.rating }}
      </div>

      <BaseIconButton
        label="Downvote"
        :data-testid="`post-${post._id}-downvote`"
        size="medium"
        tone="danger"
        :pressed="isDownvoted"
        @click="downvote(post._id)"
      >
        <IconMinus />
      </BaseIconButton>
    </div>

    <div class="post__main u-widget">
      <div class="post__title">
        <RouterLink
          v-if="interactive"
          class="post__title-link"
          :to="{
            name: 'Single',
            params: {
              slug: post.slug,
            },
          }"
          :data-testid="`post-${post._id}-title`"
        >
          {{ post.title }}
        </RouterLink>

        <span
          v-else
          class="post__title-link"
          :data-testid="`post-${post._id}-title`"
        >
          {{ post.title }}
        </span>

        <template v-if="canEdit">
          <RouterLink
            title="Edit post"
            :to="{ name: 'PostEdit', params: { slug: post.slug } }"
          >
            <IconEdit data-testid="post-edit-icon" />
          </RouterLink>

          <BaseIconButton
            label="Delete post"
            tone="danger"
            @click="deletePost(post._id)"
          >
            <IconDelete data-testid="post-delete-icon" />
          </BaseIconButton>
        </template>
      </div>

      <div v-if="post.tags?.length > 0" class="post__tags u-flex-row">
        <button
          v-for="tag in post.tags"
          :key="tag"
          :data-testid="`post-${post._id}-tag-${tag}`"
          class="post__tags-item"
          :class="{ 'post__tags-item--inert': !interactive }"
          @click.prevent.stop="openContextMenu($event, tag)"
          @keydown.enter.prevent.stop="openContextMenu($event, tag)"
          @keydown.space.prevent.stop="openContextMenu($event, tag)"
        >
          {{ tag }}
        </button>
      </div>

      <CollapsibleContent :max-height="400" :disabled="!collapsible">
        <div class="post__body">
          <div
            v-for="section in post.sections"
            :key="section.hash"
            class="post__sections"
          >
            <PostSectionSpoiler
              :class="{
                'post__section-spoiler--bleed': !isTextSection(section),
              }"
              :is-spoiler="section.isSpoiler"
              :test-id="`post-${post._id}-spoiler-${section.hash}`"
            >
              <!-- eslint-disable vue/no-v-html -->
              <div
                v-if="isTextSection(section)"
                class="rich-text"
                :data-testid="`post-${post._id}-text-${section.hash}`"
                v-html="section.content"
              />
              <!-- eslint-enable vue/no-v-html -->

              <div
                v-if="isPictureSection(section)"
                class="post__section-attachment post__section-attachment--image"
              >
                <!-- Sections stored before pictures were downloaded server side
                     still point at a third party host, so the request must not
                     carry a referrer and must not fire until it is on screen. -->
                <BaseImage
                  class="post__section-image"
                  :src="resolveImage(section.url)"
                  alt="Post attachment"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  :data-testid="`post-${post._id}-pic-${section.hash}`"
                />
              </div>

              <div
                v-if="isVideoSection(section)"
                class="post__section-attachment post__section-attachment--video"
              >
                <video
                  class="post__section-video"
                  controls
                  :src="section.url"
                  :data-testid="`post-${post._id}-vid-${section.hash}`"
                >
                  <track kind="captions" />
                </video>
              </div>
            </PostSectionSpoiler>
          </div>
        </div>
      </CollapsibleContent>

      <!-- for mobile -->
      <div class="post__rate-mobile" :inert="!interactive || undefined">
        <BaseIconButton
          label="Upvote"
          :data-testid="`m-post-${post._id}-upvote`"
          size="medium"
          tone="primary"
          :pressed="isUpvoted"
          @click="upvote(post._id)"
        >
          <IconPlus />
        </BaseIconButton>
        <div class="post__rating">
          {{ post.rating }}
        </div>
        <BaseIconButton
          label="Downvote"
          :data-testid="`m-post-${post._id}-downvote`"
          size="medium"
          tone="danger"
          :pressed="isDownvoted"
          @click="downvote(post._id)"
        >
          <IconMinus />
        </BaseIconButton>
      </div>

      <!-- for mobile -->
      <div class="post__footer">
        <div class="post__meta-info" :inert="!interactive || undefined">
          <span class="post__date">
            {{ formatFromNow(post.createdAt) }}
          </span>

          <RouterLink
            class="post__comments-count"
            :data-testid="`post-${post._id}-comments-count`"
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
            :data-testid="`post-${post._id}-author`"
            class="post__author-container"
          >
            <span class="post__author-login">
              {{ post.author.login }}
            </span>
            <UserAvatar class="post__author-avatar" :src="post.author.avatar" />
          </RouterLink>
          <span v-else class="post__author-container">
            <span> Anonymous </span>
            <UserAvatar class="post__author-avatar" src="" />
          </span>
        </div>
      </div>
    </div>

    <BaseContextMenu
      v-on-click-outside="closeContextMenu"
      :show="contextMenuData.show"
      :anchor="contextMenuData.anchor"
      :items="contextMenuOptions"
      @action="handleContextMenuAction"
    />
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import PostSectionSpoiler from './PostSectionSpoiler.vue';
import {
  isTextSection,
  isPictureSection,
  isVideoSection,
} from './is-section-of-type';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import { useOwnVote } from '@/composables/use-own-vote';
import { POST_RATE_VALUE } from '@/const';
import { useAuthPromptStore } from '@/store/auth-prompt';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import { formatFromNow } from '@/utils/format-from-now';
import { resolveImage } from '@/utils/resolve-image';
import BaseContextMenu from '@common/BaseContextMenu.vue';
import BaseIconButton from '@common/BaseIconButton.vue';
import BaseImage from '@common/BaseImage.vue';
import CollapsibleContent from '@common/CollapsibleContent.vue';
import IconComments from '@icons/IconComments.vue';
import IconDelete from '@icons/IconDelete.vue';
import IconEdit from '@icons/IconEdit.vue';
import IconMinus from '@icons/IconMinus.vue';
import IconPlus from '@icons/IconPlus.vue';
import UserAvatar from '@components/User/UserAvatar.vue';

interface Props {
  canEdit?: boolean;
  collapsible?: boolean;
  /** Off for a post that isn't stored yet, like the editor preview: the chrome
   * renders but voting, routing and following have nothing to point at. */
  interactive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
  collapsible: true,
  interactive: true,
});

const post = defineModel<postTypes.Post>('post', {
  required: true,
});

const { whenOwnVoteShown } = useOwnVote('post', post);

const router = useRouter();

const isRequesting = ref(false);

const isUpvoted = computed(
  () => post.value.rated.isRated && !post.value.rated.negative,
);
const isDownvoted = computed(
  () => post.value.rated.isRated && post.value.rated.negative,
);

const userStore = useUserStore();
const { user, isTagFollowed } = storeToRefs(userStore);

const notificationsStore = useNotificationsStore();

const authPrompt = useAuthPromptStore();

interface ContextMenuData {
  show: boolean;
  anchor: HTMLElement | null;
  target: string | null;
}

const contextMenuData = reactive<ContextMenuData>({
  show: false,
  anchor: null,
  target: null,
});

const contextMenuOptions = computed(() => {
  const options = [];

  if (router.currentRoute.value.name !== 'Search') {
    options.push({
      label: 'Search tag',
      value: 'search',
    });
  }

  const isTargetTagFollowed =
    user.value && contextMenuData.target
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

  return options;
});

const handleRemoveVote = async (id: string) => {
  isRequesting.value = true;

  const rateValue = post.value.rated.negative
    ? POST_RATE_VALUE
    : -POST_RATE_VALUE;

  const prevPostState = cloneDeep(post.value);

  try {
    // Optimistic update
    post.value = {
      ...post.value,
      rated: {
        negative: post.value.rated.negative,
        isRated: false,
      },
      rating: post.value.rating + rateValue,
    };

    const data = await api.posts.removeRateById(id);

    post.value = {
      ...post.value,
      rating: data.rating,
      commentCount: data.commentCount,
    };
  } catch {
    post.value = prevPostState;
  } finally {
    isRequesting.value = false;
  }
};

const upvote = async (id: string) => {
  if (isRequesting.value || !props.interactive) {
    return;
  }

  if (!user.value) {
    void voteAfterSignIn({ negative: false });

    return;
  }

  if (post.value.rated.isRated && !post.value.rated.negative) {
    return handleRemoveVote(id);
  }

  isRequesting.value = true;

  const rateValue = post.value.rated.isRated
    ? POST_RATE_VALUE * 2
    : POST_RATE_VALUE;

  const prevPostState = cloneDeep(post.value);

  try {
    // Optimistic update
    post.value = {
      ...post.value,
      rated: {
        ...post.value.rated,
        isRated: true,
        negative: false,
      },
      rating: post.value.rating + rateValue,
    };

    const data = await api.posts.updateRateById(id, {
      negative: false,
    });

    post.value = {
      ...post.value,
      rating: data.rating,
      commentCount: data.commentCount,
    };
  } catch {
    post.value = prevPostState;
  } finally {
    isRequesting.value = false;
  }
};

const downvote = async (id: string) => {
  if (isRequesting.value || !props.interactive) {
    return;
  }

  if (!user.value) {
    void voteAfterSignIn({ negative: true });

    return;
  }

  if (post.value.rated.isRated && post.value.rated.negative) {
    return handleRemoveVote(id);
  }

  isRequesting.value = true;

  const rateValue = post.value.rated.isRated
    ? POST_RATE_VALUE * 2
    : POST_RATE_VALUE;

  const prevPostState = cloneDeep(post.value);

  try {
    // Optimistic update
    post.value = {
      ...post.value,
      rated: {
        ...post.value.rated,
        isRated: true,
        negative: true,
      },
      rating: post.value.rating - rateValue,
    };

    const data = await api.posts.updateRateById(id, {
      negative: true,
    });

    post.value = {
      ...post.value,
      rating: data.rating,
      commentCount: data.commentCount,
    };
  } catch {
    post.value = prevPostState;
  } finally {
    isRequesting.value = false;
  }
};

/** Waits for the account's own vote first: pressing ▲ on a post the account
 * has already upvoted would otherwise take that vote back */
async function voteAfterSignIn({ negative }: { negative: boolean }) {
  if (!(await authPrompt.open({ title: 'Sign in to vote' }))) {
    return;
  }

  await whenOwnVoteShown();

  const isOwnPost = post.value.author._id === user.value?._id;
  const isVotedSo = negative ? isDownvoted.value : isUpvoted.value;

  if (!user.value || isOwnPost || isVotedSo) {
    return;
  }

  await (negative ? downvote : upvote)(post.value._id);
}

const deletePost = async (id: string) => {
  await api.posts.deletePostById({
    id,
  });

  notificationsStore.showInfoNotification({
    message: 'The post has been successfully deleted',
  });

  router.push({ name: 'Home' });
};

const openContextMenu = (ev: MouseEvent | KeyboardEvent, tag: string) => {
  if (!props.interactive || contextMenuData.show) {
    return;
  }

  contextMenuData.show = true;
  contextMenuData.anchor = ev.currentTarget as HTMLElement;
  contextMenuData.target = tag;
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
    default:
      // Handle unexpected action
      break;
  }
};

const handleFollowTag = async (tag: string) => {
  closeContextMenu();

  if (
    !(await authPrompt.ensureSignedIn({ title: 'Sign in to follow this tag' }))
  ) {
    return;
  }

  // The account just signed in to may follow it already
  if (isTagFollowed.value[tag]) {
    return;
  }

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

<style scoped>
.post {
  display: flex;
  flex-flow: row nowrap;
  position: relative;

  --post-padding-inline: 1rem;

  &__left {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: center;
    width: var(--post-votes-width);
    gap: 4px;
    margin-left: calc(-1 * var(--post-votes-width));

    @media (--phone-only) {
      display: none;
    }
  }

  &__rating {
    color: var(--color-text-secondary);
    font-size: 20px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;

    @media (--phone-only) {
      font-size: 1.25rem;
    }

    /* The edit link; the delete button styles its own icon */
    a svg {
      position: relative;
      top: 3px;
      fill: var(--color-text-secondary);
    }
  }

  &__title-link {
    color: var(--color-text-primary);
    text-decoration: none;
  }

  &__tags {
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
    color: var(--color-primary-strong);
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: bold;
    user-select: none;
    cursor: pointer;
  }

  &__main {
    flex: 1;
    min-width: 0;
    color: var(--color-text-primary);

    @media (--phone-only) {
      border: none;
      border-radius: 0;
    }
  }

  &__rate-mobile {
    display: none;

    @media (--phone-only) {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
    }
  }

  &__body {
    line-height: 1.5rem;
  }

  &__section-attachment {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    margin-top: 1rem;
    margin-bottom: 1rem;
    border-radius: 8px;
    background: var(--color-surface-primary);
    overflow: hidden;

    @media (--phone-only) {
      border-radius: 0;
    }
  }

  &__section-spoiler--bleed {
    @media (--phone-only) {
      margin-right: calc(-1 * var(--post-padding-inline));
      margin-left: calc(-1 * var(--post-padding-inline));

      :deep(.post-spoiler__veil) {
        border-radius: 0;
      }
    }
  }

  &__section-attachment--image {
    max-height: min(720px, 80svh);
  }

  &__section-image {
    width: 100%;
    max-height: min(720px, 80svh);
    object-fit: contain;
  }

  &__section-video {
    width: 100%;
    height: auto;
    max-height: 80svh;
    object-fit: contain;
  }

  &__section-image,
  &__section-video {
    display: block;
  }

  &__footer {
    @media (--phone-only) {
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
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--color-border);
  }

  &__date {
    flex: 1;
  }

  &__comments-count {
    flex: 1;
    color: var(--color-text-secondary);
    text-align: center;
    text-decoration: none;

    /* stylelint-disable-next-line no-descending-specificity */
    svg {
      position: relative;
      top: 2px;
      width: 1rem;
      height: 1rem;
      margin-right: 0.2rem;
      fill: var(--color-text-primary);
    }
  }

  &__author-container {
    display: flex;
    flex: 1;
    justify-content: flex-end;
    align-items: center;
    color: var(--color-text-primary);
    text-decoration: none;
  }

  &__author-login {
    border-bottom: 1px solid transparent;

    &:hover {
      border-bottom: 1px solid var(--color-text-primary);
    }
  }

  &__author-avatar {
    width: 1.5rem;
    height: 1.5rem;
    margin-left: 0.5rem;
    border-radius: 50%;
  }

  /* Keeps the layout honest while showing nothing here is clickable yet */
  &--inert {
    .post__left,
    .post__rate-mobile,
    .post__meta-info {
      opacity: 0.5;
      cursor: default;
    }
  }

  &__tags-item--inert {
    cursor: default;
  }
}
</style>
