/**
 * Development environment setup script.
 * Creates environment config files for development and test.
 *
 * Files created:
 * - .env - Development environment with PostHog API key
 * - .env.test - Test environment with telemetry disabled
 *
 * Requirements:
 * - 1Password CLI installed and authenticated
 * - PostHog API key stored in 1Password
 *
 * @module setup-env
 */

import * as path from 'path';

import { DOTENV_DEV, DOTENV_TEST, ENV_POSTHOG_API_KEY, ENV_TELEMETRY_OPT_OUT } from '../src/constants.js';

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const OP_POSTHOG_API_KEY_NAME = 'Posthog API Key';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchPosthogApiKey(): string | undefined {
  try {
    // Fetch API key from 1Password using their CLI
    const apiKey = execSync(`op item get "${OP_POSTHOG_API_KEY_NAME}" --reveal --field credential`, {
      encoding: 'utf-8',
    }).trim();
    return apiKey;
  } catch (error) {
    console.warn('Failed to fetch API key from 1Password:', error);
    return undefined;
  }
}

function createDevelopmentEnv() {
  const posthogApiKey = fetchPosthogApiKey();
  const posthogApiKeyEntry = posthogApiKey ? `${ENV_POSTHOG_API_KEY}=${posthogApiKey}` : '';
  const envContent = `# Development environment config
NODE_ENV=development

# Telemetry config
${posthogApiKeyEntry}
`;
  writeEnvFile({ envFileName: DOTENV_DEV, envContent });
}

function createTestEnv() {
  const envContent = `# Test environment config
NODE_ENV=test

# Telemetry config
${ENV_POSTHOG_API_KEY}=''
${ENV_TELEMETRY_OPT_OUT}=1
`;
  writeEnvFile({ envFileName: DOTENV_TEST, envContent });
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
    console.log(`Successfully wrote to ${envPath}`);
  } catch (error) {
    console.error('Failed to write env file:', error);
    process.exit(1);
  }
}

function createEnvFiles() {
  createDevelopmentEnv();
  createTestEnv();
}

function checkGraphviz() {
  try {
    execSync('dot -V', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function validateExternalDependencies() {
  if (!checkGraphviz()) {
    console.warn('Error: graphviz is required for visualizations but not installed.');
    console.warn('Install with: brew install graphviz');
  }
}

createEnvFiles();
validateExternalDependencies();
