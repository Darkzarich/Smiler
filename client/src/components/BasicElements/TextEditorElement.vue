<template>
  <div class="text-editor-container">
    <div class="text-editor-control" :data-testid="dataTestid">
      <button type="button" title="bold" @click="styleSelected('b')">B</button>
      <button type="button" title="italic" @click="styleSelected('i')">I</button>
      <button type="button" title="strike" @click="styleSelected('s')">S</button>
      <button type="button" title="underline" @click="styleSelected('u')">U</button>
      <button type="button" title="quote" @click="styleSelected('cite')">Q</button>
      <button type="button" title="remove styles" @click="removeStyles()">REMOVE STYLES</button>
    </div>
    <div
      class="text-editor"
    >
      <div
        class="text-editor__input"
        data-testid="text-editor"
        role="textbox"
        tabIndex="0"
        contenteditable
        v-html="value"
        :id="id"
        :ref="'text-editor#' + id"
        @selectstart="selecting = true"
        @mouseup="endSelect()"
        @focusout="setText()"
      />
    </div>
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
          this.anchorOffset = selection.anchorOffset < selection.focusOffset
            ? selection.anchorOffset
            : selection.focusOffset;
          // selection end index
          this.focusOffset = selection.anchorOffset < selection.focusOffset
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
          replacedDivText = text.replace(text.match(/<div>(\d*|\w*|\s*)*((<br>)+)<\/div>/)[2], '');
          console.log('replace1: ', text.replace(text.match(/<div>(\d*|\w*|\s*)*((<br>)+)<\/div>/)[2], ''));
        }

        console.log('replace2: ', replacedDivText.replace(/<\/div>/g, ''));
        replacedDivText = replacedDivText.replace(/<\/div>/g, '');

        console.log('replace3: ', replacedDivText.replace(/<div>/g, '<br>').replace(/(<br>){2,}/g, '<br>'));
        replacedDivText = replacedDivText.replace(/<div>/g, '<br>').replace(/(<br>){2,}/g, '<br>');

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
        this.selectedDOMElement.textContent = `${this.selectedDOMElement.wholeText.slice(0, this.anchorOffset)}`
        + `<${tag}>${this.curSelection.toString().trim()}</${tag}>`
        + `${this.selectedDOMElement.wholeText.slice(this.focusOffset, this.selectedDOMElement.wholeText.length)}`;

        let DOMHTML = document.getElementById(this.id).innerHTML;

        // replace all &lt; and &gt; with < and > because it gets transformed to those automatically
        DOMHTML = DOMHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        document.getElementById(this.id).innerHTML = DOMHTML;

        // TODO: clear the style when a tab button is clicked and selection was already styled
        // <b> some text </b> ----> <b></b> sometext <b></b> and then clean empty tags

        this.$emit('input', document.getElementById(this.id).innerHTML);
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.text-editor-container {
  padding: 1rem;
  border: 1px solid $light-gray;
  margin-top: 0.5rem;
}

.text-editor-control {
  padding: 1rem;
  @include flex-row();
  padding-top: 0;
  button {
    font-family: monospace;
    background: $bg;
    border: 2px solid $firm;
    margin-left: 0.5rem;
    border-radius: 3px;
    color: $main-text;
    outline: none;
    font-weight: bold;
    cursor: pointer;
    &:hover {
      background: $widget-bg;
    }
  }
}

.text-editor {
  @include input();
  @include flex-row();
  @include scroll();

  color: $main-text;
  margin-left: 1rem;
  margin-right: 1.5rem;
  height: 15rem;
  overflow-y: scroll;
  cursor: text;
  &__input {
    width: 95%;
    outline: $firm;
    br {
      margin-bottom: 1rem;
      display: block;
      content: '';
    }
    cite {
        display: block;
        padding: 1rem;
        border: solid 1px;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        background-color: $bg;
    }
  }
}

</style>
