#!/usr/bin/env node
// tests/motion/record-loop.mjs — records the orb's exhale as a seamless loop
// for social, from the local build's /share/loop page.
//
//   npx next build && npx next start -p 3100 &
//   BASE=http://localhost:3100 node tests/motion/record-loop.mjs
//
// Every CSS animation on the page is paused and stepped to an exact time per
// frame (30fps over one 4.6s cycle), so the loop is frame-accurate and the
// last frame meets the first. Encodes H.264 MP4s (no audio track, ever) with
// FFMPEG (default: `ffmpeg` on PATH; imageio-ffmpeg's static build works) and
// writes a poster PNG per video. Output: marketing/social/.

import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.env.BASE || "http://localhost:3100").replace(/\/$/, "");
const EXE = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const OUT = "marketing/social";
const TMP = process.env.TMPDIR_LOOP || "/tmp/pp-loop-frames";
const FPS = 30;
const CYCLE_MS = 4600; // release 2.6s + inhale 2s at pace 1
const POSTER_MS = 900; // plume up, orb mid-exhale

const SIZES = [
  ["4x5", 1080, 1350],
  ["9x16", 1080, 1920],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE });
for (const theme of ["day", "night"]) {
  for (const [tag, w, h] of SIZES) {
    const name = `puffprice-exhale-${theme}-${tag}`;
    const dir = join(TMP, name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/share/loop?daypart=${theme}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const frames = Math.round((CYCLE_MS / 1000) * FPS);
    const step = (t) =>
      page.evaluate((t) => {
        for (const a of document.getAnimations()) {
          a.pause();
          a.currentTime = t;
        }
      }, t);
    for (let i = 0; i < frames; i++) {
      await step((i * 1000) / FPS);
      await page.screenshot({ path: join(dir, `${String(i).padStart(4, "0")}.png`) });
    }
    await step(POSTER_MS);
    await page.screenshot({ path: join(OUT, `${name}-poster.png`) });
    await page.close();
    execFileSync(
      FFMPEG,
      ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "%04d.png"), "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(OUT, `${name}.mp4`)],
      { stdio: "inherit" }
    );
    console.log(`✓ ${OUT}/${name}.mp4 (${frames} frames, ${CYCLE_MS / 1000}s loop)`);
  }
}
await browser.close();
// One poster to lead with: day, 4:5.
copyFileSync(join(OUT, "puffprice-exhale-day-4x5-poster.png"), join(OUT, "puffprice-exhale-poster.png"));
