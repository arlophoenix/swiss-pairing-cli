/**
 * Output formatting for tournament pairings.
 * Supports multiple output formats:
 * - CSV for spreadsheet compatibility
 * - JSON (plain and pretty) for API responses
 * - Markdown for documentation
 * - Plain text for console output
 *
 * @module outputFormatter
 */

import { CLIOptionFormat, ReadonlyMatch, Round, SwissPairingOutput } from '../types/types.js';
import {
  CLI_OPTION_FORMAT_CSV,
  CLI_OPTION_FORMAT_JSON_PLAIN,
  CLI_OPTION_FORMAT_JSON_PRETTY,
  CLI_OPTION_FORMAT_TEXT_MARKDOWN,
  CLI_OPTION_FORMAT_TEXT_PLAIN,
} from '../constants.js';

/**
 * Formats tournament results in the specified output format.
 *
 * @param results - Generated tournament rounds and matches
 * @param format - Desired output format
 * @returns Formatted string representation
 *
 * @example
 * const output = formatOutput({
 *   results: { rounds: [{ label: "Round 1", matches: [["A", "B"]] }] },
 *   format: "text-markdown"
 * });
 */
export function formatOutput({
  results,
  format,
}: {
  readonly results: SwissPairingOutput;
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

/**
 * Formats rounds as CSV with headers.
 * Format: Round,Match,Home Team,Away Team
 *
 * @param rounds - Tournament rounds to format
 * @returns CSV string with headers
 */
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

/**
 * Formats rounds as Markdown with headers.
 * Includes title for multiple rounds.
 *
 * @param rounds - Tournament rounds to format
 * @returns Markdown formatted string
 */
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

/**
 * Formats rounds as plain text.
 * One round per line, matches indented.
 *
 * @param rounds - Tournament rounds to format
 * @returns Plain text formatted string
 */
export function formatRoundsAsText(rounds: readonly Round[]): string {
  return rounds
    .map((round) => {
      const matchList = round.matches.map((match) => `${match[0]} vs ${match[1]}`).join('\n');
      return `${round.label}:\n${matchList}`;
    })
    .join('\n');
}
