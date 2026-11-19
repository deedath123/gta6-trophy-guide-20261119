// Leonida Trophy Guide & Tracker — entry program for make.fun contest
// gta6-trophy-guide-01 (Node 22, standard library only).
//
// The guide itself is plain static files under app/: index.html, style.css,
// app.js and app/data/trophies.json. It runs offline in desktop Chrome with
// app/ served at the root and loads nothing over the network. This program
// hands the entry in: it copies app/ and screenshots/ from beside this file
// into the output directory and writes dossier.json there with the vendored
// make.fun library (vendor/makefun-frontend.ts, unchanged from the kit).
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

function copyEntry() {
  // Start clean so a stale file from an earlier run can never leak in.
  mkdirSync(outputDir, { recursive: true });
  const appOut = join(outputDir, 'app');
  const shotsOut = join(outputDir, 'screenshots');
  rmSync(appOut, { recursive: true, force: true });
  rmSync(shotsOut, { recursive: true, force: true });
  cpSync(appDir, appOut, { recursive: true });
  if (existsSync(shotsDir)) cpSync(shotsDir, shotsOut, { recursive: true });
  else mkdirSync(shotsOut, { recursive: true });
}

function writeDossier() {
  // Same caps as the gate: at most 4 screenshots of 256 KiB each, app/ at
  // most 993 files / 48 MiB, dossier text at most 160 KiB.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

copyEntry();
writeDossier();
console.log('wrote ' + outputDir + '/app, ' + outputDir + '/screenshots, ' + outputDir + '/dossier.json');
