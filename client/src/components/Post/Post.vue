<template>
  <div class="post-container__item">
    <div class="post-side">
      <div class="post-side__upvote">
        +
      </div>
      <div class="post-side__rating">
        {{ post.rating }}
      </div>
      <div class="post-side__downvote">
        -
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

export default {
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
    color: #fff;
    border: 1px solid $light-gray;
    border-radius: 2px;

    a {
      color: $light-gray;
      text-decoration: none;
      div {
        margin-bottom: 1rem;
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
  }
}

</style>
