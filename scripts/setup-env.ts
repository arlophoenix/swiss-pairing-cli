import * as path from 'path';

import {
  DOTENV_DEV,
  DOTENV_TEST,
  ENV_SWISS_PAIRING_POSTHOG_API_KEY,
  ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT,
} from '../src/constants.js';

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

function createDevelopmentEnv() {
  const posthogApiKey = fetchPosthogApiKey();
  const envContent = `
# Development environment config
NODE_ENV=development

# Telemetry config
${ENV_SWISS_PAIRING_POSTHOG_API_KEY}=${posthogApiKey}
`;
  writeEnvFile({ envFileName: DOTENV_DEV, envContent });
}

function createTestEnv() {
  const envContent = `
# Test environment config
NODE_ENV=test

# Telemetry config
${ENV_SWISS_PAIRING_POSTHOG_API_KEY}=''
${ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT}=1
`;
  writeEnvFile({ envFileName: DOTENV_TEST, envContent });
}

function setupEnv() {
  createDevelopmentEnv();
  createTestEnv();
}

function writeEnvFile({
  envFileName,
  envContent,
}: {
  readonly envFileName: string;
  readonly envContent: string;
}) {
  try {
    const envPath = path.resolve(__dirname, '..', envFileName);
    writeFileSync(envPath, envContent, {
      encoding: 'utf-8',
    });
    console.log(`Succesfully wrote to ${envPath}`);
  } catch (error) {
    console.error(`Failed to write env file:`, error);
    process.exit(1);
  }
}

setupEnv();
