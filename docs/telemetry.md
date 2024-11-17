# Telemetry Guide

## Overview

The CLI collects anonymous usage data to improve user experience and guide development. This data is carefully scoped to avoid any sensitive or personal information.

## Data Collection

### What We Collect

- Command line arguments provided (presence only, not values)
- Number of teams and squads
- Number of rounds
- Execution duration
- Basic system info (Node version, OS)
- Error conditions encountered

### What We Don't Collect

- Team names
- Match results
- File contents
- Personal information
- System identifiers

## Events

```typescript
// Command invocation
{
  name: 'command_invoked',
  properties: {
    args_provided: {
      teams: true,
      numRounds: false,
      // etc
    },
    teams_count: 4,
    squad_count: 2
  }
}

// Command completion
{
  name: 'command_succeeded',
  properties: {
    duration_ms: 123
  }
}
```

## Privacy Controls

### Opt Out

Set environment variable to disable telemetry:

```bash
export SWISS_PAIRING_TELEMETRY_OPT_OUT=1
```

### First Run Notice

Users see privacy notice on first run:

```bash
Telemetry Notice
----------------
To help improve this tool, we collect anonymous usage data...
```

### Environment Rules

- Telemetry disabled in test environment
- Telemetry disabled in CI environment
- Configurable per environment

## Implementation

### Privacy Checks

```typescript
class TelemetryCommand {
  private readonly telemetryClient: TelemetryClient | undefined;

  constructor({ shouldShowTelemetryNotice }: TelemetryCommandInput) {
    if (shouldShowTelemetryNotice) {
      return;
    }
  }
}

class TelemetryClient {
  recordEvent(event: TelemetryEvent) {
    if (this.isOptedOut()) return;
    this.queue.push(event);
  }
}
```

### Collection

```typescript
function shouldEnableTelemetry({ telemetryOptOut, environment }: Config): boolean {
  if (environment === 'ci') return false;
  return !telemetryOptOut;
}
```

## Debug Logging

Enable telemetry debug logs:

```bash
DEBUG=swiss-pairing-cli:telemetry npm start
```
