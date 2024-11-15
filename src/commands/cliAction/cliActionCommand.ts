import { CLIActionCommand, CLIActionCommandOutput } from '../commandTypes.js';

import { TelemetryCommand } from '../telemetry/TelemetryCommand.js';
import { TelemetryNotificationManager } from '../../telemetry/TelemetryNotificationManager.js';
import { handleCorePipelineCommand } from '../corePipeline/corePipelineCommand.js';
import { normalizeError } from '../../utils/utils.js';

export async function handleCLIAction(command: CLIActionCommand): Promise<CLIActionCommandOutput> {
  const notificationManager = new TelemetryNotificationManager();
  const shouldShowTelemetryNotice = notificationManager.shouldShowTelemetryNotice();

  const telemetryCommand = new TelemetryCommand({ options: command, shouldShowTelemetryNotice });
  telemetryCommand.recordInvocation();

  let outputPrefix = '';
  if (shouldShowTelemetryNotice) {
    outputPrefix = TelemetryNotificationManager.getTelemetryNotice();
    notificationManager.markTelemetryNoticeShown();
  }

  let resultOutput: string;
  let exitCode: number;
  try {
    const result = await handleCorePipelineCommand(command);

    if (result.success) {
      // Record success
      telemetryCommand.recordSuccess();
      resultOutput = result.value;
      exitCode = 0;
    } else {
      // Handle validation failure
      telemetryCommand.recordValidationFailure();
      resultOutput = result.message;
      exitCode = 1;
    }
  } catch (error) {
    // Handle unexpected failure
    const normalizedError = normalizeError(error);
    telemetryCommand.recordError(normalizedError);
    resultOutput = `${normalizedError.name}: ${normalizedError.message}`;
    exitCode = 1;
  } finally {
    // Send telemetry
    await telemetryCommand.shutdown();
  }
  return { output: `${outputPrefix}${resultOutput}`, exitCode };
}
