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
      <div class="post-main__meta">
        <span class="post-main__meta-author">
          {{ post.author.login }}
        </span>
      </div>
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
        {{ post.createdAt }} {{ post.createdAt !== post.updatedAt ? 'updated: ' + post.updatedAt : ''}}
      </div>
    </div>
  </div>
</template>

<script>
import config from '@/config/config'

export default {
  data () {
    return {
      STATIC_ROUTE: config.STATIC_ROUTE
    }
  },
  props: ['post'],
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/colors.scss';

.post-container__item {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-top: $widget-margin;
  margin-bottom: $widget-margin;

  .post-main {
    background: $gray;
    width: 90%;
  }

  .post-side {
    width: 10%;
  }
}

</style>
