<template>
  <div class="post">
    <div class="post__left">
      <div
        :data-testid="`post-${postData.id}-upvote`"
        class="post__upvote"
        :class="
          postData.rated.isRated && !postData.rated.negative
            ? 'post__upvote--active'
            : ''
        "
        @click="upvote(postData.id)"
      >
        <IconPlus />
      </div>

      <div class="post__rating" :data-testid="`post-${postData.id}-rating`">
        {{ postData.rating }}
      </div>

      <div
        :data-testid="`post-${postData.id}-downvote`"
        class="post__downvote"
        :class="
          postData.rated.isRated && postData.rated.negative
            ? 'post__downvote--active'
            : ''
        "
        @click="downvote(postData.id)"
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
              slug: postData.slug,
            },
          }"
          :target="$isMobile() ? '' : '_blank'"
          :data-testid="`post-${postData.id}-title`"
        >
          {{ postData.title }}
        </RouterLink>

        <template v-if="canEdit">
          <RouterLink
            title="Edit post"
            :to="{ name: 'PostEdit', params: { slug: postData.slug } }"
          >
            <IconEdit data-testid="post-edit-icon" />
          </RouterLink>

          <span @click="deletePost(postData.id)">
            <IconDelete data-testid="post-delete-icon" />
          </span>
        </template>
      </div>

      <div v-if="postData.tags.length > 0" class="post__tags">
        <div
          v-for="tag in postData.tags"
          :key="tag"
          :data-testid="`post-${postData.id}-tag-${tag}`"
          class="post__tags-item"
          @click.prevent.stop="openContextMenu($event, tag)"
        >
          {{ tag }}
        </div>
      </div>

      <div class="post__body">
        <div
          v-for="section in postData.sections"
          :key="section.hash"
          class="post__sections"
        >
          <template v-if="section.type === POST_SECTION_TYPES.TEXT">
            <div
              :data-testid="`post-${postData.id}-text-${section.hash}`"
              v-html="section.content"
            />
          </template>

          <template v-else-if="section.type === POST_SECTION_TYPES.PICTURE">
            <div class="post__section-attachment">
              <img
                class="post__section-image"
                :src="$resolveImage(section.url)"
                :alt="section.url"
                :data-testid="`post-${postData.id}-pic-${section.hash}`"
                @error="$resolveImageError"
              />
            </div>
          </template>

          <template v-else-if="section.type === POST_SECTION_TYPES.VIDEO">
            <div class="post__section-attachment">
              <video
                class="post__section-video"
                controls
                :src="section.url"
                :data-testid="`post-${postData.id}-vid-${section.hash}`"
              >
                <track kind="captions" />
              </video>
            </div>
          </template>
        </div>
      </div>

      <!-- for mobile -->

      <div class="post__rate-mobile">
        <div
          class="post__upvote"
          :data-testid="`m-post-${postData.id}-upvote`"
          :class="
            postData.rated.isRated && !postData.rated.negative
              ? 'post__upvote--active'
              : ''
          "
          @click="upvote(postData.id)"
        >
          <IconPlus />
        </div>
        <div class="post__rating">
          {{ postData.rating }}
        </div>
        <div
          class="post__downvote"
          :data-testid="`m-post-${postData.id}-downvote`"
          :class="
            postData.rated.isRated && postData.rated.negative
              ? 'post__downvote--active'
              : ''
          "
          @click="downvote(postData.id)"
        >
          <IconMinus />
        </div>
      </div>

      <!-- for mobile -->
      <div class="post__footer">
        <div class="post__meta-info">
          <span class="post__date">
            {{ postData.createdAt | $fromNow }}
          </span>

          <RouterLink
            class="post__comments-count"
            :target="$isMobile() ? '' : '_blank'"
            :to="{
              name: 'Single',
              hash: '#comments',
              params: {
                slug: postData.slug,
              },
            }"
          >
            <IconComments /> {{ postData.commentCount }}
          </RouterLink>

          <RouterLink
            v-if="postData.author"
            :to="{
              name: 'UserPage',
              params: {
                login: postData.author.login,
              },
            }"
            :data-testid="`post-${postData.id}-author`"
            class="post__author-container"
          >
            <span class="post__author-login">
              {{ postData.author.login }}
            </span>
            <img
              class="post__author-avatar"
              :src="$resolveAvatar(postData.author.avatar)"
              :alt="postData.author.avatar"
            />
          </RouterLink>
          <span v-else class="post__author-container">
            <span> Anonymous </span>
            <img :src="$resolveAvatar('')" :alt="'avatar'" />
          </span>
        </div>
      </div>
    </div>

    <BaseContextMenu
      v-click-outside="closeContextMenu"
      :show="contextMenuData.show"
      :pos-x="contextMenuData.x"
      :pos-y="contextMenuData.y"
      :list="contextMenuOptions"
      :target="contextMenuData.target"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import api from '@/api/index';
import consts from '@/const/const';
import BaseContextMenu from '@common/BaseContextMenu.vue';
import IconComments from '@icons/IconComments.vue';
import IconDelete from '@icons/IconDelete.vue';
import IconEdit from '@icons/IconEdit.vue';
import IconMinus from '@icons/IconMinus.vue';
import IconPlus from '@icons/IconPlus.vue';

