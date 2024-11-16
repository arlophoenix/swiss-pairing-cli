/**
 * Command telemetry tracking and privacy management.
 *
 * Records anonymous usage data while respecting privacy:
 * - No personal information collected
 * - No command arguments recorded
 * - Opt-out supported via environment variable
 * - First-run telemetry disabled
 * - Data aggregated by execution context
 *
 * Events tracked:
 * - command_invoked: Command execution started
 * - command_succeeded: Command completed successfully
 * - command_failed: Command failed validation
 * - command_errored: Unexpected error occurred
 *
 * @module TelemetryCommand
 */

import { TelemetryClient } from '../../telemetry/TelemetryClient.js';
import { TelemetryCommandInput } from '../commandTypes.js';
import { UnvalidatedCLIOptions } from '../../types/types.js';

/**
 * Records command execution telemetry.
 * Handles command lifecycle events and error tracking.
 *
 * Usage:
 * 1. Create instance for command
 * 2. Record invocation
 * 3. Record success/failure
 * 4. Shutdown to ensure data is sent
 */
export class TelemetryCommand {
  private readonly telemetryClient: TelemetryClient | undefined;
  private readonly startTime: number;

  /**
   * Initialize telemetry for command execution.
   * Disables telemetry on first run.
   *
   * @param shouldShowTelemetryNotice - Whether this is first run
   *
   * @example
   * const command = new TelemetryCommand({
   *   shouldShowTelemetryNotice: false
   * });
   */
  constructor({ shouldShowTelemetryNotice }: TelemetryCommandInput) {
    this.startTime = Date.now();
    if (shouldShowTelemetryNotice) {
      return;
    }
    this.telemetryClient = TelemetryClient.getInstance();
  }

  /**
   * Record command invocation with metadata.
   * Only records non-sensitive data about command structure.
   *
   * @param options - Command options to analyze
   *
   * @example
   * command.recordInvocation();
   * // Records:
   * // - Which arguments were provided
   * // - Team/round counts
   * // - Output format
   */
  recordInvocation(options: UnvalidatedCLIOptions) {
    this.telemetryClient?.record({
      name: 'command_invoked',
      properties: {
        args_provided: {
          file: options.file != undefined,
          format: options.format != undefined,
          matches: options.matches != undefined,
          numRounds: options.numRounds != undefined,
          order: options.order != undefined,
          startRound: options.startRound != undefined,
          teams: options.teams != undefined,
        },
        teams_count: options.teams?.length,
        squad_count: options.teams?.filter((t) => t.includes('[') && t.includes(']')).length,
        rounds_count: Number(options.numRounds),
        start_round: Number(options.startRound),
        order: options.order,
        format: options.format,
      },
    });
  }

  /**
   * Record successful command completion.
   * Includes execution duration.
   *
   * @example
   * command.recordSuccess();
   * // Records duration_ms: time since invocation
   */
  recordSuccess() {
    this.telemetryClient?.record({
      name: 'command_succeeded',
      properties: {
        duration_ms: Date.now() - this.startTime,
      },
    });
  }

  /**
   * Record validation failure.
   * Used when command input is invalid.
   *
   * @example
   * command.recordValidationFailure();
   * // Records:
   * // - error_name: "validation_failed"
   * // - duration_ms: time since invocation
   */
  recordValidationFailure() {
    this.telemetryClient?.record({
      name: 'command_failed',
      properties: {
        error_name: 'validation_failed',
        duration_ms: Date.now() - this.startTime,
      },
    });
  }

  /**
   * Record unexpected error.
   * Used for runtime errors during execution.
   *
   * @param error - Error that occurred
   *
   * @example
   * command.recordError(new Error("File not found"));
   * // Records:
   * // - error_name: "Error"
   * // - error_message: "File not found"
   * // - duration_ms: time since invocation
   */
  recordError(error: Error) {
    this.telemetryClient?.record({
      name: 'command_errored',
      properties: {
        error_name: error.name,
        error_message: error.message,
        duration_ms: Date.now() - this.startTime,
      },
    });
  }

  /**
   * Ensure telemetry data is sent.
   * Should be called in finally block.
   *
   * @example
   * try {
   *   // Execute command
   * } finally {
   *   await command.shutdown();
   * }
   */
  async shutdown() {
    await this.telemetryClient?.shutdown();
  }
}
