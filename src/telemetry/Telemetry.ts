import { AugmentedTelemetryEvent, TelemetryEvent } from './telemetryTypes.js';
import { detectEnvironment, detectExecutionContext } from './telemetryUtils.js';

import { Config } from '../Config.js';
import { DEBUG_TELEMETRY } from '../constants.js';
import { FirstRunManager } from './FirstRunManager.js';
import { PostHog } from 'posthog-node';
import { createHash } from 'crypto';
import debug from 'debug';
import fs from 'fs';
import os from 'os';
import path from 'path';

const log = debug(DEBUG_TELEMETRY);

export class Telemetry {
  private readonly client: PostHog | null = null;
  private readonly distinctId!: string;
  private readonly enabled: boolean = true;
  // eslint-disable-next-line functional/prefer-readonly-type
  private eventQueue: AugmentedTelemetryEvent[] = [];
  // eslint-disable-next-line functional/prefer-readonly-type
  private flushTimeout: NodeJS.Timeout | null = null;

  // eslint-disable-next-line functional/prefer-readonly-type
  private static instance: Telemetry | null = null;

  public static getInstance(): Telemetry {
    if (!Telemetry.instance) {
      // eslint-disable-next-line functional/immutable-data
      Telemetry.instance = new Telemetry();

      // Ensure events are flushed on process exit
      process.on('exit', () => {
        Telemetry.instance?.shutdown().catch(() => {
          // nothing to do here the process has ended
        });
      });
    }
    return Telemetry.instance;
  }

  private constructor() {
    const config = Config.getInstance();
    const apiKey = config.getPosthogApiKey();
    const apiKeyExists = apiKey !== '';
    const firstRunManager = new FirstRunManager();
    const shouldShowTelemetryNotice = firstRunManager.shouldShowTelemetryNotice();
    this.enabled = !config.getTelemetryOptOut() && !shouldShowTelemetryNotice && apiKeyExists;

    log('Initializing telemetry');
    log('API Key found:', apiKeyExists);
    log('Should show telemetry notice:', shouldShowTelemetryNotice);
    log('Telemetry enabled:', this.enabled);

    if (this.enabled) {
      try {
        this.client = new PostHog(apiKey, {
          host: 'https://us.i.posthog.com',
          flushAt: 1,
          flushInterval: 0,
        });
        this.distinctId = this.generateInstallId();
      } catch (error) {
        log('Failed to initialize telemetry client', error);
        this.enabled = false;
      }
    }
  }

  private generateInstallId(): string {
    const executionContext = detectExecutionContext();
    log('Execution context:', executionContext);
    // For npx, create a semi-persistent ID based on machine characteristics
    if (executionContext === 'npx') {
      const machineId = [os.hostname(), os.platform(), os.arch(), os.userInfo().username].join('-');

      return createHash('sha256').update(machineId).digest('hex').slice(0, 8);
    }

    // For installed versions, try to use persistent storage
    try {
      const configDir =
        process.platform === 'win32'
          ? (process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'))
          : (process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'));

      const idPath = path.join(configDir, 'swiss-pairing-cli', '.installation-id');

      try {
        return fs.readFileSync(idPath, 'utf8');
      } catch {
        const newId = Math.random().toString(36).substring(2);
        fs.mkdirSync(path.dirname(idPath), { recursive: true });
        fs.writeFileSync(idPath, newId);
        return newId;
      }
    } catch {
      // Fall back to temporary ID if we can't write to config
      return Math.random().toString(36).substring(2);
    }
  }

  record(event: TelemetryEvent) {
    if (!this.enabled || !this.client) {
      return;
    }
    log('Recording event:', event);
    const augmentedEvent: AugmentedTelemetryEvent = {
      name: event.name,
      properties: {
        ...event.properties,
        node_version: process.version,
        os_name: os.platform(),
        cli_version: process.env.npm_package_version,
        execution_context: detectExecutionContext(),
        environment: detectEnvironment(),
      },
    };

    // Queue the event
    // eslint-disable-next-line functional/immutable-data
    this.eventQueue.push(augmentedEvent);

    // Debounce flush
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    // eslint-disable-next-line functional/immutable-data
    this.flushTimeout = setTimeout(() => {
      void this.flush();
    }, 100);
  }

  private async flush(): Promise<void> {
    if (this.client === null || this.eventQueue.length === 0) {
      return;
    }
    log('Flushing %d events', this.eventQueue.length);
    try {
      // Send all queued events in parallel
      await Promise.all(
        this.eventQueue.map((event) => {
          this.client?.capture({
            distinctId: this.distinctId,
            event: event.name,
            properties: event.properties,
          });
        })
      );
      // eslint-disable-next-line functional/immutable-data
      this.eventQueue = [];
    } catch {
      // Silently fail
    } finally {
      log('Flush complete');
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    // Final attempt to flush any queued events
    await this.flush();

    if (this.client) {
      try {
        await this.client.shutdown();
      } catch {
        // Ignore shutdown errors
      }
    }
  }
}
