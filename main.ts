import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const baseDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });

const appSrc = join(baseDir, 'app');
const appDest = join(outputDir, 'app');
if (existsSync(appDest)) rmSync(appDest, { recursive: true, force: true });
cpSync(appSrc, appDest, { recursive: true });

const shotsSrc = join(baseDir, 'screenshots');
const shotsDest = join(outputDir, 'screenshots');
if (existsSync(shotsDest)) rmSync(shotsDest, { recursive: true, force: true });
if (existsSync(shotsSrc)) cpSync(shotsSrc, shotsDest, { recursive: true });

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const dossierBytes = buildDossier(outputDir, caps);
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);

function countFilesAndBytes(dir: string): { count: number; bytes: number } {
  let count = 0;
  let bytes = 0;
  if (!existsSync(dir)) return { count, bytes };
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const resPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countFilesAndBytes(resPath);
      count += sub.count;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      count++;
      bytes += statSync(resPath).size;
    }
  }
  return { count, bytes };
}

const appStats = countFilesAndBytes(appDest);
const shotsStats = countFilesAndBytes(shotsDest);
console.log(`Summary: app files = ${appStats.count} (${appStats.bytes} bytes), screenshots = ${shotsStats.count} (${shotsStats.bytes} bytes), dossier bytes = ${dossierBytes.length}`);
