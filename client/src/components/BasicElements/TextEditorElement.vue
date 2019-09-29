<template>
  <div>
    <button @click="styleSelected('b')">B</button>
    <button @click="styleSelected('i')">I</button>
    <button @click="styleSelected('s')">S</button>
    <button @click="styleSelected('u')">U</button>
    <button @click="styleSelected('cite')">Q</button>
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
  methods: {
    updateHtml(text) {
      // const updText = text;

      this.curSelection = document.getSelection();

      // updText = updText.replace(/&lt;/g, '<');
      // updText = updText.replace(/&gt;/g, '>');
      let replacedDivText = text.replace(/<\/div>/g, 'br');
      replacedDivText = text.replace(/<div>/g, '');
      // this.$emit('input', updText);
      this.$emit('input', replacedDivText);
    },
    styleSelected(tag) {
      console.log(this.curSelection.toString());
      if (this.curSelection.toString().trim().length > 0) {
        const IsInsideTag = new RegExp(`<${tag}>.*${this.curSelection.toString().trim()}.*<\/${tag}>`, 'g');
        let updText;

        if (!IsInsideTag.test(this.value)) {
          console.log(this.curSelection);
          updText = this.value.replace(this.curSelection.toString().trim(), `<${tag}>${this.curSelection.toString().trim()}</${tag}>`);
        } else {
          updText = this.value.replace(this.curSelection.toString().trim(), `</${tag}>${this.curSelection.toString().trim()}<${tag}>`);
        }

        // clear empty tags

        const clearEmptyTags = new RegExp(`<${tag}> *<\/${tag}>`, 'g');
        updText = updText.replace(clearEmptyTags, '');

        console.log(updText);

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

.text-editor {
  @include input();
  @include flex-row();
  color: $main-text;
  margin-left: 1rem;
  margin-right: 1.5rem;
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
