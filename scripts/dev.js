import { spawn } from "node:child_process";

const processes = [
  {
    name: "server",
    command: "npm",
    args: ["--prefix", "server", "start"],
  },
  {
    name: "client",
    command: "npm",
    args: ["--prefix", "client", "run", "dev", "--", "--host", "0.0.0.0"],
  },
];

const children = processes.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  child.stdout.on("data", (data) => writePrefixedOutput(name, data));
  child.stderr.on("data", (data) => writePrefixedOutput(name, data, true));
  child.on("exit", (code, signal) => {
    if (isShuttingDown) return;

    console.error(`[${name}] exited with ${signal || code}`);
    shutdown(code || 1);
  });

  return child;
});

let isShuttingDown = false;

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function writePrefixedOutput(name, data, isError = false) {
  const stream = isError ? process.stderr : process.stdout;
  const lines = data.toString().split(/\r?\n/).filter(Boolean);

  for (const line of lines) {
    stream.write(`[${name}] ${line}\n`);
  }
}

function shutdown(code) {
  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(code), 100);
}
