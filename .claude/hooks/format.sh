#!/usr/bin/env bash
# PostToolUse hook: formatea con Prettier y aplica autofixes de ESLint
# al archivo que Write/Edit acaba de crear o modificar.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

file=$(node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).tool_input?.file_path??"")}catch{console.log("")}})')

[ -n "$file" ] && [ -f "$file" ] || exit 0

case "$file" in
  "$PWD"/*) ;;
  *) exit 0 ;;
esac

npx --no-install prettier --write --ignore-unknown "$file" >/dev/null 2>&1

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs)
    out=$(npx --no-install eslint --fix --no-warn-ignored "$file" 2>&1) || {
      printf 'ESLint (no autofixable) en %s:\n%s\n' "$file" "$out" >&2
    }
    ;;
esac

exit 0
