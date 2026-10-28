<template>
  <div class="base-text-editor u-widget">
    <div
      class="base-text-editor__toolbar"
      role="group"
      aria-label="Formatting"
      :data-testid="dataTestid"
    >
      <div
        v-for="(group, index) in toolGroups"
        :key="index"
        class="base-text-editor__tool-group"
      >
        <BaseIconButton
          v-for="tool in group"
          :key="tool.format"
          :label="tool.label"
          :shortcut="tool.shortcut"
          :pressed="
            tool.format === 'horizontalRule' ? undefined : isActive(tool.format)
          "
          @pointerdown.prevent.stop="formatSelectionFromPointer(tool.format)"
          @click.prevent.stop="formatSelectionFromClick(tool.format)"
        >
          <component :is="tool.icon" />
        </BaseIconButton>
      </div>
    </div>

    <EditorContent :editor="editor" />

    <!-- TODO: Add button name for this slot it's not obvious when its "default" -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { mergeAttributes, type AnyExtension } from '@tiptap/core';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Bold } from '@tiptap/extension-bold';
import { BulletList } from '@tiptap/extension-bullet-list';
import { Code } from '@tiptap/extension-code';
import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Heading, type Level } from '@tiptap/extension-heading';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Italic } from '@tiptap/extension-italic';
import { Link } from '@tiptap/extension-link';
import { ListItem } from '@tiptap/extension-list-item';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Strike } from '@tiptap/extension-strike';
import { Text } from '@tiptap/extension-text';
import { Underline } from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { type Component, watch } from 'vue';
import IconBold from '@icons/IconBold.vue';
import IconBulletedList from '@icons/IconBulletedList.vue';
import IconCode from '@icons/IconCode.vue';
import IconHeading1 from '@icons/IconHeading1.vue';
import IconHeading2 from '@icons/IconHeading2.vue';
import IconHeading3 from '@icons/IconHeading3.vue';
import IconHorizontalRule from '@icons/IconHorizontalRule.vue';
import IconItalic from '@icons/IconItalic.vue';
import IconNumberedList from '@icons/IconNumberedList.vue';
import IconQuote from '@icons/IconQuote.vue';
import IconStrikethrough from '@icons/IconStrikethrough.vue';
import IconUnderline from '@icons/IconUnderline.vue';
import BaseIconButton from './BaseIconButton.vue';
import { TextEditorFeatures } from './text-editor-features';

type InlineFormat = 'bold' | 'italic' | 'strike' | 'underline' | 'code';
type BlockFormat =
  | 'blockquote'
  | 'bulletList'
  | 'orderedList'
  | 'horizontalRule';
type HeadingFormat = `heading-${Level}`;
type Format = InlineFormat | BlockFormat | HeadingFormat;
type ActiveFormat = Exclude<Format, 'horizontalRule'>;

interface Tool {
  format: Format;
  label: string;
  icon: Component;
  /** The extension's own key binding, in its notation */
  shortcut?: string;
}

type AllowedTag =
  | 'a'
  | 'b'
  | 'blockquote'
  | 'br'
  | 'cite'
  | 'code'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'hr'
  | 'i'
  | 'li'
  | 'ol'
  | 'p'
  | 's'
  | 'u'
  | 'ul';

interface Props {
  dataTestid?: string;
  features?: TextEditorFeatures;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  dataTestid: 'input',
  features: TextEditorFeatures.Comment,
  id: undefined,
});

const textEditorValue = defineModel<string>({
  default: '',
});

const editorId = props.id ?? crypto.randomUUID();

let skipNextToolbarClick = false;
let isUpdatingFromEditor = false;

const headingLevels = [1, 2, 3, 4, 5, 6] as const;

