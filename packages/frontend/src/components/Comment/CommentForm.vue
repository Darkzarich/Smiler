<template>
  <div class="comment-form">
    <BaseTextEditor
      :model-value="modelValue"
      :data-testid="dataTestid"
      @update:model-value="modelValue = $event"
    >
      <div class="comment-form__actions u-flex-row">
        <BaseButton
          class="comment-form__action-btn"
          :loading="loading"
          :data-testid="`${dataTestid}-submit-btn`"
          type="primary"
          @click="$emit('submit')"
        >
          {{ submitLabel }}
        </BaseButton>

        <BaseButton
          class="comment-form__action-btn"
          :data-testid="`${dataTestid}-close-btn`"
          @click="$emit('close')"
        >
          {{ closeLabel }}
        </BaseButton>
      </div>
    </BaseTextEditor>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@common/BaseButton.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';

defineEmits<{
  submit: [];
  close: [];
}>();

interface Props {
  dataTestid?: string;
  loading?: boolean;
  submitLabel?: string;
  closeLabel?: string;
}

withDefaults(defineProps<Props>(), {
  dataTestid: '',
  loading: false,
  submitLabel: 'Send',
  closeLabel: 'Close',
});

const modelValue = defineModel<string>({
  default: '',
});
</script>

<style>
.comment-form {
  &__actions {
    gap: 16px;
    margin-top: 20px;
  }

  &__action-btn {
    width: 140px;
  }

  .base-text-editor__contenteditable {
    min-height: 6rem;
  }
}
</style>
