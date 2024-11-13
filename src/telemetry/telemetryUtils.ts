import { DEBUG_TELEMETRY } from '../constants.js';
import debug from 'debug';
import { detectExecutionContext } from '../utils/utils.js';
export * from '../utils/utils.js';

const log = debug(DEBUG_TELEMETRY);

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
export function detectEnvironment(): 'test' | 'development' | 'ci' | 'production' {
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

/**
 * Determines whether telemetry should be enabled based on environment and configuration.
 * Rules in order of precedence:
 * 1. Always disabled in CI
 * 2. Disabled if user opted out
 * 3. Disabled if user has not seen telemetry notice yet
 * 4. Disabled if API key missing
 * 5. Otherwise enabled
 */
export function shouldEnableTelemetry({
  telemetryOptOut,
  shouldShowTelemetryNotice,
  apiKeyExists,
  environment,
}: {
  readonly telemetryOptOut: boolean;
  readonly shouldShowTelemetryNotice: boolean;
  readonly apiKeyExists: boolean;
  readonly environment: 'test' | 'development' | 'ci' | 'production';
}): boolean {
  log('shouldEnableTelemetry()', {
    telemetryOptOut,
    shouldShowTelemetryNotice,
    apiKeyExists,
    environment,
  });

  // Always disable in CI
  if (environment === 'ci') {
    return false;
  }

  // Standard rules, let Config/env handle test
  return !telemetryOptOut && !shouldShowTelemetryNotice && apiKeyExists;
}
