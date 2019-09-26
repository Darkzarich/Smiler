<template>
  <div>
    <div class="post-container">
      <post :post="post"/>
    </div>

    <comments
      v-if="!commentsLoading"
      :data="comments"
      :indent-level="0"
    />
  </div>
</template>

<script>
import Post from '@/components/Post/Post.vue';
import Comments from '@/components/Comment/Comments.vue';

import api from '@/api'

import consts from '@/const/const';

export default {
  data() {
    return {
      post: {},
      comments: [],
      commentsLoading: false,
    }
  },
  components: {
    Post,
    Comments,
  },
  async beforeRouteEnter( to, from, next) {
    const post = await api.posts.getPostBySlug(to.params.slug);

    if (post.data.error) {
      next({
        name: '404'
      })
    } else {
      next( vm => vm.setPost(post.data) );
    }
  },
  methods: {
    async setPost(post) {
      this.post = post;

      // comments

      this.loading = true;

      const res = await api.comments.getComments({
        limit: consts.COMMENTS_INITIAL_COUNT,
        post: post.id,
      });

      this.comments = res.data;
      console.log('!')
      this.loading = false;
    }
  }
};
</script>

<style lang="scss">

</style>
