<template>
  <div>
    <div v-if="!loading" class="post-container">
     <div
        v-for="post in posts"
        :key="post.id"
      >
        <post :post="post"/>
      </div>
    </div>
    <div v-else class="loading">
      Loading...
    </div>
  </div>
</template>

<script>
import Post from '@/components/Post/Post.vue';
import api from '@/api'

import consts from '@/const/const';

export default {
  data() {
    return {
      posts: [],
      loading: false,
    }
  },
  components: {
    Post,
  },
  async created() {
    this.loading = true;

    const res = await api.posts.getPosts({
      limit: consts.POSTS_INITIAL_COUNT,
    });

    this.posts = res.data.posts;

    this.loading = false;
  }
};
</script>

<style lang="scss">

</style>
