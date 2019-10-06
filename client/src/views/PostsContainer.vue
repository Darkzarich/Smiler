<template>
  <div>
<!-- TODO: fix navigation, animation for comments, change rating with
sockets -->
    <div v-if="!loading" class="post-container">
     <div
        v-for="post in posts"
        :key="post.id"
      >
        <post
          :post="post"
          :can-edit="$postCanEdit(post)"
        />
      </div>
    </div>
    <div v-else class="post-loading">
      <loader/>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Post from '@/components/Post/Post.vue';
import api from '@/api';

import loader from '@/library/svg/animation/circularLoader'

import consts from '@/const/const';

export default {
  data() {
    return {
      posts: [],
      loading: false,
    };
  },
  components: {
    Post,
    loader,
  },
  async created() {
    this.loading = true;

    const res = await api.posts.getPosts({
      limit: consts.POSTS_INITIAL_COUNT,
    });

    this.posts = res.data.posts;

    this.loading = false;
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
  }
</style>
