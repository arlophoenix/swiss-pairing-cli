import * as corePipelineCommand from '../commands/corePipeline/corePipelineCommand.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { TelemetryCommand } from '../commands/telemetry/TelemetryCommand.js';
import { TelemetryNotificationManager } from '../telemetry/TelemetryNotificationManager.js';
import { createCLI } from './cli.js';

jest.mock('../commands/corePipeline/corePipelineCommand.js');

describe('CLI', () => {
  let mockhandleCorePipelineCommand: SpyInstance<typeof corePipelineCommand.handleCorePipelineCommand>;
  let mockConsoleLog: SpyInstance;
  let mockConsoleError: SpyInstance;
  let mockProcessExit: SpyInstance<typeof process.exit>;

  beforeEach(() => {
    mockhandleCorePipelineCommand = jest
      .spyOn(corePipelineCommand, 'handleCorePipelineCommand')
      .mockResolvedValue({ success: true, value: 'Matches generated successfully' });
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {
      // do nothing
    });
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // do nothing
    });
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code?) => {
      throw new Error(`Process exited with code ${String(code)}`);
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle successful case', async () => {
    const program = createCLI();
    await program.parseAsync(['node', 'swiss-pairing', '--teams', 'Alice', 'Bob']);

    expect(corePipelineCommand.handleCorePipelineCommand).toHaveBeenCalledWith(
      expect.objectContaining({ teams: ['Alice', 'Bob'] })
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('Matches generated successfully');
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    jest.spyOn(corePipelineCommand, 'handleCorePipelineCommand').mockResolvedValue({
      success: false,
      message: 'Invalid input',
    });

    const program = createCLI();
    await expect(program.parseAsync(['node', 'swiss-pairing', '--teams', 'Alice'])).rejects.toThrow(
      'Process exited with code 1'
    );

    expect(mockConsoleError).toHaveBeenCalledWith('Invalid input');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should pass through all options', async () => {
    const program = createCLI();
    await program.parseAsync([
      'node',
      'swiss-pairing',
      '--teams',
      'Alice',
      'Bob',
      '--num-rounds',
      '3',
      '--start-round',
      '2',
      '--order',
      'random',
      '--format',
      'json-pretty',
      '--matches',
      'Alice,Bob',
      '--file',
      'data.csv',
    ]);

    expect(mockhandleCorePipelineCommand).toHaveBeenCalledWith({
      teams: ['Alice', 'Bob'],
      numRounds: '3',
      startRound: '2',
      order: 'random',
      format: 'json-pretty',
      matches: [['Alice', 'Bob']],
      file: 'data.csv',
    });
  });

  describe('telemetry flow', () => {
    let mockShouldShowTelemetryNotice: SpyInstance<
      typeof TelemetryNotificationManager.prototype.shouldShowTelemetryNotice
    >;
    let mockRecordInvocation: SpyInstance<typeof TelemetryCommand.prototype.recordInvocation>;

    beforeEach(() => {
      mockShouldShowTelemetryNotice = jest.spyOn(
        TelemetryNotificationManager.prototype,
        'shouldShowTelemetryNotice'
      );
      mockRecordInvocation = jest.spyOn(TelemetryCommand.prototype, 'recordInvocation');
    });

    it('should show notice and not collect telemetry on first run', async () => {
      mockShouldShowTelemetryNotice.mockReturnValue(true);
      const program = createCLI();
      await program.parseAsync(['node', 'swiss-pairing', '--teams', 'Alice', 'Bob']);

      expect(console.log).toHaveBeenCalledWith(TelemetryNotificationManager.getTelemetryNotice());
      expect(mockRecordInvocation).toHaveBeenCalled();
    });

    it('should collect telemetry and not show notice on subsequent runs', async () => {
      mockShouldShowTelemetryNotice.mockReturnValue(false);
      const program = createCLI();
      await program.parseAsync(['node', 'swiss-pairing', '--teams', 'Alice', 'Bob']);

      expect(console.log).not.toHaveBeenCalledWith(TelemetryNotificationManager.getTelemetryNotice());
      expect(mockRecordInvocation).toHaveBeenCalled();
    });
  });
});
