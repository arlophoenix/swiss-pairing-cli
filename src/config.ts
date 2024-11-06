import { ENV_SWISS_PAIRING_POSTHOG_API_KEY, ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT } from './constants.js';

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

export function __resetConfigForTesting() {
  initialized = false;
}
