#!/bin/bash
# Cleanup Stale Files
# Moves marketing pitch pages from root to docs/marketing/pitches/
# This improves repository organization and prevents conflicts with Next.js routing

set -e

echo "🧹 Cleaning up stale HTML files..."

# Create destination directory
mkdir -p docs/marketing/pitches

# Count files to move
count=0

# Move pitch pages
for file in architects-pitch.html buyers-pitch.html data-providers-pitch.html \
            founding-50.html suppliers-pitch.html temp-landing.html; do
  if [ -f "$file" ]; then
    echo "  Moving: $file → docs/marketing/pitches/"
    mv -v "$file" docs/marketing/pitches/
    ((count++))
  fi
done

if [ $count -eq 0 ]; then
  echo "  No stale files found to move"
else
  echo "✅ Moved $count stale HTML file(s) to docs/marketing/pitches/"
fi

# Check for index.html
if [ -f "index.html" ]; then
  echo ""
  echo "⚠️  WARNING: index.html still exists in root"
  echo "   This may conflict with Next.js routing"
  echo "   Review manually and decide if it should be:"
  echo "   - Moved to public/ for static serving"
  echo "   - Moved to docs/marketing/"
  echo "   - Deleted if no longer needed"
fi

echo ""
echo "Next steps:"
echo "  1. Review changes with: git status"
echo "  2. Commit: git add docs/ && git commit -m 'Move stale HTML files to docs/'"
echo "  3. If index.html needs action, handle it separately"
