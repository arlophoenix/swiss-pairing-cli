import * as path from 'path';

import { ENV_SWISS_PAIRING_POSTHOG_API_KEY } from '../src/constants.js';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const OP_POSTHOG_API_KEY_NAME = 'Posthog API Key';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchPosthogApiKey(): string {
  try {
    // Fetch API key from 1Password using their CLI
    const apiKey = execSync(`op item get "${OP_POSTHOG_API_KEY_NAME}" --reveal --field credential`, {
      encoding: 'utf-8',
    }).trim();
    return apiKey;
  } catch (error) {
    console.error('Failed to fetch API key from 1Password:', error);
    process.exit(1);
  }
}

function setupEnv() {
  const posthogApiKey = fetchPosthogApiKey();
  const envContent = `
# Development environment config
NODE_ENV=development

# Telemetry config
${ENV_SWISS_PAIRING_POSTHOG_API_KEY}=${posthogApiKey}
`;
  try {
    const envPath = path.resolve(__dirname, '../.env');
    writeFileSync(envPath, envContent, {
      encoding: 'utf-8',
    });
    console.log('Development environment configured successfully');
  } catch (error) {
    console.error('Failed to write .env file:', error);
    process.exit(1);
  }
}

setupEnv();
