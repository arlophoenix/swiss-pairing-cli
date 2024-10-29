import { readFileSync, writeFileSync } from 'fs';

import { examples } from '../src/cli/cliExamples.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function updateReadmeExamples() {
  let readme = readFileSync('README.md', 'utf8');
  // Update examples with output
  const outputs = await Promise.all(
    // eslint-disable-next-line max-params
    examples.map(async ({ description, command }, i) => {
      const output = await execAsync(command.replace('swiss-pairing', 'node dist/index.js'))
        .then(({ stdout }) => stdout.trim())
        .catch((error: unknown) => `Error: ${(error as Error).message}`);

      return `${String(i + 1)}. ${description}\n\n\`\`\`bash\n>${command}\n${output}\n\`\`\`\n`;
    })
  );

  readme = readme.replace(
    /<!-- CLI_EXAMPLES_START -->[\s\S]*<!-- CLI_EXAMPLES_END -->/,
    `<!-- CLI_EXAMPLES_START -->\n\n**Examples:**\n\n${outputs.join('\n')}\n<!-- CLI_EXAMPLES_END -->`
  );

  writeFileSync('README.md', readme);
  console.log('Updated README.md with latest CLI examples');
}

// eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
updateReadmeExamples().catch(console.error);
