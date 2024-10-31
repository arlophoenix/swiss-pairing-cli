import { DEBUG_TELEMETRY, ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT, PROGRAM_NAME } from '../constants.js';

import debug from 'debug';
import fs from 'fs';
import os from 'os';
import path from 'path';

const log = debug(DEBUG_TELEMETRY);

export class FirstRunManager {
  private readonly configPath: string;
  private readonly telemetryNoticePath: string;

  constructor(appName = PROGRAM_NAME) {
    log('Initializing FirstRunManager');
    // Get OS-specific config directory
    const configDir =
      process.platform === 'win32'
        ? (process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'))
        : (process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'));

    this.configPath = path.join(configDir, appName);
    this.telemetryNoticePath = path.join(this.configPath, '.telemetry-notice-shown');
    log('Config path:', this.configPath);
    log('Telemetry notice path:', this.telemetryNoticePath);
  }

  shouldShowTelemetryNotice(): boolean {
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

  markTelemetryNoticeShown() {
    try {
      fs.mkdirSync(this.configPath, { recursive: true });
      fs.writeFileSync(this.telemetryNoticePath, String(Date.now()));
      log('Marked telemetry notice as shown:');
    } catch (error) {
      // Fail silently - worst case we show notice again
      log('Error marking telemetry notice shown:', error);
    }
  }

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
