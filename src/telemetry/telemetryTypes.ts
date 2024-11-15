import { UnvalidatedCLIOptions } from '../types/types.js';

export interface SystemContext {
  readonly node_version: string;
  readonly cli_version: string | undefined;
  readonly os_name: string;
  readonly environment: 'test' | 'development' | 'ci' | 'production';
  readonly execution_context: 'npx' | 'global' | 'local';
}

interface BaseEvent<T extends string, P> {
  readonly name: T;
  readonly properties: P;
}

interface CommandInvokedProperties {
  readonly args_provided: Record<keyof UnvalidatedCLIOptions, boolean>;
  readonly teams_count: number | undefined;
  readonly squad_count: number | undefined;
  readonly rounds_count: number | undefined;
  readonly start_round: number | undefined;
  readonly order: string | undefined;
  readonly format: string | undefined;
}

interface CommandSucceededProperties {
  readonly duration_ms: number;
}

interface CommandFailedProperties {
  readonly duration_ms: number;
  readonly error_name: string;
}

interface CommandErroredProperties {
  readonly duration_ms: number;
  readonly error_name: string;
  readonly error_message: string;
}

interface CommandCancelledProperties {
  readonly duration_ms: number;
}

export type TelemetryEvent =
  | BaseEvent<'command_invoked', CommandInvokedProperties>
  | BaseEvent<'command_succeeded', CommandSucceededProperties>
  | BaseEvent<'command_failed', CommandFailedProperties>
  | BaseEvent<'command_errored', CommandErroredProperties>
  | BaseEvent<'command_cancelled', CommandCancelledProperties>;

export interface AugmentedTelemetryEvent<T extends TelemetryEvent = TelemetryEvent> {
  readonly name: T['name'];
  readonly properties: T['properties'] & SystemContext;
}
