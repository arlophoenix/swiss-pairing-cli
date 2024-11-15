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
import { DEBUG_TELEMETRY, ENV_TELEMETRY_OPT_OUT } from '../constants.js';

import { Config } from '../Config.js';
import debug from 'debug';
import fs from 'fs';
import { getConfigPath } from './telemetryUtils.js';
import path from 'path';

export class TelemetryNotificationManager {
  private readonly log = debug(DEBUG_TELEMETRY);

  /**
   * Creates notification manager for specified app.
   */
  constructor() {
    this.log('Initializing TelemetryNotificationManager');
  }

  /**
   * Checks if telemetry notice needs to be shown.
   * Returns true on first run or if notice file missing.
   */
  shouldShowTelemetryNotice(): boolean {
    const config = Config.getInstance();
    const showTelemetryNoticeOverride = config.getShowTelemetryNoticeOverride();
    this.log('Telemetry notice override:', showTelemetryNoticeOverride);
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
    this.log('Telemetry opt-out:', telemetryOptOut);
    if (telemetryOptOut) {
      return false;
    }

    const telemetryNoticePath = TelemetryNotificationManager.getTelemetryNoticePath();
    this.log('Attempting to read telemetry notice file:', telemetryNoticePath);
    const result = !fs.existsSync(telemetryNoticePath);
    this.log('Should show telemetry notice:', result);
    return result;
  }

  /**
   * Marks telemetry notice as shown.
   * Creates config directory if needed.
   * Fails silently on errors.
   */
  markTelemetryNoticeShown() {
    try {
      const telemetryNoticePath = TelemetryNotificationManager.getTelemetryNoticePath();
      const telemetryNoticeDir = path.dirname(telemetryNoticePath);
      this.log('Writing telemetry notice file:', telemetryNoticePath);
      fs.mkdirSync(telemetryNoticeDir, { recursive: true });
      fs.writeFileSync(telemetryNoticePath, String(Date.now()));
      this.log('Marked telemetry notice as shown');
    } catch (error) {
      // Fail silently - worst case we show notice again
      this.log('Error marking telemetry notice shown:', error);
    }
  }

  static getTelemetryNoticePath(): string {
    const configPath = getConfigPath();
    return path.join(configPath, '.telemetry-notice-shown');
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
export ${ENV_TELEMETRY_OPT_OUT}=1

This notice will not be shown again.
----------------
`;
  }
}
