/**
 * README examples update script.
 * Updates README.md with live CLI examples.
 *
 * Process:
 * 1. Reads example commands from cliExamples.js
 * 2. Executes each example using current CLI
 * 3. Captures command output
 * 4. Updates README.md examples section
 *
 * Example format:
 * ```bash
 * >command
 * output
 * ```
 *
 * Ensures examples stay in sync with actual CLI behavior.
 *
 * @module update-readme-examples
 */

import { readFileSync, writeFileSync } from 'fs';

import { examples } from '../src/cli/cliExamples.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function updateReadmeExamples() {
  let readme = readFileSync('README.md', 'utf8');
  // Update examples with output
  const outputs = await Promise.all(
    examples.map(async ({ description, command }) => {
      try {
        const output = await execAsync(command.replace('swiss-pairing', 'node dist/index.js'));
        // using triple spaces ie '   ' on purpose to preserve list indentation in markdown code block
        return `1. ${description}

   \`\`\`bash
   >${command}
   ${output.stdout.trim().replace(/\n/g, '\n   ')}
   \`\`\`
`;
      } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error);
        return '';
      }
    })
  );

  readme = readme.replace(
    /<!-- CLI_EXAMPLES_START -->[\s\S]*<!-- CLI_EXAMPLES_END -->/,
    `<!-- CLI_EXAMPLES_START -->
${outputs.join('\n')}
<!-- CLI_EXAMPLES_END -->`
  );

  writeFileSync('README.md', readme);
  console.log('Updated README.md with latest CLI examples');
}

// eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
updateReadmeExamples().catch(console.error);
