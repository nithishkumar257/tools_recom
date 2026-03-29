import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const pythonCandidates = [
  process.env.PYTHON,
  process.platform === 'win32'
    ? join(process.cwd(), '.venv', 'Scripts', 'python.exe')
    : join(process.cwd(), '.venv', 'bin', 'python'),
  process.platform === 'win32'
    ? join(process.cwd(), '..', '.venv', 'Scripts', 'python.exe')
    : join(process.cwd(), '..', '.venv', 'bin', 'python'),
  process.platform === 'win32' ? 'python' : 'python3',
  'python',
].filter(Boolean);

const pythonCommand = pythonCandidates.find((candidate) => {
  if (candidate === 'python' || candidate === 'python3') {
    return true;
  }
  return existsSync(candidate);
});

if (!pythonCommand) {
  console.error('No Python executable found. Set PYTHON or create a .venv.');
  process.exit(1);
}

const args = process.argv.slice(2);
const result = spawnSync(pythonCommand, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32' && (pythonCommand === 'python' || pythonCommand === 'python3'),
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
