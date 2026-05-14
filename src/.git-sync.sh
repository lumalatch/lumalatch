#!/bin/bash

echo "🔄 Syncing Qwen workspace → Git"

git status

echo "📦 Staging changes..."
git add -A

if git diff --cached --quiet; then
  echo "⚠️ No changes detected. Nothing to commit."
  exit 0
fi

echo "🧾 Committing..."
git commit -m "Qwen sync: $(date '+%Y-%m-%d %H:%M:%S')"

echo "🚀 Pushing..."
git push origin HEAD

echo "✅ Sync complete"