/**
 * Manages first-run telemetry notifications and user preferences.
 *
 * Handles:
 * - Determining if telemetry notice needs to be shown
 * - Storing notice acknowledgment persistently
 * - OS-specific config paths
 * - Error resilient file operations
 *
 * File locations:
 * - Unix: ~/.config/<app-name>/.telemetry-notice-shown
 * - Windows: %APPDATA%/<app-name>/.telemetry-notice-shown
 */
import { DEBUG_TELEMETRY, ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT, PROGRAM_NAME } from '../constants.js';

import { Config } from '../Config.js';
import debug from 'debug';
import fs from 'fs';
import os from 'os';
import path from 'path';

const log = debug(DEBUG_TELEMETRY);

export class TelemetryNotificationManager {
  private readonly configPath: string;
  private readonly telemetryNoticePath: string;

  /**
   * Creates notification manager for specified app.
   * Resolves OS-specific config paths.
   *
   * @param appName - Optional app name for config path, defaults to PROGRAM_NAME
   */
  constructor(appName = PROGRAM_NAME) {
    log('Initializing TelemetryNotificationManager');
    const configDir =
      process.platform === 'win32'
        ? (process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'))
        : (process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'));

    this.configPath = path.join(configDir, appName);
    this.telemetryNoticePath = path.join(this.configPath, '.telemetry-notice-shown');
    log('Config path:', this.configPath);
    log('Telemetry notice path:', this.telemetryNoticePath);
  }

  /**
   * Checks if telemetry notice needs to be shown.
   * Returns true on first run or if notice file missing.
   */
  shouldShowTelemetryNotice(): boolean {
    const config = Config.getInstance();
    const showTelemetryNoticeOverride = config.getShowTelemetryNoticeOverride();
    log('Telemetry notice override:', showTelemetryNoticeOverride);
    switch (showTelemetryNoticeOverride) {
      case 'show':
        return true;
      case 'hide':
        return false;
      case 'default':
        // the following logic applies
        break;
    }

    const telemetryOptOut = config.getTelemetryOptOut();
    log('Telemetry opt-out:', telemetryOptOut);
    if (telemetryOptOut) {
      return false;
    }

    let result: boolean;
    try {
      fs.accessSync(this.telemetryNoticePath);
      result = false;
    } catch {
      result = true;
    }
    log('Should show telemetry notice:', result);
    return result;
  }

  /**
   * Marks telemetry notice as shown.
   * Creates config directory if needed.
   * Fails silently on errors.
   */
  markTelemetryNoticeShown() {
    try {
      fs.mkdirSync(this.configPath, { recursive: true });
      fs.writeFileSync(this.telemetryNoticePath, String(Date.now()));
      log('Marked telemetry notice as shown');
    } catch (error) {
      // Fail silently - worst case we show notice again
      log('Error marking telemetry notice shown:', error);
    }
  }

  /**
   * Gets telemetry notice text.
   * Includes opt-out instructions.
   */
  static getTelemetryNotice(): string {
    return `
Telemetry Notice
----------------
To help improve this tool, we collect anonymous usage data.
No personal information or command arguments are collected.
No data is collected on the first run when this notice is shown.

To opt-out, set the environment variable:
export ${ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT}=1

This notice will not be shown again.
----------------
`;
  }
}
