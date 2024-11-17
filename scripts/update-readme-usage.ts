/**
 * README usage documentation update script.
 * Updates README.md with current CLI usage information.
 *
 * Process:
 * 1. Gets current CLI help text from Commander
 * 2. Updates README.md usage section
 * 3. Preserves surrounding content
 *
 * Usage section format:
 * ```bash
 * Usage: swisspair [options]
 * ...CLI help text...
 * ```
 *
 * Ensures usage documentation stays in sync with actual CLI options.
 *
 * @module update-readme-usage
 */

import { readFileSync, writeFileSync } from 'fs';

import { createCLI } from '../src/cli/cli.js';

function updateReadmeUsage(): boolean {
  const readme = readFileSync('README.md', 'utf8');
  const usage = createCLI().helpInformation();

  const newContent = readme.replace(
    /<!-- CLI_USAGE_START -->[\s\S]*<!-- CLI_USAGE_END -->/,
    `<!-- CLI_USAGE_START -->\n\n\`\`\`bash\n${usage}\`\`\`\n\n<!-- CLI_USAGE_END -->`
  );

  if (newContent !== readme) {
    writeFileSync('README.md', newContent);
    return true;
  }

  return false;
}

try {
  const wasUpdated = updateReadmeUsage();
  if (wasUpdated) {
    console.log('Updated README.md with latest CLI usage');
  }
} catch (error) {
  console.error('Error updating README:', error);
  process.exit(1);
}
