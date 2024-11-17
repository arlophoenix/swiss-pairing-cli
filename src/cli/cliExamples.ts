import {
  ARG_FILE,
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_START_ROUND,
  ARG_TEAMS,
  BIN_NAME,
  CLI_OPTION_FORMAT_JSON_PRETTY,
  CLI_OPTION_ORDER_BOTOM_UP,
  CLI_OPTION_ORDER_RANDOM,
  EXAMPLE_FILE_CSV,
  EXAMPLE_FILE_JSON,
  EXAMPLE_MATCHES,
  EXAMPLE_TEAMS,
  EXAMPLE_TEAMS_WITH_SQUADS,
} from '../constants.js';

export const examples = [
  {
    description: 'Generate random pairings for 4 teams with squads',
    command: `${BIN_NAME} --${ARG_TEAMS} ${EXAMPLE_TEAMS_WITH_SQUADS} --${ARG_ORDER} ${CLI_OPTION_ORDER_RANDOM}`,
  },
  {
    description:
      'Generate swiss pairings for 4 teams without squads, on round two, with round one matches already played',
    command: `${BIN_NAME} --${ARG_TEAMS} ${EXAMPLE_TEAMS} --${ARG_START_ROUND} 2 --${ARG_MATCHES} ${EXAMPLE_MATCHES}`,
  },
  {
    description: 'Generate pairings using a CSV file',
    command: `${BIN_NAME} --${ARG_FILE} ${EXAMPLE_FILE_CSV}`,
  },
  {
    description: 'Generate pairings using a JSON file, overriding the pairing order and the output format',
    command: `${BIN_NAME} --${ARG_FILE} ${EXAMPLE_FILE_JSON} --${ARG_ORDER} ${CLI_OPTION_ORDER_BOTOM_UP} --${ARG_FORMAT} ${CLI_OPTION_FORMAT_JSON_PRETTY}`,
  },
  {
    description: 'Generate multiple rounds of random pairings',
    command: `${BIN_NAME} --${ARG_TEAMS} ${EXAMPLE_TEAMS} --${ARG_NUM_ROUNDS} 3 --${ARG_ORDER} ${CLI_OPTION_ORDER_RANDOM}`,
  },
] as const;
