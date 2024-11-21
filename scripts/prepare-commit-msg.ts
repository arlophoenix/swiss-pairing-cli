import type { UserConfig } from '@commitlint/types';
// @ts-expect-error - commitlint config doesn't have type definitions for .mjs files
import config from '../commitlint.config.mjs';
import fs from 'fs';

// Cast the config to the correct type
const typedConfig = config as UserConfig;

const GIT_COMMENT_DILIMITER = '\n# ';

// Type guard to ensure the rule exists and has the correct structure
function isValidRule(rule: unknown): rule is readonly [string, string | number, readonly string[]] {
  return Array.isArray(rule) && rule.length === 3 && Array.isArray(rule[2]);
}

function addCommitlintTemplateToMessage({
  msgFile,
  source,
}: {
  readonly msgFile: string;
  readonly source: string;
}) {
  // Skip for amend, merge, etc
  if (source === 'message' || source === 'merge' || source === 'squash') {
    return;
  }

  if (typedConfig.rules === undefined) {
    throw new Error('No rules found in commitlint config');
  }
  // Extract allowed types and scopes from config
  const typeRule = typedConfig.rules['type-enum'];
  const scopeRule = typedConfig.rules['scope-enum'];

  const types = isValidRule(typeRule) ? typeRule[2].join('|') : '';
  const scopes = isValidRule(scopeRule) ? scopeRule[2].join('|') : '';

  const template = `# Commit Format:
# <type>([scope]): <subject>
#
# type:    ${types}
# scope:   (optional) ${scopes}
# subject: must be lowercase, imperative, and start with a verb
#
# Examples:
#   feat(cli): add squad support for teams
#   fix(parser): handle empty csv rows
#   refactor(core): optimize pairing algorithm`;

  const current = fs.readFileSync(msgFile, 'utf8');
  // Split into message and comments
  const [message, ...comments] = current.split(GIT_COMMENT_DILIMITER);
  const newContent = `${message}\n${template}\n${GIT_COMMENT_DILIMITER}${comments.join(GIT_COMMENT_DILIMITER)}`;
  fs.writeFileSync(msgFile, newContent);
}

const [msgFile, source] = process.argv.slice(2);
if (!msgFile) {
  console.error('No commit message file provided');
  process.exit(1);
}

addCommitlintTemplateToMessage({ msgFile, source });
