<template>
  <div class="base-text-editor u-widget">
    <div
      class="base-text-editor__style-buttons u-flex-row"
      :data-testid="dataTestid"
    >
      <button
        class="base-text-editor__style-button"
        :class="{ 'base-text-editor__style-button--active': isActive('bold') }"
        type="button"
        title="bold"
        @pointerdown.prevent="formatSelectionFromPointer('bold')"
        @click.prevent="formatSelectionFromClick('bold')"
      >
        B
      </button>

      <button
        class="base-text-editor__style-button"
        :class="{
          'base-text-editor__style-button--active': isActive('italic'),
        }"
        type="button"
        title="italic"
        @pointerdown.prevent="formatSelectionFromPointer('italic')"
        @click.prevent="formatSelectionFromClick('italic')"
      >
        I
      </button>

      <button
        class="base-text-editor__style-button"
        :class="{
          'base-text-editor__style-button--active': isActive('strike'),
        }"
        type="button"
        title="strike"
        @pointerdown.prevent="formatSelectionFromPointer('strike')"
        @click.prevent="formatSelectionFromClick('strike')"
      >
        S
      </button>

      <button
        class="base-text-editor__style-button"
        :class="{
          'base-text-editor__style-button--active': isActive('underline'),
        }"
        type="button"
        title="underline"
        @pointerdown.prevent="formatSelectionFromPointer('underline')"
        @click.prevent="formatSelectionFromClick('underline')"
      >
        U
      </button>

      <button
        class="base-text-editor__style-button"
        :class="{ 'base-text-editor__style-button--active': isActive('cite') }"
        type="button"
        title="quote"
        @pointerdown.prevent="formatSelectionFromPointer('cite')"
        @click.prevent="formatSelectionFromClick('cite')"
      >
        Q
      </button>
    </div>

    <EditorContent :editor="editor" />

    <!-- TODO: Add button name for this slot it's not obvious when its "default" -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import { Bold } from '@tiptap/extension-bold';
import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { Text } from '@tiptap/extension-text';
import { Underline } from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { watch } from 'vue';

type Format = 'bold' | 'italic' | 'strike' | 'underline' | 'cite';
type AllowedTag = 'b' | 'i' | 's' | 'u' | 'cite';

interface Props {
  dataTestid?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  dataTestid: 'input',
  id: undefined,
});

const textEditorValue = defineModel<string>({
  default: '',
});

const editorId = props.id ?? crypto.randomUUID();

let skipNextToolbarClick = false;
let isUpdatingFromEditor = false;

const allowedTags: AllowedTag[] = ['b', 'i', 's', 'u', 'cite'];

const InlineDocument = Document.extend({
  content: 'inline*',
});

const BoldTag = Bold.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'b',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});

const ItalicTag = Italic.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'i',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});

const Cite = Mark.create({
  name: 'cite',
  inclusive: false,

  parseHTML() {
    return [{ tag: 'cite' }];
  },

  renderHTML() {
    return ['cite', 0];
  },

  addKeyboardShortcuts() {
    return {
      'Mod->': () => this.editor.commands.toggleMark(this.name),
    };
  },
});

const EnterAsHardBreak = Extension.create({
  name: 'enterAsHardBreak',

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setHardBreak(),
    };
  },
});

const escapeHtml = (text: string) => {
  const div = document.createElement('div');
  div.textContent = text;

  return div.innerHTML;
};

const normalizeTag = (tagName: string): AllowedTag | null => {
  switch (tagName) {
    case 'b':
    case 'strong':
      return 'b';
    case 'i':
    case 'em':
      return 'i';
    case 's':
    case 'strike':
    case 'del':
      return 's';
    case 'u':
    case 'ins':
      return 'u';
    case 'cite':
      return 'cite';
    default:
      return null;
  }
};

