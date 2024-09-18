import { describe, expect, it, jest } from '@jest/globals';

import { Command } from 'commander';

// Define the shape of the mocked module
interface MockedCli {
  readonly createCLI: jest.MockedFunction<() => Command>;
}

jest.mock('./cli', () => ({
  createCLI: jest.fn().mockReturnValue({
    parse: jest.fn().mockReturnThis(),
  }),
}));

describe('Swiss Pairing CLI Entry Point', () => {
  it('should create and parse CLI', () => {
    const mockParse = jest.fn().mockReturnThis();
    // Cast the mocked module to the correct type
    const mockedCli = jest.requireMock('./cli') as MockedCli;

    mockedCli.createCLI.mockReturnValue({
      parse: mockParse,
      // Add other necessary properties to match Command interface
      opts: jest.fn(),
      args: [],
      // ... other properties as needed
    } as unknown as Command);

    jest.isolateModules(() => {
      require('./index');
    });

    expect(mockedCli.createCLI).toHaveBeenCalledWith();
    expect(mockParse).toHaveBeenCalledWith(process.argv);
  });
});
