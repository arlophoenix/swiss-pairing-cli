/**
 * CLI command orchestration and telemetry.
 *
 * Responsibilities:
 * 1. Record command telemetry events
 * 2. Display first-run notices
 * 3. Execute command pipeline
 * 4. Format output and exit codes
 * 5. Handle graceful shutdown
 *
 * Critical paths:
 * - Success (exit 0): Command completes normally
 * - Validation failure (exit 1): Invalid input detected
 * - Error (exit 1): Unexpected error during execution
 *
 * @module cliActionCommand
 */

import { CLIActionCommand, CLIActionCommandOutput } from '../commandTypes.js';

import { TelemetryCommand } from '../telemetry/TelemetryCommand.js';
import { TelemetryNotificationManager } from '../../telemetry/TelemetryNotificationManager.js';
import { handleCorePipelineCommand } from '../corePipeline/corePipelineCommand.js';
import { normalizeError } from '../../utils/utils.js';

/**
 * Execute command with telemetry tracking and error handling.
 * Entry point for all CLI commands.
 *
 * Process:
 * 1. Check first-run notice
 * 2. Record command invocation
 * 3. Execute command pipeline
 * 4. Record success/failure
 * 5. Shutdown telemetry
 *
 * @param command - Raw CLI arguments to process
 * @returns Output text and process exit code
 *
 * @example
 * // Success case
 * const success = await handleCLIAction({
 *   teams: ["Team1", "Team2"],
 *   numRounds: "2"
 * });
 * // { output: "Round 1...", exitCode: 0 }
 *
 * // Validation failure
 * const invalid = await handleCLIAction({
 *   teams: ["Team1"], // Invalid: too few teams
 * });
 * // { output: "Error: At least 2 teams required", exitCode: 1 }
 *
 * // Unexpected error
 * const error = await handleCLIAction({
 *   file: "missing.csv"
 * });
 * // { output: "FileNotFound: missing.csv", exitCode: 1 }
 */
export async function handleCLIAction(command: CLIActionCommand): Promise<CLIActionCommandOutput> {
  // Initialize telemetry
  const notificationManager = new TelemetryNotificationManager();
  const shouldShowTelemetryNotice = notificationManager.shouldShowTelemetryNotice();

  const telemetryCommand = new TelemetryCommand({
    options: command,
    shouldShowTelemetryNotice,
  });
  telemetryCommand.recordInvocation();

  let resultOutput: string;
  let exitCode: number;
  try {
    // Execute command pipeline
    const result = await handleCorePipelineCommand(command);

    if (result.success) {
      telemetryCommand.recordSuccess();
      resultOutput = result.value;
      exitCode = 0;
    } else {
      telemetryCommand.recordValidationFailure();
      resultOutput = result.message;
      exitCode = 1;
    }
  } catch (error) {
    // Handle unexpected errors
    const normalizedError = normalizeError(error);
    telemetryCommand.recordError(normalizedError);
    resultOutput = `${normalizedError.name}: ${normalizedError.message}`;
    exitCode = 1;
  } finally {
    // Ensure telemetry is flushed
    await telemetryCommand.shutdown();
  }

  let output;
  // Handle first-run notice
  if (shouldShowTelemetryNotice) {
    notificationManager.markTelemetryNoticeShown();
    output = `${TelemetryNotificationManager.getTelemetryNotice()}${resultOutput}`;
  } else {
    output = resultOutput;
  }

  return {
    output,
    exitCode,
  };
}
