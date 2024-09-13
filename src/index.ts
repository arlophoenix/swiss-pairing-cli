#!/usr/bin/env node

import { generatePairings, validateInput } from './swissPairing.js';

import { Command } from 'commander';

const program = new Command();

interface Options {
  players: string[];
  rounds: number;
}

program
  .version('1.0.0')
  .description('A simple CLI tool for generating Swiss pairings')
  .option('-p, --players <names...>', 'list of player names')
  .option('-r, --rounds <integer>', 'number of rounds', parseInt, 3)
  .action((options: Options) => {
    const { players, rounds } = options;
    
    if (!validateInput({players, rounds})) {
      console.error('Invalid input. Please check your player list and number of rounds.');
      process.exit(1);
    }

    const pairings = generatePairings({players, rounds});
    console.log('Generated pairings:', pairings);
  });

program.parse(process.argv);
