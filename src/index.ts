#!/usr/bin/env node

import { generatePairings, validateInput } from './swissPairing.js';

import { Command } from 'commander';
import { SwissPairingInput } from './types';

const program = new Command();

interface CLIOptions {
  players: string[];
  rounds: number;
  matches: [string, string][];
}

program
  .version('1.0.0')
  .description('A simple CLI tool for generating Swiss pairings')
  .option('-p, --players <names...>', 'list of player names')
  .option('-r, --rounds <integer>', 'number of rounds', parseInt, 3)
  .option(
    '-m, --match <player>,<opponent>',
    'Add a played match',
    (value: string, previous: [string, string][] = []) => {
      const [player, opponent] = value.split(',');
      if (player && opponent) {
        previous.push([player, opponent]);
      }
      return previous;
    },
    []
  )
  .action((options: CLIOptions) => {
    const { players, rounds, matches } = options;

    const playedMatches: Record<string, string[]> = {};
    matches.forEach(([player, opponent]) => {
      if (!playedMatches[player]) playedMatches[player] = [];
      if (!playedMatches[opponent]) playedMatches[opponent] = [];
      playedMatches[player].push(opponent);
      playedMatches[opponent].push(player);
    });

    const input: SwissPairingInput = { players, rounds, playedMatches };

    if (!validateInput(input)) {
      console.error('Invalid input. Please check your player list and number of rounds.');
      process.exit(1);
    }

    const pairings = generatePairings(input);
    console.log('Generated pairings:', pairings);
  });

program.parse(process.argv);
