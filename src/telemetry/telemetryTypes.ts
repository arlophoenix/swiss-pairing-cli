/**
 * Telemetry event type definitions.
 *
 * Events tracked:
 * - Command invocation
 * - Command completion (success/failure)
 * - Validation failures
 * - Runtime errors
 *
 * All events include system context metadata
 * but no personally identifiable information.
 *
 * @module telemetryTypes
 */

import { UnvalidatedCLIOptions } from '../types/types.js';

/**
 * System metadata included with all events.
 * Used for aggregating usage patterns.
 */
export interface SystemContext {
  /** Node.js version running CLI */
  readonly node_version: string;
  /** CLI package version */
  readonly cli_version: string | undefined;
  /** Operating system identifier */
  readonly os_name: string;
  /** Runtime environment (test/dev/prod) */
  readonly environment: 'test' | 'development' | 'ci' | 'production';
  /** Installation context (npx/global/local) */
  readonly execution_context: 'npx' | 'global' | 'local';
}

/**
 * Base event structure with metadata.
 * All events extend this with specific properties.
 *
 * @template T - Event name literal type
 * @template P - Event properties type
 */
interface BaseEvent<T extends string, P> {
  /** Event type identifier */
  readonly name: T;
  /** Event-specific properties */
  readonly properties: P;
}

/**
 * Command invocation event properties.
 * Records which features were used without values.
 *
 * @example
 * {
 *   args_provided: { teams: true, numRounds: true },
 *   teams_count: 4,
 *   squad_count: 2,
 *   rounds_count: 3,
 *   format: "text-markdown"
 * }
 */
interface CommandInvokedProperties {
  /** Which CLI arguments were provided */
  readonly args_provided: Record<keyof UnvalidatedCLIOptions, boolean>;
  /** Number of teams specified */
  readonly teams_count: number | undefined;
  /** Number of teams with squad assignments */
  readonly squad_count: number | undefined;
  /** Number of rounds requested */
  readonly rounds_count: number | undefined;
  /** Starting round number */
  readonly start_round: number | undefined;
  /** Team pairing order used */
  readonly order: string | undefined;
  /** Output format requested */
  readonly format: string | undefined;
}

/**
 * Successful command completion properties.
 *
 * @example
 * { duration_ms: 123 }
 */
interface CommandSucceededProperties {
  /** Total execution time in milliseconds */
  readonly duration_ms: number;
}

/**
 * Command validation failure properties.
 * Used when input validation fails.
 *
 * @example
 * {
 *   duration_ms: 45,
 *   error_name: "validation_failed"
 * }
 */
interface CommandFailedProperties {
  /** Time until failure in milliseconds */
  readonly duration_ms: number;
  /** Type of validation failure */
  readonly error_name: string;
}

/**
 * Unexpected error properties.
 * Used for runtime errors during execution.
 *
 * @example
 * {
 *   duration_ms: 67,
 *   error_name: "FileNotFoundError",
 *   error_message: "Could not read teams.csv"
 * }
 */
interface CommandErroredProperties {
  /** Time until error in milliseconds */
  readonly duration_ms: number;
  /** Error type/name */
  readonly error_name: string;
  /** Error detail message */
  readonly error_message: string;
}

/**
 * Command cancellation properties.
 * Used when execution is interrupted.
 *
 * @example
 * { duration_ms: 89 }
 */
interface CommandCancelledProperties {
  /** Time until cancellation in milliseconds */
  readonly duration_ms: number;
}

/**
 * Union of all possible telemetry events.
 * Each event combines base structure with specific properties.
 */
export type TelemetryEvent =
  | BaseEvent<'command_invoked', CommandInvokedProperties>
  | BaseEvent<'command_succeeded', CommandSucceededProperties>
  | BaseEvent<'command_failed', CommandFailedProperties>
  | BaseEvent<'command_errored', CommandErroredProperties>
  | BaseEvent<'command_cancelled', CommandCancelledProperties>;

/**
 * Event with system context added.
 * All events are augmented with metadata before sending.
 *
 * @template T - Original event type
 */
export interface AugmentedTelemetryEvent<T extends TelemetryEvent = TelemetryEvent> {
  readonly name: T['name'];
  /** Event properties combined with system context */
  readonly properties: T['properties'] & SystemContext;
}
