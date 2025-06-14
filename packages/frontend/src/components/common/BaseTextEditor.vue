<template>
  <div class="base-text-editor">
    <div class="base-text-editor__style-buttons" :data-testid="dataTestid">
      <button
        class="base-text-editor__style-button"
        type="button"
        title="bold"
        @click="styleSelected('b')"
      >
        B
      </button>

      <button
        class="base-text-editor__style-button"
        type="button"
        title="italic"
        @click="styleSelected('i')"
      >
        I
      </button>

      <button
        class="base-text-editor__style-button"
        type="button"
        title="strike"
        @click="styleSelected('s')"
      >
        S
      </button>

      <button
        class="base-text-editor__style-button"
        type="button"
        title="underline"
        @click="styleSelected('u')"
      >
        U
      </button>

      <button
        class="base-text-editor__style-button"
        type="button"
        title="quote"
        @click="styleSelected('cite')"
      >
        Q
      </button>

      <button
        class="base-text-editor__style-button"
        type="button"
        title="remove styles"
        @click="removeStyles"
      >
        REMOVE STYLES
      </button>
    </div>

    <div
      :id="id"
      ref="editorRef"
      class="base-text-editor__contenteditable"
      :data-testid="`${dataTestid}-input`"
      role="textbox"
      tabIndex="0"
      contenteditable
      @selectstart="isSelecting = true"
      @mouseup="endSelect()"
      @focusout="setText()"
      v-html="textEditorValue"
    />

    <!-- TODO: Add button name for this slot it's not obvious when its "default" -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

type Tag = 'b' | 'i' | 's' | 'u' | 'cite';

interface Props {
  dataTestid?: string;
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'input',
});

const textEditorValue = defineModel<string>({
  default: '',
});

const id = crypto.randomUUID();

const editorRef = ref<HTMLDivElement | null>(null);

const tags: Tag[] = ['b', 'i', 's', 'u', 'cite'];

const selectedDOMElement = ref<Text | null>(null);

const curSelection = ref('');
const anchorOffset = ref(0);
const focusOffset = ref(0);
const editedText = ref('');
const isSelecting = ref(true);

const removeStyles = () => {
  let text = textEditorValue.value;

  tags.forEach((tag) => {
    text = text.replace(new RegExp(`((</${tag}>)|(<${tag}>))*`, 'g'), '');
  });

  textEditorValue.value = text;
};

const endSelect = () => {
  if (!editorRef.value) {
    return;
  }

  const text = editorRef.value.innerHTML;
  const selection = document.getSelection();

  if (isSelecting.value && selection) {
    if (selection.toString().replace(/\n/g, '<br>')) {
      curSelection.value = selection.toString().replace(/\n/g, '<br>');
      selectedDOMElement.value = selection.anchorNode as Text;
      // selection start index
      anchorOffset.value =
        selection.anchorOffset < selection.focusOffset
          ? selection.anchorOffset
          : selection.focusOffset;
      // selection end index
      focusOffset.value =
        selection.anchorOffset < selection.focusOffset
          ? selection.focusOffset
          : selection.anchorOffset;
    }

    console.log('curSelection / ', curSelection.value);

    console.log('curSelection obj / ', selection);

    isSelecting.value = false;

    console.log('text: ', text);

    // text.replace(/<\/div>/g, '<br>')

    let replacedDivText = text;

    const textMatch = text.match(/<div>(\d*|\w*|\s*)*((<br>)+)<\/div>/);

    if (textMatch) {
      replacedDivText = text.replace(textMatch[2], '');

      console.log('replace1: ', text.replace(textMatch[2], ''));
    }

    console.log('replace2: ', replacedDivText.replace(/<\/div>/g, ''));

    replacedDivText = replacedDivText.replace(/<\/div>/g, '');

    console.log(
      'replace3: ',
      replacedDivText.replace(/<div>/g, '<br>').replace(/(<br>){2,}/g, '<br>'),
    );
    replacedDivText = replacedDivText
      .replace(/<div>/g, '<br>')
      .replace(/(<br>){2,}/g, '<br>');

    editedText.value = replacedDivText;
  }
};

const setText = () => {
  isSelecting.value = true;

  endSelect();

  console.log('set text!');

  textEditorValue.value = editedText.value;
};

const styleSelected = (tag: Tag) => {
  console.log('styleSelected curSelection: ', curSelection.value.trim());
  console.log('DOM Ele: ', selectedDOMElement.value);
  console.log('beforeChange ', textEditorValue.value);

  if (curSelection.value.trim().length > 0 && selectedDOMElement.value) {
    // replace curSelection text with that text inside tags
    selectedDOMElement.value.textContent =
      `${selectedDOMElement.value.wholeText.slice(0, anchorOffset.value)}` +
      `<${tag}>${curSelection.value.toString().trim()}</${tag}>` +
      `${selectedDOMElement.value.wholeText.slice(focusOffset.value, selectedDOMElement.value.wholeText.length)}`;

    let editorInnerHTML = editorRef.value!.innerHTML;

    /* replace all &lt; and &gt; with < and > because it gets transformed
        to those automatically */
    editorInnerHTML = editorInnerHTML
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    textEditorValue.value = editorInnerHTML;

    /* TODO: clear the style when a tab button is clicked
      and selection was already styled <b> some text </b> ----> <b></b>
      some text <b></b> and then clean empty tags
    */
  }
};

onMounted(() => {
  document.execCommand('defaultParagraphSeparator', false, 'br');
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.base-text-editor {
  @include mixins.widget;

  width: 100%;
  padding: 1rem;
  transition: border 200ms ease-out;

  @include mixins.for-size(phone-only) {
    padding-right: 0;
    padding-left: 0;
    border-right: 1px solid transparent;
    border-left: 1px solid transparent;
  }

  &__style-buttons {
    @include mixins.flex-row;

    gap: 8px;
    margin-bottom: 1rem;

    @include mixins.for-size(phone-only) {
      margin-left: 1rem;
    }
  }

  &__style-button {
    min-width: 22px;
    min-height: 22px;
    outline: none;
    border: 1px solid var(--color-primary);
    border-radius: 3px;
    background: var(--color-bg);
    color: var(--color-main-text);
    font-family: monospace;
    font-weight: bold;
    cursor: pointer;

    &:hover {
      background: var(--color-widget-bg);
    }
  }

  &__contenteditable {
    width: 100%;
    height: 100%;
    min-height: 240px;
    padding: 16px;
    outline: var(--color-primary);
    border: 1px solid var(--color-gray-light);
    border-radius: 8px;
    background: var(--color-bg);
    color: var(--color-main-text);
    cursor: text;

    br {
      display: block;
      margin-bottom: 1rem;
      content: '';
    }

    cite {
      display: block;
      margin-top: 8px;
      margin-bottom: 8px;
      padding: 16px;
      border: var(--color-gray) solid 1px;
      background-color: var(--color-widget-bg);
    }

    @include mixins.for-size(phone-only) {
      min-height: 9rem;
      border-right: none;
      border-left: none;
    }
  }
}
</style>
