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
        @click="removeStyles()"
      >
        REMOVE STYLES
      </button>
    </div>

    <div
      :id="id"
      :ref="'text-editor#' + id"
      class="base-text-editor__contenteditable"
      :data-testid="`${dataTestid}-input`"
      role="textbox"
      tabIndex="0"
      contenteditable
      @selectstart="selecting = true"
      @mouseup="endSelect()"
      @focusout="setText()"
      v-html="value"
    />

    <!-- TODO: Add button name for this slot it's not obvious when its "default" -->
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    dataTestid: {
      type: String,
      default: 'text-editor-container',
    },
    id: {
      type: String,
      default: 'text-editor',
    },
    value: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      curSelection: '',
      selectedDOMElement: null,
      anchorOffset: 0,
      focusOffset: 0,
      editedText: '',
      selecting: true,
      tags: ['b', 'i', 's', 'u', 'cite'],
    };
  },
  computed: {
    curSelectionComp() {
      return document.getSelection().anchorOffset;
    },
  },
  created() {
    document.execCommand('defaultParagraphSeparator', false, 'br');
  },
  methods: {
    removeStyles() {
      let text = this.value;

      this.tags.forEach((tag) => {
        text = text.replace(new RegExp(`((</${tag}>)|(<${tag}>))*`, 'g'), '');
      });

      this.$emit('input', text);
    },
    endSelect() {
      const text = this.$refs[`text-editor#${this.id}`].innerHTML;
      const selection = document.getSelection();

      if (this.selecting) {
        if (selection.toString().replace(/\n/g, '<br>')) {
          this.curSelection = selection.toString().replace(/\n/g, '<br>');
          this.selectedDOMElement = selection.anchorNode;
          // selection start index
          this.anchorOffset =
            selection.anchorOffset < selection.focusOffset
              ? selection.anchorOffset
              : selection.focusOffset;
          // selection end index
          this.focusOffset =
            selection.anchorOffset < selection.focusOffset
              ? selection.focusOffset
              : selection.anchorOffset;
        }

        console.log('curSelection / ', this.curSelection);

        console.log('curSelection obj / ', selection);

        this.selecting = false;

        console.log('text: ', text);

        // text.replace(/<\/div>/g, '<br>')

        let replacedDivText = text;

        if (text.match(/<div>(\d*|\w*|\s*)*((<br>)+)<\/div>/)) {
          replacedDivText = text.replace(
            text.match(/<div>(\d*|\w*|\s*)*((<br>)+)<\/div>/)[2],
            '',
          );
          console.log(
            'replace1: ',
            text.replace(
              text.match(/<div>(\d*|\w*|\s*)*((<br>)+)<\/div>/)[2],
              '',
            ),
          );
        }

        console.log('replace2: ', replacedDivText.replace(/<\/div>/g, ''));
        replacedDivText = replacedDivText.replace(/<\/div>/g, '');

        console.log(
          'replace3: ',
          replacedDivText
            .replace(/<div>/g, '<br>')
            .replace(/(<br>){2,}/g, '<br>'),
        );
        replacedDivText = replacedDivText
          .replace(/<div>/g, '<br>')
          .replace(/(<br>){2,}/g, '<br>');

        this.editedText = replacedDivText;
      }
    },
    setText() {
      this.selecting = true;
      this.endSelect();
      console.log('set text!');
      this.$emit('input', this.editedText);
    },
    styleSelected(tag) {
      console.log('styleSelected curSelection: ', this.curSelection.trim());
      console.log('DOM Ele: ', this.selectedDOMElement);
      console.log('beforeChange ', this.value);

      if (this.curSelection.trim().length > 0) {
        // replace curSelection text with that text inside tags
        this.selectedDOMElement.textContent =
          `${this.selectedDOMElement.wholeText.slice(0, this.anchorOffset)}` +
          `<${tag}>${this.curSelection.toString().trim()}</${tag}>` +
          `${this.selectedDOMElement.wholeText.slice(this.focusOffset, this.selectedDOMElement.wholeText.length)}`;

        let DOMHTML = document.getElementById(this.id).innerHTML;

        /* replace all &lt; and &gt; with < and > because it gets transformed 
        to those automatically */
        DOMHTML = DOMHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        document.getElementById(this.id).innerHTML = DOMHTML;

        /* TODO: clear the style when a tab button is clicked 
        and selection was already styled <b> some text </b> ----> <b></b> 
        some text <b></b> and then clean empty tags 
        */

        this.$emit('input', document.getElementById(this.id).innerHTML);
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.base-text-editor {
  width: 100%;
  padding: 1rem;
  border: 1px solid $light-gray;

  @include for-size(phone-only) {
    padding-right: 0;
    padding-left: 0;
    border-right: 1px solid transparent;
    border-left: 1px solid transparent;
  }

  &__style-buttons {
    @include flex-row;

    gap: 8px;
    margin-bottom: 1rem;

    @include for-size(phone-only) {
      margin-left: 1rem;
    }
  }

  &__style-button {
    min-width: 22px;
    min-height: 22px;
    outline: none;
    border: 1px solid $firm;
    border-radius: 3px;
    background: $bg;
    color: $main-text;
    font-family: monospace;
    font-weight: bold;
    cursor: pointer;

    &:hover {
      background: $widget-bg;
    }
  }

  &__contenteditable {
    width: 100%;
    height: 100%;
    min-height: 240px;
    padding: 16px;
    outline: $firm;
    border: 1px solid $light-gray;
    border-radius: 3px;
    background: $bg;
    color: $main-text;
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
      border: $gray solid 1px;
      background-color: $widget-bg;
    }

    @include for-size(phone-only) {
      min-height: 9rem;
      border-right: none;
      border-left: none;
    }
  }
}
</style>
