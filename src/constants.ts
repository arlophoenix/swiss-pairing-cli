import { CLIOptionOrder } from './types.js';

export const CLI_OPTION_ORDER = ['top-down', 'random', 'bottom-up'] as const;

export const CLI_OPTION_ORDER_DEFAULT: CLIOptionOrder = 'top-down';
