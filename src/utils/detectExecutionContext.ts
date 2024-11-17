/**
 * Note: this single function file exists to enable test mocking
 * Detects how the CLI was executed based on npm's execution path.
 * Used to distinguish between different installation contexts.
 *
 * @returns 'npx' if executed via npx
 *          'global' if installed globally via npm install -g
 *          'local' if installed locally or run from source
 *
 * @example
 * const context = detectExecutionContext();
 * // context === 'npx' when run via: npx swisspair
 * // context === 'global' when installed via: npm install -g swiss-pairing-cli
 * // context === 'local' when run via: npm start
 */
export function detectExecutionContext(): 'npx' | 'global' | 'local' {
  const execPath = process.env.npm_execpath ?? '';
  if (execPath.includes('npx')) {
    return 'npx';
  }
  if (execPath.includes('npm/bin')) {
    return 'global';
  }
  return 'local';
}
