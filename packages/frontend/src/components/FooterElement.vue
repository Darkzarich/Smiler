<template>
  <footer class="u-flex-row">
    <div class="footer-content">
      <a
        class="github-link"
        href="https://github.com/Darkzarich/Smiler"
        rel="noopener noreferrer"
        target="_blank"
        aria-label="GitHub"
      >
        <IconGitHub aria-hidden="true" />
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import IconGitHub from '@icons/IconGitHub.vue';
</script>

<style>
footer {
  align-items: center;
  width: 100%;
  height: calc(4rem + env(safe-area-inset-bottom, 0px));
  margin-top: 1.5rem;
  padding: 0 var(--page-gutter-right) env(safe-area-inset-bottom, 0)
    var(--page-gutter-left);
  background: var(--color-surface-elevated);

  @media (--phone-only) {
    height: calc(2rem + env(safe-area-inset-bottom, 0px));
  }

  .footer-content {
    display: flex;
    width: 100%;
    max-width: var(--page-max-width);
    height: 100%;
    margin: 0 auto;
  }

  .github-link {
    display: flex;
    align-items: center;
    height: 100%;
    margin-right: 1rem;
    margin-left: auto;
    color: var(--color-text-secondary);
    cursor: pointer;

    @media (--hover) {
      &:hover {
        color: var(--color-text-primary);
      }
    }

    svg {
      width: 2rem;
      height: 2rem;

      @media (--phone-only) {
        width: 1.25rem;
        height: 1.25rem;
      }
    }
  }
}
</style>
