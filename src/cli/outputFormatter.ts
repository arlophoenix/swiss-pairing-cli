import { CLIOptionFormat, ReadonlyRoundMatches } from '../types/types.js';
import {
  CLI_OPTION_FORMAT_JSON_PLAIN,
  CLI_OPTION_FORMAT_JSON_PRETTY,
  CLI_OPTION_FORMAT_TEXT,
} from '../constants.js';

export function formatOutput({
  roundMatches,
  format,
}: {
  readonly roundMatches: ReadonlyRoundMatches;
  readonly format: CLIOptionFormat;
}): string {
  switch (format) {
    case CLI_OPTION_FORMAT_JSON_PLAIN:
      return JSON.stringify(roundMatches);
    case CLI_OPTION_FORMAT_JSON_PRETTY:
      return JSON.stringify(roundMatches, null, 2);
    case CLI_OPTION_FORMAT_TEXT:
      return formatRoundMatchesAsMarkdown(roundMatches);
  }
}

function formatRoundMatchesAsMarkdown(roundMatches: ReadonlyRoundMatches): string {
  const rounds = Object.entries(roundMatches);
  const multipleRounds = rounds.length > 1;

  let output = multipleRounds ? '# Matches\n\n' : '';

  rounds.forEach(([round, matches]) => {
    output += `**${round}**\n\n`;
    // eslint-disable-next-line max-params
    matches.forEach((match, index) => {
      output += `${String(index + 1)}. ${match[0]} vs ${match[1]}\n`;
    });
    output += '\n';
  });

  return output.trim();
}
