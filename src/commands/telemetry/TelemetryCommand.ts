import { Telemetry } from '../../telemetry/Telemetry.js';
import { UnvalidatedCLIOptions } from '../../types/types.js';

interface TelemetryInvocation {
  readonly startTime: number;
  readonly options: UnvalidatedCLIOptions;
}

/**
 * Records telemetry for CLI command execution.
 * Encapsulates all telemetry logic to keep CLI clean.
 */
export class TelemetryCommand {
  private readonly telemetry: Telemetry;
  private readonly invocation: TelemetryInvocation;

  constructor(options: UnvalidatedCLIOptions) {
    this.telemetry = Telemetry.getInstance();
    this.invocation = {
      startTime: Date.now(),
      options,
    };

    // Record initial command invocation
    this.recordInvocation();
  }

  private recordInvocation() {
    this.telemetry.record({
      name: 'command_invoked',
      properties: {
        args_provided: {
          file: this.invocation.options.file != undefined,
          format: this.invocation.options.format != undefined,
          matches: this.invocation.options.matches != undefined,
          numRounds: this.invocation.options.numRounds != undefined,
          order: this.invocation.options.order != undefined,
          startRound: this.invocation.options.startRound != undefined,
          teams: this.invocation.options.teams != undefined,
        },
        teams_count: this.invocation.options.teams?.length,
        squad_count: this.invocation.options.teams?.filter((t) => t.includes('[') && t.includes(']')).length,
        rounds_count: Number(this.invocation.options.numRounds),
        start_round: Number(this.invocation.options.startRound),
        order: this.invocation.options.order,
        format: this.invocation.options.format,
      },
    });
  }

  recordSuccess() {
    this.telemetry.record({
      name: 'command_succeeded',
      properties: {
        duration_ms: Date.now() - this.invocation.startTime,
      },
    });
  }

  recordValidationFailure(message: string) {
    this.telemetry.record({
      name: 'command_failed',
      properties: {
        error_name: 'validation_failed',
        error_message: message,
        duration_ms: Date.now() - this.invocation.startTime,
      },
    });
  }

  recordError(error: Error) {
    this.telemetry.record({
      name: 'command_error',
      properties: {
        error_name: error.name,
        error_message: error.message,
        duration_ms: Date.now() - this.invocation.startTime,
      },
    });
  }

  async shutdown() {
    await this.telemetry.shutdown();
  }
}
