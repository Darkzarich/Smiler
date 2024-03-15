<template>
  <footer>
    <div class="footer-github">
      <a
        href="https://github.com/Darkzarich/express-blog"
        rel="noopener noreferrer"
        target="_blank"
      >
        <img
          src="@/assets/GitHub-Mark-Light-64px.png"
          alt="GitHub"
        />
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
  width: 100%;
  height: 4rem;
  margin-top: 1rem;
  background: $header;
  align-items: center;

  @include flex-row;

  .footer-github {
    display: inline-block;
    width: 3rem;
    height: 3rem;
    margin-left: auto;
    margin-right: 1rem;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
