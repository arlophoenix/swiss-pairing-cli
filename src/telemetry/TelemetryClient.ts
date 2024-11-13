import { AugmentedTelemetryEvent, TelemetryEvent } from './telemetryTypes.js';
import {
  detectEnvironment,
  detectExecutionContext,
  generateDistinctID,
  shouldEnableTelemetry,
} from './telemetryUtils.js';

import { Config } from '../Config.js';
import { DEBUG_TELEMETRY } from '../constants.js';
import { PostHog } from 'posthog-node';
import { TelemetryNotificationManager } from './TelemetryNotificationManager.js';
import debug from 'debug';
import os from 'os';

const log = debug(DEBUG_TELEMETRY);

export class TelemetryClient {
  private readonly client: PostHog | null = null;
  private readonly distinctId!: string;
  private readonly enabled: boolean = true;
  // eslint-disable-next-line functional/prefer-readonly-type
  private eventQueue: AugmentedTelemetryEvent[] = [];
  // eslint-disable-next-line functional/prefer-readonly-type
  private flushTimeout: NodeJS.Timeout | null = null;

  // eslint-disable-next-line functional/prefer-readonly-type
  private static instance: TelemetryClient | null = null;

  public static getInstance(): TelemetryClient {
    if (!TelemetryClient.instance) {
      // eslint-disable-next-line functional/immutable-data
      TelemetryClient.instance = new TelemetryClient();

      // Ensure events are flushed on process exit
      process.on('exit', () => {
        TelemetryClient.instance?.shutdown().catch(() => {
          // nothing to do here the process has ended
        });
      });
    }
    return TelemetryClient.instance;
  }

  private constructor() {
    const config = Config.getInstance();
    const apiKey = config.getPosthogApiKey();
    const nameotificationManager = new TelemetryNotificationManager();
    this.enabled = shouldEnableTelemetry({
      telemetryOptOut: config.getTelemetryOptOut(),
      shouldShowTelemetryNotice: nameotificationManager.shouldShowTelemetryNotice(),
      apiKeyExists: apiKey !== '',
      environment: detectEnvironment(),
    });

    log('Initializing telemetry');
    log('Telemetry enabled:', this.enabled);

    if (this.enabled) {
      try {
        this.client = new PostHog(apiKey, {
          host: 'https://us.i.posthog.com',
          flushAt: 1,
          flushInterval: 0,
        });
        this.distinctId = generateDistinctID();
      } catch (error) {
        log('Failed to initialize telemetry client', error);
        this.enabled = false;
      }
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

  public static resetForTesting() {
    // eslint-disable-next-line functional/immutable-data
    this.instance = null;
  }
}
