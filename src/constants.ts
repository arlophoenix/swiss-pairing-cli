import { CLIOptionFormat, CLIOptionOrder, ValidatedCLIOptions } from './types.js';

export const ARG_FILE = 'file';
export const ARG_FORMAT = 'format';
export const ARG_MATCHES = 'matches';
export const ARG_NUM_ROUNDS = 'num-rounds';
export const ARG_ORDER = 'order';
export const ARG_PLAYERS = 'players';
export const ARG_START_ROUND = 'start-round';
export const ARGS = [
  ARG_FILE,
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_PLAYERS,
  ARG_START_ROUND,
] as const;

export const BYE_PLAYER = 'BYE';

export const CLI_OPTION_ORDER_BOTOM_UP = 'bottom-up';
export const CLI_OPTION_ORDER_RANDOM = 'random';
export const CLI_OPTION_ORDER_TOP_DOWN = 'top-down';
export const CLI_OPTION_ORDER = [
  CLI_OPTION_ORDER_TOP_DOWN,
  CLI_OPTION_ORDER_BOTOM_UP,
  CLI_OPTION_ORDER_RANDOM,
] as const;

export const CLI_OPTION_FORMAT_TEXT = 'text';
export const CLI_OPTION_FORMAT_JSON_PLAIN = 'json-plain';
export const CLI_OPTION_FORMAT_JSON_PRETTY = 'json-pretty';
export const CLI_OPTION_FORMAT = [
  CLI_OPTION_FORMAT_TEXT,
  CLI_OPTION_FORMAT_JSON_PLAIN,
  CLI_OPTION_FORMAT_JSON_PRETTY,
] as const;

export const CLI_OPTION_FORMAT_DEFAULT: CLIOptionFormat = CLI_OPTION_FORMAT_TEXT;
export const CLI_OPTION_MATCHES_DEFAULT = [];
export const CLI_OPTION_NUM_ROUND_DEFAULT = 1;
export const CLI_OPTION_ORDER_DEFAULT: CLIOptionOrder = CLI_OPTION_ORDER_TOP_DOWN;
export const CLI_OPTION_PLAYERS_DEFAULT = [];
export const CLI_OPTION_START_ROUND_DEFAULT = 1;
export const CLI_OPTION_DEFAULTS: ValidatedCLIOptions = {
  file: '',
  format: CLI_OPTION_FORMAT_DEFAULT,
  matches: CLI_OPTION_MATCHES_DEFAULT,
  numRounds: CLI_OPTION_NUM_ROUND_DEFAULT,
  order: CLI_OPTION_ORDER_DEFAULT,
  players: CLI_OPTION_PLAYERS_DEFAULT,
  startRound: CLI_OPTION_START_ROUND_DEFAULT,
};

export const SUPPORTED_FILE_TYPE_CSV = '.csv';
export const SUPPORTED_FILE_TYPE_JSON = '.json';
export const SUPPORTED_FILE_TYPES = [SUPPORTED_FILE_TYPE_CSV, SUPPORTED_FILE_TYPE_JSON] as const;

export const PROGRAM_NAME = 'swiss-pairing';
export const EXAMPLE_PLAYERS = 'Alice Bob Charlie David';
export const EXAMPLE_MATCHES = '"Alice,Bob" "Charlie,David"';
export const EXAMPLE_FILE_CSV = 'tournament_data.csv';
export const EXAMPLE_FILE_JSON = 'tournament_data.json';
