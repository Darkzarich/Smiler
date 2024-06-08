<template>
  <div v-if="show" class="post-create">
    <div class="post-create__header" data-testid="post-create-header">
      {{ edit ? 'Edit' : 'Create' }} Post
    </div>
    <PostEditor :key="key" :edit="edit" :post="post" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import api from '@/api/index';
import PostEditor from '@components/PostEditor/PostEditor.vue';

export default {
  components: {
    PostEditor,
  },
  async beforeRouteEnter(to, from, next) {
    if (to.meta.mode === 'edit') {
      const res = await api.posts.getPostBySlug(to.params.slug);

      if (res.data.error) {
        next({
          name: 'NotFound',
        });
      } else {
        next((vm) => vm.setPost(res.data));
      }
    } else {
      next((vm) => vm.showEditor());
    }
  },
  data() {
    return {
      edit: false,
      post: {},
      show: false,
      key: '',
    };
  },
  computed: {
    ...mapState({
      login: (state) => state.user.login,
    }),
  },
  methods: {
    showEditor() {
      this.post = null;
      this.edit = false;
      this.show = true;
      this.key = '';
    },
    setPost(data) {
      this.show = false;
      this.key = 'edit';

      // TODO: Check id instead
      if (data.author.login !== this.login) {
        this.$store.dispatch('showErrorNotification', {
          message: "Only post's author can edit this post",
        });
        this.$router.push({
          name: 'Home',
        });
      } else if (!this.$postCanEdit(data)) {
        this.$store.dispatch('showErrorNotification', {
          message: 'You cannot edit this post anymore. Edit time has expired',
        });
        this.$router.push({
          name: 'Home',
        });
      } else {
        this.post = data;
        this.edit = true;
        this.show = true;
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';
@import '@/styles/colors';

.post-create {
  @include widget;
  @include flex-col;

  @include for-size(phone-only) {
    padding-right: 0;
    padding-left: 0;
    border: none;
  }

  &__header {
    margin-bottom: 16px;
    color: $main-text;
    font-size: 1.5rem;
    align-self: center;
  }
}
</style>
