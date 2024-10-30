#!/usr/bin/env node
/**
 * Swiss tournament pairing CLI entry point.
 * Provides command line interface for generating
 * tournament pairings using Swiss system rules.
 *
 * Environment: Node.js
 * Usage: npx swiss-pairing [options]
 *
 * @module swiss-pairing
 */

import { createCLI } from './cli/cli.js';

const program = createCLI();
program.parse(process.argv);
