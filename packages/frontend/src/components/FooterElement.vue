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
  height: 4rem;
  margin-top: 1.5rem;
  background: var(--color-surface-elevated);
  padding-inline: var(--page-gutter);

  @media (--phone-only) {
    height: 2rem;
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
