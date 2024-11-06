import { ENV_SWISS_PAIRING_POSTHOG_API_KEY, ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT } from './constants.js';

import { detectExecutionContext } from './utils/utils.js';
import dotenv from 'dotenv';

let initialized = false;

export function initConfig() {
  dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
  initialized = true;
}

function throwIfNotInitiailized() {
  if (!initialized) {
    throw new Error('Config not initialized. Call initConfig() first');
  }
}

export const getPosthogApiKey = () => {
  throwIfNotInitiailized();
  return process.env[ENV_SWISS_PAIRING_POSTHOG_API_KEY] ?? '';
};

export const getTelemetryOptOut = () => {
  throwIfNotInitiailized();
  return Boolean(process.env[ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT]);
};

/**
 * Determines the current environment context based on environment variables
 * and execution context. Priority order:
 * 1. CI environment
 * 2. Test environment
 * 3. Development environment
 * 4. Local install (development)
 * 5. Global/npx install (production)
 *
 * @returns The detected environment context
 */
export function getEnvironmentContext(): 'test' | 'development' | 'ci' | 'production' {
  if (process.env.CI) {
    return 'ci';
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  // Global/npx installs are "production", local installs are "development"
  const context = detectExecutionContext();
  return context === 'local' ? 'development' : 'production';
}

export function __resetConfigForTesting() {
  initialized = false;
}
