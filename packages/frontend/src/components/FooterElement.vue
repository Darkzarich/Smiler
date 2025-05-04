<template>
  <footer>
    <div class="footer-content">
      <a
        class="github-link"
        href="https://github.com/Darkzarich/Smiler"
        rel="noopener noreferrer"
        target="_blank"
      >
        <img src="@/assets/GitHub-Mark-Light-64px.png" alt="GitHub" />
      </a>
    </div>
  </footer>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style lang="scss">
@import '@/styles/mixins';

footer {
  @include flex-row;

  @include for-size(phone-only) {
    height: 2rem;
  }

  align-items: center;
  width: 100%;
  height: 4rem;
  margin-top: 1.5rem;
  background: var(--color-header);

  .footer-content {
    display: flex;
    width: 100%;
    max-width: 1110px;
    height: 100%;
    margin: 0 auto;
  }

  .github-link {
    display: flex;
    align-items: center;
    opacity: 0.5;
    height: 100%;
    margin-right: 1rem;
    margin-left: auto;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }

    img {
      height: 100%;
      padding: 5px;
    }
  }
}
</style>
