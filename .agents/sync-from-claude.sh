#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for item in CLAUDE.md settings.json agents commands rules skills hooks mcp; do
  rm -rf "$ROOT_DIR/.agents/$item"
  cp -R "$ROOT_DIR/.claude/$item" "$ROOT_DIR/.agents/$item"
done

ln -sfn agents "$ROOT_DIR/.agents/personas"
ln -sfn commands "$ROOT_DIR/.agents/prompts"
ln -sfn rules "$ROOT_DIR/.agents/policies"
ln -sfn skills "$ROOT_DIR/.agents/capabilities"

echo "Synced .agents from .claude"
