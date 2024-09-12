#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .version('1.0.0')
  .description('A simple CLI tool for generating Swiss pairings')
  .option('-p, --players <names...>', 'list of player names')
  .option('-r, --rounds <number>', 'number of rounds', '3')
  .action((options) => {
    console.log('Generating Swiss pairings for:');
    console.log('Players:', options.players);
    console.log('Rounds:', options.rounds);
    // Implement your Swiss pairing logic here
  });

program.parse(process.argv);