/**
 * Node version manager configuration script.
 * Updates .nvmrc to match engine version from package.json.
 *
 * Purpose:
 * - Ensures consistent Node.js version across development environments
 * - Prevents version mismatches between package.json and .nvmrc
 * - Simplifies nvm setup with automatic version switching
 *
 * Behavior:
 * - Reads required Node version from package.json engines field
 * - Strips version modifiers (^, ~, >=)
 * - Updates .nvmrc only if version differs
 *
 * @module update-nvmrc
 */

import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';

interface PackageJson {
  readonly engines?: {
    readonly node?: string;
  };
}

// Get the root directory (parent of the scripts folder)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath: string = path.join(__dirname, '..');

// Read package.json from the root
const packageJsonPath: string = path.join(rootPath, 'package.json');
let packageJson: PackageJson;

try {
  const packageJsonStr = fs.readFileSync(packageJsonPath, 'utf8');
  packageJson = JSON.parse(packageJsonStr) as PackageJson;
} catch (error) {
  console.error(`Error reading package.json: ${(error as Error).message}`);
  process.exit(1);
}

// Extract Node.js version from engines field
const packageNodeVersion: string | undefined = packageJson.engines?.node;

if (!packageNodeVersion) {
  console.error('Node.js version not found in package.json');
  process.exit(1);
}

// Clean up the version string (remove ^, ~, or >=)
const nvmNodeVersion: string = packageNodeVersion.replace(/[^0-9.]/g, '');

// Path to .nvmrc file
const nvmrcPath: string = path.join(rootPath, '.nvmrc');

// Check if .nvmrc exists and read its content
let currentNvmrcVersion = '';

try {
  currentNvmrcVersion = fs.readFileSync(nvmrcPath, 'utf8').trim();
} catch (_error) {
  // File doesn't exist or can't be read, we'll create/update it
}

// Compare versions and update only if necessary
if (currentNvmrcVersion !== nvmNodeVersion) {
  try {
    fs.writeFileSync(nvmrcPath, nvmNodeVersion);
    console.log(`.nvmrc updated with Node.js version ${nvmNodeVersion}`);
  } catch (error) {
    console.error(`Error writing .nvmrc: ${(error as Error).message}`);
    process.exit(1);
  }
}
