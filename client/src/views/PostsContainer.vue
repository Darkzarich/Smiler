<template>
  <div>
    <div v-if="!loading || posts.length > 0" class="post-container" v-scroll="handleScroll">
     <div
        v-for="post in posts"
        :key="post.id"
      >
        <post
          :post="post"
          :can-edit="$postCanEdit(post)"
        />
      </div>
      <div
        v-if="posts.length == 0"
        class="post-container__no-post"
      >
        We're sorry. No posts for this time yet.
      </div>
    </div>
    <div v-if="loading" class="post-loading">
      <loader/>
    </div>
    <div
      v-else-if="noMorePost"
      class="post-container__no-more"
    >
      Congratulations! You've read everything available. Thanks! Please, come later time to see more!
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Post from '@/components/Post/Post.vue';
import api from '@/api';

import loader from '@/library/svg/animation/circularLoader';

import consts from '@/const/const';

export default {
  data() {
    return {
      posts: [],
      loading: false,
      curPage: 0,
      noMorePost: false,
    };
  },
  components: {
    Post,
    loader,
  },
  created() {
    this.getPosts(this.curPage);
  },
  methods: {
    // add decides if concat of arrays is used
    async getPosts(add) {
      this.loading = true;

      const res = await api.posts.getPosts({
        limit: consts.POSTS_INITIAL_COUNT,
        offset: 0 + (this.curPage * consts.POSTS_INITIAL_COUNT),
      });

      if (!res.data.error) {
        if (add) {
          if (res.data.posts.length === 0) {
            this.noMorePost = true;
          } else {
            this.posts = this.posts.concat(res.data.posts);
          }
        } else {
          this.posts = res.data.posts;
          if (res.data.pages === 1) {
            this.noMorePost = true;
          }
        }
      }

      this.loading = false;
    },
    handleScroll(evt, el) {
      if (!this.loading && !this.noMorePost) {
        const curContainerBounds = el.getBoundingClientRect();
        if (curContainerBounds.height - Math.abs(curContainerBounds.y) < window.innerHeight) {
          this.curPage = this.curPage + 1;
          this.getPosts(true);
        }
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';
@import '@/styles/colors';

  .post-loading {
    @include widget();
    @include flex-row();
    justify-content: center;
    margin-left: 10%;
  }
  .post-container {
    &__no-post, &__no-more {
      @include widget;
      color: $main-text;
      display: flex;
      justify-content: center;
      font-size: 1.3rem;
    }
    &__no-more {
      margin-left: 10%;
      text-align: center;
      justify-content: none;
    }
  }
</style>
