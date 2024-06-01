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

      <div class="post__rating">
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
      <RouterLink
        class="post__title"
        tag="a"
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
      </RouterLink>

      <div v-if="postData.tags.length > 0" class="post__tags">
        <div
          v-for="tag in postData.tags"
          :key="tag"
          :data-testid="`post-${postData.id}-tag-${tag}`"
          class="post__tags-item"
          @click="openContextMenu($event, tag)"
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

    <BaseContextMenuWrapper
      v-click-outside="closeContextMenu"
      :show="contextMenuData.show"
      :pos-x="contextMenuData.x"
      :pos-y="contextMenuData.y"
      :list="contextMenuData.list"
      :target="contextMenuData.target"
      :filter="contextMenuData.filter"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import api from '@/api/index';
import consts from '@/const/const';
import BaseContextMenuWrapper from '@common/BaseContextMenuWrapper.vue';
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
    BaseContextMenuWrapper,
    IconPlus,
  },
  props: ['post', 'canEdit'],
  data() {
    return {
      postData: this.post,
      loadingRate: false,
      POST_SECTION_TYPES: consts.POST_SECTION_TYPES,
      contextMenuData: {
        show: false,
        x: 0,
        y: 0,
        target: null,
        list: [
          {
            title: 'Search tag',
            callback: this.searchTag,
          },
          {
            title: 'Follow tag',
            callback: this.followTag,
          },
          {
            title: 'Unfollow tag',
            callback: this.unfollowTag,
          },
        ],
        /* filter callback for context menu, 
        it decides what elements to show under conditions */
        filter: (item) => {
          if (item.title === 'Follow tag' || item.title === 'Unfollow tag') {
            if (!this.isUserAuth) {
              return false;
            }
            const foundTag =
              this.$store.getters.isTagFollowed[this.contextMenuData.target];

            if (foundTag && item.title === 'Unfollow tag') {
              return true;
            }
            if (item.title === 'Follow tag' && !foundTag) {
              return true;
            }
            return false;
          }
          return true;
        },
      },
    };
  },
  computed: {
    ...mapGetters(['isUserAuth']),
  },
  methods: {
    async upvote(id) {
      if (!this.loadingRate) {
        this.loadingRate = true;

        if (!this.postData.rated.isRated) {
          this.postData.rated.isRated = true;
          this.postData.rated.negative = false;
          this.postData.rating = this.postData.rating + consts.POST_RATE_VALUE;

          const res = await api.posts.updateRateById(id, {
            negative: false,
          });

          if (res.data.error) {
            this.postData.rated.isRated = false;
            this.postData.rating =
              this.postData.rating - consts.POST_RATE_VALUE;
          }
        } else if (this.postData.rated.negative) {
          this.postData.rated.isRated = false;
          this.postData.rating = this.postData.rating + consts.POST_RATE_VALUE;
          const res = await api.posts.removeRateById(id);

          if (res.data.error) {
            this.postData.rated.isRated = true;
            this.postData.rating =
              this.postData.rating - consts.POST_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
    async downvote(id) {
      if (!this.loadingRate) {
        this.loadingRate = true;

        if (!this.postData.rated.isRated) {
          this.postData.rated.isRated = true;
          this.postData.rated.negative = true;
          this.postData.rating = this.postData.rating - consts.POST_RATE_VALUE;

          const res = await api.posts.updateRateById(id, {
            negative: true,
          });

          if (res.data.error) {
            this.postData.rated.isRated = false;
            this.postData.rating =
              this.postData.rating + consts.POST_RATE_VALUE;
          }
        } else if (!this.postData.rated.negative) {
          this.postData.rated.isRated = false;
          this.postData.rating = this.postData.rating - consts.POST_RATE_VALUE;

          const res = await api.posts.removeRateById(id);

          if (res.data.error) {
            this.postData.rated.isRated = true;
            this.postData.rating =
              this.postData.rating + consts.POST_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
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
        ev.preventDefault();
        ev.stopPropagation();
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
@import '@/styles/variables';
@import '@/styles/mixins';
@import '@/styles/colors';

.post {
  display: flex;
  flex-flow: row nowrap;
  margin-bottom: $widget-margin;

  &__left {
    width: 10%;
    display: flex;
    flex-direction: column;
    align-items: center;

    @include for-size(phone-only) {
      display: none;
    }
  }

  &__rating {
    font-size: 20px;
    margin-bottom: -1rem;
    margin-top: -1rem;
  }

  &__title {
    display: block;
    color: $light-gray;
    text-decoration: none;
    margin-bottom: 1rem;
    font-weight: 400;
    font-size: 20px;

    svg {
      position: relative;
      top: 3px;
      fill: $light-gray;
    }
  }

  &__upvote,
  &__rating,
  &__downvote {
    color: $light-gray;

    svg {
      fill: $light-gray;
      width: 5rem;

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
        fill: $dark-red;
      }
    }
  }

  &__upvote {
    &--active,
    &:hover {
      /* stylelint-disable-next-line no-descending-specificity */
      svg {
        cursor: pointer;
        fill: $dark-firm;
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
    color: $firm;
    font-weight: bold;
    background: transparent;
    font-size: 0.8rem;
    font-family: monospace;
    user-select: none;
    cursor: pointer;
    padding: 0.1rem;
    margin-right: 0.5rem;
    border-radius: 5px;
    border: 1px solid $firm;
  }

  &__main {
    background: $widget-bg;
    width: 90%;
    padding: 1rem;
    color: $main-text;
    border: 1px solid $light-gray;
    border-radius: 2px;

    @include for-size(phone-only) {
      border: none;
      border-bottom: 1px solid $light-gray;
      width: 100%;
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
      border: 1px solid $light-gray;
      padding: 0.5rem;
      padding-left: 1rem;
      display: block;
      background: $bg;
      margin-top: 0.5rem;
    }
  }

  &__section-attachment {
    display: flex;
    flex-flow: row nowrap;
    border: 1px solid $light-gray;
    margin-bottom: 1rem;
    margin-top: 1rem;

    @include for-size(phone-only) {
      margin-left: -1rem;
      border: none;
      width: 110%;
    }
  }

  &__section-image,
  &__section-video {
    width: 100%;
    height: 100%;
  }

  &__footer {
    margin-top: 1rem;

    @include for-size(phone-only) {
      margin-top: -1rem;
    }
  }

  &__meta-info {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    margin: -1rem;
    padding: 0.5rem;
    align-items: center;
    background: $bg;
    margin-top: 1rem;
    border-top: 1px solid $light-gray;

    @include for-size(phone-only) {
      border-top: none;
    }
  }

  &__comments-count {
    text-decoration: none;
    color: $light-gray;

    /* stylelint-disable-next-line no-descending-specificity */
    svg {
      fill: $main-text;
      width: 1rem;
      height: 1rem;
      margin-right: 0.2rem;
      position: relative;
      top: 2px;
    }
  }

  &__author-container {
    display: flex;
    align-items: center;
    color: $main-text;
    text-decoration: none;
  }

  &__author-login {
    border-bottom: 1px solid transparent;

    &:hover {
      border-bottom: 1px solid $main-text;
    }
  }

  &__author-avatar {
    width: 1.5rem;
    height: 1.5rem;
    margin-left: 0.5rem;
    border-radius: 50%;
    border: 1px solid $light-gray;
  }
}
</style>
