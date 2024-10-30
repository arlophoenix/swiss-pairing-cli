import { CLIOptionFormat, ReadonlyMatch, Round, SwissPairingResult } from '../types/types.js';
import {
  CLI_OPTION_FORMAT_CSV,
  CLI_OPTION_FORMAT_JSON_PLAIN,
  CLI_OPTION_FORMAT_JSON_PRETTY,
  CLI_OPTION_FORMAT_TEXT_MARKDOWN,
  CLI_OPTION_FORMAT_TEXT_PLAIN,
} from '../constants.js';

export function formatOutput({
  results,
  format,
}: {
  readonly results: SwissPairingResult;
  readonly format: CLIOptionFormat;
}): string {
  // eslint-disable-next-line max-params
  const roundMatches = results.rounds.reduce<Record<string, readonly ReadonlyMatch[]>>((acc, round) => {
    // eslint-disable-next-line functional/immutable-data
    acc[round.label] = round.matches;
    return acc;
  }, {});

  switch (format) {
    case CLI_OPTION_FORMAT_CSV:
      return formatRoundsAsCSV(results.rounds);
    case CLI_OPTION_FORMAT_JSON_PLAIN:
      return JSON.stringify(roundMatches);
    case CLI_OPTION_FORMAT_JSON_PRETTY:
      return JSON.stringify(roundMatches, null, 2);
    case CLI_OPTION_FORMAT_TEXT_MARKDOWN:
      return formatRoundsAsMarkdown(results.rounds);
    case CLI_OPTION_FORMAT_TEXT_PLAIN:
      return formatRoundsAsText(results.rounds);
  }
}

export function formatRoundsAsCSV(rounds: readonly Round[]): string {
  const header = 'Round,Match,Home Team,Away Team';
  const rows = rounds.flatMap((round) =>
    round.matches.map(
      // eslint-disable-next-line max-params
      (match, index) => `${String(round.number)},${String(index + 1)},${match[0]},${match[1]}`
    )
  );
  return [header, ...rows].join('\n');
}

export function formatRoundsAsMarkdown(rounds: readonly Round[]): string {
  const multipleRounds = rounds.length > 1;
  let output = multipleRounds ? '# Matches\n\n' : '';

  rounds.forEach((round) => {
    output += `**${round.label}**\n\n`;
    // eslint-disable-next-line max-params
    round.matches.forEach((match, index) => {
      output += `${String(index + 1)}. ${match[0]} vs ${match[1]}\n`;
    });
    output += '\n';
  });

  return output.trim();
}

export function formatRoundsAsText(rounds: readonly Round[]): string {
  return rounds
    .map((round) => {
      const matchList = round.matches.map((match) => `${match[0]} vs ${match[1]}`).join('\n');
      return `${round.label}:\n${matchList}`;
    })
    .join('\n');
}
