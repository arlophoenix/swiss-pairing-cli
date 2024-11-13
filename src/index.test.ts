import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

/* eslint-disable functional/prefer-readonly-type */
import { createCLI } from './cli/cli.js';

// Define an interface for the mock program
interface MockProgram {
  parse: jest.Mock;
}

// Update the mock to use the interface
jest.mock('./cli/cli.js', () => ({
  createCLI: jest.fn(
    (): MockProgram => ({
      parse: jest.fn(),
    })
  ),
}));

describe('index', () => {
  const originalArgv = [...process.argv];

  afterEach(() => {
    jest.clearAllMocks();
    // Restore the original process.argv after each test
    // eslint-disable-next-line functional/immutable-data
    process.argv = originalArgv;
  });

  it('should call createCLI and parse with process.argv', async () => {
    // Arrange
    const mockArgv = ['node', 'script.js', 'arg1', 'arg2'];
    // eslint-disable-next-line functional/immutable-data
    process.argv = mockArgv;

    // Act
    await import('./index.js');

    // Assert
    expect(createCLI).toHaveBeenCalledTimes(1);

    const mockProgram = (createCLI as jest.MockedFunction<typeof createCLI>).mock.results[0]
      .value as MockProgram;
    expect(mockProgram.parse).toHaveBeenCalledTimes(1);
    expect(mockProgram.parse).toHaveBeenCalledWith(mockArgv);
  });
});