export default {
  components: {
    IconComments,
    IconDelete,
    IconEdit,
    IconMinus,
    BaseContextMenu,
    IconPlus,
  },
  props: ['post', 'canEdit'],
  data() {
    return {
      postData: this.post,
      isRequesting: false,
      POST_SECTION_TYPES: consts.POST_SECTION_TYPES,
      contextMenuData: {
        show: false,
        x: 0,
        y: 0,
        target: null,
      },
    };
  },
  computed: {
    ...mapGetters(['isUserAuth']),
    contextMenuOptions() {
      const options = [];

      if (this.$route.name !== 'Search') {
        options.push({
          title: 'Search tag',
          callback: this.searchTag,
        });
      }

      if (this.isUserAuth) {
        const isTargetTagFollowed =
          this.$store.getters.isTagFollowed[this.contextMenuData.target];

        if (isTargetTagFollowed) {
          options.push({
            title: 'Unfollow tag',
            callback: this.unfollowTag,
          });
        } else {
          options.push({
            title: 'Follow tag',
            callback: this.followTag,
          });
        }
      }

      return options;
    },
  },
  methods: {
    async upvote(id) {
      if (this.isRequesting) {
        return;
      }

      this.isRequesting = true;

      if (!this.postData.rated.isRated) {
        // Optimistic update
        this.postData.rated.isRated = true;
        this.postData.rated.negative = false;
        this.postData.rating = this.postData.rating + consts.POST_RATE_VALUE;

        const res = await api.posts.updateRateById(id, {
          negative: false,
        });

        this.isRequesting = false;

        if (res.data.error) {
          this.postData.rated.isRated = false;
          this.postData.rating = this.postData.rating - consts.POST_RATE_VALUE;

          return;
        }

        this.postData = {
          ...this.postData,
          rating: res.data.rating,
          commentCount: res.data.commentCount,
        };
      } else if (this.postData.rated.negative) {
        // Optimistic update
        this.postData.rated.isRated = false;
        this.postData.rating = this.postData.rating + consts.POST_RATE_VALUE;

        const res = await api.posts.removeRateById(id);

        this.isRequesting = false;

        if (res.data.error) {
          this.postData.rated.isRated = true;
          this.postData.rating = this.postData.rating - consts.POST_RATE_VALUE;

          return;
        }

        this.postData = {
          ...this.postData,
          rating: res.data.rating,
          commentCount: res.data.commentCount,
        };
      }
    },
    async downvote(id) {
      if (this.isRequesting) {
        return;
      }

      this.isRequesting = true;

      if (!this.postData.rated.isRated) {
        // Optimistic update
        this.postData.rated.isRated = true;
        this.postData.rated.negative = true;
        this.postData.rating = this.postData.rating - consts.POST_RATE_VALUE;

        const res = await api.posts.updateRateById(id, {
          negative: true,
        });

        this.isRequesting = false;

        if (res.data.error) {
          this.postData.rated.isRated = false;
          this.postData.rating = this.postData.rating + consts.POST_RATE_VALUE;

          return;
        }

        this.postData = {
          ...this.postData,
          rating: res.data.rating,
          commentCount: res.data.commentCount,
        };
      } else if (!this.postData.rated.negative) {
        // Optimistic update
        this.postData.rated.isRated = false;
        this.postData.rating = this.postData.rating - consts.POST_RATE_VALUE;

        const res = await api.posts.removeRateById(id);

        this.isRequesting = false;

        if (res.data.error) {
          this.postData.rated.isRated = true;
          this.postData.rating = this.postData.rating + consts.POST_RATE_VALUE;

          return;
        }

        this.postData = {
          ...this.postData,
          rating: res.data.rating,
          commentCount: res.data.commentCount,
        };
      }
    },
    async deletePost(id) {
      const res = await api.posts.deletePostById(id);

      if (!res.data.error) {
        this.$store.dispatch('showInfoNotification', {
          message: 'The post has been successfully deleted',
        });

        this.$router.push({ name: 'Home' });
      }
    },
    openContextMenu(ev, tag) {
      if (!this.contextMenuData.show) {
        // console.log(ev);
        // console.log(ev.target.getBoundingClientRect());
        this.contextMenuData.show = true;
        this.contextMenuData.target = tag;
        this.contextMenuData.x = ev.layerX;
        this.contextMenuData.y = ev.layerY;
      }
    },
    closeContextMenu() {
      if (this.contextMenuData.show) {
        this.contextMenuData.show = false;
      }
    },
    // context menu options
    async followTag(tag) {
      this.closeContextMenu();
      const res = await api.tags.follow(tag);
      if (!res.data.error) {
        this.$store.dispatch('showInfoNotification', {
          message: "You're now following this tag!",
        });

        this.$store.commit('followTag', tag);
      }
    },
    async unfollowTag(tag) {
      this.closeContextMenu();

      const res = await api.tags.unfollow(tag);

      if (!res.data.error) {
        this.$store.dispatch('showInfoNotification', {
          message: 'This tag was successfully unfollowed!',
        });

        this.$store.commit('unfollowTag', tag);
      }
    },
    searchTag(tag) {
      this.$router.push({
        name: 'Search',
        query: {
          tags: [tag],
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/styles/mixins';

.post {
  display: flex;
  flex-flow: row nowrap;

  &__left {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 10%;

    @include for-size(phone-only) {
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

      @include for-size(phone-only) {
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
    @include flex-row;

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
    @include widget;

    width: 90%;
    color: var(--color-main-text);

    @include for-size(phone-only) {
      width: 100%;
      border: none;
      border-radius: 0;
    }
  }

  &__rate-mobile {
    display: none;

    @include for-size(phone-only) {
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

    @include for-size(phone-only) {
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
    @include for-size(phone-only) {
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

    @include for-size(phone-only) {
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
