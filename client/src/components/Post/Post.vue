<template>
  <div class="post-container__item">
    <div class="post-side">
      <div
        class="post-side__upvote"
        @click="upvote(postData.id)"
        :class="postData.rated.isRated && !postData.rated.negative ? 'post-side__upvote_active' : ''">
        <plus-icon />
      </div>
      <div class="post-side__rating">
        {{ postData.rating }}
      </div>
      <div
        class="post-side__downvote"
        @click="downvote(postData.id)"
        :class="postData.rated.isRated && postData.rated.negative ? 'post-side__downvote_active' : ''">
        <minus-icon />
      </div>
    </div>
    <div class="post-main">
      <router-link
        :to="{
          name: 'Single',
          params: {
            slug: postData.slug,
          },
        }"
        :target="$isMobile() ? '' : '_blank'"
      >
        <div class="post-main__title">

          {{ postData.title }}
          <template v-if="canEdit">
            <router-link title="Edit post" :to="postData.slug + '/edit'">
              <edit-icon />
            </router-link>
            <span @click="deletePost(postData.id)">
              <router-link title="Delete post" :to="'/'">
                <delete-icon />
              </router-link>
            </span>
          </template>

        </div>
      </router-link>

      <div v-if="postData.tags.length > 0" class="post-main__tags">
        <div
          v-for="tag in postData.tags"
          @click="openContextMenu($event, tag)"
          :key="tag"
          class="post-main__tags-item">
          {{ tag }}
        </div>
      </div>

      <div class="post-main__body">
        <div
          class="post-main__body-section"
          v-for="section in postData.sections"
          :key="section.hash">
          <template v-if="section.type === POST_SECTION_TYPES.TEXT">
            <div v-html="section.content" />
          </template>
          <template v-else-if="section.type === POST_SECTION_TYPES.PICTURE">
            <div class="post-main__attachments-item">
              <img @error="$resolveImageError" :src="$resolveImage(section.url)" :alt="section.url">
            </div>
          </template>
          <template v-else-if="section.type === POST_SECTION_TYPES.VIDEO">
            <div class="post-main__attachments-item">
              <video controls :src="section.url" />
            </div>
          </template>
        </div>
      </div>

      <!-- for mobile -->

      <div class="post-main__rate-mobile">
        <div
          class="post-side__upvote"
          @click="upvote(postData.id)"
          :class="postData.rated.isRated && !postData.rated.negative ? 'post-side__upvote_active' : ''">
          <plus-icon />
        </div>
        <div class="post-side__rating">
          {{ postData.rating }}
        </div>
        <div
          class="post-side__downvote"
          @click="downvote(postData.id)"
          :class="postData.rated.isRated && postData.rated.negative ? 'post-side__downvote_active' : ''">
          <minus-icon />
        </div>
      </div>

      <!-- for mobile -->
      <div class="post-main__footer">
        <div class="post-main__meta">
          <span class="post-main__meta-date">
            {{ postData.createdAt | $fromNow }}
          </span>
          <span class="post-main__meta-comments">
            <router-link
              :target="$isMobile() ? '' : '_blank'"
              :to="{
                name: 'Single',
                params: {
                  slug: postData.slug,
                },
              }">
              <comments-icon /> {{ postData.commentCount }}
            </router-link>
          </span>

          <template v-if="postData.author">
            <router-link
              :target="$isMobile() ? '' : '_blank'"
              :to="{
                name: 'UserPage',
                params: {
                  login: postData.author.login,
                },
              }">
              <span class="post-main__meta-author">
                <span> {{ postData.author.login }} </span>
                <img
                  :src="$resolveAvatar(postData.author.avatar)"
                  :alt="postData.author.avatar"
                >
              </span>
            </router-link>
          </template>
          <template v-else>
            <span class="post-main__meta-author">
              <span> Anonymous </span>
              <img
                :src="$resolveAvatar('')"
                :alt="'avatar'"
              >
            </span>
          </template>

        </div>
        <!-- {{ post.createdAt !== post.updatedAt ? 'updated: ' + post.updatedAt : ''}} -->
      </div>
    </div>
    <context-menu-wrapper
      :show="contextMenuData.show"
      :posX="contextMenuData.x"
      :posY="contextMenuData.y"
      :list="contextMenuData.list"
      :target="contextMenuData.target"
      :filter="contextMenuData.filter"
      v-click-outside="closeContextMenu"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import api from '@/api/index';

import contextMenuWrapper from '@/components/BasicElements/ContextMenuWrapper';
import commentsIcon from '@/library/svg/comments';
import plusIcon from '@/library/svg/plus';
import minusIcon from '@/library/svg/minus';
import editIcon from '@/library/svg/edit';
import deleteIcon from '@/library/svg/delete';

