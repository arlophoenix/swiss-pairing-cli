import { readFileSync, writeFileSync } from 'fs';

import { createCLI } from '../src/cli.js';

// Generate CLI usage information
const usage = createCLI().helpInformation();

// Read the current README.md
let readme = readFileSync('README.md', 'utf8');

// Define start and end markers in your README
const startMarker = '<!-- CLI_USAGE_START -->';
const endMarker = '<!-- CLI_USAGE_END -->';

// Replace the content between the markers
const newContent = `${startMarker}\n\n\`\`\`bash\n${usage}\`\`\`\n\n${endMarker}`;
readme = readme.replace(new RegExp(`${startMarker}[\\s\\S]*${endMarker}`), newContent);

// Write the updated README back to the file
writeFileSync('README.md', readme);

console.log('README.md updated with latest CLI usage information.');
