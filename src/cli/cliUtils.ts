import { FirstRunManager } from '../telemetry/FirstRunManager.js';

export function showTelemetryNoticeIfNecessary() {
  const firstRunManager = new FirstRunManager();

  if (firstRunManager.shouldShowTelemetryNotice()) {
    console.log(FirstRunManager.getTelemetryNotice());
    firstRunManager.markTelemetryNoticeShown();
  }
}
