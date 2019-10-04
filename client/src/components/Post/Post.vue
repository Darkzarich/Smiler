<template>
  <div class="post-container__item">
    <div class="post-side">
      <div
        class="post-side__upvote"
        @click="upvote(postData.id)"
        :class="postData.rated.isRated && !postData.rated.negative ? 'post-side__upvote_active' : ''">
        <plus-icon/>
      </div>
      <div class="post-side__rating">
        {{ postData.rating }}
      </div>
      <div
        class="post-side__downvote"
        @click="downvote(postData.id)"
        :class="postData.rated.isRated && postData.rated.negative ? 'post-side__downvote_active' : ''">
        <minus-icon/>
      </div>
    </div>
    <div class="post-main">
      <router-link
        :to="{
          name: 'Single',
          params: {
            slug: postData.slug
          }
        }"
        target="_blank"
      >
        <div class="post-main__title">
          {{ postData.title }}
        </div>
      </router-link>
      <div class="post-main__body">
        <div
        class="post-main__body-section"
        v-for="section in postData.sections"
        :key="section.hash">
          <template v-if="section.type === POST_SECTION_TYPES.TEXT">
            <div v-html="section.content"/>
          </template>
          <template v-else-if="section.type === POST_SECTION_TYPES.PICTURE">
            <div class="post-main__attachments-item">
              <img @error="$resolveImageError" :src="$resolveImage(section.url)">
            </div>
          </template>
          <template v-else-if="section.type === POST_SECTION_TYPES.VIDEO">
            <div class="post-main__attachments-item">
              <video controls :src="section.url"></video>
            </div>
          </template>
        </div>
      </div>
      <div class="post-main__footer">
        <div class="post-main__meta">
          <span class="post-main__meta-date">
            {{ postData.createdAt | $fromNow }}
          </span>
          <span class="post-main__meta-comments">
            <router-link
            target="_blank"
            :to="{
              path: postData.slug,
              hash: 'comments'
            }">
              <comments-icon/> {{ postData.commentCount }}
            </router-link>
          </span>
            <router-link
            target="_blank"
            :to="{
              name: 'UserPage',
              params: {
                login: postData.author.login
              },
            }">
              <span class="post-main__meta-author">
                <span> {{ postData.author.login }} </span>
                <img :src="$resolveAvatar(postData.author.avatar)">
              </span>
            </router-link>
        </div>
        <!-- {{ post.createdAt !== post.updatedAt ? 'updated: ' + post.updatedAt : ''}} -->
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api/index';

import commentsIcon from '@/library/svg/comments';
import plusIcon from '@/library/svg/plus';
import minusIcon from '@/library/svg/minus';

import consts from '@/const/const';

export default {
  components: {
    commentsIcon,
    plusIcon,
    minusIcon,
  },
  props: ['post'],
  data() {
    return {
      postData: this.post,
      loadingRate: false,
      POST_SECTION_TYPES: consts.POST_SECTION_TYPES,
    };
  },
  methods: {
    async upvote(id) {
      if (!this.loadingRate) {
        this.loadingRate = true;

        if (!this.postData.rated.isRated) {
          const res = await api.posts.updateRateById(id, {
            negative: false,
          });

          if (!res.data.error) {
            this.postData.rated.isRated = true;
            this.postData.rated.negative = false;
            this.postData.rating += consts.POST_RATE_VALUE;
          }
        } else if (this.postData.rated.negative) {
          const res = await api.posts.removeRateById(id);

          if (!res.data.error) {
            this.postData.rated.isRated = false;
            this.postData.rating += consts.POST_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
    async downvote(id) {
      if (!this.loadingRate) {
        this.loadingRate = true;

        if (!this.postData.rated.isRated) {
          const res = await api.posts.updateRateById(id, {
            negative: true,
          });

          if (!res.data.error) {
            this.postData.rated.isRated = true;
            this.postData.rated.negative = true;
            this.postData.rating -= consts.POST_RATE_VALUE;
          }
        } else if (!this.postData.rated.negative) {
          const res = await api.posts.removeRateById(id);

          if (!res.data.error) {
            this.postData.rated.isRated = false;
            this.postData.rating -= consts.POST_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/variables.scss';
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
    border-radius: 2px;

    a {
      color: $light-gray;
      text-decoration: none;
      .post-main__title {
        margin-bottom: 1rem;
        font-weight: 400;
        font-size: 20px;
      }
    }

    &__footer {
      margin-top: 1rem;
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

      &-comments {
        position: absolute;
        margin-left: 25%;
        svg {
          fill: $main-text;
          width: 1rem;
          height: 1rem;
        }
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
        display: inline-block;
      }
    }
  }

  .post-side {
    width: 10%;
    display: flex;
    flex-direction: column;
    align-items: center;

    &__upvote, &__rating, &__downvote {
      color: $light-gray;
      svg {
        fill: $light-gray;
        width: 5rem;
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
