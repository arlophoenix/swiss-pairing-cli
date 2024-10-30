/**
 * Swiss tournament rule validation.
 * Enforces tournament-specific constraints:
 * - Even number of teams
 * - No repeat matches
 * - No intra-squad matches
 * - Sequential round numbers
 * - Complete round matching
 *
 * @module swissValidator
 */

import { BooleanResult, ReadonlyPlayedTeams, Round } from '../types/types.js';
import { ErrorTemplate, formatError, mutableCloneBidirectionalMap } from './swissPairingUtils.js';

/**
 * Validates input for round generation.
 * Must pass before attempting generation to ensure
 * all tournament rules can be satisfied.
 *
 * Note: Validates both technical constraints (even teams)
 * and game rules (no self-play, squad constraints).
 */
export function validateGenerateRoundsInput({
  teams,
  numRounds,
  playedTeams,
  squadMap,
}: {
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly playedTeams: ReadonlyPlayedTeams;
  readonly squadMap: ReadonlyMap<string, string>;
}): BooleanResult {
  if (teams.length < 2) {
    return {
      success: false,
      message: ErrorTemplate.MIN_TEAMS,
    };
  }

  if (teams.length % 2 !== 0) {
    return {
      success: false,
      message: ErrorTemplate.EVEN_TEAMS,
    };
  }

  // Unique team names required for matching
  if (new Set(teams).size !== teams.length) {
    return {
      success: false,
      message: ErrorTemplate.UNIQUE_TEAMS,
    };
  }

  // Can't generate more rounds than possible unique opponents
  if (numRounds < 1) {
    return {
      success: false,
      message: ErrorTemplate.MIN_ROUNDS,
    };
  }

  if (numRounds >= teams.length) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.MAX_ROUNDS,
        values: {
          rounds: numRounds,
          teams: teams.length,
        },
      }),
    };
  }

  // Validate played matches
  const allTeamsInPlayedTeams = new Set<string>();
  for (const [team, opponents] of playedTeams.entries()) {
    allTeamsInPlayedTeams.add(team);
    for (const opponent of opponents) {
      allTeamsInPlayedTeams.add(opponent);
    }
  }

  // All referenced teams must exist
  for (const team of allTeamsInPlayedTeams.keys()) {
    if (!teams.includes(team)) {
      return {
        success: false,
        message: formatError({
          template: ErrorTemplate.UNKNOWN_TEAM,
          values: {
            context: 'matches',
            team,
          },
        }),
      };
    }
  }

  // Match history must be valid
  for (const [team, opponents] of playedTeams.entries()) {
    // No self-play allowed
    for (const opponent of opponents) {
      if (team === opponent) {
        return {
          success: false,
          message: formatError({
            template: ErrorTemplate.SELF_PLAY,
            values: { team },
          }),
        };
      }
      // Match history must be symmetric
      if (!playedTeams.get(opponent)?.has(team)) {
        return {
          success: false,
          message: formatError({
            template: ErrorTemplate.ASYMMETRIC_MATCH,
            values: { team1: team, team2: opponent },
          }),
        };
      }
    }
  }

  // All squads must reference real teams
  for (const team of squadMap.keys()) {
    if (!teams.includes(team)) {
      return {
        success: false,
        message: formatError({
          template: ErrorTemplate.UNKNOWN_TEAM,
          values: {
            context: 'squad assignments',
            team,
          },
        }),
      };
    }
  }

  return { success: true };
}

/**
 * Validates generated rounds.
 * Ensures output satisfies all tournament rules:
 * - All teams matched each round
 * - No repeat matches
 * - Squad constraints respected
 * - Sequential round numbers
 *
 * Note: Validation updates played teams map to track
 * cumulative matches while checking.
 */
export function validateGenerateRoundsOutput({
  rounds,
  teams,
  numRounds,
  startRound,
  playedTeams,
  squadMap,
}: {
  readonly rounds: readonly Round[];
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly playedTeams: ReadonlyPlayedTeams;
  readonly squadMap: ReadonlyMap<string, string>;
}): BooleanResult {
  const numGamesPerRound = teams.length / 2;
  const resultNumRounds = rounds.length;

  if (resultNumRounds !== numRounds) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.ROUND_COUNT_MISMATCH,
        values: {
          actual: resultNumRounds,
          expected: numRounds,
        },
      }),
    };
  }

  const currentPlayedTeams = mutableCloneBidirectionalMap(playedTeams);

  let expectedRoundNumber = startRound;
  for (const round of rounds) {
    if (round.number !== expectedRoundNumber) {
      return {
        success: false,
        message: formatError({
          template: ErrorTemplate.ROUND_NUMBER_SEQUENCE,
          values: {
            round: round.label,
            actual: round.number,
            expected: expectedRoundNumber,
          },
        }),
      };
    }
    expectedRoundNumber++;

    if (round.matches.length !== numGamesPerRound) {
      return {
        success: false,
        message: formatError({
          template: ErrorTemplate.MATCH_COUNT_MISMATCH,
          values: {
            round: round.label,
            actual: round.matches.length,
            expected: numGamesPerRound,
          },
        }),
      };
    }

    const teamsInRound = new Set<string>();

    for (const [team1, team2] of round.matches) {
      // Check core rules
      if (team1 === team2) {
        return {
          success: false,
          message: formatError({
            template: ErrorTemplate.SELF_PLAY,
            values: { team: team1 },
          }),
        };
      }

      if (currentPlayedTeams.get(team1)?.has(team2)) {
        return {
          success: false,
          message: formatError({
            template: ErrorTemplate.DUPLICATE_MATCH,
            values: { team1, team2 },
          }),
        };
      }

      if (teamsInRound.has(team1) || teamsInRound.has(team2)) {
        return {
          success: false,
          message: formatError({
            template: ErrorTemplate.MULTIPLE_MATCHES,
            values: {
              team1,
              team2,
              round: round.label,
            },
          }),
        };
      }
      teamsInRound.add(team1);
      teamsInRound.add(team2);

      // Check squad constraints
      if (squadMap.get(team1) === squadMap.get(team2) && squadMap.get(team1) !== undefined) {
        return {
          success: false,
          message: formatError({
            template: ErrorTemplate.SAME_SQUAD,
            values: { team1, team2 },
          }),
        };
      }

      // Track matches for future validation
      if (!currentPlayedTeams.has(team1)) {
        currentPlayedTeams.set(team1, new Set());
      }
      if (!currentPlayedTeams.has(team2)) {
        currentPlayedTeams.set(team2, new Set());
      }
      currentPlayedTeams.get(team1)?.add(team2);
      currentPlayedTeams.get(team2)?.add(team1);
    }
  }

  return { success: true };
}
