/**
 * Conventional Commits, Angular flavour.
 *
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 * @see https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Scope is the workspace package a change belongs to. Repo-wide changes
    // (tooling, docs, Docker) carry no scope at all.
    'scope-enum': [2, 'always', ['backend', 'frontend', 'deps']],
  },
};
