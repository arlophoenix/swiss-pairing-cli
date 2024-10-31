import * as path from 'path';

import { ENV_SWISS_PAIRING_POSTHOG_API_KEY } from '../src/constants.js';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchApiKey(): string {
  try {
    // Fetch API key from 1Password using their CLI
    const apiKey = execSync('op item get "Posthog API Key" --reveal --field credential', {
      encoding: 'utf-8',
    }).trim();
    return apiKey;
  } catch (error) {
    console.error('Failed to fetch API key from 1Password:', error);
    process.exit(1);
  }
}

function writeEnvFile(apiKey: string) {
  const envPath = path.resolve(__dirname, '../.env');
  writeFileSync(envPath, `${ENV_SWISS_PAIRING_POSTHOG_API_KEY}=${apiKey}\n`, { encoding: 'utf-8' });
  console.log(`API key written to ${envPath}`);
}

function setupEnv() {
  const apiKey = fetchApiKey();
  writeEnvFile(apiKey);
}

setupEnv();
