import { DEBUG_TELEMETRY } from '../constants.js';
import { createHash } from 'crypto';
import debug from 'debug';
import { detectExecutionContext } from '../utils/utils.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
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

/**
 * Generates a unique installation ID for telemetry tracking.
 * The ID generation strategy varies based on execution context:
 *
 * - For npx: Uses a hash of machine characteristics (hostname, platform, arch, username)
 *   This provides consistency across npx runs on the same machine while preserving privacy
 *
 * - For installed versions (global/local):
 *   1. Tries to read existing ID from config file
 *   2. If no file exists, generates new random ID and saves it
 *   3. Falls back to temporary random ID if file operations fail
 *
 * File location follows OS conventions:
 * - Windows: %APPDATA%/swiss-pairing-cli/.installation-id
 * - Unix: ~/.config/swiss-pairing-cli/.installation-id
 *
 * @returns An 8-character hex string for npx, or a random string for installed versions
 *
 * @example
 * // npx execution
 * generateDistinctID() // => "a1b2c3d4"
 *
 * // installed version
 * generateDistinctID() // => "xj7ys9" (from config file or newly generated)
 */
export function generateDistinctID(): string {
  const executionContext = detectExecutionContext();
  log('Generating installation ID for context:', executionContext);

  // For npx, create semi-persistent ID from machine characteristics
  if (executionContext === 'npx') {
    const machineId = [
      os.hostname(), // System hostname
      os.platform(), // OS platform (darwin, win32, linux)
      os.arch(), // CPU architecture
      os.userInfo().username, // System username
    ].join('-');

    // Generate deterministic but private ID
    return createHash('sha256').update(machineId).digest('hex').slice(0, 8); // Use first 8 chars for readability
  }

  // For installed versions, try to use persistent storage
  try {
    // Get OS-specific config directory
    const configDir =
      process.platform === 'win32'
        ? (process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'))
        : (process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'));

    const idPath = path.join(configDir, 'swiss-pairing-cli', '.installation-id');

    try {
      // Try to read existing ID
      return fs.readFileSync(idPath, 'utf8');
    } catch {
      // Generate and save new ID if none exists
      const newId = Math.random().toString(36).substring(2);
      fs.mkdirSync(path.dirname(idPath), { recursive: true });
      fs.writeFileSync(idPath, newId);
      return newId;
    }
  } catch {
    // Fall back to temporary ID if file operations fail
    log('Failed to access config directory, using temporary ID');
    return Math.random().toString(36).substring(2);
  }
}
