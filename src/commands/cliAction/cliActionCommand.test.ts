import * as corePipelineCommand from '../corePipeline/corePipelineCommand.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { TelemetryManager } from '../../telemetry/TelemetryManager.js';
import { TelemetryNotificationManager } from '../../telemetry/TelemetryNotificationManager.js';
import { handleCLIAction } from './cliActionCommand.js';

jest.mock('../corePipeline/corePipelineCommand.js');

describe('handleCLIAction', () => {
  let mockhandleCorePipelineCommand: SpyInstance<typeof corePipelineCommand.handleCorePipelineCommand>;
  let mockShouldShowTelemetryNotice: SpyInstance<
    typeof TelemetryNotificationManager.prototype.shouldShowTelemetryNotice
  >;
  let mockRecordInvocation: SpyInstance<typeof TelemetryManager.prototype.recordInvocation>;
  let mockRecordSuccess: SpyInstance<typeof TelemetryManager.prototype.recordSuccess>;
  let mockRecordValidationFailure: SpyInstance<typeof TelemetryManager.prototype.recordValidationFailure>;
  let mockRecordError: SpyInstance<typeof TelemetryManager.prototype.recordError>;
  let mockShutdown: SpyInstance;

  beforeEach(() => {
    mockhandleCorePipelineCommand = jest
      .spyOn(corePipelineCommand, 'handleCorePipelineCommand')
      .mockResolvedValue({ success: true, value: 'Matches generated successfully' });

    mockShouldShowTelemetryNotice = jest
      .spyOn(TelemetryNotificationManager.prototype, 'shouldShowTelemetryNotice')
      .mockReturnValue(false);

    mockRecordInvocation = jest.spyOn(TelemetryManager.prototype, 'recordInvocation').mockReturnValue();

    mockRecordSuccess = jest.spyOn(TelemetryManager.prototype, 'recordSuccess').mockReturnValue();

    mockRecordValidationFailure = jest
      .spyOn(TelemetryManager.prototype, 'recordValidationFailure')
      .mockReturnValue();

    mockRecordError = jest.spyOn(TelemetryManager.prototype, 'recordError').mockReturnValue();

    mockShutdown = jest.spyOn(TelemetryManager.prototype, 'shutdown').mockResolvedValue();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle successful case', async () => {
    const result = await handleCLIAction({ teams: ['Alice', 'Bob'] });

    expect(result).toEqual({
      output: 'Matches generated successfully',
      exitCode: 0,
    });
    expect(mockRecordInvocation).toHaveBeenCalled();
    expect(mockRecordSuccess).toHaveBeenCalled();
    expect(mockShutdown).toHaveBeenCalled();
  });

  it('should handle validation failure', async () => {
    mockhandleCorePipelineCommand.mockResolvedValue({
      success: false,
      message: 'Invalid input',
    });

    const result = await handleCLIAction({ teams: ['Alice'] });

    expect(result).toEqual({
      output: 'Invalid input',
      exitCode: 1,
    });
    expect(mockRecordInvocation).toHaveBeenCalled();
    expect(mockRecordValidationFailure).toHaveBeenCalled();
    expect(mockShutdown).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    mockhandleCorePipelineCommand.mockRejectedValue(new Error('Unexpected error'));

    const result = await handleCLIAction({ teams: ['Alice'] });

    expect(result).toEqual({
      output: 'Error: Unexpected error',
      exitCode: 1,
    });
    expect(mockRecordInvocation).toHaveBeenCalled();
    expect(mockRecordError).toHaveBeenCalled();
    expect(mockShutdown).toHaveBeenCalled();
  });

  describe('telemetry notice', () => {
    it('should show notice on first run', async () => {
      mockShouldShowTelemetryNotice.mockReturnValue(true);

      const { output } = await handleCLIAction({ teams: ['Alice', 'Bob'] });

      expect(output).toContain(TelemetryNotificationManager.getTelemetryNotice());
    });

    it('should not show notice on subsequent runs', async () => {
      mockShouldShowTelemetryNotice.mockReturnValue(false);

      const { output } = await handleCLIAction({ teams: ['Alice', 'Bob'] });

      expect(output).not.toContain(TelemetryNotificationManager.getTelemetryNotice());
    });
  });
});
