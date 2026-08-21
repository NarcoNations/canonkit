#!/usr/bin/env node

import { runCli } from './cli/run.js';

process.exitCode = await runCli(process.argv.slice(2), {
  stderr: (value) => process.stderr.write(value),
  stdout: (value) => process.stdout.write(value),
});
