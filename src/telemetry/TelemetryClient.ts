import { AugmentedTelemetryEvent, TelemetryEvent } from './telemetryTypes.js';
import {
  detectEnvironment,
  detectExecutionContext,
  generateDistinctID,
  shouldEnableTelemetryClient,
} from './telemetryUtils.js';

import { Config } from '../Config.js';
import { DEBUG_TELEMETRY } from '../constants.js';
import { PostHog } from 'posthog-node';
import debug from 'debug';
import os from 'os';

/**
 * Core telemetry client for tracking CLI usage.
 *
 * Responsibilities:
 * - Initialize PostHog connection
 * - Buffer and batch events
 * - Handle graceful shutdown
 * - Respect privacy settings
 *
 * Events are queued in memory and flushed:
 * - When queue reaches size limit
 * - On explicit shutdown
 * - Before process exit
 *
 * Privacy features:
 * - No PII collected
 * - Opt-out support
 * - First-run disabled
 * - Environment-based rules
 *
 * @module TelemetryClient
 */
export class TelemetryClient {
  private readonly postHogClient: PostHog | null = null;
  private readonly distinctId!: string;
  private readonly enabled: boolean = true;
  // eslint-disable-next-line functional/prefer-readonly-type
  private eventQueue: AugmentedTelemetryEvent[] = [];
  // eslint-disable-next-line functional/prefer-readonly-type
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly log = debug(DEBUG_TELEMETRY);

  // eslint-disable-next-line functional/prefer-readonly-type
  private static instance: TelemetryClient | null = null;

  /**
   * Get singleton instance.
   * Creates new instance if none exists.
   * Registers process exit handler for cleanup.
   */
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
    this.log('Initializing TelemetryClient');

    const config = Config.getInstance();
    const apiKey = config.getPosthogApiKey();
    this.enabled = shouldEnableTelemetryClient({
      telemetryOptOut: config.getTelemetryOptOut(),
      apiKeyExists: apiKey !== '',
      environment: detectEnvironment(),
    });

    this.log('Telemetry enabled:', this.enabled);

    if (this.enabled) {
      try {
        this.postHogClient = new PostHog(apiKey, {
          host: 'https://us.i.posthog.com',
          flushAt: 1,
          flushInterval: 0,
        });
        this.distinctId = generateDistinctID();
      } catch (error) {
        this.log('Failed to initialize telemetry client', error);
        this.enabled = false;
      }
    }
  }

  /**
   * Record telemetry event.
   * Events are queued for batched sending.
   *
   * @param event - Event to record
   *
   * @example
   * client.record({
   *   name: 'command_succeeded',
   *   properties: { duration_ms: 123 }
   * });
   */
  record(event: TelemetryEvent) {
    if (!this.enabled || !this.postHogClient) {
      return;
    }
    this.log('Recording event:', event);
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
    if (this.postHogClient === null || this.eventQueue.length === 0) {
      return;
    }
    this.log('Flushing %d events', this.eventQueue.length);
    try {
      // Send all queued events in parallel
      await Promise.all(
        this.eventQueue.map((event) =>
          this.postHogClient?.capture({
            distinctId: this.distinctId,
            event: event.name,
            properties: event.properties,
          })
        )
      );
    } catch {
      // Silently fail
    } finally {
      // eslint-disable-next-line functional/immutable-data
      this.eventQueue = [];
      this.log('Flush complete');
    }
  }

  /**
   * Ensure queued events are sent.
   * Should be called before exit.
   * Handles errors gracefully.
   *
   * @example
   * try {
   *   // Run command
   * } finally {
   *   await client.shutdown();
   * }
   */
  async shutdown(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    // Final attempt to flush any queued events
    await this.flush();

    if (this.postHogClient) {
      try {
        await this.postHogClient.shutdown();
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
