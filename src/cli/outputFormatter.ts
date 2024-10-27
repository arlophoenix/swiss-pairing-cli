import { CLIOptionFormat, ReadonlyRoundMatches } from '../types/types.js';
import {
  CLI_OPTION_FORMAT_CSV,
  CLI_OPTION_FORMAT_JSON_PLAIN,
  CLI_OPTION_FORMAT_JSON_PRETTY,
  CLI_OPTION_FORMAT_TEXT_MARKDOWN,
} from '../constants.js';

export function formatOutput({
  roundMatches,
  format,
}: {
  readonly roundMatches: ReadonlyRoundMatches;
  readonly format: CLIOptionFormat;
}): string {
  switch (format) {
    case CLI_OPTION_FORMAT_CSV:
      return formatRoundMatchesAsCSV(roundMatches);
    case CLI_OPTION_FORMAT_JSON_PLAIN:
      return JSON.stringify(roundMatches);
    case CLI_OPTION_FORMAT_JSON_PRETTY:
      return JSON.stringify(roundMatches, null, 2);
    case CLI_OPTION_FORMAT_TEXT_MARKDOWN:
      return formatRoundMatchesAsMarkdown(roundMatches);
  }
}

function formatRoundMatchesAsCSV(roundMatches: ReadonlyRoundMatches): string {
  const header = 'Round,Match,Home Team,Away Team';
  const rows = Object.entries(roundMatches).flatMap(([round, matches]) => {
    const roundNumber = parseInt(round.split(' ')[1]);
    return matches.map(
      // eslint-disable-next-line max-params
      (match, index) => `${String(roundNumber)},${String(index + 1)},${match[0]},${match[1]}`
    );
  });
  return [header, ...rows].join('\n');
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