const markTools: Tool[] = [
  { format: 'bold', label: 'Bold', icon: IconBold, shortcut: 'Mod-b' },
  { format: 'italic', label: 'Italic', icon: IconItalic, shortcut: 'Mod-i' },
  {
    format: 'underline',
    label: 'Underline',
    icon: IconUnderline,
    shortcut: 'Mod-u',
  },
  {
    format: 'strike',
    label: 'Strikethrough',
    icon: IconStrikethrough,
    shortcut: 'Mod-Shift-s',
  },
  { format: 'code', label: 'Inline code', icon: IconCode, shortcut: 'Mod-e' },
];
// h4–h6 are drawn like h3 (styles/rich-text.css), so they get no buttons. The schema keeps all six
// levels, so a post that has them survives an edit and `#### ` still makes one.
const headingTools: Tool[] = [IconHeading1, IconHeading2, IconHeading3].map(
  (icon, index) => ({
    format: `heading-${(index + 1) as Level}`,
    label: `Heading ${index + 1}`,
    icon,
    shortcut: `Mod-Alt-${index + 1}`,
  }),
);
const blockTools: Tool[] = [
  {
    format: 'blockquote',
    label: 'Quote',
    icon: IconQuote,
    shortcut: 'Mod-Shift-b',
  },
  {
    format: 'bulletList',
    label: 'Bulleted list',
    icon: IconBulletedList,
    shortcut: 'Mod-Shift-8',
  },
  {
    format: 'orderedList',
    label: 'Numbered list',
    icon: IconNumberedList,
    shortcut: 'Mod-Shift-7',
  },
];
const toolGroups: Tool[][] =
  props.features === TextEditorFeatures.Post
    ? [
        markTools,
        headingTools,
        [
          ...blockTools,
          {
            format: 'horizontalRule',
            label: 'Divider',
            icon: IconHorizontalRule,
          },
        ],
      ]
    : [markTools, blockTools];
const commonAllowedTags: AllowedTag[] = [
  'a',
  'b',
  'blockquote',
  'br',
  'cite',
  'code',
  'i',
  'li',
  'ol',
  'p',
  's',
  'u',
  'ul',
];
const postOnlyAllowedTags: AllowedTag[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
];
const allowedTags = new Set<AllowedTag>(
  props.features === TextEditorFeatures.Post
    ? [...commonAllowedTags, ...postOnlyAllowedTags]
    : commonAllowedTags,
);
const blockTags = new Set<AllowedTag>([
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'ol',
  'p',
  'ul',
]);

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

const escapeHtml = (text: string) => {
  const div = document.createElement('div');
  div.textContent = text;

  return div.innerHTML;
};

const escapeAttribute = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const isAllowedHref = (href: string) => {
  try {
    const url = new URL(href, window.location.origin);

    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const normalizeTag = (tagName: string): AllowedTag | null => {
  switch (tagName) {
    case 'a':
      return 'a';
    case 'b':
    case 'strong':
      return 'b';
    case 'blockquote':
    case 'cite':
      return 'blockquote';
    case 'br':
      return 'br';
    case 'code':
      return 'code';
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return tagName;
    case 'hr':
      return 'hr';
    case 'i':
    case 'em':
      return 'i';
    case 'li':
      return 'li';
    case 'ol':
      return 'ol';
    case 'p':
      return 'p';
    case 's':
    case 'strike':
    case 'del':
      return 's';
    case 'u':
    case 'ins':
      return 'u';
    case 'ul':
      return 'ul';
    default:
      return null;
  }
};

const hasBlockHtml = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;

  return Array.from(template.content.childNodes).some(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE &&
      blockTags.has((node as HTMLElement).tagName.toLowerCase() as AllowedTag),
  );
};

const ensureBlockHtml = (html: string) => {
  if (!html || hasBlockHtml(html)) {
    return html;
  }

  return `<p>${html}</p>`;
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
  const normalizedTag = normalizeTag(tagName);

  if (normalizedTag === 'br') {
    return '<br>';
  }

  if (normalizedTag === 'hr') {
    return allowedTags.has('hr') ? '<hr>' : '';
  }

  const childrenHtml = Array.from(element.childNodes)
    .map((child) => renderAllowedHtml(child))
    .join('');

  if (normalizedTag === 'a' && allowedTags.has('a')) {
    const href = element.getAttribute('href') ?? '';

    if (href && isAllowedHref(href)) {
      return `<a href="${escapeAttribute(
        href,
      )}" target="_blank" rel="noopener noreferrer">${childrenHtml}</a>`;
    }

    return childrenHtml;
  }

  if (normalizedTag === 'blockquote' && allowedTags.has('blockquote')) {
    return `<blockquote>${ensureBlockHtml(childrenHtml)}</blockquote>`;
  }

  if (normalizedTag === 'li' && allowedTags.has('li')) {
    return `<li>${ensureBlockHtml(childrenHtml)}</li>`;
  }

  if (normalizedTag && allowedTags.has(normalizedTag)) {
    return `<${normalizedTag}>${childrenHtml}</${normalizedTag}>`;
  }

  return childrenHtml;
};

const hasMeaningfulHtml = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const text = template.content.textContent?.replace(/\u00a0/g, ' ').trim();

  return Boolean(
    text ||
      (props.features === TextEditorFeatures.Post && html.includes('<hr')),
  );
};

