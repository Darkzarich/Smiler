<template>
  <div class="text-editor-container">
    <div class="text-editor-control">
      <button title="bold" @click="styleSelected('b')">B</button>
      <button title="italic" @click="styleSelected('i')">I</button>
      <button title="strike" @click="styleSelected('s')">S</button>
      <button title="underline" @click="styleSelected('u')">U</button>
      <button title="quote" @click="styleSelected('cite')">Q</button>
    </div>
    <div
      class="text-editor"
    >
      <div
        class="text-editor__input"
        contenteditable
        v-html="value"
        @focusout="updateHtml($event.target.innerHTML)"
      >
      </div>
    </div>
    <slot>
    </slot>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
    },
  },
  data() {
    return {
      curSelection: '',
    };
  },
  computed: {
    curSelectionComp() {
      console.log(document.getSelection());
      return document.getSelection().anchorOffset;
    },
  },
  methods: {
    updateHtml(text) {
      // const updText = text;

      this.curSelection = document.getSelection();

      console.log('updHtml / ', this.curSelection);

      // updText = updText.replace(/&lt;/g, '<');
      // updText = updText.replace(/&gt;/g, '>');
      let replacedDivText = text.replace(/<\/div>/g, 'br');
      replacedDivText = text.replace(/<div>/g, '');
      // this.$emit('input', updText);
      this.$emit('input', replacedDivText);
    },
    styleSelected(tag) {
      console.log(this.curSelection.toString());

      console.log('beforeChange ', this.value);

      const selectLeft = this.curSelection.anchorOffset > this.curSelection.focusOffset ? this.curSelection.focusOffset + 1 : this.curSelection.anchorOffset + 1;
      const selectRight = this.curSelection.anchorOffset < this.curSelection.focusOffset ? this.curSelection.focusOffset + 1 : this.curSelection.anchorOffset + 1;
      const tagLength = `<${tag}>`.length;

      if (this.curSelection.toString().trim().length > 0) {
        const IsInsideTag = new RegExp(`<${tag}>.*${this.curSelection.toString().trim()}.*<\/${tag}>`, 'g');
        let updText;

        updText = this.curSelection.baseNode.nodeValue.slice(selectLeft - 1, selectRight);
        // debugger;
        console.log(`selectLeft/Right: ${selectLeft} | ${selectRight}`);
        console.log(this.curSelection.baseNode.nodeValue);
        console.log('With tag | ', updText);

        if (this.curSelection.baseNode.parentNode.localName !== tag) {
          if (!IsInsideTag.test(updText)) {
            updText = this.curSelection.baseNode.nodeValue.slice(selectLeft - 1, selectRight);
            console.log(this.curSelection);
            updText = updText.replace(this.curSelection.toString().trim(), `<${tag}>${this.curSelection.toString().trim()}</${tag}>`);
          } else {
            updText = updText.replace(this.curSelection.toString().trim(), `</${tag}>${this.curSelection.toString().trim()}<${tag}>`);
          }
        } else {
          updText = updText.replace(this.curSelection.toString().trim(), `</${tag}>${this.curSelection.toString().trim()}<${tag}>`);
        }

        updText = this.curSelection.baseNode.nodeValue.slice(0, selectLeft - 1) + updText
        + this.curSelection.baseNode.nodeValue.slice(selectRight, this.curSelection.baseNode.nodeValue.length);

        updText = this.value.replace(this.curSelection.baseNode.nodeValue, updText);

        console.log(updText);

        // clear tags

        ['b', 'u', 'i', 's', 'cite'].forEach((el) => {
          const clearEmptyTags = new RegExp(`<${el}> *<\/${el}>`, 'g');
          updText = updText.replace(clearEmptyTags, '');
        });

        console.log('after clear ', updText);

        this.$emit('input', updText);
      }
    },
  },
  created() {
    document.execCommand('defaultParagraphSeparator', false, 'br');
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
