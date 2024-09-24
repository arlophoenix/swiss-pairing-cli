import { CLIOptionOrder } from './types.js';

export const ARG_FILE = 'file';
export const ARG_MATCHES = 'matches';
export const ARG_NUM_ROUNDS = 'num-rounds';
export const ARG_ORDER = 'order';
export const ARG_PLAYERS = 'players';
export const ARG_START_ROUND = 'start-round';

export const BYE_PLAYER = 'BYE';

export const CLI_OPTION_ORDER_TOP_DOWN = 'top-down';
export const CLI_OPTION_ORDER_BOOTOM_UP = 'bottom-up';
export const CLI_OPTION_ORDER_RANDOM = 'random';
export const CLI_OPTION_ORDER = [
  CLI_OPTION_ORDER_TOP_DOWN,
  CLI_OPTION_ORDER_BOOTOM_UP,
  CLI_OPTION_ORDER_RANDOM,
] as const;

export const CLI_OPTION_ORDER_DEFAULT: CLIOptionOrder = CLI_OPTION_ORDER_TOP_DOWN;

export const SUPPORTED_FILE_TYPE_CSV = '.csv';
export const SUPPORTED_FILE_TYPE_JSON = '.json';
export const SUPPORTED_FILE_TYPES = [SUPPORTED_FILE_TYPE_CSV, SUPPORTED_FILE_TYPE_JSON] as const;

export const PROGRAM_NAME = 'swiss-pairing';
export const EXAMPLE_PLAYERS = 'Alice Bob Charlie David';
export const EXAMPLE_MATCHES = '"Alice,Bob" "Charlie,David"';
export const EXAMPLE_FILE_CSV = 'tournament_data.csv';
export const EXAMPLE_FILE_JSON = 'tournament_data.json';
