#!/usr/bin/env node
// tests/fixtures/with-mock.mjs — run a command with the mock Supabase up and
// the app pointed at it. Used to build the app against fixtures:
//
//   node tests/fixtures/with-mock.mjs npx next build
//
// NEXT_PUBLIC_* values are inlined at build time, so a fixtures build only
// ever talks to the mock — it can't reach (or write to) production.
import { spawn } from "node:child_process";
import { startMockServer, MOCK_PORT } from "./mock-supabase.mjs";
import { fixtureEnv } from "./env.mjs";

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error("usage: node tests/fixtures/with-mock.mjs <command> [args...]");
  process.exit(2);
}

const server = await startMockServer(MOCK_PORT);
const child = spawn(cmd, args, { stdio: "inherit", env: { ...process.env, ...fixtureEnv() } });
child.on("exit", (code, signal) => {
  server.close();
  process.exit(code ?? (signal ? 1 : 0));
});
