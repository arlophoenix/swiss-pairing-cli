import { CLIOptionFormat, CLIOptionOrder, ValidatedCLIOptions } from './types/types.js';

export const ARG_FILE = 'file';
export const ARG_FORMAT = 'format';
export const ARG_MATCHES = 'matches';
export const ARG_MATCHES_SHORT = ARG_MATCHES.charAt(0);
export const ARG_NUM_ROUNDS = 'num-rounds';
export const ARG_NUM_ROUNDS_SHORT = ARG_NUM_ROUNDS.charAt(0);
export const ARG_ORDER = 'order';
export const ARG_ORDER_SHORT = ARG_ORDER.charAt(0);
export const ARG_TEAMS = 'teams';
export const ARG_TEAMS_SHORT = ARG_TEAMS.charAt(0);
export const ARG_START_ROUND = 'start-round';
export const ARG_START_ROUND_SHORT = ARG_START_ROUND.charAt(0);
export const ARGS = [
  ARG_FILE,
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_TEAMS,
  ARG_START_ROUND,
] as const;

export const BYE_TEAM = 'BYE';

export const CLI_OPTION_ORDER_BOTOM_UP = 'bottom-up';
export const CLI_OPTION_ORDER_RANDOM = 'random';
export const CLI_OPTION_ORDER_TOP_DOWN = 'top-down';
export const CLI_OPTION_ORDER = [
  CLI_OPTION_ORDER_TOP_DOWN,
  CLI_OPTION_ORDER_BOTOM_UP,
  CLI_OPTION_ORDER_RANDOM,
] as const;

export const CLI_OPTION_FORMAT_CSV = 'csv';
export const CLI_OPTION_FORMAT_JSON_PLAIN = 'json-plain';
export const CLI_OPTION_FORMAT_JSON_PRETTY = 'json-pretty';
export const CLI_OPTION_FORMAT_TEXT_MARKDOWN = 'text-markdown';
export const CLI_OPTION_FORMAT = [
  CLI_OPTION_FORMAT_CSV,
  CLI_OPTION_FORMAT_JSON_PLAIN,
  CLI_OPTION_FORMAT_JSON_PRETTY,
  CLI_OPTION_FORMAT_TEXT_MARKDOWN,
] as const;

export const CLI_OPTION_FORMAT_DEFAULT: CLIOptionFormat = CLI_OPTION_FORMAT_TEXT_MARKDOWN;
export const CLI_OPTION_MATCHES_DEFAULT = [];
export const CLI_OPTION_NUM_ROUND_DEFAULT = 1;
export const CLI_OPTION_ORDER_DEFAULT: CLIOptionOrder = CLI_OPTION_ORDER_TOP_DOWN;
export const CLI_OPTION_TEAMS_DEFAULT = [];
export const CLI_OPTION_START_ROUND_DEFAULT = 1;
export const CLI_OPTION_DEFAULTS: ValidatedCLIOptions = {
  file: '',
  format: CLI_OPTION_FORMAT_DEFAULT,
  matches: CLI_OPTION_MATCHES_DEFAULT,
  numRounds: CLI_OPTION_NUM_ROUND_DEFAULT,
  order: CLI_OPTION_ORDER_DEFAULT,
  teams: CLI_OPTION_TEAMS_DEFAULT,
  startRound: CLI_OPTION_START_ROUND_DEFAULT,
};

export const SUPPORTED_FILE_TYPE_CSV = '.csv';
export const SUPPORTED_FILE_TYPE_JSON = '.json';
export const SUPPORTED_FILE_TYPES = [SUPPORTED_FILE_TYPE_CSV, SUPPORTED_FILE_TYPE_JSON] as const;

export const PROGRAM_NAME = 'swiss-pairing';
export const EXAMPLE_TEAMS_COUNT = '4';
export const EXAMPLE_TEAMS = 'Alice Bob Charlie David';
export const EXAMPLE_TEAMS_WITH_SQUADS = '"Alice [Home]" "Bob [Home]" "Charlie [Away]" "David [Away]"';
export const EXAMPLE_MATCHES = '"Alice,Bob" "Charlie,David"';
export const EXAMPLE_FILE_CSV = 'tournament_data.csv';
export const EXAMPLE_FILE_JSON = 'tournament_data.json';
