#!/bin/sh
# Validates the commit message file that git's commit-msg hook passes in:
#   1. Conventional Commits format — commitlint.config.cjs
#   2. Spelling               — cspell.json
#
# Git's own comment block, and the diff `git commit -v` appends below the
# scissors line, are stripped first so only the text the author wrote is
# spellchecked. commitlint strips the comments on its own.
set -e

msg_file="$1"

if [ -z "$msg_file" ]; then
  echo "usage: pnpm commitmsg <commit-msg-file>" >&2
  exit 1
fi

commitlint --edit "$msg_file"

message=$(sed -n '/^#.*>8/q;p' "$msg_file" | git stripspace --strip-comments)

if ! printf '%s\n' "$message" | cspell --no-progress --no-summary 'stdin://commit-message.txt'; then
  echo '✖   commit message has spelling issues' >&2
  echo 'ⓘ   Fix them, or add the term to the "words" list in cspell.json' >&2
  exit 1
fi
