import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

// Prisma generation uses the schema only; it does not connect to this fallback URL.
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/blueform',
};
const result = spawnSync(
  process.execPath,
  [resolve('node_modules/prisma/build/index.js'), 'generate', '--generator', 'client'],
  {
    env,
    stdio: 'inherit',
  },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