const sanitizeEditorHtml = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;

  const sanitizedHtml = Array.from(template.content.childNodes)
    .map((node) => renderAllowedHtml(node))
    .join('');

  return hasMeaningfulHtml(sanitizedHtml) ? sanitizedHtml : '';
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
    Document,
    Paragraph,
    Text,
    HardBreak.configure({
      keepMarks: false,
    }),
    BoldTag,
    ItalicTag,
    Strike,
    Underline,
    Code,
    Link.configure({
      autolink: true,
      linkOnPaste: true,
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    Blockquote,
    BulletList,
    OrderedList,
    ListItem,
    ...(props.features === TextEditorFeatures.Post
      ? [
          Heading.configure({
            levels: [...headingLevels],
          }),
          HorizontalRule,
        ]
      : []),
  ] satisfies AnyExtension[],
  editorProps: {
    attributes: {
      id: editorId,
      class: 'base-text-editor__contenteditable',
      'data-testid': `${props.dataTestid}-input`,
      role: 'textbox',
      tabindex: '0',
    },
    transformPastedHTML: sanitizeEditorHtml,
  },
  onUpdate: ({ editor }) => {
    updateModelValue(editor.getHTML());
  },
});

const isActive = (format: ActiveFormat) => {
  if (format.startsWith('heading-')) {
    const level = Number(format.replace('heading-', ''));

    return editor.value?.isActive('heading', { level }) ?? false;
  }

  return editor.value?.isActive(format) ?? false;
};

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
    case 'code':
      chain.toggleCode().run();
      break;
    case 'blockquote':
      chain.toggleBlockquote().run();
      break;
    case 'bulletList':
      chain.toggleBulletList().run();
      break;
    case 'orderedList':
      chain.toggleOrderedList().run();
      break;
    case 'horizontalRule':
      if (props.features === TextEditorFeatures.Post) {
        chain.setHorizontalRule().run();
      }
      break;
    default: {
      const level = Number(format.replace('heading-', '')) as Level;

      if (
        props.features === TextEditorFeatures.Post &&
        headingLevels.includes(level)
      ) {
        chain.toggleHeading({ level }).run();
      }
    }
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

<style>
.base-text-editor {
  width: 100%;
  padding: 1rem;
  transition: border 200ms ease-out;

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-bottom: 0.75rem;
    container: formatting-toolbar / inline-size;

    /* 28px buttons with 44px touch areas 16px apart: the areas meet but never overlap */
    @media (--pointer-coarse) {
      gap: 16px;
    }
  }

  &__tool-group {
    display: flex;
    gap: 2px;

    @media (--pointer-coarse) {
      gap: 16px;

      /* A margin, not a wider gap, so that the groups can let go of it below */
      &:not(:last-child) {
        margin-inline-end: 16px;
      }

      /* Too narrow for the post editor's groups to take two rows, so the buttons flow as one list */
      @container formatting-toolbar (width < 308px) {
        display: contents;
      }
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

    p,
    blockquote,
    ul,
    ol,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 0;
      margin-bottom: 1rem;
    }

    /* The heading scale of styles/rich-text.css */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.3;
    }

    h1 {
      font-size: 1.25rem;
    }

    h2 {
      font-size: 1.125rem;
    }

    ul,
    ol {
      padding-left: 1.5rem;
    }

    code {
      padding: 0.1rem 0.25rem;
      border-radius: 4px;
      background: var(--color-surface-secondary);
      font-family: monospace;
    }

    blockquote,
    cite {
      display: block;
      margin-top: 8px;
      margin-bottom: 8px;
      margin-left: 0;
      padding: 16px;
      border-left: var(--color-gray-500) solid 3px;
      background-color: var(--color-surface-secondary);
    }

    p:last-child,
    blockquote:last-child,
    ul:last-child,
    ol:last-child,
    h1:last-child,
    h2:last-child,
    h3:last-child,
    h4:last-child,
    h5:last-child,
    h6:last-child {
      margin-bottom: 0;
    }

    hr {
      margin: 1rem 0;
      border: none;
      border-top: 1px solid var(--color-text-secondary);
    }

    a {
      color: var(--color-primary-strong);
    }

    @media (--phone-only) {
      min-height: 9rem;
    }
  }
}
</style>
