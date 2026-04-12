<template>
  <AsyncTextEditor
    :id="id"
    v-model="textEditorValue"
    :data-testid="dataTestid"
    :features="features"
  >
    <slot />
  </AsyncTextEditor>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { TextEditorFeatures } from './text-editor-features';

interface Props {
  dataTestid?: string;
  features?: TextEditorFeatures;
  id?: string;
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'input',
  features: TextEditorFeatures.Comment,
  id: undefined,
});

const textEditorValue = defineModel<string>({
  default: '',
});

const AsyncTextEditor = defineAsyncComponent(
  () => import('./BaseTiptapTextEditor.vue'),
);
</script>
