<template>
  <div v-if="show" class="post-create">
    <h1 class="post-create__header" data-testid="post-create-header">
      {{ isEdit ? 'Edit' : 'Make' }} Post
    </h1>
    <PostEditor :key="key" :is-edit="isEdit" :post="post" />
  </div>
</template>

<script lang="ts">
import { mapActions, mapState } from 'pinia';
import { defineComponent } from 'vue';
import { api } from '@/api';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import { checkCanEditPost } from '@/utils/check-can-edit-post';
import PostEditor from '@components/PostEditor/PostEditor.vue';

export default defineComponent({
  components: {
    PostEditor,
  },
  async beforeRouteEnter(to, from, next) {
    if (to.meta.mode === 'edit') {
      try {
        const data = await api.posts.getPostBySlug(to.params.slug as string);

        next((vm) => vm.setPost(data));
      } catch {
        next({
          name: 'NotFound',
        });
      }
    } else {
      next((vm) => vm.showEditor());
    }
  },
  data() {
    return {
      isEdit: false,
      post: null,
      show: false,
      key: '',
    };
  },
  computed: {
    ...mapState(useUserStore, {
      userId: (state) => state.user?.id,
    }),
  },
  methods: {
    ...mapActions(useNotificationsStore, ['showErrorNotification']),
    checkCanEditPost,
    showEditor() {
      this.post = null;
      this.isEdit = false;
      this.show = true;
      this.key = '';
    },
    setPost(data) {
      this.show = false;
      this.key = 'edit';

      if (data.author.id !== this.userId) {
        this.showErrorNotification({
          message: "Only post's author can edit this post",
        });

        this.$router.push({
          name: 'Home',
        });
      } else if (!this.checkCanEditPost(data, this.userId)) {
        this.showErrorNotification({
          message:
            'You cannot edit this post anymore. The time allowed to edit has expired',
        });

        this.$router.push({
          name: 'Home',
        });
      } else {
        this.post = data;
        this.isEdit = true;
        this.show = true;
      }
    },
  },
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.post-create {
  @include mixins.widget;
  @include mixins.flex-col;

  @include mixins.for-size(phone-only) {
    padding-right: 0;
    padding-left: 0;
    border: none;
    border-radius: 0;
  }

  &__header {
    margin-bottom: 16px;
    color: var(--color-main-text);
    font-size: 1.5rem;
    align-self: center;
    font-weight: 500;
  }
}
</style>
