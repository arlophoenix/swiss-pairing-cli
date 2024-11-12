import { detectExecutionContext } from '../utils/utils.js';

export * from '../utils/utils.js';

/**
 * Determines the current environment context based on environment variables
 * and execution context. Priority order:
 * 1. CI environment
 * 2. Test environment
 * 3. Development environment
 * 4. Local install (development)
 * 5. Global/npx install (production)
 *
 * @returns The detected environment context
 */
export function detectEnvironment(): 'test' | 'development' | 'ci' | 'production' {
  if (process.env.CI) {
    return 'ci';
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  // Global/npx installs are "production", local installs are "development"
  const context = detectExecutionContext();
  return context === 'local' ? 'development' : 'production';
}
