import { CLIOptionOrder } from './types.js';

export const ARG_FILE = 'file';
export const ARG_MATCHES = 'matches';
export const ARG_NUM_ROUNDS = 'num-rounds';
export const ARG_ORDER = 'order';
export const ARG_PLAYERS = 'players';
export const ARG_START_ROUND = 'start-round';

export const BYE_PLAYER = 'BYE';

export const CLI_OPTION_ORDER = ['top-down', 'random', 'bottom-up'] as const;

export const CLI_OPTION_ORDER_DEFAULT: CLIOptionOrder = 'top-down';

export const SUPPORTED_FILE_TYPE_CSV = '.csv';
export const SUPPORTED_FILE_TYPE_JSON = '.json';
export const SUPPORTED_FILE_TYPES = [SUPPORTED_FILE_TYPE_CSV, SUPPORTED_FILE_TYPE_JSON] as const;
