/**
 * Local binary build script.
 * Builds a standalone executable for the current platform using Node.js SEA.
 *
 * Steps:
 * - TypeScript compile
 * - esbuild bundle (ESM → CJS)
 * - Generate SEA blob
 * - Copy node binary and inject blob via postject
 * - macOS: remove and re-apply codesign
 *
 * Output: dist/swisspair-<platform>-<arch>[.exe]
 *
 * @module build-binary
 */

import * as fs from 'fs';
import * as path from 'path';

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, '..');

function run(command: string): void {
  console.log(`\n> ${command}`);
  execSync(command, { cwd: rootPath, stdio: 'inherit' });
}

function getOutputName(): string {
  const { platform, arch } = process;
  if (platform === 'linux') {
    return 'swisspair-linux-x64';
  }
  if (platform === 'darwin' && arch === 'arm64') {
    return 'swisspair-macos-arm64';
  }
  if (platform === 'darwin') {
    return 'swisspair-macos-x64';
  }
  if (platform === 'win32') {
    return 'swisspair-windows-x64.exe';
  }
  throw new Error(`Unsupported platform: ${platform}/${arch}`);
}

function main(): void {
  const outputName = getOutputName();
  const outputPath = path.join(rootPath, 'dist', outputName);
  const blobPath = path.join(rootPath, 'dist', 'sea-prep.blob');
  const isMacos = process.platform === 'darwin';

  console.log(`Building binary for ${process.platform}/${process.arch} → dist/${outputName}`);

  run('npm run build');
  run('npm run build:binary:bundle');
  run('npm run build:binary:blob');

  fs.copyFileSync(process.execPath, outputPath);
  if (process.platform !== 'win32') {
    fs.chmodSync(outputPath, 0o755);
  }
  console.log(`\nCopied node binary to dist/${outputName}`);

  if (isMacos) {
    run(`codesign --remove-signature "${outputPath}"`);
  }

  const macosFlag = isMacos ? ' --macho-segment-name NODE_SEA' : '';
  run(
    `npx postject "${outputPath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2${macosFlag}`
  );

  if (isMacos) {
    run(`codesign --sign - "${outputPath}"`);
  }

  console.log(`\nBinary built: dist/${outputName}`);
  console.log('Verifying...\n');
  run(`"${outputPath}" --help`);
}

main();