import consts from '@/const/const';

export default {
  components: {
    commentsIcon,
    plusIcon,
    minusIcon,
    editIcon,
    contextMenuWrapper,
    deleteIcon,
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
        // filter callback for context menu, decides what elements to show under conditions
        filter: (item) => {
          if (item.title === 'Follow tag' || item.title === 'Unfollow tag') {
            if (!this.authState) {
              return false;
            }
            const foundTag = this.$store.getters.isTagFollowed[this.contextMenuData.target];

            if (foundTag && item.title === 'Unfollow tag') {
              return true;
            } if (item.title === 'Follow tag' && !foundTag) {
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
    ...mapState({
      authState: (state) => state.user.authState,
    }),
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
            this.postData.rating = this.postData.rating - consts.POST_RATE_VALUE;
          }
        } else if (this.postData.rated.negative) {
          this.postData.rated.isRated = false;
          this.postData.rating = this.postData.rating + consts.POST_RATE_VALUE;
          const res = await api.posts.removeRateById(id);

          if (res.data.error) {
            this.postData.rated.isRated = true;
            this.postData.rating = this.postData.rating - consts.POST_RATE_VALUE;
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
            this.postData.rating = this.postData.rating + consts.POST_RATE_VALUE;
          }
        } else if (!this.postData.rated.negative) {
          this.postData.rated.isRated = false;
          this.postData.rating = this.postData.rating - consts.POST_RATE_VALUE;

          const res = await api.posts.removeRateById(id);

          if (res.data.error) {
            this.postData.rated.isRated = true;
            this.postData.rating = this.postData.rating + consts.POST_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
    async deletePost(id) {
      const res = await api.posts.deletePostById(id);
      if (!res.data.error) {
        document.location.reload();
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
        this.$store.commit('followTag', tag);
      }
    },
    async unfollowTag(tag) {
      this.closeContextMenu();
      const res = await api.tags.unfollow(tag);
      if (!res.data.error) {
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

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
@import '@/styles/colors.scss';

.post-container__item {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-bottom: $widget-margin;

  .post-main {
    background: $widget-bg;
    width: 90%;
    padding: 1rem;
    color: $main-text;
    border: 1px solid $light-gray;
    @include for-size(phone-only) {
      border: none;
      border-bottom: 1px solid $light-gray;
      width: 100%;
    }
    border-radius: 2px;

    &__rate-mobile {
      display: none;
    }
    @include for-size(phone-only) {
      &__rate-mobile {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    a {
      color: $light-gray;
      text-decoration: none;
      .post-main__title {
        margin-bottom: 1rem;
        font-weight: 400;
        font-size: 20px;
        a {
          display: inline;
          svg {
            position: relative;
            top: 3px;
            fill: $light-gray;
          }
        }
      }
    }

    &__tags {
      @include flex-row;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      &-item {
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
    }

    &__footer {
      margin-top: 1rem;
      @include for-size(phone-only) {
        margin-top: -1rem;
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

    &__attachments {
      &-item {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        border: 1px solid $light-gray;
        margin-bottom: 1rem;
        margin-top: 1rem;
        img, video {
          width: 100%;
          height: 100%;
        }
        @include for-size(phone-only) {
          margin-left: -1rem;
          border: none;
          width: 110%;
        }
      }
    }

    &__meta {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
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

      &-comments {
        svg {
          fill: $main-text;
          width: 1rem;
          height: 1rem;
          margin-right: 0.2rem;
        }
      }

     > a {
       flex-basis: 33%;
       display: flex;
       justify-content: flex-end;
     }

      &-author {
        display: flex;
        align-items: center;
        color: $main-text;
        span {
          border-bottom: 1px solid transparent;
          &:hover {
            border-bottom: 1px solid $main-text;
          }
        }
        img {
          width: 2rem;
          height: 2rem;
          margin-left: 0.5rem;
          border-radius: 50%;
        }
      }
      &-date {
            flex-basis: 33%;
        display: inline-block;
      }
    }
  }

  .post-side {
    width: 10%;
    display: flex;
    flex-direction: column;
    align-items: center;
    @include for-size(phone-only) {
      display: none;
    }

    &__upvote, &__rating, &__downvote {
      color: $light-gray;
      svg {
        fill: $light-gray;
        width: 5rem;
        @include for-size(phone-only) {
          width: 3rem;
        }
      }
    }

    &__rating {
      font-size: 20px;
      margin-bottom: -1rem;
      margin-top: -1rem;
    }

    &__upvote:hover svg, &__upvote_active svg {
      cursor: pointer;
      fill: $dark-firm;
    }

    &__downvote:hover svg, &__downvote_active svg {
      cursor: pointer;
      fill: $dark-red;
    }
  }
}

</style>
