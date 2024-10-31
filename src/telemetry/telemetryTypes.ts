import { UnvalidatedCLIOptions } from '../types/types.js';

export interface SystemContext {
  readonly node_version: string;
  readonly cli_version: string | undefined;
  readonly os_name: string;
  readonly ci: boolean;
  readonly execution_context: 'npx' | 'global' | 'local';
}

interface BaseEvent<T extends string, P> {
  readonly name: T;
  readonly properties: P;
}

interface BaseCLIEventProperties {
  readonly command_name: string;
  readonly args_provided: Record<keyof UnvalidatedCLIOptions, boolean>;
}

interface CommandInvokedProperties extends BaseCLIEventProperties {
  readonly teams_count: number | undefined;
  readonly squad_count: number | undefined;
  readonly rounds_count: number | undefined;
  readonly start_round: number | undefined;
  readonly order: string | undefined;
  readonly format: string | undefined;
}

interface CommandSucceededProperties extends BaseCLIEventProperties {
  readonly duration_ms: number;
}

interface CommandFailedProperties extends BaseCLIEventProperties {
  readonly duration_ms: number;
  readonly error_type: 'validation_error';
  readonly error_message: string;
}

interface CommandErrorProperties extends BaseCLIEventProperties {
  readonly duration_ms: number;
  readonly error_name: string;
  readonly error_message: string;
}

interface CommandCancelledProperties extends BaseCLIEventProperties {
  readonly duration_ms: number;
}

export type RawTelemetryEvent =
  | BaseEvent<'command_invoked', CommandInvokedProperties>
  | BaseEvent<'command_succeeded', CommandSucceededProperties>
  | BaseEvent<'command_failed', CommandFailedProperties>
  | BaseEvent<'command_error', CommandErrorProperties>
  | BaseEvent<'command_cancelled', CommandCancelledProperties>;

export type TelemetryEvent = {
  readonly [K in RawTelemetryEvent['name']]: BaseEvent<
    K,
    Extract<RawTelemetryEvent, { readonly name: K }>['properties'] & SystemContext
  >;
}[RawTelemetryEvent['name']];
