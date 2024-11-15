import {
  DOTENV_DEV,
  DOTENV_TEST,
  ENV_POSTHOG_API_KEY,
  ENV_SHOW_TELEMETRY_NOTICE,
  ENV_TELEMETRY_OPT_OUT,
  POSTHOG_API_KEY,
} from './constants.js';

import dotenv from 'dotenv';

export class Config {
  // eslint-disable-next-line functional/prefer-readonly-type
  private static instance: Config | null = null;
  private readonly env: NodeJS.ProcessEnv;

  public static getInstance(): Config {
    if (!Config.instance) {
      // eslint-disable-next-line functional/immutable-data
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private constructor(env: NodeJS.ProcessEnv = process.env) {
    this.env = env;
    dotenv.config({
      path: env.NODE_ENV === 'test' ? DOTENV_TEST : DOTENV_DEV,
    });
  }

  public getPosthogApiKey(): string {
    return this.env[ENV_POSTHOG_API_KEY] ?? POSTHOG_API_KEY;
  }

  public getTelemetryOptOut(): boolean {
    return Boolean(this.env[ENV_TELEMETRY_OPT_OUT]);
  }

  public getShowTelemetryNoticeOverride(): 'show' | 'hide' | 'default' {
    const envValue = this.env[ENV_SHOW_TELEMETRY_NOTICE]?.toLowerCase();
    if (envValue === undefined) {
      return 'default';
    }
    switch (envValue) {
      case '1':
      case 'true':
      case 'show':
        return 'show';
      case '0':
      case 'false':
      case 'hide':
        return 'hide';
      default:
        return 'default';
    }
  }

  // For testing only
  public static resetForTesting({ env }: { readonly env: NodeJS.ProcessEnv | null }) {
    if (env === null) {
      // eslint-disable-next-line functional/immutable-data
      Config.instance = null;
      return;
    }
    // eslint-disable-next-line functional/immutable-data
    Config.instance = new Config(env);
  }
}
