import { ENV_SWISS_PAIRING_POSTHOG_API_KEY, ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT } from './constants.js';

import dotenv from 'dotenv';

dotenv.config();

export const POSTHOG_API_KEY = process.env[ENV_SWISS_PAIRING_POSTHOG_API_KEY] ?? '';
export const TELEMETRY_OPT_OUT = process.env[ENV_SWISS_PAIRING_TELEMETRY_OPT_OUT] ?? '';
