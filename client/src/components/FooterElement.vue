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
export default {};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

footer {
  @include flex-row;

  @include for-size(phone-only) {
    height: 2rem;
  }

  width: 100%;
  height: 4rem;
  margin-top: 1.5rem;
  background: $header;
  align-items: center;

  .footer-content {
    display: flex;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    max-width: 1110px;
  }

  .github-link {
    margin-left: auto;
    display: flex;
    height: 100%;
    align-items: center;
    margin-right: 1rem;
    opacity: 0.5;
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