const renderAllowedHtml = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'br') {
    return '<br>';
  }

  const childrenHtml = Array.from(element.childNodes)
    .map((child) => renderAllowedHtml(child))
    .join('');
  const normalizedTag = normalizeTag(tagName);

  if (normalizedTag && allowedTags.includes(normalizedTag)) {
    return `<${normalizedTag}>${childrenHtml}</${normalizedTag}>`;
  }

  if (['div', 'p', 'li', 'blockquote'].includes(tagName)) {
    return `${childrenHtml}<br>`;
  }

  return childrenHtml;
};

const sanitizeEditorHtml = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;

  return Array.from(template.content.childNodes)
    .map((node) => renderAllowedHtml(node))
    .join('')
    .replace(/(<br>){3,}/g, '<br><br>');
};

const updateModelValue = (html: string) => {
  const sanitizedHtml = sanitizeEditorHtml(html);

  isUpdatingFromEditor = true;
  textEditorValue.value = sanitizedHtml;
  queueMicrotask(() => {
    isUpdatingFromEditor = false;
  });
};

const editor = useEditor({
  content: sanitizeEditorHtml(textEditorValue.value),
  extensions: [
    InlineDocument,
    Text,
    HardBreak.configure({
      keepMarks: false,
    }),
    BoldTag,
    ItalicTag,
    Strike,
    Underline,
    Cite,
    EnterAsHardBreak,
  ],
  editorProps: {
    attributes: {
      id: editorId,
      class: 'base-text-editor__contenteditable',
      'data-testid': `${props.dataTestid}-input`,
      role: 'textbox',
      tabindex: '0',
    },
    transformPastedHTML: sanitizeEditorHtml,
    transformPastedText: (text) => escapeHtml(text).replace(/\r?\n/g, '<br>'),
  },
  onUpdate: ({ editor }) => {
    updateModelValue(editor.getHTML());
  },
});

const isActive = (format: Format) => editor.value?.isActive(format) ?? false;

const toggleFormat = (format: Format) => {
  const chain = editor.value?.chain().focus();

  if (!chain) {
    return;
  }

  switch (format) {
    case 'bold':
      chain.toggleBold().run();
      break;
    case 'italic':
      chain.toggleItalic().run();
      break;
    case 'strike':
      chain.toggleStrike().run();
      break;
    case 'underline':
      chain.toggleUnderline().run();
      break;
    case 'cite':
      chain.toggleMark('cite').run();
      break;
  }
};

const formatSelectionFromPointer = (format: Format) => {
  skipNextToolbarClick = true;
  toggleFormat(format);
};

const formatSelectionFromClick = (format: Format) => {
  if (skipNextToolbarClick) {
    skipNextToolbarClick = false;

    return;
  }

  toggleFormat(format);
};

watch(textEditorValue, (value) => {
  if (isUpdatingFromEditor || !editor.value) {
    return;
  }

  const sanitizedHtml = sanitizeEditorHtml(value);

  if (sanitizedHtml !== editor.value.getHTML()) {
    editor.value.commands.setContent(sanitizedHtml, {
      emitUpdate: false,
    });
  }

  if (sanitizedHtml !== value) {
    updateModelValue(sanitizedHtml);
  }
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.base-text-editor {
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
    background: var(--color-surface-primary);
    color: var(--color-text-primary);
    font-family: monospace;
    font-weight: bold;
    cursor: pointer;

    &:hover,
    &--active {
      background: var(--color-surface-secondary);
    }
  }

  &__contenteditable {
    width: 100%;
    height: 100%;
    min-height: 240px;
    padding: 16px;
    outline: var(--color-primary);
    border: 1px solid var(--color-text-secondary);
    border-radius: 8px;
    background: var(--color-surface-primary);
    color: var(--color-text-primary);
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
      border: var(--color-gray-500) solid 1px;
      background-color: var(--color-surface-secondary);
    }

    @include mixins.for-size(phone-only) {
      min-height: 9rem;
      border-right: none;
      border-left: none;
    }
  }
}
</style>
