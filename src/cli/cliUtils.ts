import { TelemetryNotificationManager } from '../telemetry/TelemetryNotificationManager.js';

export function showTelemetryNoticeIfNecessary() {
  const notificationManager = new TelemetryNotificationManager();

  if (notificationManager.shouldShowTelemetryNotice()) {
    console.log(TelemetryNotificationManager.getTelemetryNotice());
    notificationManager.markTelemetryNoticeShown();
  }
}
