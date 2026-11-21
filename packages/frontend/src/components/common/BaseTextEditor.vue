<template>
  <AsyncTextEditor
    :id="id"
    v-model="textEditorValue"
    :data-testid="dataTestid"
    :features="features"
    :placeholder="placeholder"
    :focus-on-mount="focusOnMount"
  >
    <slot />
  </AsyncTextEditor>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { loadBaseTiptapTextEditor } from './base-tiptap-text-editor-loader';
import { TextEditorFeatures } from './text-editor-features';

interface Props {
  dataTestid?: string;
  features?: TextEditorFeatures;
  id?: string;
  placeholder?: string;
  focusOnMount?: boolean;
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'input',
  features: TextEditorFeatures.Comment,
  id: undefined,
  placeholder: '',
  focusOnMount: false,
});

const textEditorValue = defineModel<string>({
  default: '',
});

const AsyncTextEditor = defineAsyncComponent(loadBaseTiptapTextEditor);
</script>
