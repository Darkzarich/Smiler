<template>
  <div class="post-container__item">
    <div class="post-side">
      <div class="post-side__upvote">
        <plus-icon/>
      </div>
      <div class="post-side__rating">
        {{ post.rating }}
      </div>
      <div class="post-side__downvote">
        <minus-icon/>
      </div>
    </div>
    <div class="post-main">
      <router-link :to="post.slug">
        <div class="post-main__title">
          {{ post.title }}
        </div>
      </router-link>
      <div class="post-main__body">
        {{ post.body }}
      </div>
      <div class="post-main__attachments">
        <div
          class="post-main__attachments-item"
          v-for="upload in post.uploads"
          :key="upload"
        >
          <img :src="STATIC_ROUTE + upload">
        </div>
      </div>
      <div class="post-main__footer">
        <div class="post-main__meta">
          <span class="post-main__meta-date">
            {{ post.createdAt | fromNow }}
          </span>
          <span class="post-main__meta-comments">
            <router-link 
            :to="{
              path: post.slug,
              hash: 'comments'
            }"> 
              <comments-icon/> {{ post.commentCount }}
            </router-link>
          </span>
          <span class="post-main__meta-author">
            {{ post.author.login }}
            <img :src="post.author.avatar">
          </span>
        </div>
        <!-- {{ post.createdAt !== post.updatedAt ? 'updated: ' + post.updatedAt : ''}} -->
      </div>
    </div>
  </div>
</template>

<script>
import config from '@/config/config';
import moment from 'moment';

import commentsIcon from '@/library/svg/comments';
import plusIcon from '@/library/svg/plus';
import minusIcon from '@/library/svg/minus';

export default {
  components: {
    commentsIcon,
    plusIcon,
    minusIcon
  },
  data () {
    return {
      STATIC_ROUTE: config.STATIC_ROUTE
    }
  },
  props: ['post'],
  filters: {
    fromNow: function (date) {
      return moment(date).fromNow();
    }
  }
}
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

    &__meta {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: space-between;
      margin: -1rem;
      padding: 1rem;
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
        display: inline-block;
        img {
          width: 1rem;
          height: 1rem;
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
